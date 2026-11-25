import { GENERATORS, PUMPS } from './productData';

export interface CatalogMatch {
    id: string;
    name: string;
    brand: string;
    powerKW?: number;
    image: string;
    category: 'generator' | 'pump';
    inStock: boolean;
}

interface IndexedProduct {
    item: CatalogMatch;
    idLower: string;
    nameLower: string;
    brandLower: string;
    searchBlob: string;
    tokens: Set<string>;
}

const AMHARIC_BRAND_MAP: Record<string, string> = {
    'ዊቻይ': 'weichai',
    'ዩቻይ': 'yuchai',
    'ዩኔይ': 'yunnei',
    'ዌይፋንግ': 'weifang',
    'ዩናይትድ': 'united',
    'ኮፎ': 'kofo',
    'ኬፎ': 'kefo',
    'ከሚንስ': 'cummins',
    'ላስት': 'last',
    'ፓምፕ': 'pump',
    'ውሃ': 'water',
    'ጀነሬተር': 'generator',
    'ጀኔሬተር': 'generator',
    'ኪሎዋት': 'kw',
};

const STOP_WORDS = new Set([
    'a', 'an', 'the', 'show', 'me', 'photo', 'picture', 'image', 'glimpse',
    'of', 'for', 'series', 'set', 'diesel', 'industrial', 'high', 'power',
    'model', 'ce', 'please', 'can', 'i', 'see', 'kw', 'kva', 'hp'
]);

const normalizeText = (raw: string): string => {
    let text = raw.toLowerCase().trim();
    for (const [am, en] of Object.entries(AMHARIC_BRAND_MAP)) {
        text = text.replaceAll(am, ` ${en} `);
    }
    return text
        .replace(/\.png\b/g, '.webp')
        .replace(/[_/]+/g, ' ')
        .replace(/-/g, ' ')
        .replace(/(\d+(?:\.\d+)?)\s*(kw|kva|hp)\b/g, ' $1$2 ')
        .replace(/\s+/g, ' ')
        .trim();
};

const extractTokens = (text: string): string[] =>
    normalizeText(text)
        .split(/[^a-z0-9.]+/)
        .filter(t => t.length >= 2 && !STOP_WORDS.has(t));

const INDEXED_CATALOG: IndexedProduct[] = [
    ...GENERATORS.map((g): CatalogMatch => ({
        id: g.id,
        name: g.name,
        brand: g.brand,
        powerKW: g.powerKW,
        image: g.image,
        category: 'generator',
        inStock: g.inStock,
    })),
    ...PUMPS.map((p): CatalogMatch => ({
        id: p.id,
        name: p.name,
        brand: p.brand || '',
        powerKW: p.powerKW,
        image: p.image,
        category: 'pump',
        inStock: p.inStock,
    })),
].map((item) => {
    const searchBlob = normalizeText(`${item.id} ${item.name} ${item.brand} ${item.powerKW ?? ''}kw ${item.category}`);
    return {
        item,
        idLower: item.id.toLowerCase(),
        nameLower: item.name.toLowerCase(),
        brandLower: item.brand.toLowerCase(),
        searchBlob,
        tokens: new Set(extractTokens(searchBlob)),
    };
});

/**
 * Matches a natural-language query, model name, or ID from CE Assistant
 * to a verified local generator or water pump in `productData.ts`.
 */
