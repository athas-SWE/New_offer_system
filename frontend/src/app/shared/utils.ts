export function formatLkr(amount: number): string {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Sale price from original + discount % (2 decimal places). Returns 0 if no original. */
export function offerPriceFrom(original: number, percent: number): number {
  const base = Number(original);
  if (!Number.isFinite(base) || base <= 0) return 0;
  const discount = Math.min(100, Math.max(0, Number(percent) || 0));
  return Math.round(base * (1 - discount / 100) * 100) / 100;
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-LK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

/** Ensure external links open correctly when users omit https:// */
export function externalHref(url?: string | null): string | undefined {
  const raw = (url || '').trim();
  if (!raw) return undefined;
  if (/^https?:\/\//i.test(raw) || /^mailto:/i.test(raw) || /^tel:/i.test(raw)) {
    return raw;
  }
  return `https://${raw.replace(/^\/+/, '')}`;
}

/** Short label for long URLs in shop UI */
export function displayUrl(url?: string | null, max = 42): string {
  const href = externalHref(url);
  if (!href) return '';
  const cleaned = href.replace(/^https?:\/\//i, '').replace(/\/$/, '');
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 1)}…`;
}

