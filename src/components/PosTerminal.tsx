"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatCOP } from "@/lib/format";
import { sonidoCaja } from "@/lib/sound";
import ScanButton from "@/components/ScanButton";
import { buildTree, categoryWithChildren } from "@/lib/categories";
import type { Category, Product } from "@/lib/database.types";

type TicketItem = {
  id: string;
  name: string;
  price: number;
  unit: string;
  stock: number;
  quantity: number;
};

type LastSale = {
  number: number;
  total: number;
  received: number | null;
  change: number | null;
};

const PAYMENTS = [
  { value: "efectivo", label: "Efectivo" },
  { value: "transferencia", label: "Transferencia" },
] as const;

/** Precio real de venta (aplica la oferta si existe). */
function sellPrice(p: Product) {
  return p.discount_price != null && p.discount_price < p.price
    ? Number(p.discount_price)
    : Number(p.price);
}

export default function PosTerminal({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
}) {
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<TicketItem[]>([]);
  const [search, setSearch] = useState("");
  // Categoría principal elegida y, dentro de ella, la subcategoría
  const [rootId, setRootId] = useState<string | "all">("all");
  const [subId, setSubId] = useState<string | null>(null);
  const [payment, setPayment] = useState<string>("efectivo");
  const [received, setReceived] = useState<string>("");
  const [customer, setCustomer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanMsg, setScanMsg] = useState<{ text: string; ok: boolean } | null>(
    null
  );
  const [lastSale, setLastSale] = useState<LastSale | null>(null);

  // La confirmación de escaneo se desvanece sola; los avisos de error se quedan
  useEffect(() => {
    if (!scanMsg?.ok) return;
    const timer = setTimeout(() => setScanMsg(null), 3000);
    return () => clearTimeout(timer);
  }, [scanMsg]);

  const tree = useMemo(() => buildTree(categories), [categories]);
  const subcategorias = useMemo(
    () => tree.find((n) => n.category.id === rootId)?.children ?? [],
    [tree, rootId]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    // Una categoría principal muestra también lo de sus subcategorías
    const permitidas =
      rootId === "all"
        ? null
        : subId
          ? new Set([subId])
          : categoryWithChildren(categories, rootId);

    return products.filter((p) => {
      const matchCat =
        !permitidas || (p.category_id != null && permitidas.has(p.category_id));
      const matchText =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.brand ?? "").toLowerCase().includes(q) ||
        (p.barcode ?? "").includes(q);
      return matchCat && matchText;
    });
  }, [products, categories, search, rootId, subId]);

  function elegirRoot(id: string | "all") {
    setRootId(id);
    setSubId(null);
  }

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const receivedNum = received === "" ? null : Number(received);
  const change =
    payment === "efectivo" && receivedNum != null ? receivedNum - total : null;

  function addProduct(p: Product) {
    setError(null);
    setLastSale(null);
    setItems((prev) => {
      const found = prev.find((i) => i.id === p.id);
      if (found) {
        if (found.quantity >= p.stock) return prev; // no vender más de lo que hay
        return prev.map((i) =>
          i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      if (p.stock <= 0) return prev;
      return [
        ...prev,
        {
          id: p.id,
          name: p.name,
          price: sellPrice(p),
          unit: p.unit,
          stock: p.stock,
          quantity: 1,
        },
      ];
    });
  }

  function setQty(id: string, qty: number) {
    setItems((prev) =>
      prev
        .map((i) =>
          i.id === id
            ? { ...i, quantity: Math.max(0, Math.min(qty, i.stock)) }
            : i
        )
        .filter((i) => i.quantity > 0)
    );
  }

  function clearTicket() {
    setItems([]);
    setReceived("");
    setCustomer("");
    setError(null);
  }

  /** Añade al ticket el producto cuyo código coincida exactamente. */
  function handleScannedCode(code: string) {
    const scanned = products.find((p) => p.barcode && p.barcode === code);

    if (!scanned) {
      setScanMsg({
        ok: false,
        text: `Código ${code} sin producto asignado. Asígnalo en Inventario → Códigos de barras.`,
      });
      return;
    }
    if (scanned.stock <= 0) {
      setScanMsg({ ok: false, text: `${scanned.name} está agotado.` });
      return;
    }

    addProduct(scanned);

    // Confirmación visible al volver de la cámara
    const yaEnTicket = items.find((i) => i.id === scanned.id)?.quantity ?? 0;
    setScanMsg({
      ok: true,
      text: `${scanned.name} agregado${
        yaEnTicket > 0 ? ` · ahora van ${yaEnTicket + 1}` : ""
      }`,
    });
  }

  /**
   * Enter agrega al ticket. La pistola lectora "teclea" el código y envía
   * Enter, así que primero se busca coincidencia exacta de código (en todo el
   * catálogo, sin importar el filtro) y, si no la hay, el primer resultado de
   * la búsqueda por texto.
   */
  function onSearchKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    const code = search.trim();
    if (!code) return;
    setScanMsg(null);

    const scanned = products.find((p) => p.barcode && p.barcode === code);
    if (scanned) {
      handleScannedCode(code);
      setSearch("");
      return;
    }

    const first = filtered.find((p) => p.stock > 0);
    if (first) {
      addProduct(first);
      setSearch("");
    } else if (/^\d{6,}$/.test(code)) {
      handleScannedCode(code);
      setSearch("");
    }
  }

  async function charge() {
    if (items.length === 0) {
      setError("Agrega productos a la venta.");
      return;
    }
    if (payment === "efectivo" && receivedNum != null && receivedNum < total) {
      setError("El efectivo recibido es menor que el total.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc("create_pos_sale", {
      p_items: items.map((i) => ({ product_id: i.id, quantity: i.quantity })),
      p_customer_name: customer.trim() || undefined,
      p_payment_method: payment,
      p_amount_received:
        payment === "efectivo" && receivedNum != null ? receivedNum : undefined,
    });

    setSubmitting(false);

    if (rpcError || !data || data.length === 0) {
      setError(rpcError?.message ?? "No se pudo registrar la venta.");
      return;
    }

    // Venta cerrada: entró la plata
    sonidoCaja();

    const sale = data[0];
    setLastSale({
      number: sale.order_number,
      total: Number(sale.total),
      received: payment === "efectivo" ? receivedNum : null,
      change: payment === "efectivo" && receivedNum != null ? receivedNum - Number(sale.total) : null,
    });
    clearTicket();
    router.refresh(); // refresca el stock disponible
    searchRef.current?.focus();
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold">Venta en tienda</h1>
        <p className="text-xs text-neutral-500">
          Cobro presencial. Descuenta el inventario y queda registrado en los
          informes.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        {/* Catálogo */}
        <section>
          <div className="flex gap-2">
            <input
              ref={searchRef}
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={onSearchKey}
              placeholder="Busca por nombre o dispara la pistola lectora"
              className="w-full rounded-lg border border-black/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            <ScanButton
              onDetected={handleScannedCode}
              title="Escanear producto"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-text transition hover:bg-brand-dark"
            />
          </div>

          {scanMsg && (
            <p
              className={`mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                scanMsg.ok
                  ? "bg-green-50 text-green-800"
                  : "bg-amber-50 text-amber-800"
              }`}
            >
              {scanMsg.ok && <CheckIcon />}
              {scanMsg.text}
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <Chip
              active={rootId === "all"}
              onClick={() => elegirRoot("all")}
              label="Todos"
            />
            {tree.map(({ category }) => (
              <Chip
                key={category.id}
                active={rootId === category.id}
                onClick={() => elegirRoot(category.id)}
                label={category.name}
              />
            ))}
          </div>

          {/* Subcategorías de la categoría elegida */}
          {subcategorias.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2 border-l-2 border-brand/30 pl-3">
              <SubChip
                active={subId === null}
                onClick={() => setSubId(null)}
                label="Todo"
              />
              {subcategorias.map((c) => (
                <SubChip
                  key={c.id}
                  active={subId === c.id}
                  onClick={() => setSubId(c.id)}
                  label={c.name}
                />
              ))}
            </div>
          )}

          {filtered.length === 0 ? (
            <p className="py-16 text-center text-sm text-neutral-400">
              Ningún producto coincide con la búsqueda.
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
              {filtered.map((p) => {
                const out = p.stock <= 0;
                const inTicket =
                  items.find((i) => i.id === p.id)?.quantity ?? 0;

                return (
                  <button
                    key={p.id}
                    onClick={() => addProduct(p)}
                    disabled={out || inTicket >= p.stock}
                    className="group relative flex items-center gap-2 rounded-xl border border-black/5 bg-white p-2 text-left transition hover:border-brand/40 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-black/5 bg-white">
                      {p.image_url && (
                        <Image
                          src={p.image_url}
                          alt={p.name}
                          fill
                          sizes="44px"
                          className="object-contain p-0.5"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-neutral-800">
                        {p.name}
                      </p>
                      <p className="text-sm font-bold text-neutral-900">
                        {formatCOP(sellPrice(p))}
                      </p>
                      <p
                        className={`text-[11px] ${
                          p.stock <= 5 ? "text-red-600" : "text-neutral-400"
                        }`}
                      >
                        {out ? "Agotado" : `${p.stock} disp.`}
                      </p>
                    </div>
                    {inTicket > 0 && (
                      <span className="absolute right-1.5 top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-xs font-bold text-brand-text">
                        {inTicket}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Ticket */}
        <aside className="h-fit rounded-xl border border-black/5 bg-white p-4 lg:sticky lg:top-20">
          {lastSale && (
            <div className="mb-4 rounded-lg bg-brand/5 p-3 text-sm">
              <p className="font-semibold text-brand-ink">
                Venta #{lastSale.number} registrada
              </p>
              <p className="text-neutral-600">
                Total {formatCOP(lastSale.total)}
              </p>
              {lastSale.change != null && (
                <p className="mt-1 text-base font-bold text-neutral-900">
                  Cambio: {formatCOP(lastSale.change)}
                </p>
              )}
            </div>
          )}

          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold">
              Ticket{" "}
              {items.length > 0 && (
                <span className="text-neutral-400">({items.length})</span>
              )}
            </h2>
            {items.length > 0 && (
              <button
                onClick={clearTicket}
                className="text-xs text-red-600 hover:underline"
              >
                Vaciar
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-400">
              Toca un producto para agregarlo.
            </p>
          ) : (
            <ul className="mb-3 max-h-64 space-y-2 overflow-y-auto">
              {items.map((i) => (
                <li key={i.id} className="flex items-center gap-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{i.name}</p>
                    <p className="text-xs text-neutral-400">
                      {formatCOP(i.price)} · {i.unit}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <QtyBtn onClick={() => setQty(i.id, i.quantity - 1)} label="−" />
                    <span className="w-6 text-center text-sm font-semibold">
                      {i.quantity}
                    </span>
                    <QtyBtn
                      onClick={() => setQty(i.id, i.quantity + 1)}
                      label="+"
                      disabled={i.quantity >= i.stock}
                    />
                  </div>
                  <span className="w-20 shrink-0 text-right font-semibold">
                    {formatCOP(i.price * i.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="border-t border-black/5 pt-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-neutral-500">Total</span>
              <span className="text-2xl font-bold">{formatCOP(total)}</span>
            </div>
          </div>

          {/* Pago */}
          <div className="mt-4 space-y-3">
            <div className="flex gap-1 rounded-lg bg-neutral-100 p-1">
              {PAYMENTS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setPayment(m.value)}
                  className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    payment === m.value
                      ? "bg-white text-neutral-900 shadow-sm"
                      : "text-neutral-500 hover:text-neutral-700"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {payment === "efectivo" && (
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-600">
                  Efectivo recibido
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={0}
                    value={received}
                    onChange={(e) => setReceived(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                  <button
                    type="button"
                    onClick={() => setReceived(String(total))}
                    disabled={total === 0}
                    className="shrink-0 rounded-lg border border-black/10 px-3 text-xs font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-40"
                  >
                    Exacto
                  </button>
                </div>
                {change != null && (
                  <p
                    className={`mt-1.5 text-sm font-semibold ${
                      change < 0 ? "text-red-600" : "text-neutral-900"
                    }`}
                  >
                    {change < 0
                      ? `Faltan ${formatCOP(Math.abs(change))}`
                      : `Cambio: ${formatCOP(change)}`}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-600">
                Cliente (opcional)
              </label>
              <input
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                placeholder="Nombre de quien compra"
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </p>
            )}

            <button
              onClick={charge}
              disabled={submitting || items.length === 0}
              className="w-full rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-brand-text transition hover:bg-brand-dark disabled:bg-neutral-300"
            >
              {submitting ? "Registrando..." : `Cobrar ${formatCOP(total)}`}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

/** Marca de "listo" para la confirmación de escaneo. */
function CheckIcon() {
  return (
    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-green-600 text-xs font-bold text-white">
      ✓
    </span>
  );
}

function Chip({
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
      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
        active
          ? "bg-brand text-brand-text"
          : "bg-white text-neutral-600 hover:bg-neutral-100"
      }`}
    >
      {label}
    </button>
  );
}

/** Las subcategorías van más discretas, para que se vea que dependen de la de arriba. */
function SubChip({
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
      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
        active
          ? "bg-brand/15 text-brand-ink"
          : "bg-white text-neutral-500 hover:bg-neutral-100"
      }`}
    >
      {label}
    </button>
  );
}

function QtyBtn({
  onClick,
  label,
  disabled,
}: {
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="grid h-6 w-6 place-items-center rounded border border-black/10 text-sm font-bold text-neutral-700 hover:bg-neutral-50 disabled:opacity-30"
    >
      {label}
    </button>
  );
}
