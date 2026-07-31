import { environment } from '../../environments/environment';

/** Resolve API-relative paths like `/uploads/...` to absolute URLs. */
export function resolveAssetUrl(path?: string | null): string {
  if (!path) return '';
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  const base =
    environment.assetsUrl ||
    environment.apiUrl.replace(/\/api\/?$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
