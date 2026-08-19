"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ScanButton from "@/components/ScanButton";
import { useLectorDeCodigos } from "@/lib/lector";
import type { OrderItem } from "@/lib/database.types";

/**
 * Verificación por lector al alistar un pedido: se escanea cada producto y se
 * va marcando hasta completar las cantidades. Es una ayuda de empaque, no
 * modifica el pedido ni el inventario.
 */
export default function OrderPicking({
  items,
  barcodes,
}: {
  items: OrderItem[];
  /** product_id -> código de barras */
  barcodes: Record<string, string | null>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState("");
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // La confirmación de escaneo se desvanece sola; los avisos de error se quedan
  useEffect(() => {
    if (!msg?.ok) return;
    const timer = setTimeout(() => setMsg(null), 3000);
    return () => clearTimeout(timer);
  }, [msg]);

  const done = useMemo(
    () => items.every((i) => (counts[i.id] ?? 0) >= i.quantity),
    [items, counts]
  );

  function bump(itemId: string, delta: number, max: number) {
    setCounts((prev) => {
      const next = Math.max(0, Math.min((prev[itemId] ?? 0) + delta, max));
      return { ...prev, [itemId]: next };
    });
  }

  // Alistando un pedido se van tocando casillas, asi que el foco se pierde
  // constantemente; el disparo tiene que valer igual.
  useLectorDeCodigos((codigo) => handleScannedCode(codigo));

  /** Marca el ítem del pedido cuyo producto tiene ese código. */
  function handleScannedCode(value: string) {
    const match = items.find(
      (i) => i.product_id && barcodes[i.product_id] === value
    );

    if (!match) {
      setMsg({
        ok: false,
        text: `El código ${value} no corresponde a este pedido.`,
      });
      return;
    }
    if ((counts[match.id] ?? 0) >= match.quantity) {
      setMsg({ ok: false, text: `${match.product_name} ya está completo.` });
      return;
    }

    const verificados = (counts[match.id] ?? 0) + 1;
    bump(match.id, 1, match.quantity);

    // Confirmación visible al volver de la cámara
    setMsg({
      ok: true,
      text: `${match.product_name} · ${verificados} de ${match.quantity}`,
    });
  }

  function onScan(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    const value = code.trim();
    if (!value) return;
    setCode("");
    handleScannedCode(value);
  }

  const sinCodigo = items.filter(
    (i) => !i.product_id || !barcodes[i.product_id]
  ).length;

  return (
    <div className="mt-3 rounded-lg border border-black/10 bg-white p-3">
      <div className="flex gap-2">
        <input
          ref={inputRef}
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={onScan}
          placeholder="Dispara la pistola sobre cada producto, sin tocar nada"
          className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        <ScanButton
          onDetected={handleScannedCode}
          title="Verificar producto"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
        />
      </div>

      {msg && (
        <p
          className={`mt-2 flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium ${
            msg.ok ? "bg-green-50 text-green-800" : "bg-amber-50 text-amber-800"
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

      <ul className="mt-3 space-y-1.5">
        {items.map((i) => {
          const got = counts[i.id] ?? 0;
          const complete = got >= i.quantity;
          const hasCode = i.product_id && barcodes[i.product_id];

          return (
            <li
              key={i.id}
              className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${
                complete ? "bg-green-50" : "bg-neutral-50"
              }`}
            >
              <span
                className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-xs font-bold ${
                  complete
                    ? "bg-green-600 text-white"
                    : "border border-neutral-300 text-neutral-400"
                }`}
              >
                {complete ? "✓" : ""}
              </span>
              <span className="min-w-0 flex-1 truncate">
                {i.product_name}
                {!hasCode && (
                  <span className="ml-1.5 text-xs text-neutral-400">
                    (sin código)
                  </span>
                )}
              </span>
              <span className="shrink-0 text-xs font-medium text-neutral-500">
                {got}/{i.quantity}
              </span>
              <button
                onClick={() => bump(i.id, 1, i.quantity)}
                disabled={complete}
                className="shrink-0 rounded border border-black/10 px-1.5 text-xs text-neutral-600 hover:bg-white disabled:opacity-30"
                title="Marcar a mano"
              >
                +
              </button>
              <button
                onClick={() => bump(i.id, -1, i.quantity)}
                disabled={got === 0}
                className="shrink-0 rounded border border-black/10 px-1.5 text-xs text-neutral-600 hover:bg-white disabled:opacity-30"
              >
                −
              </button>
            </li>
          );
        })}
      </ul>

      {sinCodigo > 0 && (
        <p className="mt-2 text-xs text-neutral-400">
          {sinCodigo} producto(s) sin código de barras: márcalos con el botón +.
        </p>
      )}

      {done && (
        <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm font-semibold text-green-800">
          Pedido completo. Ya puedes marcarlo como entregado.
        </p>
      )}
    </div>
  );
}
