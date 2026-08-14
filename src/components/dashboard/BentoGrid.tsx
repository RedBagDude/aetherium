'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * 12-column responsive Bento grid shell. Cells declare their own `col-span`
 * so the layout stays explicit (zero CLS) and composable.
 */
export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div className={cn('grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-6', className)}>
      {children}
    </div>
  );
}

interface BentoCellProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

/**
 * A single grid cell with the staggered entrance choreography (scale 0.92 →
 * 1, opacity 0 → 1, translateY 40 → 0, cubic-bezier(0.16,1,0.3,1)).
 */
export function BentoCell({ children, className, delay = 0 }: BentoCellProps) {
  return (
    <div
      className={cn('h-full bento-cell', className)}
      style={{ animationDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
}