export function findCatalogProduct(
    query?: string | null,
    fallbackName?: string | null,
    preferredCategory?: string | null
): CatalogMatch | null {
    const rawPrimary = (query || '').trim();
    const rawSecondary = (fallbackName || '').trim();
    const combinedRaw = [rawPrimary, rawSecondary].filter(Boolean).join(' ').trim();
    if (!combinedRaw && !preferredCategory) return null;

    const primaryLower = rawPrimary.toLowerCase();
    const secondaryLower = rawSecondary.toLowerCase();

    // 1. Exact ID or exact name match
    const exactMatch = INDEXED_CATALOG.find(entry =>
        (primaryLower && (entry.idLower === primaryLower || entry.nameLower === primaryLower)) ||
        (secondaryLower && (entry.idLower === secondaryLower || entry.nameLower === secondaryLower))
    );
    if (exactMatch) return exactMatch.item;

    const normalized = normalizeText(combinedRaw);

    // 2. Category hint
    const catHintRaw = (preferredCategory || '').toLowerCase();
    const mentionsPump =
        catHintRaw.includes('pump') ||
        /\b(pump|water pump|irrigation|submersible|dewatering|borehole|fire pump)\b/.test(normalized);
    const mentionsGen =
        catHintRaw.includes('gen') ||
        /\b(generator|genset|power station|canopy)\b/.test(normalized);

    const categoryHint: 'generator' | 'pump' | null =
        mentionsPump && !mentionsGen ? 'pump' :
        mentionsGen && !mentionsPump ? 'generator' :
        null;

    // 3. Extract power ratings (kW, or convert kVA/HP to approx kW)
    const targetKWs: number[] = [];
    for (const m of normalized.matchAll(/(\d+(?:\.\d+)?)\s*(kw|kva|hp)\b/g)) {
        const val = parseFloat(m[1]);
        const unit = m[2];
        if (!Number.isFinite(val)) continue;
        if (unit === 'kw') targetKWs.push(val);
        else if (unit === 'kva') targetKWs.push(Math.round(val * 0.8));
        else if (unit === 'hp') targetKWs.push(Math.round(val * 0.746));
    }
    if (targetKWs.length === 0) {
        for (const m of normalized.matchAll(/\b(\d{1,4}(?:\.\d+)?)\b/g)) {
            const val = parseFloat(m[1]);
            if (Number.isFinite(val) && val >= 2 && val <= 3000) {
                targetKWs.push(val);
            }
        }
    }

    const queryTokens = extractTokens(combinedRaw);
    const wantsOpen = /\bopen\b/.test(normalized);
    const wantsSilent = /\b(silent|canopy)\b/.test(normalized);

    let bestEntry: IndexedProduct | null = null;
    let bestScore = 0;

    for (const entry of INDEXED_CATALOG) {
        let score = 0;
        const { item } = entry;

        if (categoryHint) {
            score += item.category === categoryHint ? 40 : -35;
        }

        // Substring inclusion on id (or name when no explicit kW clash)
        if (primaryLower && primaryLower.length >= 4) {
            if (entry.idLower.includes(primaryLower)) {
                score += 45;
            } else if (entry.nameLower.includes(primaryLower) && (targetKWs.length === 0 || (item.powerKW && targetKWs.includes(item.powerKW)))) {
                score += 45;
            }
        }

        // Brand match
        if (entry.brandLower) {
            const brandParts = entry.brandLower.split(/\s+/);
            if (brandParts.some(bp => bp.length >= 3 && queryTokens.includes(bp))) {
                score += 35;
            }
        }

        // Power rating match (prioritize exact kW over kVA approximation in name)
        if (item.powerKW && targetKWs.length > 0) {
            for (const target of targetKWs) {
                if (item.powerKW === target) {
                    score += 85;
                } else {
                    const diffRatio = Math.abs(item.powerKW - target) / Math.max(target, 1);
                    if (diffRatio <= 0.12) score += 28;
                    else if (diffRatio <= 0.25) score += 10;
                    else score -= 12;
                }
            }
        }

        // Token overlap
        for (const token of queryTokens) {
            if (entry.tokens.has(token)) {
                score += 12;
            } else if (token.length >= 4 && entry.searchBlob.includes(token)) {
                score += 6;
            }
        }

        // Open vs closed canopy preference
        const isOpenModel = entry.idLower.includes('open') || entry.nameLower.includes('open');
        if (wantsOpen && isOpenModel) score += 18;
        else if (!wantsOpen && isOpenModel) score -= 4;
        if (wantsSilent && !isOpenModel) score += 6;

        // Slight tie-breaker for in-stock items
        if (item.inStock) score += 2;

        if (score > bestScore) {
            bestScore = score;
            bestEntry = entry;
        }
    }

    if (bestEntry && bestScore >= 12) {
        return bestEntry.item;
    }

    // Safe category fallback for broad asks like "show me a water pump" or "show me a generator"
    if (categoryHint === 'pump') {
        const defaultPump = PUMPS.find(p => p.id === 'yuchai-80kw-pump') || PUMPS[0];
        return defaultPump
            ? {
                id: defaultPump.id,
                name: defaultPump.name,
                brand: defaultPump.brand || '',
                powerKW: defaultPump.powerKW,
                image: defaultPump.image,
                category: 'pump',
                inStock: defaultPump.inStock,
            }
            : null;
    }

    if (categoryHint === 'generator') {
        const defaultGen = GENERATORS.find(g => g.id === 'yuchai-200kw-md200') || GENERATORS[0];
        return defaultGen
            ? {
                id: defaultGen.id,
                name: defaultGen.name,
                brand: defaultGen.brand,
                powerKW: defaultGen.powerKW,
                image: defaultGen.image,
                category: 'generator',
                inStock: defaultGen.inStock,
            }
            : null;
    }

    return null;
}
