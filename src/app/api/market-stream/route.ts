import type { MarketTick } from '@/types/financial';

/**
 * Server-Sent Events stream of simulated market ticks. Clients subscribe with
 * an EventSource and receive one tick per second (random-walk around a base).
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  const encoder = new TextEncoder();
  let interval: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let price = 97_420;
      const symbols = ['BTC-USD', 'ETH-USD', 'NVDA', 'SPY', 'GLD'];
      let symbolIndex = 0;

      const tick = () => {
        symbolIndex = (symbolIndex + 1) % symbols.length;
        const symbol = symbols[symbolIndex];
        const change = (Math.random() - 0.5) * price * 0.001;
        price += change;
        const payload: MarketTick = {
          symbol,
          price: Number(price.toFixed(2)),
          change: Number(change.toFixed(2)),
          changePct: Number(((change / (price - change)) * 100).toFixed(4)),
          volume: Math.round(100 + Math.random() * 4_000),
          timestamp: Date.now(),
        };
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(payload)}\n\n`),
        );
      };

      tick();
      interval = setInterval(tick, 1000);
    },
    cancel() {
      if (interval) clearInterval(interval);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
