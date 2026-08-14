'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { AIInsight } from '@/types/financial';
import { SEVERITY_COLOR } from '@/lib/constants';

interface InsightCardProps {
  insight: AIInsight;
  index?: number;
}

const SEVERITY_LABEL = {
  INFO: 'Info',
  WARNING: 'Advertencia',
  CRITICAL: 'Crítico',
  OPPORTUNITY: 'Oportunidad',
} as const;

export function InsightCard({ insight, index = 0 }: InsightCardProps) {
  const color = SEVERITY_COLOR[insight.severity];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 320, damping: 26 }}
      className="rounded-xl border border-white/10 bg-bg-surface-2/60 p-3.5"
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
          style={{ color, backgroundColor: `${color}1a` }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: color }}
          />
          {SEVERITY_LABEL[insight.severity]}
        </span>
        <span className="font-mono text-[10px] text-text-muted">
          {Math.round(insight.confidenceScore * 100)}% conf.
        </span>
      </div>

      <h4 className="mb-1 text-sm font-semibold text-text-primary">
        {insight.title}
      </h4>
      <p className="text-xs leading-relaxed text-text-muted">
        {insight.description}
      </p>

      {insight.recommendedAction && (
        <p className="mt-2 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs text-accent-cyan">
          → {insight.recommendedAction}
        </p>
      )}

      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${insight.confidenceScore * 100}%` }}
          transition={{ duration: 0.7, delay: 0.2 + index * 0.06, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
}
