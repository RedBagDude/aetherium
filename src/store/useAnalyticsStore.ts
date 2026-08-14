'use client';

import { create } from 'zustand';
import type {
  CandlestickData,
  OrderBookState,
  AIInsight,
  Transaction,
} from '@/types/financial';
import {
  generateCandlesticks,
  generateOrderBook,
  generateTransactions,
} from '@/lib/data';

interface AnalyticsState {
  candles: CandlestickData[];
  orderBook: OrderBookState;
  transactions: Transaction[];
  insights: AIInsight[];
  livePrice: number;
  timeframe: '1D' | '1W' | '1M' | '3M' | '1Y';
  isStreaming: boolean;

  setTimeframe: (tf: AnalyticsState['timeframe']) => void;
  setStreaming: (on: boolean) => void;
  tickOrderBook: () => void;
  setInsights: (insights: AIInsight[]) => void;
  pushInsight: (insight: AIInsight) => void;
}

const initialCandles = generateCandlesticks();

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  candles: initialCandles,
  orderBook: generateOrderBook(),
  transactions: generateTransactions(),
  insights: [],
  livePrice: initialCandles[initialCandles.length - 1]?.close ?? 0,
  timeframe: '3M',
  isStreaming: true,

  setTimeframe: (timeframe) => set({ timeframe }),

  setStreaming: (isStreaming) => set({ isStreaming }),

  tickOrderBook: () => {
    const current = get().orderBook;
    // Slight random walk of the mid price + depth shuffle (client-side only).
    const spread = current.spread;
    const mid =
      current.bids[0].price + spread / 2 + (Math.random() - 0.5) * spread;
    const next = generateOrderBook(mid);
    set({ orderBook: next, livePrice: mid });
  },

  setInsights: (insights) => set({ insights }),

  pushInsight: (insight) =>
    set((state) => ({ insights: [insight, ...state.insights].slice(0, 12) })),
}));
