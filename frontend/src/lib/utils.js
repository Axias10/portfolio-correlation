import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...args) {
  return twMerge(clsx(args));
}

export function fmtPct(n, digits = 2) {
  if (n == null || Number.isNaN(n)) return '—';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(digits)}%`;
}

export function fmtPrice(n) {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: n < 10 ? 4 : 2,
  }).format(n);
}

// Diverging color: -1 (red) → 0 (neutral) → 1 (green)
export function corrColor(v) {
  const x = Math.max(-1, Math.min(1, v));
  if (x >= 0) {
    const a = 0.15 + 0.7 * x;
    return `rgba(16, 185, 129, ${a.toFixed(3)})`;
  }
  const a = 0.15 + 0.7 * Math.abs(x);
  return `rgba(239, 68, 68, ${a.toFixed(3)})`;
}
