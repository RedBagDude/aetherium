import type {
  MonteCarloInput,
  MonteCarloPathResult,
  CandlestickData,
} from '@/types/financial';
import { gaussian, inverseNormalCdf } from './utils';

/**
 * Pure quantitative analytics. Every function here is synchronous and free of
 * side effects so it can run inside a Web Worker (off the UI thread) or inline
 * as a fallback. All monetary quantities are expressed in USD.
 */

// ── Monte Carlo (Geometric Brownian Motion) ────────────────────────────────

/**
 * Simulate `numberOfSimulations` GBM paths and return the P10 / P50 / P90
 * percentile envelopes at monthly resolution.
 *
 *   S_t = S_0 · exp( (μ − σ²/2)·t + σ·W_t )
 */
export function runMonteCarlo(params: MonteCarloInput): MonteCarloPathResult {
  const {
    initialCapital,
    expectedReturnAnnual,
    volatilityAnnual,
    timeHorizonYears,
    numberOfSimulations,
  } = params;

  const stepsPerYear = 12; // monthly resolution
  const totalSteps = Math.round(timeHorizonYears * stepsPerYear);
  const dt = 1 / stepsPerYear;

  const drift = (expectedReturnAnnual - 0.5 * volatilityAnnual ** 2) * dt;
  const volSqrtDt = volatilityAnnual * Math.sqrt(dt);

  const paths: Float64Array[] = [];
  for (let s = 0; s < numberOfSimulations; s++) {
    const path = new Float64Array(totalSteps + 1);
    path[0] = initialCapital;
    paths.push(path);
  }

  for (let step = 1; step <= totalSteps; step++) {
    for (let sim = 0; sim < numberOfSimulations; sim++) {
      const z = gaussian(Math.random);
      paths[sim][step] = paths[sim][step - 1] * Math.exp(drift + volSqrtDt * z);
    }
  }

  const p10 = new Array<number>(totalSteps + 1);
  const p50 = new Array<number>(totalSteps + 1);
  const p90 = new Array<number>(totalSteps + 1);
  const timeSteps = new Array<string>(totalSteps + 1);

  for (let step = 0; step <= totalSteps; step++) {
    const column = new Array<number>(numberOfSimulations);
    for (let sim = 0; sim < numberOfSimulations; sim++) {
      column[sim] = paths[sim][step];
    }
    column.sort((a, b) => a - b);
    p10[step] = column[Math.floor(numberOfSimulations * 0.1)];
    p50[step] = column[Math.floor(numberOfSimulations * 0.5)];
    p90[step] = column[Math.floor(numberOfSimulations * 0.9)];

    const year = Math.floor(step / 12);
    const month = step % 12;
    timeSteps[step] = `Y${year}M${month}`;
  }

  // Drawdown distribution at the terminal step.
  const drawdowns = paths
    .map((path) => (initialCapital - path[totalSteps]) / initialCapital)
    .filter((d) => d > 0)
    .sort((a, b) => a - b);

  return {
    percentile10: p10,
    percentile50: p50,
    percentile90: p90,
    timeSteps,
    simulatedDrawdownDistribution: drawdowns,
  };
}

// ── Risk metrics ────────────────────────────────────────────────────────────

/** Historical VaR: quantile of observed returns. Returns a positive loss. */
export function historicalVaR(
  returns: number[],
  confidenceLevel: number,
  initialValue: number,
): number {
  if (returns.length === 0) return 0;
  const sorted = [...returns].sort((a, b) => a - b);
  const index = Math.max(0, Math.floor((1 - confidenceLevel) * sorted.length));
  return Math.abs(sorted[index] * initialValue);
}

/** Parametric VaR assuming normally-distributed returns: VaR = (Z_α·σ − μ)·V0. */
export function parametricVaR(
  returns: number[],
  confidenceLevel: number,
  initialValue: number,
): number {
  if (returns.length < 2) return 0;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance =
    returns.reduce((a, b) => a + (b - mean) ** 2, 0) / (returns.length - 1);
  const sd = Math.sqrt(variance);
  const z = inverseNormalCdf(confidenceLevel); // positive for confidence > 0.5
  return Math.max(0, (z * sd - mean) * initialValue);
}

