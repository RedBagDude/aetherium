'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS, WATCHLIST } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useCommandStore } from '@/components/ui/CommandMenu';
import { MagneticButton } from '@/components/animations/MagneticButton';

export function HeaderCommandPalette() {
  const pathname = usePathname();
  const openMenu = useCommandStore((s) => s.openMenu);
  const toggle = useCommandStore((s) => s.toggle);

  // Global Cmd/Ctrl+K shortcut.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggle]);

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-bg-void/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-4 px-4 md:px-8">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5" data-cursor="HOME">
          <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent-indigo to-accent-cyan font-mono text-sm font-bold text-black">
            Æ
          </span>
          <span className="hidden text-sm font-semibold tracking-tight text-text-primary sm:block">
            Aetherium
          </span>
        </Link>

        {/* Nav */}
        <nav className="ml-4 flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm transition-colors',
                  active
                    ? 'bg-white/8 text-text-primary'
                    : 'text-text-muted hover:bg-white/5 hover:text-text-primary',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Ticker strip (hidden on small screens) */}
        <div className="ml-auto hidden items-center gap-5 font-mono text-xs lg:flex">
          {WATCHLIST.map((w) => (
            <div key={w.symbol} className="flex items-center gap-1.5">
              <span className="text-text-muted">{w.symbol}</span>
              <span
                className={cn(
                  'tabular-nums',
                  w.change >= 0 ? 'text-accent-emerald' : 'text-accent-crimson',
                )}
              >
                {w.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>

        {/* Command palette trigger */}
        <MagneticButton
          onClick={openMenu}
          strength={16}
          className="ml-auto h-9 gap-2 border border-white/10 bg-white/5 px-3 text-xs text-text-muted lg:ml-4"
          data-cursor="SEARCH"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <span className="hidden sm:inline">Buscar</span>
          <kbd className="rounded border border-white/10 px-1.5 py-0.5 font-mono text-[10px]">
            ⌘K
          </kbd>
        </MagneticButton>

        {/* Profile */}
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-accent-emerald to-accent-cyan font-mono text-xs font-bold text-black"
          title="Jonathan Martínez"
        >
          JM
        </div>
      </div>
    </header>
  );
}
