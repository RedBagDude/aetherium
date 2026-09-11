import type {
  CandlestickData,
  OrderBookState,
  PortfolioPosition,
  Transaction,
  CashFlowStreamNode,
} from '@/types/financial';
import { mulberry32 } from './utils';

/**
 * Deterministic seed data. Every series is generated from a fixed PRNG seed so
 * server and client produce identical output (no hydration mismatch). Live
 * ticking happens client-side after mount.
 */

const DAY_MS = 86_400_000;

// ── Candlesticks ────────────────────────────────────────────────────────────

export function generateCandlesticks(count = 220): CandlestickData[] {
  const rand = mulberry32(0x4a11dead);
  const candles: CandlestickData[] = [];
  let price = 412.4;
  const now = Date.UTC(2026, 7, 12, 0, 0, 0);
  let volumeBase = 2_400_000;

  for (let i = 0; i < count; i++) {
    const drift = 0.0002 + (rand() - 0.5) * 0.0012;
    const shock = (rand() - 0.5) * 0.03;
    const open = price;
    const close = Math.max(5, open * (1 + drift + shock));
    const high = Math.max(open, close) * (1 + rand() * 0.008);
    const low = Math.min(open, close) * (1 - rand() * 0.008);
    const volume = volumeBase * (0.6 + rand() * 0.9);
    volumeBase = volumeBase * (0.98 + rand() * 0.04);
    candles.push({
      timestamp: now - (count - 1 - i) * DAY_MS,
      open: round2(open),
      high: round2(high),
      low: round2(low),
      close: round2(close),
      volume: Math.round(volume),
    });
    price = close;
  }
  return candles;
}

// ── Order book ──────────────────────────────────────────────────────────────

export function generateOrderBook(mid = 64_250): OrderBookState {
  const rand = mulberry32(0xb00b1e5);
  const bids = [];
  const asks = [];
  let bidTotal = 0;
  let askTotal = 0;
  for (let i = 0; i < 12; i++) {
    const bidSize = round2(0.05 + rand() * 3);
    const askSize = round2(0.05 + rand() * 3);
    bidTotal += bidSize * (mid - i * 0.5);
    askTotal += askSize * (mid + i * 0.5);
    bids.push({
      price: round2(mid - i * 0.5),
      size: bidSize,
      total: round2(bidTotal),
    });
    asks.push({
      price: round2(mid + (i + 1) * 0.5),
      size: askSize,
      total: round2(askTotal),
    });
  }
  const bidSum = bids.reduce((a, b) => a + b.size, 0);
  const askSum = asks.reduce((a, b) => a + b.size, 0);
  const imbalanceRatio = (bidSum - askSum) / (bidSum + askSum || 1);
  return {
    bids,
    asks,
    spread: round2(asks[0].price - bids[0].price),
    imbalanceRatio: round4(imbalanceRatio),
  };
}

// ── Portfolio positions ─────────────────────────────────────────────────────

export function generatePositions(): PortfolioPosition[] {
  const raw: Array<
    [string, string, PortfolioPosition['assetClass'], number, number]
  > = [
    ['NVDA', 'NVIDIA Corporation', 'EQUITY', 0.142, 34.2],
    ['AAPL', 'Apple Inc.', 'EQUITY', 0.118, 21.5],
    ['MSFT', 'Microsoft Corporation', 'EQUITY', 0.096, 18.9],
    ['BTC-USD', 'Bitcoin', 'CRYPTO', 0.087, 61.4],
    ['ETH-USD', 'Ethereum', 'CRYPTO', 0.052, 58.2],
    ['TLT', '20Y Treasury Bond ETF', 'FIXED_INCOME', 0.124, 12.4],
    ['GLD', 'SPDR Gold Shares', 'COMMODITY', 0.069, 14.8],
    ['EURUSD', 'EUR/USD FX', 'FOREX', 0.041, 7.1],
    ['SPX', 'S&P 500 Futures', 'DERIVATIVE', 0.093, 26.3],
    ['AMZN', 'Amazon.com Inc.', 'EQUITY', 0.088, 29.7],
    ['GOOGL', 'Alphabet Inc.', 'EQUITY', 0.062, 24.1],
    ['XOM', 'Exxon Mobil Corp.', 'EQUITY', 0.028, 19.6],
  ];

  const total = 1_250_000;
  return raw.map(([ticker, name, assetClass, alloc, vol], i) => {
    const marketValue = total * alloc;
    const pnlPct = (i % 3 === 0 ? -1 : 1) * (2 + (i * 3.7) % 18);
    return {
      id: `pos_${ticker.toLowerCase()}`,
      ticker,
      name,
      assetClass,
      allocationPercentage: round4(alloc),
      marketValueUSD: Math.round(marketValue),
      unrealizedPnlUSD: Math.round((marketValue * pnlPct) / 100),
      unrealizedPnlPercentage: round2(pnlPct),
      volatility30d: round2(vol / 100),
    };
  });
}

