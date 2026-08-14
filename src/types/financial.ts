export type AssetClass =
  | 'EQUITY'
  | 'FIXED_INCOME'
  | 'CRYPTO'
  | 'COMMODITY'
  | 'FOREX'
  | 'DERIVATIVE';

export type RiskLevel =
  | 'CONSERVATIVE'
  | 'MODERATE'
  | 'AGGRESSIVE'
  | 'SYSTEMIC_HAZARD';

export interface CandlestickData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MetricValue {
  current: number;
  previousPeriod: number;
  percentageChange: number;
  trend: 'UP' | 'DOWN' | 'NEUTRAL';
}

export interface FinancialSummaryKPIs {
  netLiquidity: MetricValue;
  sharpeRatio: MetricValue;
  maxDrawdown: MetricValue;
  valueAtRisk99: MetricValue;
  alphaGenerated: MetricValue;
  betaToMarket: MetricValue;
}

export interface PortfolioPosition {
  id: string;
  ticker: string;
  name: string;
  assetClass: AssetClass;
  allocationPercentage: number;
  marketValueUSD: number;
  unrealizedPnlUSD: number;
  unrealizedPnlPercentage: number;
  volatility30d: number;
}

export interface MonteCarloInput {
  initialCapital: number;
  expectedReturnAnnual: number;
  volatilityAnnual: number;
  timeHorizonYears: number;
  numberOfSimulations: number;
}

export interface MonteCarloPathResult {
  percentile10: number[];
  percentile50: number[];
  percentile90: number[];
  timeSteps: string[];
  simulatedDrawdownDistribution: number[];
}

export interface OrderBookEntry {
  price: number;
  size: number;
  total: number;
}

export interface OrderBookState {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  spread: number;
  imbalanceRatio: number; // Ratio comprador/vendedor [-1, 1]
}

export interface CashFlowStreamNode {
  id: string;
  source: string;
  target: string;
  valueUSD: number;
  category: 'INFLOW' | 'OPERATING_EXPENSE' | 'CAPEX' | 'TAX' | 'NET_MARGIN';
}

export interface AIInsight {
  id: string;
  timestamp: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'OPPORTUNITY';
  title: string;
  description: string;
  recommendedAction?: string;
  confidenceScore: number; // [0, 1]
}

// ── Additional contracts used across the platform ──────────────────────────

export interface Transaction {
  id: string;
  timestamp: number;
  ticker: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  notionalUSD: number;
  feeUSD: number;
  status: 'FILLED' | 'PENDING' | 'CANCELLED';
}

export interface RiskMetrics {
  valueAtRisk95: number;
  valueAtRisk99: number;
  parametricVaR95: number;
  parametricVaR99: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  volatilityAnnualized: number;
  expectedReturnAnnual: number;
}

export interface VaRCalculationInput {
  returns: number[];
  confidenceLevel: number;
  initialValue: number;
}

export interface VaRCalculationResult {
  varAmount: number;
  confidence: number;
  horizon: '1D' | '10D';
}

export interface MarketTick {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  volume: number;
  timestamp: number;
}

export interface CommandItem {
  id: string;
  label: string;
  hint?: string;
  section: string;
  icon?: string;
  action: () => void;
}
