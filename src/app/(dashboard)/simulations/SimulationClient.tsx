'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { BentoCell } from '@/components/dashboard/BentoGrid';
import { TiltCard } from '@/components/animations/TiltCard';
import { MonteCarloSimChart } from '@/components/charts/MonteCarloSimChart';
import { NumberTicker } from '@/components/animations/NumberTicker';
import { useAetheriumWorker } from '@/hooks/useAetheriumWorker';
import { DEFAULT_MONTE_CARLO } from '@/lib/constants';
import { formatUSD, formatPercent } from '@/lib/formatters';
import type { MonteCarloInput, MonteCarloPathResult } from '@/types/financial';

const RECESSION_PRESET: MonteCarloInput = {
  initialCapital: 1_250_000,
  expectedReturnAnnual: -0.12,
  volatilityAnnual: 0.45,
  timeHorizonYears: 2,
  numberOfSimulations: 10_000,
};

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="text-text-muted">{label}</span>
        <span className="font-mono text-text-primary">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-accent-indigo"
      />
    </label>
  );
}

export function SimulationClient({
  initialScenario,
}: {
  initialScenario: string | null;
}) {
  const { runMonteCarlo } = useAetheriumWorker();
  const [input, setInput] = useState<MonteCarloInput>(() =>
    initialScenario === 'recession' ? RECESSION_PRESET : DEFAULT_MONTE_CARLO,
  );
  const [result, setResult] = useState<MonteCarloPathResult | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const id = setTimeout(() => {
      setRunning(true);
      runMonteCarlo(input).then((r) => {
        if (!cancelled) {
          setResult(r);
          setRunning(false);
        }
      });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [input, runMonteCarlo]);

  const summary = useMemo(() => {
    if (!result) return null;
    const last = result.percentile10.length - 1;
    return {
      p10: result.percentile10[last],
      p50: result.percentile50[last],
      p90: result.percentile90[last],
    };
  }, [result]);

  const set = (patch: Partial<MonteCarloInput>) =>
    setInput((prev) => ({ ...prev, ...patch }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display-header bg-gradient-to-r from-text-primary to-text-primary/60 bg-clip-text text-transparent">
          Monte Carlo Engine
        </h1>
        <p className="body-text mt-2 max-w-2xl text-text-muted">
          {`Simulación estocástica de ${input.numberOfSimulations.toLocaleString(
            'en-US',
          )} trayectorias mediante Movimiento Browniano Geométrico, ejecutada en un Web Worker dedicado.`}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
        <BentoCell className="md:col-span-4" delay={0.05}>
          <TiltCard className="h-full">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold">Parámetros</h3>
              <button
                onClick={() => setInput(RECESSION_PRESET)}
                className="rounded-lg border border-accent-crimson/30 bg-accent-crimson/10 px-2.5 py-1 text-xs text-accent-crimson hover:bg-accent-crimson/20"
              >
                Escenario Recesión
              </button>
            </div>

            <div className="space-y-5">
              <Slider
                label="Capital Inicial"
                value={input.initialCapital}
                min={100_000}
                max={10_000_000}
                step={50_000}
                onChange={(v) => set({ initialCapital: v })}
                format={(v) => formatUSD(v)}
              />
              <Slider
                label="Retorno Esperado (anual)"
                value={input.expectedReturnAnnual}
                min={-0.25}
                max={0.4}
                step={0.005}
                onChange={(v) => set({ expectedReturnAnnual: v })}
                format={(v) => formatPercent(v)}
              />
              <Slider
                label="Volatilidad (anual)"
                value={input.volatilityAnnual}
                min={0.02}
                max={0.8}
                step={0.01}
                onChange={(v) => set({ volatilityAnnual: v })}
                format={(v) => formatPercent(v)}
              />
              <Slider
                label="Horizonte (años)"
                value={input.timeHorizonYears}
                min={1}
                max={10}
                step={1}
                onChange={(v) => set({ timeHorizonYears: v })}
                format={(v) => `${v}a`}
              />
              <div>
                <span className="mb-1.5 block text-xs text-text-muted">
                  Número de Simulaciones
                </span>
                <div className="flex gap-2">
                  {[1_000, 5_000, 10_000, 25_000].map((n) => (
                    <button
                      key={n}
                      onClick={() => set({ numberOfSimulations: n })}
                      className={`flex-1 rounded-lg border px-2 py-1.5 font-mono text-xs transition-colors ${
                        input.numberOfSimulations === n
                          ? 'border-accent-indigo/60 bg-accent-indigo/20 text-text-primary'
                          : 'border-white/10 bg-white/5 text-text-muted hover:text-text-primary'
                      }`}
                    >
                      {n.toLocaleString('en-US')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </TiltCard>
        </BentoCell>

        <BentoCell className="md:col-span-8" delay={0.1}>
          <TiltCard className="h-full">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-base font-semibold">Distribución de Trayectorias</h3>
              {running && (
                <span className="flex items-center gap-1.5 font-mono text-xs text-accent-indigo">
                  <span className="h-1.5 w-1.5 animate-ping rounded-full bg-accent-indigo" />
                  calculando…
                </span>
              )}
            </div>
            <MonteCarloSimChart result={result} height={340} />
          </TiltCard>
        </BentoCell>
      </div>

      {summary && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { label: 'P10 · Pesimista', value: summary.p10, color: '#FF2E63' },
            { label: 'P50 · Esperado', value: summary.p50, color: '#00F0FF' },
            { label: 'P90 · Optimista', value: summary.p90, color: '#00FF95' },
          ].map((s) => (
            <TiltCard key={s.label} className="p-5">
              <p className="mb-1 text-[11px] uppercase tracking-wider text-text-muted">
                {s.label}
              </p>
              <NumberTicker
                value={s.value}
                format={(v) => formatUSD(v)}
                className="text-2xl font-bold"
              />
              <p className="mt-1 font-mono text-[11px]" style={{ color: s.color }}>
                valor terminal (fin de horizonte)
              </p>
            </TiltCard>
          ))}
        </div>
      )}
    </div>
  );
}
