'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
} from 'react';
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from '@/lib/gsap';

interface SmoothScrollContextValue {
  lenisRef: React.RefObject<Lenis | null>;
}

const SmoothScrollContext = createContext<SmoothScrollContextValue>({
  lenisRef: { current: null },
});

/** Access the live Lenis instance (e.g. `lenisRef.current?.scrollTo(...)`). */
export function useLenis() {
  return useContext(SmoothScrollContext).lenisRef;
}

/**
 * Lenis smooth-scroll provider, driven by the GSAP ticker so ScrollTrigger
 * and Lenis share a single, frame-synchronised clock (no dropped frames).
 * The instance is held in a ref (not state) to avoid a cascading re-render.
 */
export function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const instance = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.5,
    });
    lenisRef.current = instance;

    instance.on('scroll', ScrollTrigger.update);

    const tick = (time: number) => {
      instance.raf(time * 1000);
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      instance.destroy();
      lenisRef.current = null;
    };
  }, []);

  return (
    <SmoothScrollContext.Provider value={{ lenisRef }}>
      {children}
    </SmoothScrollContext.Provider>
  );
}
