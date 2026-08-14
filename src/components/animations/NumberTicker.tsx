'use client';

import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/gsap';
import { cn } from '@/lib/utils';
import { formatUSDCompact } from '@/lib/formatters';

interface NumberTickerProps {
  value: number;
  format?: (v: number) => string;
  duration?: number;
  className?: string;
  decimals?: number;
}

/**
 * GSAP-powered counter: tweens an object's `val` property and writes the
 * formatted result straight into the DOM (no React re-render per frame), so
 * numbers glide at 60 FPS without jitter.
 */
export function NumberTicker({
  value,
  format,
  duration = 1.4,
  className,
  decimals,
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const prevValue = useRef(value);
  const formatterRef = useRef(format);

  useEffect(() => {
    formatterRef.current = format;
  }, [format]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const formatter = formatterRef.current ?? ((v: number) => {
      const fixed = decimals !== undefined ? v.toFixed(decimals) : v;
      return formatUSDCompact(Number(fixed));
    });

    const obj = { val: prevValue.current };
    const tween = gsap.to(obj, {
      val: value,
      duration,
      ease: 'power3.out',
      onUpdate: () => {
        if (el) el.textContent = formatter(obj.val);
      },
      onComplete: () => {
        prevValue.current = value;
      },
    });

    return () => {
      tween.kill();
      prevValue.current = value;
    };
  }, [value, duration, decimals]);

  const formatter = format ?? ((v: number) => {
    const fixed = decimals !== undefined ? v.toFixed(decimals) : v;
    return formatUSDCompact(Number(fixed));
  });

  return (
    <span ref={ref} className={cn('mono-metrics tabular-nums', className)}>
      {formatter(value)}
    </span>
  );
}
