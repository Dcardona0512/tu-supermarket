import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCOP, formatDate } from "@/lib/format";
import {
  EXPIRY_ALERT_DAYS,
  EXPIRY_STYLES,
  expiryCutoff,
  expiryStatus,
} from "@/lib/expiry";
import type { SalesReport } from "@/lib/database.types";

export const dynamic = "force-dynamic";

/** Inicio del mes actual, para los indicadores del resumen. */
function startOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    { count: productCount },
    { count: pendingCount },
    { data: orders },
    { data: lowStock },
    { data: monthReport },
    { data: expiring },
  ] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "pendiente"),
    supabase
      .from("orders")
      .select("id, order_number, customer_name, total, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("products")
      .select("id, name, stock")
      .lte("stock", 5)
      .eq("is_active", true)
      .order("stock", { ascending: true })
      .limit(5),
    supabase.rpc("sales_report", {
      p_granularity: "month",
      p_from: startOfMonth(),
    }),
    // Productos vencidos o que vencen dentro de los próximos días
    supabase
      .from("products")
      .select("id, name, expires_at")
      .not("expires_at", "is", null)
      .lte("expires_at", expiryCutoff())
      .eq("is_active", true)
      .order("expires_at", { ascending: true })
      .limit(5),
  ]);

  const month = (monthReport as unknown as SalesReport | null)?.totals;
  const monthRevenue = Number(month?.revenue ?? 0);
  const monthProfit = Number(month?.profit ?? 0);
  const monthMargin =
    monthRevenue > 0 ? Math.round((monthProfit / monthRevenue) * 100) : 0;

  return (
    <div>
      <h1 className="mb-5 text-xl font-bold">Resumen</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Productos" value={String(productCount ?? 0)} />
        <StatCard
          label="Pedidos pendientes"
          value={String(pendingCount ?? 0)}
          accent
        />
        <StatCard
          label="Ventas del mes"
          value={formatCOP(monthRevenue)}
          note={`${month?.orders ?? 0} pedidos`}
        />
        <StatCard
          label="Ganancia del mes"
          value={formatCOP(monthProfit)}
          note={`${monthMargin}% de margen`}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-black/5 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold">Pedidos recientes</h2>
            <Link
              href="/admin/pedidos"
              className="text-xs text-brand-ink hover:underline"
            >
              Ver todos
            </Link>
          </div>
          {orders && orders.length > 0 ? (
            <ul className="divide-y divide-black/5">
              {orders.map((o) => (
                <li key={o.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">
                      #{o.order_number} · {o.customer_name}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {formatDate(o.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {formatCOP(o.total)}
                    </p>
                    <StatusBadge status={o.status} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-neutral-400">
              Aún no hay pedidos.
            </p>
          )}
        </section>

        <div className="space-y-4">
          <section className="rounded-xl border border-black/5 bg-white p-4">
            <h2 className="mb-3 text-sm font-bold">Stock bajo (≤ 5)</h2>
            {lowStock && lowStock.length > 0 ? (
              <ul className="divide-y divide-black/5">
                {lowStock.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between py-2"
                  >
                    <span className="text-sm">{p.name}</span>
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
                      {p.stock} disp.
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-sm text-neutral-400">
                Todo con buen stock.
              </p>
            )}
          </section>

          <section className="rounded-xl border border-black/5 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold">
                Próximos a vencer ({EXPIRY_ALERT_DAYS} días)
              </h2>
              <Link
                href="/admin/productos"
                className="text-xs text-brand-ink hover:underline"
              >
                Ver productos
              </Link>
            </div>
            {expiring && expiring.length > 0 ? (
              <ul className="divide-y divide-black/5">
                {expiring.map((p) => {
                  const { label, tone } = expiryStatus(p.expires_at!);
                  return (
                    <li
                      key={p.id}
                      className="flex items-center justify-between gap-3 py-2"
                    >
                      <span className="truncate text-sm">{p.name}</span>
                      <span
                        className={`shrink-0 text-xs ${EXPIRY_STYLES[tone]}`}
                      >
                        {label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="py-6 text-center text-sm text-neutral-400">
                Ninguno vence pronto.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function StatCard({
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

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pendiente: "bg-amber-50 text-amber-700",
    entregado: "bg-green-50 text-green-700",
    cancelado: "bg-neutral-100 text-neutral-500",
  };
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
        map[status] ?? "bg-neutral-100 text-neutral-600"
      }`}
    >
      {status}
    </span>
  );
}
