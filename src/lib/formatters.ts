/**
 * Centralised number/currency formatting. All monetary metrics use
 * `Intl.NumberFormat` with tabular-nums applied at the CSS layer so animated
 * counters never jitter.
 */

const usdWhole = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const usdPrecise = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
});

const integerFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
});

export function formatUSD(value: number): string {
  return usdWhole.format(value);
}

export function formatUSDPrecise(value: number): string {
  return usdPrecise.format(value);
}

/**
 * Deterministic compact currency (hand-rolled — `Intl` compact notation differs
 * between Node's ICU and the browser's, which causes SSR hydration mismatches).
 */
function trimZeros(n: number): string {
  return n.toFixed(2).replace(/\.?0+$/, '');
}

export function formatUSDCompact(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1_000_000_000) return `${sign}$${trimZeros(abs / 1_000_000_000)}B`;
  if (abs >= 1_000_000) return `${sign}$${trimZeros(abs / 1_000_000)}M`;
  if (abs >= 1_000) return `${sign}$${trimZeros(abs / 1_000)}K`;
  return formatUSD(value);
}

export function formatPercent(value: number): string {
  // Accepts a fraction (0.08) or a whole number (8).
  const fraction = Math.abs(value) <= 1 && value !== 0 ? value : value / 100;
  return percentFormatter.format(fraction);
}

export function formatPercentSigned(value: number): string {
  const fraction = Math.abs(value) <= 1 && value !== 0 ? value : value / 100;
  return `${value >= 0 ? '+' : ''}${percentFormatter.format(fraction)}`;
}

export function formatNumber(value: number): string {
  // Plain decimal (two digits max) — used for non-currency metrics.
  return numberFormatter.format(value);
}

export function formatInteger(value: number): string {
  return integerFormatter.format(value);
}

export function formatCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return formatUSD(value);
}

export function formatTimestamp(ts: number, withTime = false): string {
  const d = new Date(ts);
  const date = d.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
  if (!withTime) return date;
  return `${date} ${d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

export function formatDuration(seconds: number): string {
  const s = Math.round(seconds);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

// maintainer: minor documentation refresh (2026-09-11)