import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';
import React from 'react';

// Mock Modules
vi.mock('./lib/LanguageContext', () => ({
    useLanguage: () => ({
        language: 'English',
        setLanguage: vi.fn()
    }),
    LanguageProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

vi.mock('./components/ui/BackgroundEffects', () => ({
    default: () => <div data-testid="bg-effects" />
}));

vi.mock('./components/VoiceAssistant', () => ({
    default: () => <div data-testid="voice-assistant" />
}));

describe('App Smoke Test', () => {
    it('renders without crashing', () => {
        render(<App />);
        // Use a more robust check for the brand name
        const brandElements = screen.getAllByText(/CE Power/i);
        expect(brandElements.length).toBeGreaterThan(0);
    });

    it('shows the main navigation', () => {
        render(<App />);
        expect(screen.getByRole('navigation')).toBeInTheDocument();
    });
});

import { assetUrl } from './lib/assetUtils';

describe('Deployment assetUrl resolution', () => {
    it('resolves local paths for both root (Vercel) and subpath (GitHub Pages)', () => {
        expect(assetUrl('/images/weichai-500kw.webp', '/')).toBe('/images/weichai-500kw.webp');
        expect(assetUrl('/images/weichai-500kw.webp', '/Power-Ethiopia/')).toBe('/Power-Ethiopia/images/weichai-500kw.webp');
        expect(assetUrl('/Power-Ethiopia/images/weichai-500kw.webp', '/Power-Ethiopia/')).toBe('/Power-Ethiopia/images/weichai-500kw.webp');
        expect(assetUrl('videos/hero-bg.mp4', '/Power-Ethiopia/')).toBe('/Power-Ethiopia/videos/hero-bg.mp4');
    });

    it('preserves external HTTPS and data URLs unchanged', () => {
        expect(assetUrl('https://cepower.et/logo.webp', '/Power-Ethiopia/')).toBe('https://cepower.et/logo.webp');
    });
});

import { findCatalogProduct } from './lib/productMatcher';

describe('CE Assistant Product Glimpse Matcher', () => {
    it('resolves exact catalog IDs cleanly', () => {
        expect(findCatalogProduct('weichai-500kw')?.image).toBe('/images/weichai-500kw.webp');
        expect(findCatalogProduct('yuchai-80kw-pump')?.image).toBe('/images/perkins-pump-80.webp');
        expect(findCatalogProduct('weichai-250kw-pump')?.category).toBe('pump');
    });

    it('resolves natural-language queries, brand+kW, and hallucinated model names', () => {
        const weichai = findCatalogProduct('WPG500-60HZ', 'WEICHAI WPG500 Series 500KW Diesel Generator Set', 'generator');
        expect(weichai?.id).toBe('weichai-500kw');
        expect(weichai?.image).toBe('/images/weichai-500kw.webp');

        const pump80 = findCatalogProduct('yuchai 80kw water pump');
        expect(pump80?.id).toBe('yuchai-80kw-pump');
        expect(pump80?.category).toBe('pump');

        expect(findCatalogProduct('yuchai 60kw water pump')?.id).toBe('yuchai-60kw-pump');
        expect(findCatalogProduct('yuchai 120kw pump')?.id).toBe('yuchai-120kw-pump');
        expect(findCatalogProduct('yuchai 120', null, 'Water Pump')?.id).toBe('yuchai-120kw-pump');
        expect(findCatalogProduct('yuchai 200kw pump')?.id).toBe('yuchai-200kw-pump');
        expect(findCatalogProduct('yuchai 250kw water pump')?.id).toBe('yuchai-250kw-pump');

        const pump150 = findCatalogProduct('weifang 150kw pump');
        expect(pump150?.id).toBe('weifang-150kw-pump');
        expect(pump150?.image).toBe('/images/volvo-pump-150.webp');

        const gen200 = findCatalogProduct('200kw yuchai generator');
        expect(gen200?.id).toBe('yuchai-200kw-md200');
        expect(gen200?.image).toBe('/images/yuchai-200kw-md200.webp');

        expect(findCatalogProduct('Yuchai 450', null, 'generator')?.id).toBe('yuchai-450kw');
        expect(findCatalogProduct('Weifang 150', null, 'generator')?.id).toBe('weifang-150kw');
        expect(findCatalogProduct('United Power 2.2', null, 'generator')?.id).toBe('united-2.2kw');
    });

    it('resolves Amharic product photo queries and category fallbacks', () => {
        const amPump = findCatalogProduct('የዩቻይ 80 ኪሎዋት ፓምፕ');
        expect(amPump?.id).toBe('yuchai-80kw-pump');

        const broadPump = findCatalogProduct('show me a water pump');
        expect(broadPump?.category).toBe('pump');
        expect(broadPump?.image.endsWith('.webp')).toBe(true);
    });
});

import { decodeBase64Bytes, decodePcm16ToFloat32, downsampleFloat32, float32ToPcm16Base64 } from './lib/audioUtils';

describe('Voice Assistant Smooth Audio Utilities', () => {
    it('round-trips Float32 -> PCM16 base64 -> Float32 without distortion', () => {
        const input = new Float32Array([0, 0.5, -0.5, 1.0, -1.0]);
        const b64 = float32ToPcm16Base64(input);
        const bytes = decodeBase64Bytes(b64);
        const decoded = decodePcm16ToFloat32(bytes);
        expect(decoded.length).toBe(input.length);
        for (let i = 0; i < input.length; i++) {
            expect(Math.abs(decoded[i] - input[i])).toBeLessThan(0.001);
        }
    });

    it('handles non-zero Uint8Array byteOffset cleanly when decoding PCM16', () => {
        const raw = new Int16Array([9999, 16384, -16384]);
        const slicedBytes = new Uint8Array(raw.buffer, 2, 4);
        const decoded = decodePcm16ToFloat32(slicedBytes);
        expect(decoded.length).toBe(2);
        expect(Math.abs(decoded[0] - 0.5)).toBeLessThan(0.001);
        expect(Math.abs(decoded[1] + 0.5)).toBeLessThan(0.001);
    });

    it('downsamples 48kHz capture cleanly to 16kHz and passes through 16kHz unchanged', () => {
        const buf16 = new Float32Array([0.1, 0.2, 0.3]);
        expect(downsampleFloat32(buf16, 16000, 16000)).toBe(buf16);

        const buf48 = new Float32Array([0.3, 0.3, 0.3, -0.6, -0.6, -0.6]);
        const down = downsampleFloat32(buf48, 48000, 16000);
        expect(down.length).toBe(2);
        expect(Math.abs(down[0] - 0.3)).toBeLessThan(0.0001);
        expect(Math.abs(down[1] + 0.6)).toBeLessThan(0.0001);
    });
});
