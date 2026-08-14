'use client';

import React, { useMemo } from 'react';
import { sankey } from 'd3-sankey';
import type { CashFlowStreamNode } from '@/types/financial';
import { COLORS } from '@/lib/constants';
import { formatUSDCompact } from '@/lib/formatters';

const CATEGORY_COLOR: Record<CashFlowStreamNode['category'], string> = {
  INFLOW: COLORS.emerald,
  OPERATING_EXPENSE: COLORS.crimson,
  CAPEX: COLORS.amber,
  TAX: COLORS.crimson,
  NET_MARGIN: COLORS.cyan,
};

interface SankeyCashflowChartProps {
  flows: CashFlowStreamNode[];
  height?: number;
}

interface SankeyNode {
  id: string;
  value?: number;
  x0?: number;
  x1?: number;
  y0?: number;
  y1?: number;
}

interface SankeyLink {
  source: SankeyNode | string;
  target: SankeyNode | string;
  value: number;
  category: CashFlowStreamNode['category'];
  width?: number;
}

interface SankeyGraphResult {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

type SankeyGenerator = {
  nodeWidth(w: number): SankeyGenerator;
  nodePadding(p: number): SankeyGenerator;
  nodeId(fn: (d: SankeyNode) => string): SankeyGenerator;
  extent(e: Array<[number, number]>): SankeyGenerator;
  (input: { nodes: SankeyNode[]; links: SankeyLink[] }): SankeyGraphResult;
};

/**
 * Capital-allocation Sankey diagram via d3-sankey, with a hand-written bezier
 * link path (avoids `sankeyLinkHorizontal`'s generic friction).
 */
export function SankeyCashflowChart({
  flows,
  height = 340,
}: SankeyCashflowChartProps) {
  const { nodes, links, width, innerHeight } = useMemo(() => {
    const W = 720;
    const H = 340;
    const nodeIds = Array.from(
      new Set([...flows.map((f) => f.source), ...flows.map((f) => f.target)]),
    );

    const generator = sankey() as unknown as SankeyGenerator;
    generator
      .nodeWidth(14)
      .nodePadding(16)
      .nodeId((d) => d.id)
      .extent([
        [1, 14],
        [W - 1, H - 14],
      ]);

    const graph = generator({
      nodes: nodeIds.map((id) => ({ id })),
      links: flows.map((f) => ({
        source: f.source,
        target: f.target,
        value: f.valueUSD,
        category: f.category,
      })),
    });

    return {
      nodes: graph.nodes,
      links: graph.links,
      width: W,
      innerHeight: H,
    };
  }, [flows]);

  const linkPath = (link: SankeyLink): string => {
    const source = link.source as SankeyNode;
    const target = link.target as SankeyNode;
    const sx = source.x1 ?? 0;
    const tx = target.x0 ?? 0;
    const sy = ((source.y0 ?? 0) + (source.y1 ?? 0)) / 2;
    const ty = ((target.y0 ?? 0) + (target.y1 ?? 0)) / 2;
    const dx = tx - sx;
    return `M${sx},${sy} C${sx + dx / 2},${sy} ${tx - dx / 2},${ty} ${tx},${ty}`;
  };

  return (
    <svg
      viewBox={`0 0 ${width} ${innerHeight}`}
      width="100%"
      height={height}
      role="img"
      aria-label="Cash-flow Sankey diagram"
    >
      <g>
        {links.map((link, i) => (
          <path
            key={`link-${i}`}
            d={linkPath(link)}
            fill="none"
            stroke={CATEGORY_COLOR[link.category]}
            strokeOpacity={0.38}
            strokeWidth={Math.max(1.2, link.width ?? 0)}
          />
        ))}
      </g>
      <g>
        {nodes.map((node, i) => {
          const x0 = node.x0 ?? 0;
          const x1 = node.x1 ?? 0;
          const y0 = node.y0 ?? 0;
          const y1 = node.y1 ?? 0;
          const onLeft = x0 < width / 2;
          const labelX = onLeft ? x1 + 6 : x0 - 6;
          return (
            <g key={`node-${i}`}>
              <rect
                x={x0}
                y={y0}
                width={x1 - x0}
                height={Math.max(0, y1 - y0)}
                rx={3}
                fill={COLORS.indigo}
                fillOpacity={0.85}
              />
              <text
                x={labelX}
                y={(y0 + y1) / 2 - 4}
                textAnchor={onLeft ? 'start' : 'end'}
                fontSize={11}
                fill={COLORS.textPrimary}
                fontFamily="Inter, sans-serif"
              >
                {node.id}
              </text>
              <text
                x={labelX}
                y={(y0 + y1) / 2 + 12}
                textAnchor={onLeft ? 'start' : 'end'}
                fontSize={10}
                fill={COLORS.textMuted}
                fontFamily="JetBrains Mono, monospace"
              >
                {formatUSDCompact(node.value ?? 0)}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
