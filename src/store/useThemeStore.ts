'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ThemeMode = 'dark' | 'light';
type Density = 'compact' | 'comfortable';

interface ThemeState {
  mode: ThemeMode;
  density: Density;
  reducedMotion: boolean;
  setMode: (mode: ThemeMode) => void;
  setDensity: (density: Density) => void;
  setReducedMotion: (reduced: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'dark',
      density: 'comfortable',
      reducedMotion: false,
      setMode: (mode) => set({ mode }),
      setDensity: (density) => set({ density }),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
    }),
    { name: 'aetherium-theme' },
  ),
);
