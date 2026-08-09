/** Formatting helpers shared across the UI. */

export function currencySymbol(code?: string): string {
  switch ((code || '').toUpperCase()) {
    case 'USD':
      return '$';
    case 'INR':
      return '₹';
    case 'EUR':
      return '€';
    case 'GBP':
      return '£';
    default:
      return code ? `${code} ` : '₹';
  }
}

export function formatMoney(amount: number, code?: string): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return `${currencySymbol(code)}${safe.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export function formatDate(value?: string): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(value?: string): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
