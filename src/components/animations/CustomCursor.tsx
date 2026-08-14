'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

/**
 * Liquid cursor: a rigid central dot + a spring-physics ring that lags behind
 * (mass/stiffness/damping ≈ the spec's spring parameters). The ring expands and
 * shows a contextual label over interactive elements.
 */
export function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [label, setLabel] = useState('');
  const [active, setActive] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { stiffness: 250, damping: 15, mass: 0.5 });
  const ringY = useSpring(y, { stiffness: 250, damping: 15, mass: 0.5 });

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || reduced) return;

    const raf = requestAnimationFrame(() => setEnabled(true));
    document.documentElement.classList.add('cursor-hidden');

    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    const over = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const interactive = target?.closest?.(
        'a, button, [data-cursor], input, select, textarea, [role="button"]',
      ) as HTMLElement | null;
      if (interactive) {
        setActive(true);
        setLabel(interactive.getAttribute('data-cursor') ?? 'VIEW');
      } else {
        setActive(false);
        setLabel('');
      }
    };

    window.addEventListener('mousemove', move, { passive: true });
    window.addEventListener('mouseover', over, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseover', over);
      document.documentElement.classList.remove('cursor-hidden');
    };
  }, [x, y]);

  if (!enabled) return null;

  const center: React.CSSProperties = {
    transform: 'translate(-50%, -50%)',
  };

  return (
    <>
      {/* Rigid dot */}
      <motion.div
        aria-hidden
        style={{ x, y }}
        className="pointer-events-none fixed left-0 top-0 z-[200]"
      >
        <div
          style={center}
          className="h-1.5 w-1.5 rounded-full bg-accent-cyan shadow-[0_0_8px_rgba(0,240,255,0.9)]"
        />
      </motion.div>

      {/* Spring ring */}
      <motion.div
        aria-hidden
        style={{ x: ringX, y: ringY }}
        className="pointer-events-none fixed left-0 top-0 z-[199]"
      >
        <motion.div
          style={center}
          animate={{ scale: active ? 2.3 : 1, opacity: active ? 0.95 : 0.55 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-accent-cyan/60"
        >
          {label && active && (
            <span className="font-mono text-[7px] font-semibold tracking-wider text-accent-cyan">
              {label}
            </span>
          )}
        </motion.div>
      </motion.div>
    </>
  );
}
