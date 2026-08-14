'use client';

import { createContext, useContext } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';

/**
 * Shared GSAP context so child components can register ScrollTrigger tweens
 * against a single scope and clean them up together (avoids leaks/overlap on
 * route transitions in the App Router).
 */
export const GSAPContext = createContext<gsap.Context | null>(null);

export function useGSAPContext(): gsap.Context | null {
  return useContext(GSAPContext);
}

export { gsap, ScrollTrigger };
