"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatCOP, formatDate } from "@/lib/format";
import { updateOrderStatus } from "@/app/admin/(panel)/pedidos/actions";
import OrderPicking from "@/components/OrderPicking";
import { sonidoCaja } from "@/lib/sound";
import type {
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
} from "@/lib/database.types";

export type OrderWithItems = Order & { order_items: OrderItem[] };

const STATUSES: { value: OrderStatus | "todos"; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "pendiente", label: "Pendientes" },
  { value: "entregado", label: "Entregados" },
  { value: "cancelado", label: "Cancelados" },
];

const STATUS_STYLES: Record<string, string> = {
  pendiente: "bg-amber-50 text-amber-700",
  entregado: "bg-green-50 text-green-700",
  cancelado: "bg-neutral-100 text-neutral-500",
};

/** Estados de los que un pedido ya no sale (lo garantiza un trigger en la base). */
const FINALES: OrderStatus[] = ["entregado", "cancelado"];

const CHANNELS: { value: "todos" | "linea" | "tienda"; label: string }[] = [
  { value: "todos", label: "Todos los orígenes" },
  { value: "linea", label: "Pedidos en línea" },
  { value: "tienda", label: "Ventas en tienda" },
];

/** Las ventas presenciales no tienen datos de entrega. */
function isStore(order: OrderWithItems) {
  return (order.channel ?? "linea") === "tienda";
}

