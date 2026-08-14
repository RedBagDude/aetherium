'use client';

import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { MonteCarloPathResult } from '@/types/financial';
import { COLORS } from '@/lib/constants';
import { formatUSDCompact } from '@/lib/formatters';

interface MonteCarloSimChartProps {
  result: MonteCarloPathResult | null;
  height?: number;
}

interface TooltipEntry {
  dataKey?: string | number;
  value?: number | string;
  name?: string | number;
  color?: string;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card rounded-lg px-3 py-2 font-mono text-xs">
      <p className="mb-1 text-text-muted">{String(label ?? '')}</p>
      {payload.map((entry) => (
        <p key={String(entry.dataKey ?? entry.name)} style={{ color: entry.color }}>
          {entry.name}: {formatUSDCompact(Number(entry.value))}
        </p>
      ))}
    </div>
  );
}

/**
 * Percentile envelope (P10 / P50 / P90) of a Monte Carlo run, rendered with
 * Recharts. The band between P10 and P90 is shaded as the confidence corridor.
 */
export function MonteCarloSimChart({
  result,
  height = 320,
}: MonteCarloSimChartProps) {
  const data = useMemo(() => {
    if (!result) return [];
    return result.timeSteps.map((t, i) => ({
      step: t,
      p10: Math.round(result.percentile10[i]),
      p50: Math.round(result.percentile50[i]),
      p90: Math.round(result.percentile90[i]),
    }));
  }, [result]);

  if (!result) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center text-sm text-text-muted"
      >
        Ejecutando simulación…
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="mcFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLORS.indigo} stopOpacity={0.25} />
            <stop offset="100%" stopColor={COLORS.indigo} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="step"
          tick={{ fill: COLORS.textMuted, fontSize: 10, fontFamily: 'JetBrains Mono' }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: COLORS.textMuted, fontSize: 10, fontFamily: 'JetBrains Mono' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => formatUSDCompact(Number(v))}
          width={70}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="p90"
          name="P90 Optimista"
          stroke={COLORS.emerald}
          strokeWidth={1.5}
          fill="transparent"
          dot={false}
        />
        <Area
          type="monotone"
          dataKey="p50"
          name="P50 Esperado"
          stroke={COLORS.cyan}
          strokeWidth={2}
          fill="url(#mcFill)"
          dot={false}
        />
        <Area
          type="monotone"
          dataKey="p10"
          name="P10 Pesimista"
          stroke={COLORS.crimson}
          strokeWidth={1.5}
          fill="transparent"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
