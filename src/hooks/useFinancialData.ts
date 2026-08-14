'use client';

import { useQuery } from '@tanstack/react-query';
import type {
  CandlestickData,
  OrderBookState,
  PortfolioPosition,
  Transaction,
  MarketTick,
} from '@/types/financial';
import {
  generateCandlesticks,
  generateOrderBook,
  generatePositions,
  generateTransactions,
} from '@/lib/data';

/**
 * TanStack Query v5 wrapper. Seed data is deterministic (stable queryKey), so
 * SSR and client render identical payloads. Live endpoints can be swapped in by
 * replacing the queryFn with a fetch to `/api/market-stream`.
 */

export function useCandlesticks() {
  return useQuery<CandlestickData[]>({
    queryKey: ['market', 'candles'],
    queryFn: () => generateCandlesticks(),
    staleTime: Infinity,
  });
}

export function useOrderBook() {
  return useQuery<OrderBookState>({
    queryKey: ['market', 'orderbook'],
    queryFn: () => generateOrderBook(),
    staleTime: 5_000,
  });
}

export function usePositions() {
  return useQuery<PortfolioPosition[]>({
    queryKey: ['portfolio', 'positions'],
    queryFn: () => generatePositions(),
    staleTime: Infinity,
  });
}

export function useTransactions() {
  return useQuery<Transaction[]>({
    queryKey: ['portfolio', 'transactions'],
    queryFn: () => generateTransactions(),
    staleTime: Infinity,
  });
}

export function useWatchlist() {
  return useQuery<MarketTick[]>({
    queryKey: ['market', 'watchlist'],
    queryFn: () =>
      generateCandlesticks(6).map((c, i) => ({
        symbol: ['SPY', 'NVDA', 'BTC', 'GLD', 'EUR', 'TLT'][i] ?? 'SPY',
        price: c.close,
        change: c.close - c.open,
        changePct: (c.close - c.open) / c.open,
        volume: c.volume,
        timestamp: c.timestamp,
      })),
    staleTime: 30_000,
  });
}
