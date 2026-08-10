"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { formatCOP } from "@/lib/format";
import { sonidoPedidoNuevo } from "@/lib/sound";

type Aviso = {
  id: string;
  numero: number;
  cliente: string;
  total: number;
};

/**
 * Aviso en pantalla cuando entra un pedido de la tienda en línea.
 *
 * Escucha la base de datos en vivo, así que aparece sin recargar la página.
 * No se cierra solo: hay que descartarlo para no perder ninguna orden.
 *
 * El canal y el filtro llevan la tienda: con un canal compartido, a cada dueño
 * le sonaría la campana con los pedidos de los demás y vería el nombre de un
 * cliente que no es suyo.
 */
export default function NewOrderAlert({ storeId }: { storeId: string }) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let canal: RealtimeChannel | null = null;
    let activo = true;

    async function escuchar() {
      // La sesión del administrador vive en las cookies. Hay que entregarle
      // ese token a la conexión en vivo, porque los pedidos solo son visibles
      // para usuarios autenticados: sin él la base no envía ningún aviso.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!activo || !session) return;

      await supabase.realtime.setAuth(session.access_token);

      canal = supabase
        .channel(`pedidos-nuevos:${storeId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "orders",
            filter: `store_id=eq.${storeId}`,
          },
          (payload) => {
            const o = payload.new as {
              id: string;
              order_number: number;
              customer_name: string | null;
              total: number;
              channel: string;
            };

            // Realtime admite un solo filtro y lo gasta la tienda, así que el
            // origen se comprueba aquí: una venta de mostrador la acaba de
            // hacer el propio cajero y no tiene sentido avisarle.
            if (o.channel !== "linea") return;

            setAvisos((prev) =>
              prev.some((a) => a.id === o.id)
                ? prev
                : [
                    ...prev,
                    {
                      id: o.id,
                      numero: o.order_number,
                      cliente: o.customer_name ?? "Cliente",
                      total: Number(o.total),
                    },
                  ]
            );

            sonidoPedidoNuevo();
            navigator.vibrate?.([120, 60, 120]);
            // Refresca contadores y listados del panel
            router.refresh();

            // El pedido se guarda y enseguida se le suman los productos y el
            // domicilio, así que el aviso llega con el total todavía en cero.
            // Lo consultamos para mostrar el valor real.
            void (async () => {
              for (let i = 0; i < 6; i++) {
                const { data } = await supabase
                  .from("orders")
                  .select("total")
                  .eq("id", o.id)
                  .maybeSingle();

                const total = Number(data?.total ?? 0);
                if (total > 0) {
                  setAvisos((prev) =>
                    prev.map((a) => (a.id === o.id ? { ...a, total } : a))
                  );
                  return;
                }
                await new Promise((r) => setTimeout(r, 400));
              }
            })();
          }
        )
        .subscribe();
    }

    void escuchar();

    // Si la sesión se renueva, el socket necesita el token nuevo
    const { data: auth } = supabase.auth.onAuthStateChange((_evento, sesion) => {
      if (sesion) void supabase.realtime.setAuth(sesion.access_token);
    });

    return () => {
      activo = false;
      auth.subscription.unsubscribe();
      if (canal) supabase.removeChannel(canal);
    };
  }, [router, storeId]);

  if (avisos.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
      {avisos.map((a) => (
        <div
          key={a.id}
          role="alert"
          className="rounded-xl border border-brand/30 bg-white p-4 shadow-xl"
        >
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand/10 text-brand-dark">
              <BellIcon />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-neutral-900">
                ¡Nuevo pedido en línea!
              </p>
              <p className="truncate text-sm text-neutral-600">
                #{a.numero} · {a.cliente}
              </p>
              <p className="text-sm font-semibold text-neutral-900">
                {formatCOP(a.total)}
              </p>
            </div>
            <button
              onClick={() =>
                setAvisos((prev) => prev.filter((x) => x.id !== a.id))
              }
              aria-label="Descartar"
              className="shrink-0 text-neutral-400 hover:text-neutral-700"
            >
              ✕
            </button>
          </div>

          <Link
            href="/admin/pedidos"
            onClick={() => setAvisos((prev) => prev.filter((x) => x.id !== a.id))}
            className="mt-3 block rounded-lg bg-brand px-4 py-2 text-center text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Tomar la orden
          </Link>
        </div>
      ))}
    </div>
  );
}

function BellIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  );
}
