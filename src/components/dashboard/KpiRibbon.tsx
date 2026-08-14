'use client';

import React, { useMemo } from 'react';
import type { FinancialSummaryKPIs } from '@/types/financial';
import { NumberTicker } from '@/components/animations/NumberTicker';
import { TiltCard } from '@/components/animations/TiltCard';
import { formatPercentSigned, formatUSD } from '@/lib/formatters';
import { generateHistoricalReturns } from '@/lib/data';
import { sharpeRatio, maxDrawdown } from '@/lib/analytics';

interface Kpi {
  id: string;
  label: string;
  value: number;
  format: (v: number) => string;
  trend: 'UP' | 'DOWN' | 'NEUTRAL';
  accent: string;
  change: number;
}

function buildKpis(): FinancialSummaryKPIs & { kpis: Kpi[] } {
  const returns = generateHistoricalReturns();
  const equity = returns.reduce<number[]>((acc, r, i) => {
    acc.push((i === 0 ? 1_250_000 : acc[i - 1]) * (1 + r));
    return acc;
  }, []);
  const sharpe = sharpeRatio(returns);
  const mdd = maxDrawdown(equity);
  const var99 = 1_250_000 * 0.0386;

  const kpis: Kpi[] = [
    {
      id: 'net',
      label: 'Net Capital',
      value: 1_250_000,
      format: (v) => formatUSD(v),
      trend: 'UP',
      accent: '#00FF95',
      change: 6.4,
    },
    {
      id: 'sharpe',
      label: 'Sharpe Ratio',
      value: sharpe,
      format: (v) => v.toFixed(2),
      trend: sharpe > 1 ? 'UP' : 'DOWN',
      accent: '#00F0FF',
      change: 4.1,
    },
    {
      id: 'mdd',
      label: 'Max Drawdown',
      value: mdd * 100,
      format: (v) => `${v.toFixed(2)}%`,
      trend: 'DOWN',
      accent: '#FF2E63',
      change: -14.2,
    },
    {
      id: 'var',
      label: 'VaR (99%)',
      value: var99,
      format: (v) => formatUSD(v),
      trend: 'DOWN',
      accent: '#FFB800',
      change: -2.8,
    },
    {
      id: 'alpha',
      label: 'Alpha Generated',
      value: 3.42,
      format: (v) => `${v.toFixed(2)}%`,
      trend: 'UP',
      accent: '#6366F1',
      change: 12.9,
    },
    {
      id: 'beta',
      label: 'Beta to Market',
      value: 1.12,
      format: (v) => v.toFixed(2),
      trend: 'NEUTRAL',
      accent: '#00F0FF',
      change: 0.0,
    },
  ];

  const summary: FinancialSummaryKPIs = {
    netLiquidity: {
      current: 1_250_000,
      previousPeriod: 1_174_500,
      percentageChange: 6.4,
      trend: 'UP',
    },
    sharpeRatio: {
      current: sharpe,
      previousPeriod: sharpe / 1.04,
      percentageChange: 4.1,
      trend: 'UP',
    },
    maxDrawdown: {
      current: mdd,
      previousPeriod: mdd * 1.14,
      percentageChange: -14.2,
      trend: 'DOWN',
    },
    valueAtRisk99: {
      current: var99,
      previousPeriod: var99 * 1.028,
      percentageChange: -2.8,
      trend: 'DOWN',
    },
    alphaGenerated: {
      current: 3.42,
      previousPeriod: 3.03,
      percentageChange: 12.9,
      trend: 'UP',
    },
    betaToMarket: {
      current: 1.12,
      previousPeriod: 1.12,
      percentageChange: 0,
      trend: 'NEUTRAL',
    },
  };

  return { ...summary, kpis };
}

export function KpiRibbon() {
  const { kpis } = useMemo(() => buildKpis(), []);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      {kpis.map((kpi) => (
        <TiltCard
          key={kpi.id}
          className="p-4"
          glowColor={`${kpi.accent}26`}
        >
          <p className="mb-1 text-[11px] uppercase tracking-wider text-text-muted">
            {kpi.label}
          </p>
          <div className="flex items-baseline gap-2">
            <NumberTicker
              value={kpi.value}
              format={kpi.format}
              className="text-xl font-bold text-text-primary"
            />
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <span
              className="font-mono text-[11px]"
              style={{
                color:
                  kpi.trend === 'UP'
                    ? '#00FF95'
                    : kpi.trend === 'DOWN'
                      ? '#FF2E63'
                      : '#71788B',
              }}
            >
              {formatPercentSigned(kpi.change)}
            </span>
            <span className="text-[10px] text-text-muted">vs. periodo ant.</span>
          </div>
        </TiltCard>
      ))}
    </div>
  );
}
