'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { CandlestickData } from '@/types/financial';
import { COLORS } from '@/lib/constants';
import { ema, bollingerBands } from '@/lib/analytics';
import { formatUSDPrecise, formatTimestamp, formatCompact } from '@/lib/formatters';

interface CandlestickCanvasProps {
  data: CandlestickData[];
  height?: number;
}

interface VisibleWindow {
  start: number;
  count: number;
}

/**
 * High-frequency candlestick renderer on the raw 2D Canvas API (no chart lib)
 * with EMA / Bollinger overlays, synchronised volume bars, wheel-zoom with
 * damping and a crosshair inspector.
 */
export function CandlestickCanvasChart({
  data,
  height = 460,
}: CandlestickCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [hovered, setHovered] = useState<CandlestickData | null>(null);
  const [crosshair, setCrosshair] = useState({ x: 0, y: 0, visible: false });
  const [windowState, setWindowState] = useState<VisibleWindow>({
    start: 0,
    count: 90,
  });
  const [width, setWidth] = useState(0);

  // Responsive width tracking.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width);
    });
    observer.observe(el);
    setWidth(el.clientWidth);
    return () => observer.disconnect();
  }, []);

  const start = Math.max(0, Math.min(windowState.start, data.length - windowState.count));
  const count = Math.min(windowState.count, data.length);
  const visible = data.slice(start, start + count);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || visible.length === 0 || width === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const padRight = 62;
    const volumeBand = height * 0.22;
    const chartTop = 8;
    const priceBottom = height - volumeBand;
    const volumeTop = priceBottom + 6;
    const chartWidth = width - padRight;

    ctx.clearRect(0, 0, width, height);

    const highs = visible.map((d) => d.high);
    const lows = visible.map((d) => d.low);
    const closes = visible.map((d) => d.close);
    const maxPrice = Math.max(...highs);
    const minPrice = Math.min(...lows);
    const priceRange = maxPrice - minPrice || 1;
    const maxVolume = Math.max(...visible.map((d) => d.volume)) || 1;

    const slot = chartWidth / visible.length;
    const candleW = Math.max(1, slot * 0.65);

    const yFor = (p: number) =>
      chartTop + ((maxPrice - p) / priceRange) * (priceBottom - chartTop);

    // ── Grid + price axis ──
    const gridRows = 5;
    ctx.font = '10px JetBrains Mono, monospace';
    for (let i = 0; i <= gridRows; i++) {
      const y = chartTop + ((priceBottom - chartTop) / gridRows) * i;
      ctx.strokeStyle = COLORS.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(chartWidth, y);
      ctx.stroke();
      const price = maxPrice - (priceRange / gridRows) * i;
      ctx.fillStyle = COLORS.textMuted;
      ctx.textAlign = 'right';
      ctx.fillText(formatUSDPrecise(price), width - 4, y + 3);
    }

    // ── Bollinger bands ──
    const bb = bollingerBands(closes, 20, 2);
    const bandPath = (values: number[]) => {
      ctx.beginPath();
      values.forEach((v, i) => {
        const x = i * slot + slot / 2;
        const y = yFor(v);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
    };
    ctx.fillStyle = 'rgba(99,102,241,0.06)';
    bandPath(bb.upper);
    for (let i = visible.length - 1; i >= 0; i--) {
      ctx.lineTo(i * slot + slot / 2, yFor(bb.lower[i]));
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(99,102,241,0.25)';
    ctx.setLineDash([3, 3]);
    bandPath(bb.upper);
    ctx.stroke();
    bandPath(bb.lower);
    ctx.stroke();
    ctx.setLineDash([]);

    // ── EMA overlays ──
    const emas: Array<[number[], string, number]> = [
      [ema(closes, 20), COLORS.cyan, 1.2],
      [ema(closes, 50), COLORS.indigo, 1.2],
      [ema(closes, 200), COLORS.amber, 1],
    ];
    for (const [series, color, lw] of emas) {
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      series.forEach((v, i) => {
        const x = i * slot + slot / 2;
        const y = yFor(v);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // ── Candles + volume ──
    visible.forEach((candle, i) => {
      const x = i * slot + (slot - candleW) / 2;
      const isBull = candle.close >= candle.open;
      const color = isBull ? COLORS.emerald : COLORS.crimson;

      // wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x + candleW / 2, yFor(candle.high));
      ctx.lineTo(x + candleW / 2, yFor(candle.low));
      ctx.stroke();

      // body
      const bodyTop = yFor(Math.max(candle.open, candle.close));
      const bodyBottom = yFor(Math.min(candle.open, candle.close));
      ctx.fillStyle = color;
      const bh = Math.max(Math.abs(bodyBottom - bodyTop), 1);
      ctx.beginPath();
      ctx.roundRect(x, bodyTop, candleW, bh, 1.5);
      ctx.fill();

      // volume bar (bottom third, low alpha)
      const vh = (candle.volume / maxVolume) * (height - volumeTop - 6);
      ctx.fillStyle = isBull
        ? 'rgba(0,255,149,0.28)'
        : 'rgba(255,46,99,0.28)';
      ctx.fillRect(x, height - vh - 2, candleW, vh);
    });

    // volume divider
    ctx.strokeStyle = COLORS.grid;
    ctx.beginPath();
    ctx.moveTo(0, volumeTop - 3);
    ctx.lineTo(chartWidth, volumeTop - 3);
    ctx.stroke();

    // ── Crosshair ──
    if (crosshair.visible && crosshair.x <= chartWidth) {
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(crosshair.x, 0);
      ctx.lineTo(crosshair.x, priceBottom);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, crosshair.y);
      ctx.lineTo(chartWidth, crosshair.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [visible, height, width, crosshair, start, count]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const slot = (rect.width - 62) / visible.length;
    const index = Math.floor(x / slot);
    if (index >= 0 && index < visible.length) {
      setHovered(visible[index]);
      setCrosshair({ x, y, visible: true });
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setWindowState((prev) => {
      const factor = e.deltaY > 0 ? 1.18 : 1 / 1.18;
      const next = Math.round(prev.count * factor);
      return { ...prev, count: Math.max(15, Math.min(data.length, next)) };
    });
  };

  const handlePan = (dir: number) => {
    setWindowState((prev) => ({
      ...prev,
      start: Math.max(
        0,
        Math.min(prev.start + dir, Math.max(0, data.length - prev.count)),
      ),
    }));
  };

  const last = visible[visible.length - 1];
  const change = last && visible[0] ? last.close - visible[0].close : 0;
  const changePct = last && visible[0] ? (change / visible[0].close) * 100 : 0;

  return (
    <div ref={wrapRef} className="relative w-full">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-xl font-bold text-text-primary">
            {formatUSDPrecise(last?.close ?? 0)}
          </span>
          <span
            className={`font-mono text-xs ${change >= 0 ? 'text-accent-emerald' : 'text-accent-crimson'}`}
          >
            {change >= 0 ? '+' : ''}
            {change.toFixed(2)} ({changePct.toFixed(2)}%)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePan(-10)}
            className="rounded-md border border-white/10 px-2 py-1 text-xs text-text-muted hover:text-text-primary"
            aria-label="Pan left"
          >
            ←
          </button>
          <button
            onClick={() => handlePan(10)}
            className="rounded-md border border-white/10 px-2 py-1 text-xs text-text-muted hover:text-text-primary"
            aria-label="Pan right"
          >
            →
          </button>
          <span className="font-mono text-[10px] text-text-muted">
            {visible.length}/{data.length} · scroll = zoom
          </span>
        </div>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute left-3 top-2 z-20 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-text-muted">
          {hovered ? (
            <>
              <span>
                O{' '}
                <strong className="text-text-primary">
                  {formatUSDPrecise(hovered.open)}
                </strong>
              </span>
              <span>
                H{' '}
                <strong className="text-accent-emerald">
                  {formatUSDPrecise(hovered.high)}
                </strong>
              </span>
              <span>
                L{' '}
                <strong className="text-accent-crimson">
                  {formatUSDPrecise(hovered.low)}
                </strong>
              </span>
              <span>
                C{' '}
                <strong className="text-text-primary">
                  {formatUSDPrecise(hovered.close)}
                </strong>
              </span>
              <span>
                Vol{' '}
                <strong className="text-accent-cyan">
                  {formatCompact(hovered.volume)}
                </strong>
              </span>
              <span>{formatTimestamp(hovered.timestamp)}</span>
            </>
          ) : (
            <span className="text-text-muted/60">
              Hover para inspeccionar OHLC · Rueda para zoom
            </span>
          )}
        </div>

        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => {
            setCrosshair((p) => ({ ...p, visible: false }));
            setHovered(null);
          }}
          onWheel={handleWheel}
          className="w-full cursor-crosshair rounded-xl bg-bg-surface-1/40"
          data-cursor="ZOOM"
        />
      </div>
    </div>
  );
}
