'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAnalyticsStore } from '@/store/useAnalyticsStore';
import { formatUSDPrecise, formatUSD } from '@/lib/formatters';
import { COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';

function PriceCell({
  price,
  side,
  flash,
}: {
  price: number;
  side: 'bid' | 'ask';
  flash: 'up' | 'down' | 'flat';
}) {
  const color = side === 'bid' ? COLORS.emerald : COLORS.crimson;
  return (
    <motion.span
      key={`${side}-${price}`}
      initial={
        flash !== 'flat'
          ? {
              backgroundColor:
                flash === 'up'
                  ? 'rgba(0,255,149,0.28)'
                  : 'rgba(255,46,99,0.28)',
            }
          : false
      }
      animate={{ backgroundColor: 'rgba(0,0,0,0)' }}
      transition={{ duration: 0.9, ease: 'easeOut' }}
      className="inline-block rounded px-1.5 font-mono text-xs tabular-nums"
      style={{ color }}
    >
      {formatUSDPrecise(price)}
    </motion.span>
  );
}

/**
 * Live order-book depth visualiser. The store ticks every ~1.6s (client-side)
 * and changed price cells flash green/red using the render-time state-adjust
 * pattern (no setState-in-effect).
 */
export function LiveMarketOrderBook() {
  const orderBook = useAnalyticsStore((s) => s.orderBook);
  const tick = useAnalyticsStore((s) => s.tickOrderBook);
  const isStreaming = useAnalyticsStore((s) => s.isStreaming);
  const setStreaming = useAnalyticsStore((s) => s.setStreaming);

  const mid = orderBook.bids[0].price + orderBook.spread / 2;

  const [prevMid, setPrevMid] = useState(mid);
  const [flash, setFlash] = useState<'up' | 'down' | 'flat'>('flat');
  if (mid !== prevMid) {
    const dir = mid > prevMid ? 'up' : 'down';
    setPrevMid(mid);
    setFlash(dir);
  }

  useEffect(() => {
    if (!isStreaming) return;
    const id = setInterval(tick, 1600);
    return () => clearInterval(id);
  }, [isStreaming, tick]);

  const maxTotal =
    Math.max(
      ...orderBook.bids.map((b) => b.total),
      ...orderBook.asks.map((a) => a.total),
      1,
    ) || 1;

  const asks = [...orderBook.asks].reverse();

  const renderRow = (
    entry: { price: number; size: number; total: number },
    side: 'bid' | 'ask',
  ) => (
    <div
      key={`${side}-${entry.price}`}
      className="relative flex items-center justify-between gap-2 px-3 py-1"
    >
      <div
        className="pointer-events-none absolute inset-y-0 right-0 transition-all duration-500"
        style={{
          width: `${(entry.total / maxTotal) * 100}%`,
          background:
            side === 'bid'
              ? 'rgba(0,255,149,0.07)'
              : 'rgba(255,46,99,0.07)',
        }}
      />
      <PriceCell price={entry.price} side={side} flash={flash} />
      <span className="relative font-mono text-xs tabular-nums text-text-muted">
        {entry.size.toFixed(3)}
      </span>
      <span className="relative font-mono text-xs tabular-nums text-text-muted">
        {formatUSD(entry.total)}
      </span>
    </div>
  );

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-text-muted">
          Order Book
        </span>
        <button
          onClick={() => setStreaming(!isStreaming)}
          className={cn(
            'flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium',
            isStreaming
              ? 'bg-accent-emerald/10 text-accent-emerald'
              : 'bg-white/5 text-text-muted',
          )}
        >
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              isStreaming ? 'bg-accent-emerald animate-pulse-glow' : 'bg-text-muted',
            )}
          />
          {isStreaming ? 'LIVE' : 'PAUSED'}
        </button>
      </div>

      {/* Asks */}
      <div className="flex-1 overflow-hidden">{asks.map((a) => renderRow(a, 'ask'))}</div>

      {/* Spread */}
      <div className="my-1 border-y border-white/10 bg-white/[0.03] px-3 py-2">
        <div className="flex items-center justify-between font-mono text-[11px]">
          <span className="text-text-muted">
            Spread: {formatUSDPrecise(orderBook.spread)} (
            {((orderBook.spread / mid) * 100).toFixed(4)}%)
          </span>
          <span
            className={cn(
              orderBook.imbalanceRatio >= 0
                ? 'text-accent-emerald'
                : 'text-accent-crimson',
            )}
          >
            Imbalance: {orderBook.imbalanceRatio >= 0 ? '+' : ''}
            {(orderBook.imbalanceRatio * 100).toFixed(1)}%{' '}
            {orderBook.imbalanceRatio >= 0 ? 'BUY' : 'SELL'}
          </span>
        </div>
        <div className="mt-1.5 flex h-1 w-full overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full bg-accent-emerald transition-all duration-500"
            style={{ width: `${50 + orderBook.imbalanceRatio * 50}%` }}
          />
          <div className="h-full flex-1 bg-accent-crimson/60" />
        </div>
      </div>

      {/* Bids */}
      <div className="flex-1 overflow-hidden">{orderBook.bids.map((b) => renderRow(b, 'bid'))}</div>
    </div>
  );
}
