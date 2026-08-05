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
