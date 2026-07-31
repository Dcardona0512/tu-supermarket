import InventoryView from "@/components/InventoryView";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const supabase = await createClient();

  const [{ data: products }, { data: recent }] = await Promise.all([
    supabase.from("products").select("*").order("name", { ascending: true }),
    supabase
      .from("stock_entries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(15),
  ]);

  return <InventoryView products={products ?? []} recent={recent ?? []} />;
}
