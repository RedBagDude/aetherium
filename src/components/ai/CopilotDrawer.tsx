'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import type { AIInsight } from '@/types/financial';
import {
  generateInsights,
  generateRebalanceInsight,
  generateStressedVaRInsight,
} from '@/lib/insights';
import {
  generatePositions,
  generateHistoricalReturns,
} from '@/lib/data';
import { maxDrawdown, annualizedVolatility, sharpeRatio } from '@/lib/analytics';
import { AI_QUICK_PROMPTS } from '@/lib/constants';
import { InsightCard } from './InsightCard';
import { useAnalyticsStore } from '@/store/useAnalyticsStore';

export function CopilotDrawer() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const router = useRouter();
  const pushInsight = useAnalyticsStore((s) => s.pushInsight);

  const initialInsights = useMemo<AIInsight[]>(() => {
    const positions = generatePositions();
    const returns = generateHistoricalReturns();
    const equity = returns.reduce<number[]>((acc, r, i) => {
      const prev = i === 0 ? 1_250_000 : acc[i - 1];
      acc.push(prev * (1 + r));
      return acc;
    }, []);
    const concentrationTop = Math.max(
      ...positions.map((p) => p.allocationPercentage),
    );
    return generateInsights({
      totalValue: 1_250_000,
      maxDrawdown: maxDrawdown(equity),
      volatilityAnnualized: annualizedVolatility(returns),
      sharpe: sharpeRatio(returns),
      concentrationTop,
      positions,
    });
  }, []);

  const [insights, setInsights] = useState<AIInsight[]>(initialInsights);

  const runQuickPrompt = (id: string) => {
    if (id === 'recession') {
      setOpen(false);
      router.push('/simulations?scenario=recession');
      return;
    }
    if (id === 'rebalance') {
      const insight = generateRebalanceInsight(generatePositions());
      pushInsight(insight);
      setInsights((prev) => [insight, ...prev]);
      return;
    }
    if (id === 'var') {
      const insight = generateStressedVaRInsight();
      pushInsight(insight);
      setInsights((prev) => [insight, ...prev]);
      return;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = draft.trim().toLowerCase();
    if (!q) return;
    if (q.includes('recesión') || q.includes('recession')) runQuickPrompt('recession');
    else if (q.includes('rebalance') || q.includes('rebalancear')) runQuickPrompt('rebalance');
    else if (q.includes('var') || q.includes('riesgo') || q.includes('risk')) runQuickPrompt('var');
    else {
      const generic: AIInsight = {
        id: `q_${Date.now()}`,
        timestamp: new Date().toISOString(),
        severity: 'INFO',
        title: 'Consulta procesada',
        description: `He analizado tu consulta: “${draft.trim()}”. Refinando contra las métricas actuales del portafolio… (respuesta generada por el motor local de análisis).`,
        confidenceScore: 0.66,
      };
      setInsights((prev) => [generic, ...prev]);
    }
    setDraft('');
  };

  return (
    <>
      {/* Floating magnetic orb trigger */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        aria-label="Abrir copiloto de IA"
        className="fixed bottom-6 right-6 z-[90] flex h-14 w-14 items-center justify-center rounded-full border border-accent-indigo/40 bg-accent-indigo/15 shadow-[0_0_40px_-4px_rgba(99,102,241,0.7)] backdrop-blur-xl"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
      >
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-indigo opacity-60" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-accent-indigo" />
        </span>
        <span className="sr-only">AI Active</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-[85] bg-black/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}
              className="fixed right-0 top-0 z-[86] flex h-full w-full max-w-md flex-col border-l border-white/10 bg-bg-surface-1/90 backdrop-blur-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 p-5">
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">
                    Aetherium Copilot
                  </h2>
                  <p className="flex items-center gap-1.5 text-xs text-accent-emerald">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent-emerald animate-pulse-glow" />
                    AI Active · análisis en tiempo real
                  </p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Cerrar"
                  className="rounded-lg p-1.5 text-text-muted hover:bg-white/5 hover:text-text-primary"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-5">
                {insights.map((insight, i) => (
                  <InsightCard key={insight.id} insight={insight} index={i} />
                ))}
              </div>

              <div className="border-t border-white/10 p-4">
                <div className="mb-2 flex flex-wrap gap-2">
                  {AI_QUICK_PROMPTS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => runQuickPrompt(p.id)}
                      className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-text-muted transition-colors hover:border-accent-indigo/50 hover:text-text-primary"
                    >
                      [{p.label}]
                    </button>
                  ))}
                </div>
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Pregunta al copiloto…"
                    className="h-10 flex-1 rounded-xl border border-white/10 bg-bg-surface-2 px-3 text-sm text-text-primary outline-none placeholder:text-text-muted focus:ring-2 focus:ring-accent-indigo/50"
                  />
                  <button
                    type="submit"
                    className="h-10 rounded-xl bg-accent-indigo px-4 text-sm font-medium text-white"
                  >
                    Enviar
                  </button>
                </form>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
