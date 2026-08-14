'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { BentoCell } from '@/components/dashboard/BentoGrid';
import { TiltCard } from '@/components/animations/TiltCard';
import { NumberTicker } from '@/components/animations/NumberTicker';
import { RiskHeatmapChart } from '@/components/charts/RiskHeatmapChart';
import { useAetheriumWorker, type RiskMetricsPayload, type VarResult } from '@/hooks/useAetheriumWorker';
import { generateHistoricalReturns } from '@/lib/data';
import { COLORS } from '@/lib/constants';
import { formatUSD } from '@/lib/formatters';

const INITIAL_VALUE = 1_250_000;

export default function RiskPage() {
  const { calculateVaR, calculateRiskMetrics } = useAetheriumWorker();
  const [vars, setVars] = useState<{ p95: VarResult | null; p99: VarResult | null }>({
    p95: null,
    p99: null,
  });
  const [metrics, setMetrics] = useState<RiskMetricsPayload | null>(null);

  const returns = useMemo(() => generateHistoricalReturns(), []);

  const equity = useMemo(() => {
    const curve = returns.reduce<number[]>((acc, r, i) => {
      acc.push((i === 0 ? INITIAL_VALUE : acc[i - 1]) * (1 + r));
      return acc;
    }, []);
    return curve.map((v, i) => ({ i, value: Math.round(v), drawdown: 0 }));
  }, [returns]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      calculateVaR(returns, 0.95, INITIAL_VALUE),
      calculateVaR(returns, 0.99, INITIAL_VALUE),
      calculateRiskMetrics(returns, equity.map((e) => e.value)),
    ]).then(([p95, p99, m]) => {
      if (cancelled) return;
      setVars({ p95, p99 });
      setMetrics(m);
    });
    return () => {
      cancelled = true;
    };
  }, [calculateVaR, calculateRiskMetrics, returns, equity]);

  const metricCards = [
    {
      label: 'VaR Histórico 95%',
      value: vars.p95?.historical ?? 0,
      fmt: (v: number) => formatUSD(v),
      color: COLORS.amber,
    },
    {
      label: 'VaR Histórico 99%',
      value: vars.p99?.historical ?? 0,
      fmt: (v: number) => formatUSD(v),
      color: COLORS.crimson,
    },
    {
      label: 'VaR Paramétrico 99%',
      value: vars.p99?.parametric ?? 0,
      fmt: (v: number) => formatUSD(v),
      color: COLORS.crimson,
    },
    {
      label: 'Sharpe Ratio',
      value: metrics?.sharpe ?? 0,
      fmt: (v: number) => v.toFixed(2),
      color: COLORS.emerald,
    },
    {
      label: 'Sortino Ratio',
      value: metrics?.sortino ?? 0,
      fmt: (v: number) => v.toFixed(2),
      color: COLORS.cyan,
    },
    {
      label: 'Max Drawdown',
      value: (metrics?.maxDrawdown ?? 0) * 100,
      fmt: (v: number) => `${v.toFixed(2)}%`,
      color: COLORS.crimson,
    },
    {
      label: 'Volatilidad Anual',
      value: (metrics?.volatilityAnnualized ?? 0) * 100,
      fmt: (v: number) => `${v.toFixed(2)}%`,
      color: COLORS.amber,
    },
    {
      label: 'Retorno Esperado',
      value: (metrics?.expectedReturnAnnual ?? 0) * 100,
      fmt: (v: number) => `${v.toFixed(2)}%`,
      color: COLORS.emerald,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display-header bg-gradient-to-r from-text-primary to-text-primary/60 bg-clip-text text-transparent">
          Risk Engine
        </h1>
        <p className="body-text mt-2 max-w-2xl text-text-muted">
          VaR histórico y paramétrico, ratios ajustados por riesgo y exposición
          correlacional, calculados en Web Worker.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {metricCards.map((m) => (
          <TiltCard key={m.label} className="p-4">
            <p className="mb-1 text-[11px] uppercase tracking-wider text-text-muted">
              {m.label}
            </p>
            <NumberTicker
              value={m.value}
              format={m.fmt}
              className="text-lg font-bold"
            />
          </TiltCard>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
        <BentoCell className="md:col-span-7" delay={0.1}>
          <TiltCard className="h-full">
            <h3 className="mb-4 text-base font-semibold">Curva de Capital</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={equity} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.emerald} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={COLORS.emerald} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="i" tick={false} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: COLORS.textMuted, fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  tickFormatter={(v) => formatUSD(Number(v))}
                  tickLine={false}
                  axisLine={false}
                  width={72}
                />
                <Tooltip
                  contentStyle={{
                    background: COLORS.surface2,
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value) => [formatUSD(Number(value)), 'Equity']}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={COLORS.emerald}
                  strokeWidth={2}
                  fill="url(#equityFill)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </TiltCard>
        </BentoCell>

        <BentoCell className="md:col-span-5" delay={0.16}>
          <TiltCard className="h-full">
            <h3 className="mb-4 text-base font-semibold">Matriz de Correlación</h3>
            <RiskHeatmapChart />
          </TiltCard>
        </BentoCell>
      </div>
    </div>
  );
}
