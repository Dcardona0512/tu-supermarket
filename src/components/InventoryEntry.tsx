"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/format";
import ScanButton from "@/components/ScanButton";
import type { Product, StockEntry } from "@/lib/database.types";

type Line = {
  id: string;
  name: string;
  barcode: string | null;
  currentStock: number;
  quantity: number;
  /** Vencimiento del lote que entra; sustituye al del producto. */
  expiresAt: string;
};

type Mode = "entrada" | "salida";

/**
 * Entrada de mercancía: se escanean los productos recibidos, se ajustan las
 * cantidades y se confirma. También sirve para descontar por merma o avería.
 */
export default function InventoryEntry({
  products,
  recent,
}: {
  products: Product[];
  recent: StockEntry[];
}) {
  const router = useRouter();
  const scanRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<Mode>("entrada");
  const [code, setCode] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  // La confirmación de escaneo se desvanece sola; los avisos de error se quedan
  useEffect(() => {
    if (!msg?.ok) return;
    const timer = setTimeout(() => setMsg(null), 3000);
    return () => clearTimeout(timer);
  }, [msg]);

  const suggestions = useMemo(() => {
    const q = code.trim().toLowerCase();
    if (q.length < 2) return [];
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.brand ?? "").toLowerCase().includes(q) ||
          (p.barcode ?? "").includes(q)
      )
      .slice(0, 6);
  }, [products, code]);

  function addLine(p: Product) {
    setMsg(null);
    setDone(null);
    setLines((prev) => {
      const found = prev.find((l) => l.id === p.id);
      if (found) {
        return prev.map((l) =>
          l.id === p.id ? { ...l, quantity: l.quantity + 1 } : l
        );
      }
      return [
        ...prev,
        {
          id: p.id,
          name: p.name,
          barcode: p.barcode,
          currentStock: p.stock,
          quantity: 1,
          expiresAt: p.expires_at ?? "",
        },
      ];
    });
  }

  /** Añade la línea del producto cuyo código coincida exactamente. */
  function handleScannedCode(value: string) {
    const byCode = products.find((p) => p.barcode && p.barcode === value);

    if (!byCode) {
      setMsg({
        ok: false,
        text: `Código ${value} sin producto asignado. Asígnalo en la pestaña "Códigos de barras".`,
      });
      return;
    }

    const yaEnLista = lines.find((l) => l.id === byCode.id)?.quantity ?? 0;
    addLine(byCode);

    // Confirmación visible al volver de la cámara
    setMsg({
      ok: true,
      text: `${byCode.name} · ${yaEnLista + 1} unidad${
        yaEnLista + 1 === 1 ? "" : "es"
      } en la lista`,
    });
  }

  function onScan(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    const value = code.trim();
    if (!value) return;

    const byCode = products.find((p) => p.barcode && p.barcode === value);
    if (byCode) {
      addLine(byCode);
      setCode("");
      return;
    }

    if (suggestions.length > 0) {
      addLine(suggestions[0]);
      setCode("");
      return;
    }

    handleScannedCode(value);
    setCode("");
  }

  function setExpiry(id: string, value: string) {
    setLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, expiresAt: value } : l))
    );
  }

  function setQty(id: string, qty: number) {
    setLines((prev) =>
      prev
        .map((l) => (l.id === id ? { ...l, quantity: Math.max(0, qty) } : l))
        .filter((l) => l.quantity > 0)
    );
  }

  async function save() {
    if (lines.length === 0) return;
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const sign = mode === "entrada" ? 1 : -1;
    const failures: string[] = [];

    for (const line of lines) {
      const { error: rpcError } = await supabase.rpc("add_stock", {
        p_product_id: line.id,
        p_quantity: sign * line.quantity,
        // Solo en las entradas: el producto queda con el vencimiento del lote
        p_expires_at:
          mode === "entrada" && line.expiresAt ? line.expiresAt : undefined,
      });
      if (rpcError) failures.push(`${line.name}: ${rpcError.message}`);
    }

    setSaving(false);

    if (failures.length > 0) {
      setError(failures.join(" · "));
      router.refresh();
      return;
    }

    const units = lines.reduce((s, l) => s + l.quantity, 0);
    setDone(
      mode === "entrada"
        ? `Se agregaron ${units} unidades al inventario.`
        : `Se descontaron ${units} unidades del inventario.`
    );
    setLines([]);
    router.refresh();
    scanRef.current?.focus();
  }

  const totalUnits = lines.reduce((s, l) => s + l.quantity, 0);

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold">Inventario</h1>
        <p className="text-xs text-neutral-500">
          Escanea los productos que llegaron para sumarlos al stock, o descuenta
          por merma.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <section>
          {/* Modo */}
          <div className="mb-3 flex gap-1 rounded-lg bg-white p-1">
            <ModeBtn
              active={mode === "entrada"}
              onClick={() => setMode("entrada")}
              label="Entrada de mercancía"
            />
            <ModeBtn
              active={mode === "salida"}
              onClick={() => setMode("salida")}
              label="Salida o merma"
            />
          </div>

          <div className="flex gap-2">
            <input
              ref={scanRef}
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={onScan}
              placeholder="Escribe el nombre o dispara la pistola lectora"
              className="w-full rounded-lg border border-black/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            <ScanButton
              onDetected={handleScannedCode}
              title="Escanear mercancía"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-text transition hover:bg-brand-dark"
            />
          </div>

          {msg && (
            <p
              className={`mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                msg.ok
                  ? "bg-green-50 text-green-800"
                  : "bg-amber-50 text-amber-800"
              }`}
            >
              {msg.ok && (
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-green-600 text-xs font-bold text-white">
                  ✓
                </span>
              )}
              {msg.text}
            </p>
          )}

          {/* Sugerencias al escribir */}
          {suggestions.length > 0 && (
            <ul className="mt-2 overflow-hidden rounded-lg border border-black/5 bg-white">
              {suggestions.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => {
                      addLine(p);
                      setCode("");
                    }}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-neutral-50"
                  >
                    <span className="truncate">
                      {p.name}
                      {p.barcode && (
                        <span className="ml-2 font-mono text-xs text-neutral-400">
                          {p.barcode}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 text-xs text-neutral-400">
                      {p.stock} disp.
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Líneas a registrar */}
          <div className="mt-4 rounded-xl border border-black/5 bg-white">
            {lines.length === 0 ? (
              <p className="py-12 text-center text-sm text-neutral-400">
                Escanea un producto para empezar.
              </p>
            ) : (
              <ul className="divide-y divide-black/5">
                {lines.map((l) => (
                  <li key={l.id} className="flex flex-wrap items-center gap-3 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{l.name}</p>
                      <p className="text-xs text-neutral-400">
                        Stock actual {l.currentStock} →{" "}
                        <span className="font-medium text-neutral-600">
                          {mode === "entrada"
                            ? l.currentStock + l.quantity
                            : l.currentStock - l.quantity}
                        </span>
                      </p>
                    </div>
                    <QtyInput
                      value={l.quantity}
                      onChange={(q) => setQty(l.id, q)}
                    />
                    <button
                      onClick={() => setQty(l.id, 0)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Quitar
                    </button>

                    {/* El vencimiento solo aplica a lo que entra */}
                    {mode === "entrada" && (
                      <div className="flex w-full items-center gap-2 border-t border-black/5 pt-2">
                        <label className="text-xs text-neutral-500">
                          Vence
                        </label>
                        <input
                          type="date"
                          value={l.expiresAt}
                          onChange={(e) => setExpiry(l.id, e.target.value)}
                          className="rounded-lg border border-black/10 px-2 py-1 text-xs outline-none focus:border-brand"
                        />
                        {l.expiresAt ? (
                          <span className="text-xs text-neutral-400">
                            Reemplazará la fecha del producto
                          </span>
                        ) : (
                          <span className="text-xs text-neutral-300">
                            Opcional
                          </span>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          {done && (
            <p className="mt-3 rounded-lg bg-brand/5 px-3 py-2 text-sm font-medium text-brand-ink">
              {done}
            </p>
          )}

          {lines.length > 0 && (
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-sm text-neutral-500">
                {lines.length} producto(s) · {totalUnits} unidades
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setLines([])}
                  className="rounded-lg border border-black/10 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  Vaciar
                </button>
                <button
                  onClick={save}
                  disabled={saving}
                  className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-brand-text hover:bg-brand-dark disabled:bg-neutral-300"
                >
                  {saving
                    ? "Guardando..."
                    : mode === "entrada"
                      ? "Registrar entrada"
                      : "Registrar salida"}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Movimientos recientes */}
        <aside className="h-fit rounded-xl border border-black/5 bg-white p-4">
          <h2 className="mb-3 text-sm font-bold">Movimientos recientes</h2>
          {recent.length === 0 ? (
            <p className="py-6 text-center text-sm text-neutral-400">
              Todavía no hay movimientos.
            </p>
          ) : (
            <ul className="divide-y divide-black/5">
              {recent.map((e) => (
                <li key={e.id} className="flex items-center gap-2 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{e.product_name}</p>
                    <p className="text-xs text-neutral-400">
                      {formatDate(e.created_at)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-sm font-semibold ${
                      e.quantity >= 0 ? "text-green-700" : "text-red-600"
                    }`}
                  >
                    {e.quantity > 0 ? "+" : ""}
                    {e.quantity}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}

/**
 * Cantidad de una línea. Guarda el texto aparte del número para poder borrarlo
 * y escribir otro sin que reaparezca el valor anterior ni se pierda la línea.
 */
function QtyInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (q: number) => void;
}) {
  const [text, setText] = useState(String(value));

  return (
    <input
      type="number"
      min={1}
      value={text}
      onFocus={(e) => e.target.select()}
      onChange={(e) => {
        const raw = e.target.value;
        setText(raw);
        const n = parseInt(raw, 10);
        if (!Number.isNaN(n) && n > 0) onChange(n);
      }}
      onBlur={() => {
        const n = parseInt(text, 10);
        if (Number.isNaN(n) || n < 1) {
          setText("1");
          onChange(1);
        } else {
          setText(String(n));
        }
      }}
      className="w-20 rounded-lg border border-black/10 px-2 py-1.5 text-center text-sm outline-none focus:border-brand"
    />
  );
}

function ModeBtn({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
        active
          ? "bg-brand text-brand-text"
          : "text-neutral-600 hover:bg-neutral-100"
      }`}
    >
      {label}
    </button>
  );
}
