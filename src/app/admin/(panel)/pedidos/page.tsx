import OrdersManager, {
  type OrderWithItems,
} from "@/components/OrdersManager";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const supabase = await createClient();

  const [{ data: orders }, { data: products }] = await Promise.all([
    supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false }),
    supabase.from("products").select("id, barcode"),
  ]);

  // Mapa producto -> código, para verificar el pedido con el lector
  const barcodes = Object.fromEntries(
    (products ?? []).map((p) => [p.id, p.barcode])
  );

  return (
    <OrdersManager
      orders={(orders ?? []) as unknown as OrderWithItems[]}
      barcodes={barcodes}
    />
  );
}
