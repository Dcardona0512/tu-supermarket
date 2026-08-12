import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getStoreBySlug } from "@/lib/store";
import { SLUG_DEMO } from "@/lib/demo";
import { formatCOP } from "@/lib/format";
import { darken, readableText, inkOnWhite } from "@/lib/brand";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Así se ve el panel · TU SUPERMARKET",
  description:
    "Un recorrido por el panel con el que una tienda maneja su catálogo, sus pedidos y su caja.",
};

/**
 * Muestra del panel de administración, para que cualquiera lo conozca.
 *
 * Existe porque al panel de verdad no se entra sin cuenta, y con razón: es el
 * mismo que usan las tiendas de los clientes. Enseñarlo abriendo permisos —al
 * visitante o al rol público— obligaba a tocar `my_store_id()`, la bisagra de la
 * que cuelga todo el aislamiento entre tiendas. No valía el riesgo.
 *
 * Así que esto **no es el panel**: es una página que lo retrata. No tiene un solo
 * control que escriba, no abre sesión, no necesita permisos nuevos y no hay nada
 * que un visitante pueda estropear. Lo único real son los productos y las
 * categorías, que ya son públicos porque los muestra el escaparate; los pedidos y
 * los números son de ejemplo.
 *
 * Solo responde para la tienda de demostración. En cualquier otra da 404: el
 * panel de un cliente no se retrata.
 */

/** Pedidos de ejemplo. No se leen de la base: los pedidos no son públicos. */
const PEDIDOS = [
  {
    numero: 3,
    cliente: "María Gómez",
    telefono: "3012345678",
    total: 25200,
    estado: "pendiente" as const,
    cuando: "hace 10 minutos",
  },
  {
    numero: 2,
    cliente: "Ana Torres",
    telefono: "3205551234",
    total: 20700,
    estado: "cancelado" as const,
    cuando: "ayer",
  },
  {
    numero: 1,
    cliente: "Carlos Ramírez",
    telefono: "3109876543",
    total: 43600,
    estado: "entregado" as const,
    cuando: "ayer",
  },
];

const ESTILO_ESTADO: Record<string, string> = {
  pendiente: "bg-amber-50 text-amber-700",
  entregado: "bg-green-50 text-green-700",
  cancelado: "bg-red-50 text-red-700",
};

/** Las mismas secciones que tiene el panel de verdad, en el mismo orden. */
const SECCIONES = [
  "Resumen",
  "Venta en tienda",
  "Inventario",
  "Productos",
  "Pedidos",
  "Informes",
  "Personalizar tienda",
];

