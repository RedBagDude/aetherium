'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

/**
 * Accessible, keyboard-friendly select styled to match the glass system
 * (kept as a native <select> for full keyboard/screen-reader support).
 */
export function Select({
  options,
  value,
  onChange,
  className,
  ...props
}: SelectProps) {
  return (
    <div className={cn('relative', className)}>
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="h-10 w-full appearance-none rounded-xl border border-white/10 bg-bg-surface-2 px-3 pr-9 text-sm text-text-primary outline-none transition-colors hover:border-white/20 focus-visible:ring-2 focus-visible:ring-accent-cyan/60 [&>option]:bg-bg-surface-2"
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}
