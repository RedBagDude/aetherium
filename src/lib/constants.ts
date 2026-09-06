import type { AssetClass, RiskLevel } from '@/types/financial';

/**
 * Design-token references kept in one place for programmatic use (canvas
 * fills, d3 scales, glows) — mirrors the CSS custom properties in globals.css.
 */
export const COLORS = {
  bgVoid: '#030305',
  surface1: '#0A0B10',
  surface2: '#12141D',
  emerald: '#00FF95',
  indigo: '#6366F1',
  cyan: '#00F0FF',
  crimson: '#FF2E63',
  amber: '#FFB800',
  textPrimary: '#F4F5F8',
  textMuted: '#71788B',
  grid: 'rgba(255,255,255,0.05)',
} as const;

export const ASSET_CLASS_LABEL: Record<AssetClass, string> = {
  EQUITY: 'Equity',
  FIXED_INCOME: 'Fixed Income',
  CRYPTO: 'Cryptocurrency',
  COMMODITY: 'Commodity',
  FOREX: 'Foreign Exchange',
  DERIVATIVE: 'Derivative',
};

export const ASSET_CLASS_COLOR: Record<AssetClass, string> = {
  EQUITY: COLORS.indigo,
  FIXED_INCOME: COLORS.cyan,
  CRYPTO: COLORS.amber,
  COMMODITY: COLORS.emerald,
  FOREX: '#8B5CF6',
  DERIVATIVE: COLORS.crimson,
};

export const RISK_LEVEL_LABEL: Record<RiskLevel, string> = {
  CONSERVATIVE: 'Conservative',
  MODERATE: 'Moderate',
  AGGRESSIVE: 'Aggressive',
  SYSTEMIC_HAZARD: 'Systemic Hazard',
};

export const SEVERITY_COLOR = {
  INFO: COLORS.cyan,
  WARNING: COLORS.amber,
  CRITICAL: COLORS.crimson,
  OPPORTUNITY: COLORS.emerald,
} as const;

export const NAV_ITEMS = [
  { href: '/analytics', label: 'Analytics', short: 'AN' },
  { href: '/portfolio', label: 'Portfolio', short: 'PF' },
  { href: '/risk', label: 'Risk', short: 'RK' },
  { href: '/simulations', label: 'Simulations', short: 'SM' },
] as const;

export const DEFAULT_MONTE_CARLO: {
  initialCapital: number;
  expectedReturnAnnual: number;
  volatilityAnnual: number;
  timeHorizonYears: number;
  numberOfSimulations: number;
} = {
  initialCapital: 1_250_000,
  expectedReturnAnnual: 0.085,
  volatilityAnnual: 0.18,
  timeHorizonYears: 3,
  numberOfSimulations: 10_000,
};

export const RISK_FREE_RATE = 0.043; // 4.3% annualised

export const WATCHLIST = [
  { symbol: 'SPY', name: 'S&P 500 ETF', price: 642.18, change: 0.42 },
  { symbol: 'NVDA', name: 'NVIDIA Corp', price: 1_204.55, change: 2.31 },
  { symbol: 'BTC-USD', name: 'Bitcoin', price: 97_420.1, change: -1.12 },
  { symbol: 'GLD', name: 'SPDR Gold', price: 241.33, change: 0.18 },
  { symbol: 'EURUSD', name: 'Euro / Dollar', price: 1.0842, change: -0.05 },
] as const;

export const AI_QUICK_PROMPTS = [
  { id: 'recession', label: 'Simular Recesión', prompt: 'Simulate a recession scenario' },
  { id: 'rebalance', label: 'Rebalancear Portafolio', prompt: 'Rebalance my portfolio' },
  { id: 'var', label: 'Calcular VaR Estresado', prompt: 'Run a stressed VaR test' },
] as const;

// maintainer: periodic housekeeping sync (2026-09-06)