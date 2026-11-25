/**
 * Resolves static asset URLs cleanly across root deployments (localhost, Vercel '/')
 * and subpath deployments (GitHub Pages '/Power-Ethiopia/').
 */
export function assetUrl(assetPath: string, baseOverride?: string): string {
  if (!assetPath) return '';
  if (/^(https?:|data:|blob:)/.test(assetPath)) return assetPath;

  const base =
    baseOverride ??
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.BASE_URL
      ? (import.meta as any).env.BASE_URL
      : '/');

  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  if (cleanBase !== '/' && assetPath.startsWith(cleanBase)) {
    return assetPath;
  }

  return `${cleanBase}${assetPath.replace(/^\/+/, '')}`;
}