export default function OrdersManager({
  orders,
  barcodes = {},
}: {
  orders: OrderWithItems[];
  /** product_id -> código de barras, para verificar el pedido con el lector */
  barcodes?: Record<string, string | null>;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<OrderStatus | "todos">("todos");
  const [channel, setChannel] = useState<"todos" | "linea" | "tienda">("todos");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [picking, setPicking] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  // Pedido al que le estamos preguntando cómo pagó antes de darlo por entregado
  const [cobrando, setCobrando] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      orders.filter(
        (o) =>
          (filter === "todos" || o.status === filter) &&
          (channel === "todos" || (o.channel ?? "linea") === channel)
      ),
    [orders, filter, channel]
  );

  async function changeStatus(
    orderId: string,
    status: OrderStatus,
    paymentMethod?: PaymentMethod
  ) {
    setUpdating(orderId);
    const res = await updateOrderStatus(orderId, status, paymentMethod);
    setUpdating(null);
    if (!res.ok) {
      alert(res.error);
      return;
    }
    setCobrando(null);
    // Pedido entregado: entró la plata
    if (status === "entregado") sonidoCaja();
    router.refresh();
  }

  return (
    <div>
      <h1 className="mb-5 text-xl font-bold">Pedidos y ventas</h1>

      <div className="mb-3 flex flex-wrap gap-2">
        {CHANNELS.map((c) => (
          <button
            key={c.value}
            onClick={() => setChannel(c.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              channel === c.value
                ? "bg-neutral-800 text-white"
                : "bg-white text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => setFilter(s.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              filter === s.value
                ? "bg-brand text-brand-text"
                : "bg-white text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-sm text-neutral-400">
          No hay pedidos en esta categoría.
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => {
            const isOpen = expanded === o.id;
            return (
              <div
                key={o.id}
                className="overflow-hidden rounded-xl border border-black/5 bg-white"
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : o.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-neutral-50"
                >
                  <div className="flex-1">
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      #{o.order_number} ·{" "}
                      {o.customer_name || "Venta en tienda"}
                      {isStore(o) && (
                        <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[11px] font-medium text-neutral-500">
                          Tienda
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {formatDate(o.created_at)} · {o.order_items.length}{" "}
                      producto(s)
                    </p>
                  </div>
                  <span className="text-sm font-bold">
                    {formatCOP(o.total)}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      STATUS_STYLES[o.status] ?? ""
                    }`}
                  >
                    {o.status}
                  </span>
                  <span className="text-neutral-300">{isOpen ? "▲" : "▼"}</span>
                </button>

                {isOpen && (
                  <div className="border-t border-black/5 bg-neutral-50/50 px-4 py-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <h3 className="mb-1 text-xs font-bold uppercase text-neutral-400">
                          {isStore(o) ? "Venta presencial" : "Cliente"}
                        </h3>

                        {isStore(o) ? (
                          <>
                            {o.customer_name && (
                              <p className="text-sm">{o.customer_name}</p>
                            )}
                            <p className="text-sm capitalize text-neutral-600">
                              Pago: {o.payment_method}
                            </p>
                            {o.amount_received != null && (
                              <p className="text-sm text-neutral-500">
                                Recibido {formatCOP(Number(o.amount_received))}
                                {" · "}
                                cambio{" "}
                                {formatCOP(
                                  Number(o.amount_received) - Number(o.total)
                                )}
                              </p>
                            )}
                          </>
                        ) : (
                          <>
                            <p className="text-sm">{o.customer_name}</p>
                            {o.customer_phone && (
                              <p className="text-sm">
                                <a
                                  href={`tel:${o.customer_phone}`}
                                  className="text-brand-ink hover:underline"
                                >
                                  {o.customer_phone}
                                </a>
                              </p>
                            )}
                            <p className="text-sm text-neutral-600">
                              {o.customer_address}
                            </p>
                            <p className="text-sm text-neutral-500">
                              Pago:{" "}
                              {o.payment_method === "efectivo" ||
                              o.payment_method === "transferencia" ? (
                                <span className="capitalize text-neutral-700">
                                  {o.payment_method}
                                </span>
                              ) : (
                                "se registra al entregar"
                              )}
                            </p>
                          </>
                        )}

                        {o.notes && (
                          <p className="mt-1 text-sm text-neutral-500">
                            Nota: {o.notes}
                          </p>
                        )}
                      </div>

                      <div>
                        <h3 className="mb-1 text-xs font-bold uppercase text-neutral-400">
                          Productos
                        </h3>
                        <ul className="space-y-1">
                          {o.order_items.map((it) => (
                            <li
                              key={it.id}
                              className="flex justify-between text-sm"
                            >
                              <span>
                                {it.quantity} × {it.product_name}
                              </span>
                              <span className="font-medium">
                                {formatCOP(it.subtotal)}
                              </span>
                            </li>
                          ))}
                        </ul>
                        {Number(o.delivery_fee) > 0 && (
                          <div className="mt-2 flex justify-between border-t border-black/5 pt-2 text-sm text-neutral-500">
                            <span>Domicilio</span>
                            <span>{formatCOP(Number(o.delivery_fee))}</span>
                          </div>
                        )}
                        <div className="mt-2 flex justify-between border-t border-black/5 pt-2 text-sm font-bold">
                          <span>Total</span>
                          <span>{formatCOP(o.total)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Alistamiento: verificar con lector antes de despachar */}
                    {!isStore(o) && o.status !== "cancelado" && (
                      <div className="mt-4">
                        <button
                          onClick={() =>
                            setPicking(picking === o.id ? null : o.id)
                          }
                          className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                        >
                          {picking === o.id
                            ? "Cerrar verificación"
                            : "Verificar productos con el lector"}
                        </button>

                        {picking === o.id && (
                          <OrderPicking
                            items={o.order_items}
                            barcodes={barcodes}
                          />
                        )}
                      </div>
                    )}

                    {/* Entregado y cancelado son finales: el primero ya se cobró
                        y entró al cierre de caja, el segundo ya devolvió las
                        unidades al inventario. Sin botones no hay nada que
                        explicar: la etiqueta del pedido ya dice en qué estado
                        está. */}
                    {!FINALES.includes(o.status as OrderStatus) && (
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-neutral-500">
                          Cambiar estado:
                        </span>
                        {(
                          [
                            "pendiente",
                            "entregado",
                            "cancelado",
                          ] as OrderStatus[]
                        ).map((st) => (
                          <button
                            key={st}
                            disabled={updating === o.id || o.status === st}
                            onClick={() =>
                              // Antes de entregar hay que registrar cómo pagó
                              st === "entregado"
                                ? setCobrando(cobrando === o.id ? null : o.id)
                                : changeStatus(o.id, st)
                            }
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-40 ${
                              o.status === st
                                ? "bg-brand text-brand-text"
                                : "border border-black/10 text-neutral-700 hover:bg-white"
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Quien entrega confirma el pago real, no el que dijo el cliente */}
                    {cobrando === o.id && (
                      <div className="mt-3 rounded-xl border border-brand/30 bg-white p-3">
                        <p className="mb-2 text-xs font-semibold text-neutral-700">
                          ¿Cómo pagó el cliente los{" "}
                          {formatCOP(Number(o.total))}?
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {(
                            [
                              { value: "efectivo", label: "Efectivo" },
                              {
                                value: "transferencia",
                                label: "Transferencia",
                              },
                            ] as { value: PaymentMethod; label: string }[]
                          ).map((m) => (
                            <button
                              key={m.value}
                              disabled={updating === o.id}
                              onClick={() =>
                                changeStatus(o.id, "entregado", m.value)
                              }
                              className="rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-brand-text transition hover:bg-brand-dark disabled:opacity-50"
                            >
                              {m.label}
                            </button>
                          ))}
                          <button
                            onClick={() => setCobrando(null)}
                            className="rounded-lg px-3 py-2 text-xs font-medium text-neutral-500 hover:text-neutral-800"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

