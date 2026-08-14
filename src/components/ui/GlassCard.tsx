'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  glow?: boolean;
}

/**
 * Base glassmorphic surface. `interactive` enables the radial mouse-follow glow
 * (via native CSS custom properties `--mouse-x` / `--mouse-y`).
 */
export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  function GlassCard(
    { className, interactive = false, glow = true, children, ...props },
    ref,
  ) {
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!interactive) return;
      const rect = e.currentTarget.getBoundingClientRect();
      e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
      e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
    };

    return (
      <div
        ref={ref}
        onMouseMove={handleMouseMove}
        className={cn(
          'glass-card glass-topline relative rounded-2xl p-6',
          interactive && 'group',
          className,
        )}
        {...props}
      >
        {interactive && glow && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{
              background:
                'radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(0,240,255,0.10), transparent 45%)',
            }}
          />
        )}
        <div className="relative z-10 h-full">{children}</div>
      </div>
    );
  },
);
