'use client';

import { useCallback } from 'react';
import type { MonteCarloInput, MonteCarloPathResult } from '@/types/financial';
import {
  runMonteCarlo,
  historicalVaR,
  parametricVaR,
  sharpeRatio,
  sortinoRatio,
  maxDrawdown,
  douglasPeucker,
  annualizedVolatility,
  annualizedReturn,
} from '@/lib/analytics';

/**
 * Promise-based bridge to the dedicated analytics Web Worker, with a fully
 * functional inline fallback so the UI never blocks on worker availability
 * (e.g. SSR, or an environment where worker bundling is unavailable).
 */

export interface VarResult {
  historical: number;
  parametric: number;
  confidence: number;
}

export interface RiskMetricsPayload {
  sharpe: number;
  sortino: number;
  maxDrawdown: number;
  volatilityAnnualized: number;
  expectedReturnAnnual: number;
}

export interface Point {
  x: number;
  y: number;
}

let worker: Worker | null = null;
let workerFailed = false;

interface Pending {
  resolve: (value: unknown) => void;
  reject: (err: Error) => void;
}

const pending = new Map<string, Pending>();

function getWorker(): Worker | null {
  if (workerFailed) return null;
  if (worker) return worker;
  if (typeof window === 'undefined') {
    workerFailed = true;
    return null;
  }
  try {
    worker = new Worker(new URL('../workers/analytics.worker.ts', import.meta.url));
    worker.onmessage = (event: MessageEvent) => {
      const { id, type, payload } = event.data ?? {};
      const entry = pending.get(id);
      if (!entry) return;
      pending.delete(id);
      if (type === 'ERROR') entry.reject(new Error(payload ?? 'Worker error'));
      else entry.resolve(payload);
    };
    worker.onerror = () => {
      workerFailed = true;
      worker = null;
      for (const [, entry] of pending) entry.reject(new Error('Worker crashed'));
      pending.clear();
    };
  } catch {
    workerFailed = true;
    worker = null;
  }
  return worker;
}

function request<T>(type: string, payload: unknown): Promise<T> {
  const w = getWorker();
  if (!w) return Promise.reject(new Error('Worker unavailable'));
  return new Promise<T>((resolve, reject) => {
    const id = `${type}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    pending.set(id, { resolve: resolve as (v: unknown) => void, reject });
    w.postMessage({ id, type, payload });
  });
}

export function useAetheriumWorker() {
  const runMonteCarloAsync = useCallback(
    (input: MonteCarloInput): Promise<MonteCarloPathResult> =>
      request<MonteCarloPathResult>('RUN_MONTE_CARLO', input).catch(() =>
        runMonteCarlo(input),
      ),
    [],
  );

  const calculateVaR = useCallback(
    (
      returns: number[],
      confidenceLevel: number,
      initialValue: number,
    ): Promise<VarResult> =>
      request<VarResult>('CALCULATE_VAR', {
        returns,
        confidenceLevel,
        initialValue,
      }).catch(() => ({
        historical: historicalVaR(returns, confidenceLevel, initialValue),
        parametric: parametricVaR(returns, confidenceLevel, initialValue),
        confidence: confidenceLevel,
      })),
    [],
  );

  const calculateRiskMetrics = useCallback(
    (returns: number[], equity: number[]): Promise<RiskMetricsPayload> =>
      request<RiskMetricsPayload>('CALCULATE_RISK_METRICS', {
        returns,
        equity,
      }).catch(() => ({
        sharpe: sharpeRatio(returns),
        sortino: sortinoRatio(returns),
        maxDrawdown: maxDrawdown(equity),
        volatilityAnnualized: annualizedVolatility(returns),
        expectedReturnAnnual: annualizedReturn(returns),
      })),
    [],
  );

  const simplifySeries = useCallback(
    (points: Point[], epsilon: number): Promise<Point[]> =>
      request<{ points: Point[] }>('SIMPLIFY_SERIES', { points, epsilon })
        .then((res) => res.points)
        .catch(() => douglasPeucker(points, epsilon)),
    [],
  );

  return {
    runMonteCarlo: runMonteCarloAsync,
    calculateVaR,
    calculateRiskMetrics,
    simplifySeries,
  };
}
