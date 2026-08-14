'use client';

import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'ghost' | 'outline' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-accent-indigo text-white hover:bg-accent-indigo/90 shadow-[0_0_24px_-6px_rgba(99,102,241,0.7)]',
  ghost: 'bg-transparent text-text-muted hover:text-text-primary hover:bg-white/5',
  outline:
    'border border-white/10 text-text-primary hover:border-accent-cyan/50 hover:text-accent-cyan',
  danger:
    'bg-accent-crimson/10 text-accent-crimson border border-accent-crimson/30 hover:bg-accent-crimson/20',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className, variant = 'primary', size = 'md', children, ...props },
    ref,
  ) {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.97 }}
        whileHover={{ scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/60 disabled:opacity-50 disabled:pointer-events-none',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {children}
      </motion.button>
    );
  },
);
