'use client';

import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  /** Magnetic pull strength (px of attraction). */
  strength?: number;
}

/**
 * Button that magnetically attracts toward the pointer within its bounds.
 */
export function MagneticButton({
  children,
  className,
  onClick,
  strength = 24,
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 250, damping: 15, mass: 0.5 });
  const springY = useSpring(y, { stiffness: 250, damping: 15, mass: 0.5 });

  const handleMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    x.set((dx / (rect.width / 2)) * strength);
    y.set((dy / (rect.height / 2)) * strength);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      onClick={onClick}
      style={{ x: springX, y: springY }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/60',
        className,
      )}
      data-cursor="CLICK"
    >
      {children}
    </motion.button>
  );
}
