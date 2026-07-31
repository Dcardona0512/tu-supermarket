import ReportsView from "@/components/ReportsView";
import { createClient } from "@/lib/supabase/server";
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
  const supabase = await createClient();

  const [{ data: report }, { data: closing }] = await Promise.all([
    supabase.rpc("sales_report", { p_granularity: "day" }),
    supabase.rpc("cash_closing", {}),
  ]);

  return (
    <ReportsView
      report={(report as unknown as SalesReport | null) ?? EMPTY}
      closing={(closing as unknown as CashClosing | null) ?? null}
    />
  );
}
