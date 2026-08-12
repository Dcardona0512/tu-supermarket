"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCOP } from "@/lib/format";
import { CHART, bucketLabel } from "@/lib/chart-theme";
import {
  endOfDayISO,
  rangeLabel,
  startOfDayISO,
  suggestGranularity,
  todayInput,
  toDateInput,
} from "@/lib/dates";
import SalesTrendChart from "@/components/charts/SalesTrendChart";
import TopProductsChart from "@/components/charts/TopProductsChart";
import type {
  ReportChannelStats,
  ReportGranularity,
  SalesReport,
} from "@/lib/database.types";

/** Rango por defecto: últimos 30 días (coincide con lo que carga el servidor). */
function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 29);
  return { from: toDateInput(from), to: toDateInput(to) };
}

export default function SalesReportView({
  initialReport,
}: {
  initialReport: SalesReport;
}) {
  const initial = defaultRange();

  const [report, setReport] = useState(initialReport);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [granularity, setGranularity] = useState<ReportGranularity>(
    initialReport.granularity ?? "day"
  );
  const [showTable, setShowTable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function load(
    nextFrom: string,
    nextTo: string,
    nextGranularity: ReportGranularity
  ) {
    setError(null);

    if (nextFrom > nextTo) {
      setError("La fecha inicial no puede ser posterior a la final.");
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const { data, error: rpcError } = await supabase.rpc("sales_report", {
        p_granularity: nextGranularity,
        p_from: startOfDayISO(nextFrom),
        p_to: endOfDayISO(nextTo),
      });

      if (rpcError || !data) {
        setError("No se pudo cargar el informe. Intenta de nuevo.");
        return;
      }
      setReport(data as unknown as SalesReport);
    });
  }

  /**
   * El informe es diario. Solo en rangos largos las barras se agrupan por
   * semana o mes, porque cientos de barras diarias no se podrían leer.
   */
  function applyRange(nextFrom: string, nextTo: string) {
    setFrom(nextFrom);
    setTo(nextTo);
    if (nextFrom > nextTo) {
      setError("La fecha inicial no puede ser posterior a la final.");
      return;
    }
    const g = suggestGranularity(nextFrom, nextTo);
    setGranularity(g);
    load(nextFrom, nextTo, g);
  }

  const t = report.totals;
  const margin =
    Number(t.revenue) > 0
      ? Math.round((Number(t.profit) / Number(t.revenue)) * 100)
      : 0;

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold">Informe de ventas</h1>
        <p className="text-xs text-neutral-500 first-letter:uppercase">
          {rangeLabel(from, to)} · solo pedidos entregados
        </p>
      </div>

      {/* Rango de fechas del informe */}
      <div className="mb-5 rounded-xl border border-black/5 bg-white p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">
              Desde
            </label>
            <input
              type="date"
              value={from}
              max={to || todayInput()}
              onChange={(e) => applyRange(e.target.value, to)}
              className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">
              Hasta
            </label>
            <input
              type="date"
              value={to}
              min={from}
              max={todayInput()}
              onChange={(e) => applyRange(from, e.target.value)}
              className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </div>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* Indicadores del periodo */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Ventas"
          value={formatCOP(Number(t.revenue))}
          note={
            Number(t.delivery) > 0
              ? `${formatCOP(Number(t.delivery))} de domicilios aparte`
              : undefined
          }
        />
        <Stat
          label="Ganancia"
          value={formatCOP(Number(t.profit))}
          note={`${margin}% de margen`}
          accent
        />
        <Stat
          label="Pedidos"
          value={String(t.orders)}
          note={`${t.units} productos`}
        />
        <Stat label="Ticket promedio" value={formatCOP(Number(t.avg_ticket))} />
      </div>

      {/* Origen de las ventas */}
      <section className="mt-4 rounded-xl border border-black/5 bg-white p-5">
        <h2 className="mb-3 text-sm font-bold">Origen de las ventas</h2>
        <div className="space-y-3">
          <ChannelRow
            label="Pedidos en línea"
            stats={report.by_channel?.linea}
            total={Number(t.revenue)}
          />
          <ChannelRow
            label="Ventas en tienda"
            stats={report.by_channel?.tienda}
            total={Number(t.revenue)}
          />
        </div>
      </section>

      {/* Tendencia */}
      <section className="mt-4 rounded-xl border border-black/5 bg-white p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold">
              Ventas por {granularity === "day" ? "día" : granularity === "week" ? "semana" : "mes"}
            </h2>
            <p className="text-xs text-neutral-500">
              Cada barra es el total vendido, dividido en costo y ganancia.
              {granularity !== "day" &&
                " El rango es largo, por eso las barras se agrupan."}
            </p>
          </div>
          {/* Leyenda: identidad nunca depende solo del color */}
          <div className="flex items-center gap-4 text-xs">
            <LegendItem color={CHART.profit} label="Ganancia" />
            <LegendItem color={CHART.cost} label="Costo" />
          </div>
        </div>

        <div className={pending ? "opacity-50 transition" : "transition"}>
          <SalesTrendChart series={report.series} granularity={granularity} />
        </div>

        <button
          onClick={() => setShowTable((s) => !s)}
          className="mt-3 text-xs font-medium text-brand-ink hover:underline"
        >
          {showTable ? "Ocultar tabla" : "Ver tabla de datos"}
        </button>

        {showTable && (
          <div className="mt-3 max-h-80 overflow-auto rounded-lg border border-black/5">
            <table className="w-full min-w-[420px] text-sm">
              <thead className="sticky top-0 bg-neutral-50 text-left text-xs uppercase text-neutral-400">
                <tr>
                  <th className="px-3 py-2 font-medium">Periodo</th>
                  <th className="px-3 py-2 text-right font-medium">Ventas</th>
                  <th className="px-3 py-2 text-right font-medium">Costo</th>
                  <th className="px-3 py-2 text-right font-medium">Ganancia</th>
                  <th className="px-3 py-2 text-right font-medium">Pedidos</th>
                </tr>
              </thead>
              <tbody
                className="divide-y divide-black/5"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {report.series
                  .filter((p) => Number(p.orders) > 0)
                  .reverse()
                  .map((p) => (
                    <tr key={p.bucket}>
                      <td className="px-3 py-2 text-neutral-600 first-letter:uppercase">
                        {bucketLabel(p.bucket, granularity, true)}
                      </td>
                      <td className="px-3 py-2 text-right font-medium">
                        {formatCOP(Number(p.revenue))}
                      </td>
                      <td className="px-3 py-2 text-right text-neutral-500">
                        {formatCOP(Number(p.cost))}
                      </td>
                      <td className="px-3 py-2 text-right text-neutral-700">
                        {formatCOP(Number(p.profit))}
                      </td>
                      <td className="px-3 py-2 text-right text-neutral-500">
                        {p.orders}
                      </td>
                    </tr>
                  ))}
                {report.series.every((p) => Number(p.orders) === 0) && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-6 text-center text-neutral-400"
                    >
                      Sin ventas registradas en este periodo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Productos más vendidos */}
      <section className="mt-4 rounded-xl border border-black/5 bg-white p-5">
        <h2 className="mb-1 text-sm font-bold">Productos más vendidos</h2>
        <p className="mb-4 text-xs text-neutral-500">
          Ordenados por ventas del periodo.
        </p>
        <div className={pending ? "opacity-50 transition" : "transition"}>
          <TopProductsChart products={report.top_products} />
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  note,
  accent,
}: {
  label: string;
  value: string;
  note?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        accent ? "border-brand/20 bg-brand/5" : "border-black/5 bg-white"
      }`}
    >
      <p className="text-xs font-medium text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {note && <p className="mt-0.5 text-xs text-neutral-400">{note}</p>}
    </div>
  );
}

/** Participación de cada canal sobre el total, como medidor de un solo tono. */
function ChannelRow({
  label,
  stats,
  total,
}: {
  label: string;
  stats?: ReportChannelStats;
  total: number;
}) {
  const revenue = Number(stats?.revenue ?? 0);
  const orders = Number(stats?.orders ?? 0);
  const share = total > 0 ? Math.round((revenue / total) * 100) : 0;

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
        <span className="text-neutral-700">
          {label}
          <span className="ml-1.5 text-xs text-neutral-400">
            {orders} venta{orders === 1 ? "" : "s"}
          </span>
        </span>
        <span className="font-semibold text-neutral-900">
          {formatCOP(revenue)}
          <span className="ml-1.5 text-xs font-normal text-neutral-400">
            {share}%
          </span>
        </span>
      </div>
      <div
        className="h-2.5 w-full overflow-hidden rounded-full"
        style={{ background: "#cde2fb" }}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${share}%`, background: CHART.cost }}
        />
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-neutral-600">
      <span
        className="inline-block h-2.5 w-2.5 rounded-sm"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}
