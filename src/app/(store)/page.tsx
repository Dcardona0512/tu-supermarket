import Catalog from "@/components/Catalog";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function StorePage() {
  const supabase = await createClient();

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabase.from("categories").select("*").order("name", { ascending: true }),
  ]);

  return <Catalog products={products ?? []} categories={categories ?? []} />;
}
