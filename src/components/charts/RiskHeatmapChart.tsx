'use client';

import React, { useMemo } from 'react';
import { COLORS } from '@/lib/constants';
import { mulberry32 } from '@/lib/utils';

interface RiskHeatmapChartProps {
  assets?: string[];
  height?: number;
}

/**
 * Correlation / exposure heatmap rendered as an SVG grid. Correlation values
 * are deterministically derived from a seeded PRNG (stable across SSR/client).
 */
export function RiskHeatmapChart({
  assets = ['NVDA', 'AAPL', 'MSFT', 'BTC', 'ETH', 'TLT', 'GLD', 'SPX'],
  height = 320,
}: RiskHeatmapChartProps) {
  const matrix = useMemo(() => {
    const rand = mulberry32(0xfeedface);
    const n = assets.length;
    const m: number[][] = [];
    for (let i = 0; i < n; i++) {
      m[i] = [];
      for (let j = 0; j < n; j++) {
        if (i === j) m[i][j] = 1;
        else if (j < i) m[i][j] = m[j][i];
        else m[i][j] = Number((0.25 + rand() * 0.7).toFixed(2));
      }
    }
    return m;
  }, [assets]);

  const n = assets.length;
  const cell = 100 / (n + 1.5);
  const labelPad = 100 - cell * (n + 0.5);

  const colorFor = (value: number) => {
    // positive → emerald/indigo, negative → crimson
    if (value < 0.35) return COLORS.crimson;
    if (value < 0.6) return COLORS.amber;
    if (value < 0.8) return COLORS.indigo;
    return COLORS.emerald;
  };

  return (
    <svg
      viewBox={`0 0 100 ${100 - (n + 1) * cell * 0}`}
      width="100%"
      height={height}
      className="overflow-visible"
      role="img"
      aria-label="Risk correlation heatmap"
    >
      {matrix.map((row, i) =>
        row.map((value, j) => {
          const x = labelPad + j * cell;
          const y = i * cell;
          return (
            <rect
              key={`${i}-${j}`}
              x={x}
              y={y}
              width={cell * 0.92}
              height={cell * 0.92}
              rx={cell * 0.2}
              fill={colorFor(value)}
              opacity={0.18 + value * 0.6}
            >
              <title>{`${assets[i]} × ${assets[j]}: ${value.toFixed(2)}`}</title>
            </rect>
          );
        }),
      )}
      {assets.map((a, i) => (
        <text
          key={`row-${a}`}
          x={labelPad - 2}
          y={i * cell + cell * 0.62}
          textAnchor="end"
          fontSize={cell * 0.34}
          fill={COLORS.textMuted}
          fontFamily="JetBrains Mono, monospace"
        >
          {a}
        </text>
      ))}
      {assets.map((a, i) => (
        <text
          key={`col-${a}`}
          x={labelPad + i * cell + cell * 0.46}
          y={n * cell + cell * 0.6}
          textAnchor="middle"
          fontSize={cell * 0.3}
          fill={COLORS.textMuted}
          fontFamily="JetBrains Mono, monospace"
          transform={`rotate(-40 ${labelPad + i * cell + cell * 0.46} ${n * cell + cell * 0.6})`}
        >
          {a}
        </text>
      ))}
    </svg>
  );
}
