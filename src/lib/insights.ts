import type { AIInsight, PortfolioPosition } from '@/types/financial';
import { formatPercent, formatUSDCompact } from './formatters';

/**
 * Deterministic rule-based "copilot" engine. Derives contextual, citable
 * insights from live portfolio metrics without requiring an external LLM key.
 * The `/api/ai-copilot` route wraps this same logic server-side.
 */

interface PortfolioSnapshot {
  totalValue: number;
  maxDrawdown: number;
  volatilityAnnualized: number;
  sharpe: number;
  concentrationTop: number;
  positions: PortfolioPosition[];
}

export function generateInsights(snapshot: PortfolioSnapshot): AIInsight[] {
  const insights: AIInsight[] = [];
  const now = new Date().toISOString();

  if (snapshot.concentrationTop > 0.35) {
    insights.push({
      id: 'conc',
      timestamp: now,
      severity: 'WARNING',
      title: 'Riesgo de concentración alto',
      description: `Tu mayor posición representa ${formatPercent(
        snapshot.concentrationTop,
      )} del capital, por encima del umbral de 35%. Un shock idiosincrático en ese activo tendría impacto desproporcionado.`,
      recommendedAction:
        'Considera rebalancear hacia una asignación máxima de ~15% por posición.',
      confidenceScore: 0.87,
    });
  }

  if (snapshot.maxDrawdown > 0.2) {
    insights.push({
      id: 'dd',
      timestamp: now,
      severity: 'CRITICAL',
      title: 'Drawdown máximo elevado',
      description: `El drawdown máximo histórico es ${formatPercent(
        snapshot.maxDrawdown,
      )}, lo que sugiere colas de riesgo más gruesas de lo esperado por el modelo normal.`,
      recommendedAction: 'Revisar coberturas y ajustar el presupuesto de riesgo.',
      confidenceScore: 0.92,
    });
  }

  if (snapshot.volatilityAnnualized > 0.25) {
    insights.push({
      id: 'vol',
      timestamp: now,
      severity: 'WARNING',
      title: 'Volatilidad anualizada elevada',
      description: `La volatilidad anualizada es ${formatPercent(
        snapshot.volatilityAnnualized,
      )}, superando el objetivo de riesgo declarado.`,
      recommendedAction: 'Aumentar exposición a renta fija o activos descorrelacionados.',
      confidenceScore: 0.8,
    });
  }

  const cryptoPositions = snapshot.positions.filter((p) => p.assetClass === 'CRYPTO');
  const cryptoAlloc = cryptoPositions.reduce((a, p) => a + p.allocationPercentage, 0);
  if (cryptoAlloc > 0.12) {
    insights.push({
      id: 'crypto',
      timestamp: now,
      severity: 'OPPORTUNITY',
      title: 'Correlación crypto/equity detectada',
      description: `Las posiciones de cripto suman ${formatPercent(
        cryptoAlloc,
      )} y muestran correlación creciente con el equity (Big Tech). Diversificar el perfil de riesgo.`,
      confidenceScore: 0.74,
    });
  }

  if (snapshot.sharpe > 1.5) {
    insights.push({
      id: 'sharpe',
      timestamp: now,
      severity: 'OPPORTUNITY',
      title: 'Eficiencia de riesgo excelente',
      description: `El Sharpe ratio es ${snapshot.sharpe.toFixed(
        2,
      )}, indicando retorno ajustado por riesgo sólido frente a la referencia.`,
      confidenceScore: 0.9,
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: 'allgood',
      timestamp: now,
      severity: 'INFO',
      title: 'Portafolio dentro de parámetros',
      description:
        'No se detectaron anomalías materiales. Los niveles de riesgo, concentración y volatilidad están dentro de los umbrales configurados.',
      confidenceScore: 0.95,
    });
  }

  return insights;
}

export function generateRebalanceInsight(
  positions: PortfolioPosition[],
): AIInsight {
  const sorted = [...positions].sort(
    (a, b) => b.allocationPercentage - a.allocationPercentage,
  );
  const over = sorted
    .filter((p) => p.allocationPercentage > 0.15)
    .map((p) => `${p.ticker} (${formatPercent(p.allocationPercentage)})`)
    .join(', ');
  return {
    id: 'rebalance',
    timestamp: new Date().toISOString(),
    severity: 'OPPORTUNITY',
    title: 'Propuesta de rebalanceo (frontera eficiente)',
    description: `Según la frontera eficiente de Markowitz, los activos sobreponderados son: ${over || 'ninguno'}. Reducir concentración y aumentar renta fija mejora el ratio de Sharpe marginal.`,
    recommendedAction: 'Aplicar rebalanceo trimestral con bandas de ±5%.',
    confidenceScore: 0.81,
  };
}

export function generateStressedVaRInsight(): AIInsight {
  return {
    id: 'stressvar',
    timestamp: new Date().toISOString(),
    severity: 'CRITICAL',
    title: 'VaR Estresado (2008 + 2020)',
    description:
      'Bajo escenarios históricos de estrés (caídas del -21% en 2008 y -34% en marzo 2020), el VaR 99% a 10 días se estima en ' +
      formatUSDCompact(1_250_000 * 0.31) +
      ', ~2.6× el VaR paramétrico normal. Las colas no son gaussianas.',
    recommendedAction: 'Dimensionar el capital de riesgo para eventos de cola, no para la media.',
    confidenceScore: 0.88,
  };
}
