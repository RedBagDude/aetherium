'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { MonteCarloPathResult, AIInsight } from '@/types/financial';
import { useAnalyticsStore } from '@/store/useAnalyticsStore';
import { useAetheriumWorker } from '@/hooks/useAetheriumWorker';
import { BentoGrid, BentoCell } from '@/components/dashboard/BentoGrid';
import { TiltCard } from '@/components/animations/TiltCard';
import { KpiRibbon } from '@/components/dashboard/KpiRibbon';
import { CandlestickCanvasChart } from '@/components/charts/CandlestickCanvasChart';
import { LiveMarketOrderBook } from '@/components/dashboard/LiveMarketOrderBook';
import { MonteCarloSimChart } from '@/components/charts/MonteCarloSimChart';
import { RiskHeatmapChart } from '@/components/charts/RiskHeatmapChart';
import { SankeyCashflowChart } from '@/components/charts/SankeyCashflowChart';
import { TransactionTable } from '@/components/dashboard/TransactionTable';
import { InsightCard } from '@/components/ai/InsightCard';
import { DEFAULT_MONTE_CARLO } from '@/lib/constants';
import { generateCashflow, generatePositions, generateHistoricalReturns } from '@/lib/data';
import { generateInsights } from '@/lib/insights';
import { maxDrawdown, annualizedVolatility, sharpeRatio } from '@/lib/analytics';

function SectionTitle({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between">
      <div>
        <p className="mb-0.5 text-[11px] uppercase tracking-widest text-accent-cyan/70">
          {eyebrow}
        </p>
        <h3 className="text-base font-semibold text-text-primary">{title}</h3>
      </div>
      {action}
    </div>
  );
}

export default function AnalyticsPage() {
  const candles = useAnalyticsStore((s) => s.candles);
  const transactions = useAnalyticsStore((s) => s.transactions);
  const { runMonteCarlo } = useAetheriumWorker();
  const [mcResult, setMcResult] = useState<MonteCarloPathResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    runMonteCarlo(DEFAULT_MONTE_CARLO).then((r) => {
      if (!cancelled) setMcResult(r);
    });
    return () => {
      cancelled = true;
    };
  }, [runMonteCarlo]);

  const flows = useMemo(() => generateCashflow(), []);

  const insights = useMemo<AIInsight[]>(() => {
    const positions = generatePositions();
    const returns = generateHistoricalReturns();
    const equity = returns.reduce<number[]>((acc, r, i) => {
      acc.push((i === 0 ? 1_250_000 : acc[i - 1]) * (1 + r));
      return acc;
    }, []);
    return generateInsights({
      totalValue: 1_250_000,
      maxDrawdown: maxDrawdown(equity),
      volatilityAnnualized: annualizedVolatility(returns),
      sharpe: sharpeRatio(returns),
      concentrationTop: Math.max(...positions.map((p) => p.allocationPercentage)),
      positions,
    }).slice(0, 3);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display-header bg-gradient-to-r from-text-primary to-text-primary/60 bg-clip-text text-transparent">
          Command Center
        </h1>
        <p className="body-text mt-2 max-w-2xl text-text-muted">
          Inteligencia financiera en tiempo real — Monte Carlo, riesgo de cola y
          flujos de capital sobre un motor cuantitativo en Web Worker.
        </p>
      </div>

      <KpiRibbon />

      <BentoGrid>
        <BentoCell className="md:col-span-8 md:row-span-2" delay={0.05}>
          <TiltCard className="h-full" glowColor="rgba(0,240,255,0.12)">
            <SectionTitle eyebrow="Market" title="Price Action · EMA / Bollinger" />
            <CandlestickCanvasChart data={candles} />
          </TiltCard>
        </BentoCell>

        <BentoCell className="md:col-span-4 md:row-span-2" delay={0.12}>
          <TiltCard className="h-full" glowColor="rgba(99,102,241,0.12)">
            <LiveMarketOrderBook />
          </TiltCard>
        </BentoCell>

        <BentoCell className="md:col-span-7" delay={0.18}>
          <TiltCard className="h-full" glowColor="rgba(0,255,149,0.12)">
            <SectionTitle
              eyebrow="Quant"
              title="Monte Carlo · Proyección a 36 meses"
            />
            <MonteCarloSimChart result={mcResult} />
          </TiltCard>
        </BentoCell>

        <BentoCell className="md:col-span-5" delay={0.24}>
          <TiltCard className="h-full" glowColor="rgba(255,184,0,0.12)">
            <SectionTitle eyebrow="Risk" title="Matriz de Correlación" />
            <RiskHeatmapChart />
          </TiltCard>
        </BentoCell>

        <BentoCell className="md:col-span-8" delay={0.3}>
          <TiltCard className="h-full" glowColor="rgba(0,240,255,0.10)">
            <SectionTitle eyebrow="Cashflow" title="Asignación de Capital" />
            <SankeyCashflowChart flows={flows} />
          </TiltCard>
        </BentoCell>

        <BentoCell className="md:col-span-4" delay={0.36}>
          <TiltCard className="h-full" glowColor="rgba(99,102,241,0.14)">
            <SectionTitle eyebrow="AI Copilot" title="Insights Automáticos" />
            <div className="space-y-3">
              {insights.map((insight, i) => (
                <InsightCard key={insight.id} insight={insight} index={i} />
              ))}
            </div>
          </TiltCard>
        </BentoCell>
      </BentoGrid>

      <BentoCell delay={0.4}>
        <TiltCard className="h-full">
          <SectionTitle eyebrow="Ledger" title="Transacciones Recientes" />
          <TransactionTable transactions={transactions} />
        </TiltCard>
      </BentoCell>
    </div>
  );
}
