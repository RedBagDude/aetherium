import type { MonteCarloInput, MonteCarloPathResult } from '@/types/financial';
import {
  runMonteCarlo,
  historicalVaR,
  parametricVaR,
  sharpeRatio,
  sortinoRatio,
  maxDrawdown,
  douglasPeucker,
} from '@/lib/analytics';

/**
 * Dedicated Web Worker for heavy quantitative computation. Runs off the main
 * UI thread so canvas/animation frames never drop.
 */

type WorkerScope = {
  addEventListener(
    type: 'message',
    listener: (event: MessageEvent<WorkerRequest>) => void,
  ): void;
  postMessage(message: WorkerResponse): void;
};

const ctx = self as unknown as WorkerScope;

type WorkerRequest = { id: string } & (
  | { type: 'RUN_MONTE_CARLO'; payload: MonteCarloInput }
  | { type: 'CALCULATE_VAR'; payload: { returns: number[]; confidenceLevel: number; initialValue: number } }
  | { type: 'CALCULATE_RISK_METRICS'; payload: { returns: number[]; equity: number[] } }
  | { type: 'SIMPLIFY_SERIES'; payload: { points: { x: number; y: number }[]; epsilon: number } }
);

type WorkerResponse = { id: string } & (
  | { type: 'MONTE_CARLO_SUCCESS'; payload: MonteCarloPathResult }
  | { type: 'VAR_SUCCESS'; payload: { historical: number; parametric: number; confidence: number } }
  | { type: 'RISK_METRICS_SUCCESS'; payload: RiskMetricsPayload }
  | { type: 'SIMPLIFY_SUCCESS'; payload: { points: { x: number; y: number }[] } }
  | { type: 'ERROR'; payload: string }
);

interface RiskMetricsPayload {
  sharpe: number;
  sortino: number;
  maxDrawdown: number;
  volatilityAnnualized: number;
  expectedReturnAnnual: number;
}

ctx.addEventListener('message', (event) => {
  const { id, type, payload } = event.data;
  try {
    switch (type) {
      case 'RUN_MONTE_CARLO': {
        const result = runMonteCarlo(payload);
        ctx.postMessage({ id, type: 'MONTE_CARLO_SUCCESS', payload: result });
        break;
      }
      case 'CALCULATE_VAR': {
        const { returns, confidenceLevel, initialValue } = payload;
        const historical = historicalVaR(returns, confidenceLevel, initialValue);
        const parametric = parametricVaR(returns, confidenceLevel, initialValue);
        ctx.postMessage({
          id,
          type: 'VAR_SUCCESS',
          payload: { historical, parametric, confidence: confidenceLevel },
        });
        break;
      }
      case 'CALCULATE_RISK_METRICS': {
        const { returns, equity } = payload;
        ctx.postMessage({
          id,
          type: 'RISK_METRICS_SUCCESS',
          payload: {
            sharpe: sharpeRatio(returns),
            sortino: sortinoRatio(returns),
            maxDrawdown: maxDrawdown(equity),
            volatilityAnnualized: annualizedVolatility(returns),
            expectedReturnAnnual: annualizedReturn(returns),
          },
        });
        break;
      }
      case 'SIMPLIFY_SERIES': {
        const simplified = douglasPeucker(payload.points, payload.epsilon);
        ctx.postMessage({ id, type: 'SIMPLIFY_SUCCESS', payload: { points: simplified } });
        break;
      }
      default:
        ctx.postMessage({
          id,
          type: 'ERROR',
          payload: `Unrecognized worker action type: ${(type as string) ?? 'undefined'}`,
        });
    }
  } catch (err) {
    ctx.postMessage({
      id,
      type: 'ERROR',
      payload: err instanceof Error ? err.message : 'Unknown worker error',
    });
  }
});

function annualizedVolatility(returns: number[], periodsPerYear = 252): number {
  if (returns.length < 2) return 0;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance =
    returns.reduce((a, b) => a + (b - mean) ** 2, 0) / (returns.length - 1);
  return Math.sqrt(variance) * Math.sqrt(periodsPerYear);
}

function annualizedReturn(returns: number[], periodsPerYear = 252): number {
  if (returns.length < 2) return 0;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  return mean * periodsPerYear;
}

export {};
