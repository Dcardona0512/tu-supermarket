import PosTerminal from "@/components/PosTerminal";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PosPage() {
  const supabase = await createClient();

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase.from("products").select("*").order("name", { ascending: true }),
    supabase.from("categories").select("*").order("name", { ascending: true }),
  ]);

  return (
    <PosTerminal products={products ?? []} categories={categories ?? []} />
  );
}
