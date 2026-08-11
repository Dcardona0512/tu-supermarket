"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCOP } from "@/lib/format";
import type { CashClosing } from "@/lib/database.types";

/** Fecha de hoy en formato YYYY-MM-DD según el reloj del navegador. */
function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/**
 * "2026-07-31" -> "viernes, 31 de julio de 2026".
 *
 * Se parte a mano en vez de `new Date(texto)` porque esa forma interpreta la
 * fecha en UTC y en Colombia mostraría el día anterior.
 */
function longDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1).toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function CashClosingView({
  initial,
  storeName,
}: {
  initial: CashClosing | null;
  /** Encabeza el comprobante impreso. */
  storeName: string;
}) {
  const [date, setDate] = useState(initial?.date ?? today());
  const [data, setData] = useState<CashClosing | null>(initial);
  const [counted, setCounted] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function changeDate(next: string) {
    if (!next) return;
    setDate(next);
    setError(null);
    setCounted("");

    startTransition(async () => {
      const supabase = createClient();
      const { data: res, error: rpcError } = await supabase.rpc(
        "cash_closing",
        { p_date: next }
      );
      if (rpcError || !res) {
        setError("No se pudo cargar el cierre.");
        return;
      }
      setData(res as unknown as CashClosing);
    });
  }

  const totals = data?.totals;
  const expectedCash = Number(totals?.cash ?? 0);
  const countedNum = counted === "" ? null : Number(counted);
  const diff = countedNum == null ? null : countedNum - expectedCash;

  return (
    <div className={pending ? "opacity-60 transition" : "transition"}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Cierre de caja</h1>
          <p className="text-xs text-neutral-500">
            Ventas entregadas del día y efectivo que debería haber en caja.
          </p>
        </div>
        <div className="flex items-end gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">
              Día
            </label>
            <input
              type="date"
              value={date}
              max={today()}
              onChange={(e) => changeDate(e.target.value)}
              className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            disabled={pending || !data}
            title="Abre el diálogo de impresión; ahí eliges «Guardar como PDF»"
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:bg-neutral-300"
          >
            <PdfIcon />
            Descargar PDF
          </button>
        </div>
      </div>

      <p className="-mt-2 mb-4 text-xs text-neutral-400">
        Incluye todo lo entregado ese día, de 00:00 a 23:59 (hora de Colombia).
      </p>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile
          label="Ventas del día"
          value={formatCOP(Number(totals?.revenue ?? 0))}
        />
        <Tile
          label="Efectivo esperado"
          value={formatCOP(expectedCash)}
          accent
        />
        <Tile
          label="Transferencias"
          value={formatCOP(Number(totals?.transfer ?? 0))}
        />
        <Tile label="Ventas" value={String(totals?.orders ?? 0)} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Arqueo */}
        <section className="rounded-xl border border-black/5 bg-white p-5">
          <h2 className="mb-1 text-sm font-bold">Arqueo</h2>
          <p className="mb-3 text-xs text-neutral-500">
            Cuenta el efectivo de la caja y anótalo para comparar.
          </p>

          <label className="mb-1 block text-xs font-medium text-neutral-600">
            Efectivo contado
          </label>
          <input
            type="number"
            min={0}
            value={counted}
            onChange={(e) => setCounted(e.target.value)}
            placeholder="0"
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />

          {diff != null && (
            <div
              className={`mt-3 rounded-lg px-3 py-2 text-sm ${
                diff === 0
                  ? "bg-green-50 text-green-800"
                  : diff > 0
                    ? "bg-blue-50 text-blue-800"
                    : "bg-red-50 text-red-700"
              }`}
            >
              {diff === 0 && "La caja cuadra exactamente."}
              {diff > 0 && `Sobran ${formatCOP(diff)} en la caja.`}
              {diff < 0 && `Faltan ${formatCOP(Math.abs(diff))} en la caja.`}
            </div>
          )}

          <dl className="mt-4 space-y-1.5 border-t border-black/5 pt-3 text-sm">
            <Row
              label="Ventas en tienda"
              value={formatCOP(Number(data?.by_channel?.tienda?.revenue ?? 0))}
              note={`${data?.by_channel?.tienda?.orders ?? 0} venta(s)`}
            />
            <Row
              label="Pedidos entregados"
              value={formatCOP(Number(data?.by_channel?.linea?.revenue ?? 0))}
              note={`${data?.by_channel?.linea?.orders ?? 0} pedido(s)`}
            />
            <Row
              label="Domicilios cobrados"
              value={formatCOP(Number(totals?.delivery ?? 0))}
              note="no cuentan en la caja"
            />
          </dl>
        </section>

        {/* Detalle */}
        <section className="rounded-xl border border-black/5 bg-white p-5">
          <h2 className="mb-3 text-sm font-bold">Ventas del día</h2>
          {!data || data.sales.length === 0 ? (
            <p className="py-10 text-center text-sm text-neutral-400">
              No hay ventas entregadas este día.
            </p>
          ) : (
            <ul className="max-h-80 divide-y divide-black/5 overflow-y-auto">
              {data.sales.map((s) => (
                <li
                  key={s.order_number}
                  className="flex items-center gap-2 py-2 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate">
                      #{s.order_number}{" "}
                      <span className="text-neutral-500">
                        {s.customer_name || "Venta en tienda"}
                      </span>
                    </p>
                    <p className="text-xs text-neutral-400">
                      {s.channel === "tienda" ? "Tienda" : "En línea"} ·{" "}
                      <span className="capitalize">{s.payment_method}</span>
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="font-semibold">
                      {formatCOP(Number(s.total))}
                    </span>
                    {Number(s.delivery_fee) > 0 && (
                      <span className="block text-xs text-neutral-400">
                        + {formatCOP(Number(s.delivery_fee))} dom.
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <PrintableClosing
        date={date}
        data={data}
        counted={countedNum}
        diff={diff}
        storeName={storeName}
      />
    </div>
  );
}

/**
 * Comprobante del cierre para llevar en papel o guardar como PDF.
 *
 * No se ve en pantalla: los estilos de `globals.css` lo muestran solo al
 * imprimir, y desde el diálogo del navegador se guarda como PDF.
 */
function PrintableClosing({
  date,
  data,
  counted,
  diff,
  storeName,
}: {
  date: string;
  data: CashClosing | null;
  counted: number | null;
  diff: number | null;
  storeName: string;
}) {
  const t = data?.totals;
  const ventas = data?.sales ?? [];

  return (
    <div className="hoja-impresion">
      <div style={{ borderBottom: "2px solid #000", paddingBottom: 8 }}>
        <h1 style={{ fontSize: "16pt", fontWeight: 800, letterSpacing: 1 }}>
          {storeName}
        </h1>
        <p style={{ fontSize: "12pt", fontWeight: 700, marginTop: 2 }}>
          Cierre de caja
        </p>
        <p style={{ marginTop: 2 }}>
          {longDate(date)} · de 00:00 a 23:59
        </p>
      </div>

      <table
        style={{ width: "100%", marginTop: 14, borderCollapse: "collapse" }}
      >
        <tbody>
          <PrintRow label="Ventas del día" value={formatCOP(Number(t?.revenue ?? 0))} />
          <PrintRow label="Efectivo esperado en caja" value={formatCOP(Number(t?.cash ?? 0))} strong />
          <PrintRow label="Transferencias" value={formatCOP(Number(t?.transfer ?? 0))} />
          <PrintRow label="Domicilios cobrados (no cuentan en caja)" value={formatCOP(Number(t?.delivery ?? 0))} />
          <PrintRow label="Número de ventas" value={String(t?.orders ?? 0)} />
          <PrintRow
            label="Ventas en tienda"
            value={`${formatCOP(Number(data?.by_channel?.tienda?.revenue ?? 0))}  (${data?.by_channel?.tienda?.orders ?? 0})`}
          />
          <PrintRow
            label="Pedidos a domicilio entregados"
            value={`${formatCOP(Number(data?.by_channel?.linea?.revenue ?? 0))}  (${data?.by_channel?.linea?.orders ?? 0})`}
          />
        </tbody>
      </table>

      {counted != null && (
        <table
          style={{ width: "100%", marginTop: 12, borderCollapse: "collapse" }}
        >
          <tbody>
            <PrintRow label="Efectivo contado" value={formatCOP(counted)} />
            <PrintRow
              label="Diferencia"
              strong
              value={
                diff === 0
                  ? "La caja cuadra"
                  : (diff ?? 0) > 0
                    ? `Sobran ${formatCOP(diff ?? 0)}`
                    : `Faltan ${formatCOP(Math.abs(diff ?? 0))}`
              }
            />
          </tbody>
        </table>
      )}

      <h2 style={{ fontSize: "11pt", fontWeight: 700, marginTop: 16 }}>
        Detalle de ventas
      </h2>
      {ventas.length === 0 ? (
        <p style={{ marginTop: 6 }}>No hubo ventas entregadas este día.</p>
      ) : (
        <table
          style={{
            width: "100%",
            marginTop: 6,
            borderCollapse: "collapse",
            fontSize: "10pt",
          }}
        >
          <thead>
            <tr style={{ borderBottom: "1px solid #000", textAlign: "left" }}>
              <th style={{ padding: "3px 0" }}>#</th>
              <th>Cliente</th>
              <th>Canal</th>
              <th>Pago</th>
              <th style={{ textAlign: "right" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {ventas.map((s) => (
              <tr key={s.order_number} style={{ borderBottom: "1px solid #ddd" }}>
                <td style={{ padding: "3px 0" }}>{s.order_number}</td>
                <td>{s.customer_name || "Venta en tienda"}</td>
                <td>{s.channel === "tienda" ? "Tienda" : "En línea"}</td>
                <td style={{ textTransform: "capitalize" }}>
                  {s.payment_method}
                </td>
                <td style={{ textAlign: "right" }}>
                  {formatCOP(Number(s.total))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div
        style={{
          marginTop: 34,
          display: "flex",
          justifyContent: "space-between",
          gap: 40,
        }}
      >
        <div style={{ flex: 1, borderTop: "1px solid #000", paddingTop: 4 }}>
          Entrega
        </div>
        <div style={{ flex: 1, borderTop: "1px solid #000", paddingTop: 4 }}>
          Recibe
        </div>
      </div>

      <p style={{ marginTop: 16, fontSize: "8pt", color: "#555" }}>
        Generado el {new Date().toLocaleString("es-CO")}
      </p>
    </div>
  );
}

function PrintRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <tr style={{ borderBottom: "1px solid #ddd" }}>
      <td style={{ padding: "4px 0" }}>{label}</td>
      <td
        style={{
          padding: "4px 0",
          textAlign: "right",
          fontWeight: strong ? 700 : 400,
        }}
      >
        {value}
      </td>
    </tr>
  );
}

function PdfIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3v12" />
      <path d="m7 12 5 5 5-5" />
      <path d="M4 19h16" />
    </svg>
  );
}

function Tile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
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
    </div>
  );
}

function Row({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-neutral-500">
        {label}
        {note && <span className="ml-1.5 text-xs text-neutral-400">{note}</span>}
      </dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
