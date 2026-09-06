# Aetherium — Financial Intelligence Engine

Dashboard ejecutivo de **analítica financiera de alto rendimiento** con una interfaz
dark glassmorphic de grado *Awwwards* y un motor cuantitativo que ejecuta las
simulaciones pesadas fuera del hilo principal.

> Inteligencia financiera en tiempo real: Monte Carlo, riesgo de cola y flujos de
> capital sobre un motor cuantitativo en Web Worker.

## ✨ Features

- 📊 **Command Center en tiempo real** — KPIs (Net Capital, Sharpe, Max Drawdown, VaR, Alpha, Beta) con variaciones vs. periodo anterior.
- 🕯️ **Candlestick de alta frecuencia** — gráfico OHLC en Canvas 2D con EMA/Bollinger, zoom con rueda y pan.
- 📖 **Order Book en vivo** — profundidad de mercado con spread e imbalance.
- 🧠 **Motor cuantitativo en Web Workers** — Monte Carlo, VaR (99%), Sharpe/Sortino, drawdown y simplificación Douglas–Peucker sin bloquear la UI.
- 🎨 **Fondo 3D con shaders GLSL** — simplex noise + grid financiera reactiva al ratón (React Three Fiber).
- 🤖 **AI Insights** — detección de spikes de correlación, señales de mean-reversion y alertas de breach de VaR.
- 🧮 **Simulaciones Monte Carlo interactivas** — sliders de capital, retorno, volatilidad y horizonte.
- 🕸️ **Sankey de flujo de caja** — Revenue → Gross Profit → OpEx → EBITDA → Net Income.
- 📈 **Percentiles y distribución** — histogramas de retornos y estadísticos descriptivos en vivo.

## 🛠️ Stack

- **Next.js 16** (App Router, Server + Client Components)
- **TypeScript 5** (`strict: true`)
- **Tailwind CSS v4** (design tokens CSS-first) + shadcn/ui
- **Three.js / React Three Fiber** — fondo GLSL con simplex noise + grid financiera
- **GSAP 3** (ScrollTrigger / Flip) + **Framer Motion** + **Lenis** smooth-scroll
- **Zustand** + **TanStack Query v5**
- **Web Workers** — Monte Carlo, VaR, Sharpe/Sortino, drawdown, Douglas–Peucker
- **d3-sankey** + **Recharts** + **Canvas 2D** (candlestick de alta frecuencia)

## 🚀 Instalación

```bash
npm install
npm run dev
# → http://localhost:3000
```

## 📁 Estructura

```
src/
├── app/           # App Router (dashboard, api)
├── components/    # 3d, ai, animations, charts, dashboard, ui
├── hooks/         # hooks reutilizables
├── lib/           # motor cuantitativo, utilidades
├── store/         # Zustand
├── types/         # tipos TypeScript
└── workers/       # Web Workers (Monte Carlo, métricas)
```

## 📝 Licencia

MIT
