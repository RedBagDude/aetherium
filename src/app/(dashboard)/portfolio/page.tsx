'use client';

import React, { useMemo } from 'react';
import { BentoCell } from '@/components/dashboard/BentoGrid';
import { TiltCard } from '@/components/animations/TiltCard';
import { NumberTicker } from '@/components/animations/NumberTicker';
import { generatePositions } from '@/lib/data';
import { ASSET_CLASS_COLOR, ASSET_CLASS_LABEL, COLORS } from '@/lib/constants';
import { formatUSD, formatPercent, formatPercentSigned } from '@/lib/formatters';
import type { AssetClass } from '@/types/financial';

export default function PortfolioPage() {
  const positions = useMemo(() => generatePositions(), []);

  const totalValue = positions.reduce((a, p) => a + p.marketValueUSD, 0);
  const totalPnl = positions.reduce((a, p) => a + p.unrealizedPnlUSD, 0);

  const byClass = useMemo(() => {
    const map = new Map<AssetClass, number>();
    for (const p of positions) {
      map.set(p.assetClass, (map.get(p.assetClass) ?? 0) + p.allocationPercentage);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [positions]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display-header bg-gradient-to-r from-text-primary to-text-primary/60 bg-clip-text text-transparent">
          Portfolio
        </h1>
        <p className="body-text mt-2 max-w-2xl text-text-muted">
          Exposición por clase de activo, asignación y P&L no realizado.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { label: 'Valor de Mercado', value: totalValue, fmt: (v: number) => formatUSD(v), color: COLORS.cyan },
          { label: 'P&L No Realizado', value: totalPnl, fmt: (v: number) => formatUSD(v), color: totalPnl >= 0 ? COLORS.emerald : COLORS.crimson },
          { label: 'Posiciones', value: positions.length, fmt: (v: number) => `${v}`, color: COLORS.indigo },
        ].map((k) => (
          <TiltCard key={k.label} className="p-5">
            <p className="mb-1 text-[11px] uppercase tracking-wider text-text-muted">
              {k.label}
            </p>
            <NumberTicker value={k.value} format={k.fmt} className="text-2xl font-bold" />
          </TiltCard>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
        <BentoCell className="md:col-span-5" delay={0.1}>
          <TiltCard className="h-full">
            <h3 className="mb-4 text-base font-semibold">Asignación por Clase</h3>
            <div className="space-y-3">
              {byClass.map(([assetClass, alloc]) => (
                <div key={assetClass}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-text-muted">
                      {ASSET_CLASS_LABEL[assetClass]}
                    </span>
                    <span className="font-mono text-text-primary">
                      {formatPercent(alloc)}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${alloc * 100}%`,
                        backgroundColor: ASSET_CLASS_COLOR[assetClass],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </TiltCard>
        </BentoCell>

        <BentoCell className="md:col-span-7" delay={0.16}>
          <TiltCard className="h-full">
            <h3 className="mb-4 text-base font-semibold">Posiciones</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-text-muted">
                    <th className="py-2 pr-3 font-medium">Activo</th>
                    <th className="py-2 pr-3 font-medium">Clase</th>
                    <th className="py-2 pr-3 text-right font-medium">Asignación</th>
                    <th className="py-2 pr-3 text-right font-medium">Valor</th>
                    <th className="py-2 pr-3 text-right font-medium">P&L</th>
                    <th className="py-2 text-right font-medium">Vol 30d</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((p) => (
                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                      <td className="py-2.5 pr-3">
                        <div className="font-mono font-semibold text-text-primary">
                          {p.ticker}
                        </div>
                        <div className="text-[11px] text-text-muted">{p.name}</div>
                      </td>
                      <td className="py-2.5 pr-3">
                        <span
                          className="inline-block rounded-full px-2 py-0.5 text-[11px] font-medium"
                          style={{
                            color: ASSET_CLASS_COLOR[p.assetClass],
                            backgroundColor: `${ASSET_CLASS_COLOR[p.assetClass]}1a`,
                          }}
                        >
                          {ASSET_CLASS_LABEL[p.assetClass]}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 text-right font-mono tabular-nums">
                        {formatPercent(p.allocationPercentage)}
                      </td>
                      <td className="py-2.5 pr-3 text-right font-mono tabular-nums">
                        {formatUSD(p.marketValueUSD)}
                      </td>
                      <td
                        className={`py-2.5 pr-3 text-right font-mono tabular-nums ${
                          p.unrealizedPnlUSD >= 0
                            ? 'text-accent-emerald'
                            : 'text-accent-crimson'
                        }`}
                      >
                        {formatPercentSigned(p.unrealizedPnlPercentage)}
                      </td>
                      <td className="py-2.5 text-right font-mono tabular-nums text-text-muted">
                        {formatPercent(p.volatility30d)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TiltCard>
        </BentoCell>
      </div>
    </div>
  );
}
