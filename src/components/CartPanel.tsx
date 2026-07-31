"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart";
import { formatCOP } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { DELIVERY_FEE } from "@/lib/delivery";

/** Celular colombiano: 10 dígitos que empiezan por 3. */
function isValidPhone(value: string): boolean {
  return /^3\d{9}$/.test(value);
}

/**
 * Contenido del carrito: productos elegidos y datos de entrega.
 *
 * Se usa en la página /carrito (celular) y dentro del panel lateral
 * (computador), para que la lógica del pedido viva en un solo sitio.
 */
export default function CartPanel({
  onSeguirComprando,
}: {
  /** Qué hacer al pulsar "Seguir comprando" con el carrito vacío. */
  onSeguirComprando?: () => void;
}) {
  const { items, totalPrice, setQuantity, removeItem, clear, ready } =
    useCart();
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (items.length === 0) {
      setError("Tu carrito está vacío.");
      return;
    }
    if (!name.trim() || !phone.trim() || !address.trim()) {
      setError("Completa nombre, celular y dirección.");
      return;
    }
    if (!isValidPhone(phone)) {
      setError(
        "El celular debe tener 10 dígitos y empezar por 3 (ejemplo: 3001234567)."
      );
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc("create_order", {
      p_customer_name: name,
      p_customer_phone: phone,
      p_customer_address: address,
      p_notes: notes,
      p_items: items.map((i) => ({ product_id: i.id, quantity: i.quantity })),
    });

    if (rpcError || !data || data.length === 0) {
      setSubmitting(false);
      setError(
        rpcError?.message ?? "No se pudo registrar el pedido. Intenta de nuevo."
      );
      return;
    }

    const orderId = data[0].order_id;
    clear();
    router.push(`/pedido/${orderId}`);
  }

  if (!ready) {
    return (
      <p className="py-16 text-center text-sm text-neutral-500">Cargando...</p>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-neutral-600">Tu carrito está vacío.</p>
        {onSeguirComprando ? (
          <button
            onClick={onSeguirComprando}
            className="mt-4 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Ver productos
          </button>
        ) : (
          <Link
            href="/"
            className="mt-4 inline-block rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Ver productos
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Productos elegidos */}
      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex gap-3 rounded-xl border border-black/5 bg-white p-3"
          >
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-black/5 bg-white">
              {item.image_url ? (
                <Image
                  src={item.image_url}
                  alt={item.name}
                  fill
                  sizes="64px"
                  className="object-contain p-1"
                />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{item.name}</p>
              <p className="text-xs text-neutral-500">
                {formatCOP(item.price)} · {item.unit}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <QtyButton
                  onClick={() => setQuantity(item.id, item.quantity - 1)}
                  label="−"
                />
                <span className="w-8 text-center text-sm font-semibold">
                  {item.quantity}
                </span>
                <QtyButton
                  onClick={() => setQuantity(item.id, item.quantity + 1)}
                  label="+"
                  disabled={item.quantity >= item.stock}
                />
                <button
                  onClick={() => removeItem(item.id)}
                  className="ml-2 text-xs text-red-600 hover:underline"
                >
                  Quitar
                </button>
              </div>
            </div>
            <div className="shrink-0 text-right text-sm font-bold">
              {formatCOP(item.price * item.quantity)}
            </div>
          </li>
        ))}
      </ul>

      {/* Datos de entrega */}
      <div className="rounded-xl border border-black/5 bg-white p-4">
        <h2 className="mb-3 text-lg font-bold">Datos de entrega</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Field
            label="Nombre completo *"
            value={name}
            onChange={setName}
            placeholder="Ej: María Gómez"
          />
          <Field
            label="Celular *"
            value={phone}
            // Solo dígitos y máximo 10: es la longitud de un celular en Colombia
            onChange={(v) => setPhone(v.replace(/\D/g, "").slice(0, 10))}
            placeholder="Ej: 3001234567"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            hint={
              phone.length > 0 && !isValidPhone(phone)
                ? "Debe tener 10 dígitos y empezar por 3."
                : undefined
            }
          />
          <Field
            label="Dirección *"
            value={address}
            onChange={setAddress}
            placeholder="Calle, número, barrio"
          />
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">
              Notas (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Indicaciones para la entrega"
              className="w-full resize-none rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

          <div className="space-y-1 border-t border-black/5 pt-3 text-sm">
            <div className="flex items-center justify-between text-neutral-500">
              <span>Productos</span>
              <span>{formatCOP(totalPrice)}</span>
            </div>
            <div className="flex items-center justify-between text-neutral-500">
              <span>Domicilio</span>
              <span>{formatCOP(DELIVERY_FEE)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-black/5 pt-2">
              <span className="font-medium">Total a pagar</span>
              <span className="text-lg font-bold">
                {formatCOP(totalPrice + DELIVERY_FEE)}
              </span>
            </div>
            <p className="pt-1 text-xs text-neutral-500">
              Pagas al recibir tu pedido, en efectivo o por transferencia.
            </p>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:bg-neutral-300"
          >
            {submitting ? "Enviando pedido..." : "Confirmar pedido"}
          </button>
        </form>
      </div>
    </div>
  );
}

function QtyButton({
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
      className="grid h-7 w-7 place-items-center rounded-md border border-black/10 text-sm font-bold text-neutral-700 hover:bg-neutral-50 disabled:opacity-30"
    >
      {label}
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
  maxLength,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: "numeric" | "text" | "tel";
  maxLength?: number;
  /** Aviso bajo el campo cuando lo escrito aún no es válido. */
  hint?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-neutral-600">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        maxLength={maxLength}
        className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 ${
          hint
            ? "border-amber-400 focus:border-amber-500 focus:ring-amber-500/20"
            : "border-black/10 focus:border-brand focus:ring-brand/20"
        }`}
      />
      {hint && <p className="mt-1 text-xs text-amber-700">{hint}</p>}
    </div>
  );
}
