'use client';

import React from 'react';
import type { Transaction } from '@/types/financial';
import { cn } from '@/lib/utils';
import { formatUSD, formatTimestamp } from '@/lib/formatters';

interface TransactionTableProps {
  transactions: Transaction[];
  limit?: number;
}

const STATUS_STYLE: Record<Transaction['status'], string> = {
  FILLED: 'bg-accent-emerald/10 text-accent-emerald',
  PENDING: 'bg-accent-amber/10 text-accent-amber',
  CANCELLED: 'bg-white/5 text-text-muted line-through',
};

export function TransactionTable({ transactions, limit = 12 }: TransactionTableProps) {
  const rows = transactions.slice(0, limit);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-text-muted">
            <th className="py-2 pr-3 font-medium">Activo</th>
            <th className="py-2 pr-3 font-medium">Lado</th>
            <th className="py-2 pr-3 text-right font-medium">Cantidad</th>
            <th className="py-2 pr-3 text-right font-medium">Precio</th>
            <th className="py-2 pr-3 text-right font-medium">Nocional</th>
            <th className="py-2 pr-3 text-right font-medium">Comisión</th>
            <th className="py-2 text-right font-medium">Estado</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((tx) => (
            <tr
              key={tx.id}
              className="border-b border-white/5 transition-colors hover:bg-white/[0.03]"
            >
              <td className="py-2.5 pr-3">
                <div className="font-mono font-semibold text-text-primary">
                  {tx.ticker}
                </div>
                <div className="text-[11px] text-text-muted">
                  {formatTimestamp(tx.timestamp, true)}
                </div>
              </td>
              <td className="py-2.5 pr-3">
                <span
                  className={cn(
                    'font-mono text-xs font-semibold',
                    tx.side === 'BUY' ? 'text-accent-emerald' : 'text-accent-crimson',
                  )}
                >
                  {tx.side}
                </span>
              </td>
              <td className="py-2.5 pr-3 text-right font-mono tabular-nums">
                {tx.quantity}
              </td>
              <td className="py-2.5 pr-3 text-right font-mono tabular-nums">
                {formatUSD(tx.price)}
              </td>
              <td className="py-2.5 pr-3 text-right font-mono tabular-nums text-text-primary">
                {formatUSD(tx.notionalUSD)}
              </td>
              <td className="py-2.5 pr-3 text-right font-mono tabular-nums text-text-muted">
                {formatUSD(tx.feeUSD)}
              </td>
              <td className="py-2.5 text-right">
                <span
                  className={cn(
                    'inline-block rounded-full px-2 py-0.5 text-[11px] font-medium',
                    STATUS_STYLE[tx.status],
                  )}
                >
                  {tx.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