// ── Transactions ────────────────────────────────────────────────────────────

export function generateTransactions(count = 40): Transaction[] {
  const rand = mulberry32(0xca5cade5);
  const tickers = ['NVDA', 'AAPL', 'BTC-USD', 'TLT', 'MSFT', 'GLD', 'SPX'];
  const now = Date.UTC(2026, 7, 12, 0, 0, 0);
  const tx: Transaction[] = [];
  for (let i = 0; i < count; i++) {
    const ticker = tickers[Math.floor(rand() * tickers.length)];
    const side = rand() > 0.45 ? 'BUY' : 'SELL';
    const price = round2(40 + rand() * 1_200);
    const quantity = Math.round(1 + rand() * 400);
    const status =
      i < 3 ? 'PENDING' : rand() > 0.94 ? 'CANCELLED' : 'FILLED';
    tx.push({
      id: `tx_${i}`,
      timestamp: now - i * 5 * 3_600_000 - Math.floor(rand() * 3_600_000),
      ticker,
      side,
      quantity,
      price,
      notionalUSD: Math.round(price * quantity),
      feeUSD: round2((price * quantity) / 1000),
      status,
    });
  }
  return tx.sort((a, b) => b.timestamp - a.timestamp);
}

// ── Cash-flow streams (Sankey) ──────────────────────────────────────────────

export function generateCashflow(): CashFlowStreamNode[] {
  return [
    { id: 'cf_in_ops', source: 'Operating Revenue', target: 'Gross Margin', valueUSD: 4_820_000, category: 'INFLOW' },
    { id: 'cf_in_fin', source: 'Financing', target: 'Gross Margin', valueUSD: 1_240_000, category: 'INFLOW' },
    { id: 'cf_in_inv', source: 'Investment Income', target: 'Gross Margin', valueUSD: 640_000, category: 'INFLOW' },
    { id: 'cf_op1', source: 'Gross Margin', target: 'Operating Expenses', valueUSD: 2_310_000, category: 'OPERATING_EXPENSE' },
    { id: 'cf_op2', source: 'Gross Margin', target: 'R&D', valueUSD: 890_000, category: 'OPERATING_EXPENSE' },
    { id: 'cf_capex', source: 'Gross Margin', target: 'CAPEX', valueUSD: 720_000, category: 'CAPEX' },
    { id: 'cf_tax', source: 'Gross Margin', target: 'Taxes', valueUSD: 430_000, category: 'TAX' },
    { id: 'cf_net', source: 'Gross Margin', target: 'Net Margin', valueUSD: 2_350_000, category: 'NET_MARGIN' },
  ];
}

// ── Historical daily returns (for VaR / Sharpe) ─────────────────────────────

export function generateHistoricalReturns(count = 756): number[] {
  const rand = mulberry32(0xdeadc0de);
  const returns: number[] = [];
  const drift = 0.00085; // positive daily drift → realistic positive Sharpe
  for (let i = 0; i < count; i++) {
    const u = rand();
    let r: number;
    if (u < 0.015) r = -0.03 - rand() * 0.025;
    else if (u > 0.985) r = 0.028 + rand() * 0.02;
    else r = (rand() - 0.5) * 0.015;
    returns.push(r + drift);
  }
  return returns;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function round4(n: number): number {
  return Math.round(n * 10_000) / 10_000;
}

// maintainer: scheduled consistency check (2026-09-11)