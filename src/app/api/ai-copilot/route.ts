import { NextResponse } from 'next/server';
import type { AIInsight } from '@/types/financial';
import { generateInsights } from '@/lib/insights';
import { generatePositions, generateHistoricalReturns } from '@/lib/data';
import {
  maxDrawdown,
  annualizedVolatility,
  sharpeRatio,
} from '@/lib/analytics';

/**
 * AI copilot endpoint. Accepts an optional portfolio snapshot (POST) and
 * returns rule-based, citable insights. Falls back to the seeded demo snapshot.
 */
export const dynamic = 'force-dynamic';

function defaultSnapshot() {
  const positions = generatePositions();
  const returns = generateHistoricalReturns();
  const equity = returns.reduce<number[]>((acc, r, i) => {
    acc.push((i === 0 ? 1_250_000 : acc[i - 1]) * (1 + r));
    return acc;
  }, []);
  return {
    totalValue: 1_250_000,
    maxDrawdown: maxDrawdown(equity),
    volatilityAnnualized: annualizedVolatility(returns),
    sharpe: sharpeRatio(returns),
    concentrationTop: Math.max(...positions.map((p) => p.allocationPercentage)),
    positions,
  };
}

export async function GET() {
  const insights: AIInsight[] = generateInsights(defaultSnapshot());
  return NextResponse.json({ insights });
}

export async function POST(request: Request) {
  let snapshot = defaultSnapshot();
  try {
    const body = await request.json();
    if (body && typeof body === 'object') {
      snapshot = { ...snapshot, ...body };
    }
  } catch {
    // keep defaults on malformed body
  }
  const insights: AIInsight[] = generateInsights(snapshot);
  return NextResponse.json({ insights });
}
