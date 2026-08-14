'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  content?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultValue?: string;
  onChange?: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, defaultValue, onChange, className }: TabsProps) {
  const [active, setActive] = useState(defaultValue ?? tabs[0]?.id ?? '');

  const handleSelect = (id: string) => {
    setActive(id);
    onChange?.(id);
  };

  return (
    <div className={cn('w-full', className)}>
      <div
        role="tablist"
        aria-label="Chart timeframe"
        className="relative flex items-center gap-1 rounded-xl bg-white/5 p-1"
      >
        {tabs.map((tab) => {
          const selected = active === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={selected}
              onClick={() => handleSelect(tab.id)}
              className={cn(
                'relative z-10 flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/60',
                selected
                  ? 'text-text-primary'
                  : 'text-text-muted hover:text-text-primary',
              )}
            >
              {selected && (
                <motion.span
                  layoutId="tab-pill"
                  className="absolute inset-0 rounded-lg bg-accent-indigo/20 ring-1 ring-accent-indigo/40"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
