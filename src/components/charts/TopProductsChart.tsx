"use client";

import { formatCOP } from "@/lib/format";
import { CHART } from "@/lib/chart-theme";
import type { ReportTopProduct } from "@/lib/database.types";

/**
 * Ranking de productos por ventas. Una sola serie (magnitud) => un solo tono,
 * sin leyenda: el título ya dice qué se está midiendo.
 */
export default function TopProductsChart({
  products,
}: {
  products: ReportTopProduct[];
}) {
  if (products.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-neutral-400">
        Todavía no hay ventas en este periodo.
      </p>
    );
  }

  const max = Math.max(...products.map((p) => Number(p.revenue)), 1);

  return (
    <ul className="space-y-3">
      {products.map((p) => {
        const revenue = Number(p.revenue);
        const profit = Number(p.profit);
        const pct = (revenue / max) * 100;

        return (
          <li key={p.name}>
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <span className="truncate text-sm text-neutral-700">
                {p.name}
                <span className="ml-1.5 text-xs text-neutral-400">
                  ×{p.quantity}
                </span>
              </span>
              <span
                className="shrink-0 text-sm font-semibold text-neutral-900"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {formatCOP(revenue)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 flex-1 overflow-hidden">
                <div
                  className="h-full"
                  style={{
                    width: `${Math.max(pct, 1.5)}%`,
                    background: CHART.cost,
                    // extremo de dato redondeado, base cuadrada
                    borderRadius: "0 4px 4px 0",
                  }}
                />
              </div>
              <span className="w-24 shrink-0 text-right text-xs text-neutral-400">
                {formatCOP(profit)} gan.
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
