'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { create } from 'zustand';
import { cn } from '@/lib/utils';
import { useAnalyticsStore } from '@/store/useAnalyticsStore';

interface CommandItem {
  id: string;
  label: string;
  hint?: string;
  section: string;
  run: () => void;
}

interface CommandState {
  open: boolean;
  openMenu: () => void;
  closeMenu: () => void;
  toggle: () => void;
}

export const useCommandStore = create<CommandState>((set) => ({
  open: false,
  openMenu: () => set({ open: true }),
  closeMenu: () => set({ open: false }),
  toggle: () => set((s) => ({ open: !s.open })),
}));

export function CommandMenu() {
  const { open, closeMenu } = useCommandStore();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const commands = useMemo<CommandItem[]>(() => {
    const setStreaming = useAnalyticsStore.getState().setStreaming;
    return [
      { id: 'nav-analytics', label: 'Go to Analytics', hint: '/analytics', section: 'Navigation', run: () => router.push('/analytics') },
      { id: 'nav-portfolio', label: 'Go to Portfolio', hint: '/portfolio', section: 'Navigation', run: () => router.push('/portfolio') },
      { id: 'nav-risk', label: 'Go to Risk', hint: '/risk', section: 'Navigation', run: () => router.push('/risk') },
      { id: 'nav-simulations', label: 'Go to Simulations', hint: '/simulations', section: 'Navigation', run: () => router.push('/simulations') },
      { id: 'stream-on', label: 'Resume live streaming', hint: 'market', section: 'Actions', run: () => setStreaming(true) },
      { id: 'stream-off', label: 'Pause live streaming', hint: 'market', section: 'Actions', run: () => setStreaming(false) },
      { id: 'mc', label: 'Run Monte Carlo simulation', hint: 'quant', section: 'Actions', run: () => router.push('/simulations') },
    ];
  }, [router]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => c.label.toLowerCase().includes(q));
  }, [commands, query]);

  // Reset query/active-index when the menu transitions closed→open.
  // (Adjust-state-during-render pattern avoids setState-in-effect.)
  const [prevOpen, setPrevOpen] = useState(open);
  if (open && !prevOpen) {
    setQuery('');
    setActiveIndex(0);
  }
  if (open !== prevOpen) setPrevOpen(open);

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = filtered[activeIndex];
      if (cmd) {
        closeMenu();
        cmd.run();
      }
    }
  };

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>('[aria-selected="true"]')
      ?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[120] flex items-start justify-center p-4 pt-[18vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onKeyDown={handleKey}
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={closeMenu}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command menu"
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            className="glass-card relative z-10 w-full max-w-xl overflow-hidden rounded-2xl"
          >
            <div className="flex items-center gap-3 border-b border-white/10 px-4">
              <svg
                aria-hidden
                className="text-text-muted"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                placeholder="Buscar secciones o acciones…"
                className="h-12 w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
              />
              <kbd className="rounded-md border border-white/10 px-1.5 py-0.5 font-mono text-[10px] text-text-muted">
                ESC
              </kbd>
            </div>

            <div ref={listRef} className="max-h-72 overflow-y-auto p-2">
              {filtered.length === 0 && (
                <p className="px-3 py-8 text-center text-sm text-text-muted">
                  No results for “{query}”
                </p>
              )}
              {filtered.map((cmd, i) => (
                <button
                  key={cmd.id}
                  role="option"
                  aria-selected={i === activeIndex}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => {
                    closeMenu();
                    cmd.run();
                  }}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                    i === activeIndex
                      ? 'bg-accent-indigo/20 text-text-primary'
                      : 'text-text-muted',
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wide opacity-50">
                      {cmd.section}
                    </span>
                    {cmd.label}
                  </span>
                  {cmd.hint && (
                    <span className="font-mono text-xs opacity-50">{cmd.hint}</span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