export default async function MuestraDelPanelPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (slug.toLowerCase() !== SLUG_DEMO) notFound();

  const store = await getStoreBySlug(slug);
  if (!store) notFound();

  // Catálogo real de la demo: es público, lo lee cualquiera desde el escaparate.
  const supabase = await createClient();
  const [{ data: productos }, { count: totalProductos }, { count: categorias }] =
    await Promise.all([
      supabase
        .from("products")
        .select("id, name, brand, price, stock, unit")
        .eq("store_id", store.id)
        .eq("is_active", true)
        .order("name")
        .limit(8),
      supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("store_id", store.id),
      supabase
        .from("categories")
        .select("*", { count: "exact", head: true })
        .eq("store_id", store.id),
    ]);

  const ventasDelMes = 1_284_500;
  const gananciaDelMes = 291_300;

  return (
    <div
      className="min-h-screen bg-neutral-100"
      style={
        {
          "--brand": store.brandColor,
          "--brand-dark": darken(store.brandColor),
          "--brand-text": readableText(store.brandColor),
          "--brand-ink": inkOnWhite(store.brandColor),
        } as React.CSSProperties
      }
    >
      {/* Aviso: que nadie crea que está dentro de un panel de verdad */}
      <div className="border-b border-amber-200 bg-amber-50">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-amber-900">
              Así se ve el panel de tu tienda
            </p>
            <p className="mt-0.5 text-xs text-amber-800">
              Esta es una muestra para que lo conozcas. En el panel de verdad todo
              lo que ves aquí se crea, se edita y se borra desde el navegador o
              desde el celular.
            </p>
          </div>
          <Link
            href={`/${store.slug}`}
            className="shrink-0 rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-900 transition hover:bg-amber-100"
          >
            Volver a la tienda
          </Link>
        </div>
      </div>

      <div className="mx-auto flex max-w-5xl gap-4 px-4 py-6">
        {/* Retrato del menú lateral */}
        <aside className="hidden w-48 shrink-0 self-start rounded-xl border border-black/5 bg-white p-2 lg:block">
          <div className="flex items-center gap-2 border-b border-black/5 px-2 pb-3">
            <span
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-sm font-black"
              style={{
                backgroundColor: store.brandColor,
                color: readableText(store.brandColor),
              }}
            >
              {store.initials}
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-sm font-bold">
                {store.name}
              </span>
              <span className="block truncate text-xs text-neutral-500">
                TU SUPERMARKET
              </span>
            </span>
          </div>
          <ul className="mt-2 space-y-1">
            {SECCIONES.map((s, i) => (
              <li
                key={s}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  i === 0 ? "bg-brand/10 text-brand-ink" : "text-neutral-600"
                }`}
              >
                {s}
              </li>
            ))}
          </ul>
        </aside>

        <main className="min-w-0 flex-1 space-y-5">
          <div>
            <h1 className="text-xl font-bold">Resumen</h1>
            <p className="text-xs text-neutral-500">
              Lo primero que ve el tendero al entrar.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Tarjeta label="Productos" valor={String(totalProductos ?? 0)} />
            <Tarjeta label="Pedidos pendientes" valor="1" acento />
            <Tarjeta label="Ventas del mes" valor={formatCOP(ventasDelMes)} />
            <Tarjeta label="Ganancia del mes" valor={formatCOP(gananciaDelMes)} />
          </div>

          {/* Pedidos */}
          <section className="rounded-xl border border-black/5 bg-white p-5">
            <h2 className="text-sm font-bold">Pedidos</h2>
            <p className="mt-1 text-xs text-neutral-500">
              Cada pedido de la tienda en línea llega aquí con el nombre, el
              teléfono y la dirección del cliente. El tendero lo marca como
              entregado cuando lo despacha.
            </p>
            <ul className="mt-3 divide-y divide-black/5">
              {PEDIDOS.map((p) => (
                <li
                  key={p.numero}
                  className="flex flex-wrap items-center gap-2 py-2.5 text-sm"
                >
                  <span className="font-mono text-xs text-neutral-400">
                    #{p.numero}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {p.cliente}
                    </span>
                    <span className="block truncate text-xs text-neutral-500">
                      {p.telefono} · {p.cuando}
                    </span>
                  </span>
                  <span className="shrink-0 font-semibold">
                    {formatCOP(p.total)}
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      ESTILO_ESTADO[p.estado]
                    }`}
                  >
                    {p.estado}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Productos: estos sí son los de verdad */}
          <section className="rounded-xl border border-black/5 bg-white p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-sm font-bold">Productos</h2>
              <span className="text-xs text-neutral-500">
                {totalProductos ?? 0} productos en {categorias ?? 0} categorías
              </span>
            </div>
            <p className="mt-1 text-xs text-neutral-500">
              Con foto, precio, oferta, existencias, fecha de vencimiento y código
              de barras. Se puede buscar, filtrar y esconder lo que no esté a la
              venta.
            </p>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-md text-left text-sm">
                <thead>
                  <tr className="border-b border-black/5 text-xs text-neutral-500">
                    <th className="pb-2 pr-3 font-medium">Producto</th>
                    <th className="pb-2 pr-3 font-medium">Precio</th>
                    <th className="pb-2 font-medium">Existencias</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {(productos ?? []).map((p) => (
                    <tr key={p.id}>
                      <td className="py-2 pr-3">
                        <span className="block truncate font-medium">
                          {p.name}
                        </span>
                        {p.brand && (
                          <span className="block truncate text-xs text-neutral-500">
                            {p.brand}
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap">
                        {formatCOP(Number(p.price))}
                      </td>
                      <td className="py-2 whitespace-nowrap">
                        {p.stock > 0 ? (
                          <span className="text-neutral-700">
                            {p.stock} {p.unit}
                          </span>
                        ) : (
                          <span className="text-red-600">agotado</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {(totalProductos ?? 0) > (productos?.length ?? 0) && (
              <p className="mt-3 text-xs text-neutral-400">
                Y {(totalProductos ?? 0) - (productos?.length ?? 0)} más.
              </p>
            )}
          </section>

          {/* Lo que no se retrata en detalle, dicho en una línea cada uno */}
          <section className="rounded-xl border border-black/5 bg-white p-5">
            <h2 className="text-sm font-bold">Y además</h2>
            <ul className="mt-3 space-y-3 text-sm">
              <Punto titulo="Venta en tienda">
                Un punto de venta para cobrar en el mostrador, con lector de
                código de barras y vuelto calculado. Descuenta del inventario en
                el momento.
              </Punto>
              <Punto titulo="Inventario">
                Entradas de mercancía con su fecha de vencimiento, y avisos de lo
                que se está acabando o está por vencer.
              </Punto>
              <Punto titulo="Informes y cierre de caja">
                Ventas por día, semana o mes, con ganancia y margen. Y el cierre
                del día con el efectivo que debería haber en caja, para cuadrar.
                Se descarga en PDF.
              </Punto>
              <Punto titulo="Personalizar tienda">
                El nombre, el logo y el color con el que ven la tienda los
                clientes, con vista previa mientras se elige.
              </Punto>
            </ul>
          </section>

          <section className="rounded-xl border border-black/5 bg-white p-5 text-center">
            <p className="text-sm font-bold">¿Quieres uno así para tu tienda?</p>
            <p className="mt-1 text-xs text-neutral-500">
              Cada tienda tiene su propio panel, su propio enlace y su propia
              marca. Nadie ve los datos de nadie.
            </p>
            <Link
              href="/login"
              className="mt-4 inline-block rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-text transition hover:bg-brand-dark"
            >
              Ya tengo cuenta, quiero entrar
            </Link>
          </section>
        </main>
      </div>
    </div>
  );
}

function Tarjeta({
  label,
  valor,
  acento = false,
}: {
  label: string;
  valor: string;
  acento?: boolean;
}) {
  return (
    <div className="rounded-xl border border-black/5 bg-white p-4">
      <p className="text-xs text-neutral-500">{label}</p>
      <p
        className={`mt-1 text-xl font-bold ${
          acento ? "text-brand-ink" : "text-neutral-900"
        }`}
      >
        {valor}
      </p>
    </div>
  );
}

function Punto({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <p className="font-semibold">{titulo}</p>
      <p className="text-xs text-neutral-600">{children}</p>
    </li>
  );
}
