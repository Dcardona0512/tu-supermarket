import ReportsView from "@/components/ReportsView";
import { requireStore } from "@/lib/store";
import type { CashClosing, SalesReport } from "@/lib/database.types";

export const dynamic = "force-dynamic";

const EMPTY: SalesReport = {
  granularity: "day",
  from: "",
  to: "",
  series: [],
  totals: {
    revenue: 0,
    cost: 0,
    profit: 0,
    orders: 0,
    units: 0,
    delivery: 0,
    avg_ticket: 0,
  },
  by_channel: {},
  top_products: [],
};

export default async function ReportsPage() {
  // El nombre de la tienda encabeza el comprobante impreso del cierre de caja:
  // ese papel lo firma el negocio, no la plataforma.
  const { supabase, store } = await requireStore();

  const [{ data: report }, { data: closing }] = await Promise.all([
    supabase.rpc("sales_report", { p_granularity: "day" }),
    supabase.rpc("cash_closing", {}),
  ]);

  return (
    <ReportsView
      report={(report as unknown as SalesReport | null) ?? EMPTY}
      closing={(closing as unknown as CashClosing | null) ?? null}
      storeName={store.name}
    />
  );
}