/** Annualised Sharpe ratio: (Rp − Rf) / σp. */
export function sharpeRatio(
  returns: number[],
  riskFreeRateAnnual = 0.043,
  periodsPerYear = 252,
): number {
  if (returns.length < 2) return 0;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance =
    returns.reduce((a, b) => a + (b - mean) ** 2, 0) / (returns.length - 1);
  const sd = Math.sqrt(variance);
  if (sd === 0) return 0;
  const rf = riskFreeRateAnnual / periodsPerYear;
  return ((mean - rf) / sd) * Math.sqrt(periodsPerYear);
}

/** Sortino ratio uses only downside deviation. */
export function sortinoRatio(
  returns: number[],
  riskFreeRateAnnual = 0.043,
  periodsPerYear = 252,
): number {
  if (returns.length < 2) return 0;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const rf = riskFreeRateAnnual / periodsPerYear;
  const downside = returns.filter((r) => r < rf);
  if (downside.length === 0) return 0;
  const variance =
    downside.reduce((a, b) => a + (b - rf) ** 2, 0) / downside.length;
  const sd = Math.sqrt(variance);
  if (sd === 0) return 0;
  return ((mean - rf) / sd) * Math.sqrt(periodsPerYear);
}

/** Maximum drawdown of an equity curve (array of portfolio values). */
export function maxDrawdown(equity: number[]): number {
  if (equity.length === 0) return 0;
  let peak = equity[0];
  let mdd = 0;
  for (const value of equity) {
    if (value > peak) peak = value;
    const dd = (peak - value) / peak;
    if (dd > mdd) mdd = dd;
  }
  return mdd;
}

/** Annualised volatility from a series of periodic returns. */
export function annualizedVolatility(
  returns: number[],
  periodsPerYear = 252,
): number {
  if (returns.length < 2) return 0;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance =
    returns.reduce((a, b) => a + (b - mean) ** 2, 0) / (returns.length - 1);
  return Math.sqrt(variance) * Math.sqrt(periodsPerYear);
}

/** Annualised expected return (geometric) from periodic returns. */
export function annualizedReturn(
  returns: number[],
  periodsPerYear = 252,
): number {
  if (returns.length < 2) return 0;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  return mean * periodsPerYear;
}

// ── Douglas–Peucker polyline simplification ─────────────────────────────────

interface Point {
  x: number;
  y: number;
}

function perpendicularDistance(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (dx === 0 && dy === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy);
  const cx = a.x + dx * Math.max(0, Math.min(1, t));
  const cy = a.y + dy * Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - cx, p.y - cy);
}

/**
 * Reduce a polyline to its most salient vertices, preserving peaks/troughs.
 */
export function douglasPeucker(points: Point[], epsilon: number): Point[] {
  if (points.length <= 2) return points;
  let maxDistance = 0;
  let index = 0;
  const end = points.length - 1;
  for (let i = 1; i < end; i++) {
    const d = perpendicularDistance(points[i], points[0], points[end]);
    if (d > maxDistance) {
      index = i;
      maxDistance = d;
    }
  }
  if (maxDistance > epsilon) {
    const left = douglasPeucker(points.slice(0, index + 1), epsilon);
    const right = douglasPeucker(points.slice(index), epsilon);
    return [...left.slice(0, -1), ...right];
  }
  return [points[0], points[end]];
}

// ── Technical indicators ────────────────────────────────────────────────────

/** Exponential moving average of a series. */
export function ema(values: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const result: number[] = [];
  let prev = values[0] ?? 0;
  for (let i = 0; i < values.length; i++) {
    prev = i === 0 ? values[i] : values[i] * k + prev * (1 - k);
    result.push(prev);
  }
  return result;
}

/** Bollinger bands (20-period, 2σ) around a series. */
export function bollingerBands(values: number[], period = 20, mult = 2) {
  const middle = ema(values, period);
  const upper: number[] = [];
  const lower: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - period + 1);
    const window = values.slice(start, i + 1);
    const mean = window.reduce((a, b) => a + b, 0) / window.length;
    const variance =
      window.reduce((a, b) => a + (b - mean) ** 2, 0) / window.length;
    const sd = Math.sqrt(variance);
    upper.push(middle[i] + mult * sd);
    lower.push(middle[i] - mult * sd);
  }
  return { middle, upper, lower };
}

/** Simple periodic returns from a price series. */
export function toReturns(prices: number[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  return returns;
}

/** Extract closing prices from candlesticks. */
export function closes(data: CandlestickData[]): number[] {
  return data.map((d) => d.close);
}
