'use client';

import { useEffect, useRef } from 'react';
import { useMotionValue } from 'framer-motion';

/**
 * Tracks the pointer position as motion values (fast, non-re-rendering) plus a
 * ref with the raw coordinates for imperative consumers (GSAP, canvas).
 */
export function useCursorPosition() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const positionRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      positionRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('pointermove', handler, { passive: true });
    return () => window.removeEventListener('pointermove', handler);
  }, [x, y]);

  return { x, y, positionRef };
}
