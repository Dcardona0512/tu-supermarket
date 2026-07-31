"use client";

import { useState } from "react";
import { formatCOP } from "@/lib/format";
import {
  CHART,
  bucketLabel,
  compactCOP,
  niceMax,
} from "@/lib/chart-theme";
import type { ReportGranularity, ReportPoint } from "@/lib/database.types";

const W = 880;
const H = 300;
const PAD = { top: 16, right: 12, bottom: 34, left: 68 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;
const BAR_MAX = 24; // nunca llenar la banda: el sobrante es aire
const GAP = 2; // separador en color superficie entre segmentos apilados
const R = 4; // radio del extremo de dato

/** Barra con el extremo superior redondeado y la base cuadrada. */
function topRoundedPath(x: number, y: number, w: number, h: number) {
  const r = Math.min(R, w / 2, h);
  return [
    `M${x},${y + h}`,
    `V${y + r}`,
    `Q${x},${y} ${x + r},${y}`,
    `H${x + w - r}`,
    `Q${x + w},${y} ${x + w},${y + r}`,
    `V${y + h}`,
    "Z",
  ].join(" ");
}

export default function SalesTrendChart({
  series,
  granularity,
}: {
  series: ReportPoint[];
  granularity: ReportGranularity;
}) {
  const [hover, setHover] = useState<number | null>(null);

  const maxRevenue = Math.max(...series.map((p) => Number(p.revenue)), 0);
  const yMax = niceMax(maxRevenue);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * yMax);

  const band = PLOT_W / Math.max(series.length, 1);
  const barW = Math.min(BAR_MAX, band * 0.7);
  const y0 = PAD.top + PLOT_H;
  const scale = (v: number) => (yMax === 0 ? 0 : (v / yMax) * PLOT_H);

  // Etiquetas del eje X espaciadas para que nunca se solapen
  const labelStep = Math.max(1, Math.ceil(series.length / 8));

  const active = hover != null ? series[hover] : null;
  const hasData = series.some((p) => Number(p.revenue) > 0);

  return (
    <div className="relative">
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          role="img"
          aria-label="Ventas por periodo, separadas en costo y ganancia"
          style={{ minWidth: 560, display: "block" }}
          onMouseLeave={() => setHover(null)}
        >
          {/* Cuadrícula */}
          {ticks.map((t, i) => {
            const y = y0 - scale(t);
            return (
              <g key={i}>
                <line
                  x1={PAD.left}
                  x2={W - PAD.right}
                  y1={y}
                  y2={y}
                  stroke={i === 0 ? CHART.baseline : CHART.gridline}
                  strokeWidth={1}
                />
                <text
                  x={PAD.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize={11}
                  fill={CHART.muted}
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {compactCOP(t)}
                </text>
              </g>
            );
          })}

          {/* Columnas apiladas: costo (base) + ganancia (arriba) */}
          {series.map((p, i) => {
            const revenue = Number(p.revenue);
            const cost = Math.min(Number(p.cost), revenue);
            const profit = Math.max(revenue - cost, 0);

            const x = PAD.left + i * band + (band - barW) / 2;
            const hTotal = scale(revenue);
            const hCost = scale(cost);
            const hProfit = Math.max(hTotal - hCost - GAP, 0);
            const dim = hover != null && hover !== i;

            return (
              <g key={p.bucket} opacity={dim ? 0.45 : 1}>
                {profit > 0 && hProfit > 0 && (
                  <path
                    d={topRoundedPath(x, y0 - hTotal, barW, hProfit)}
                    fill={CHART.profit}
                  />
                )}
                {cost > 0 && hCost > 0 && (
                  <path
                    d={
                      profit > 0 && hProfit > 0
                        ? `M${x},${y0} V${y0 - hCost} H${x + barW} V${y0} Z`
                        : topRoundedPath(x, y0 - hCost, barW, hCost)
                    }
                    fill={CHART.cost}
                  />
                )}
              </g>
            );
          })}

          {/* Etiquetas del eje X */}
          {series.map((p, i) =>
            i % labelStep === 0 ? (
              <text
                key={p.bucket}
                x={PAD.left + i * band + band / 2}
                y={y0 + 20}
                textAnchor="middle"
                fontSize={11}
                fill={CHART.muted}
              >
                {bucketLabel(p.bucket, granularity)}
              </text>
            ) : null
          )}

          {/* Zonas de interacción (más anchas que la marca) */}
          {series.map((p, i) => (
            <rect
              key={`hit-${p.bucket}`}
              x={PAD.left + i * band}
              y={PAD.top}
              width={band}
              height={PLOT_H}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
            />
          ))}
        </svg>
      </div>

      {!hasData && (
        <p className="absolute inset-0 grid place-items-center text-sm text-neutral-400">
          Todavía no hay ventas en este periodo.
        </p>
      )}

      {/* Tooltip */}
      {active && (
        <div
          className="pointer-events-none absolute top-2 z-10 w-52 rounded-lg border border-black/10 bg-white p-3 text-xs shadow-lg"
          style={{
            left: `${Math.min(
              Math.max(((hover! + 0.5) / series.length) * 100, 12),
              78
            )}%`,
          }}
        >
          <p className="mb-1.5 font-semibold text-neutral-900 first-letter:uppercase">
            {bucketLabel(active.bucket, granularity, true)}
          </p>
          <TipRow
            color={CHART.profit}
            label="Ganancia"
            value={formatCOP(Number(active.profit))}
          />
          <TipRow
            color={CHART.cost}
            label="Costo"
            value={formatCOP(Number(active.cost))}
          />
          <div className="mt-1.5 flex justify-between border-t border-black/5 pt-1.5 font-semibold text-neutral-900">
            <span>Ventas</span>
            <span>{formatCOP(Number(active.revenue))}</span>
          </div>
          <p className="mt-0.5 text-neutral-400">
            {active.orders} pedido{active.orders === 1 ? "" : "s"}
          </p>
        </div>
      )}
    </div>
  );
}

function TipRow({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-0.5">
      <span className="flex items-center gap-1.5 text-neutral-500">
        <span
          className="inline-block h-2 w-2 rounded-sm"
          style={{ background: color }}
        />
        {label}
      </span>
      <span className="font-medium text-neutral-700">{value}</span>
    </div>
  );
}
