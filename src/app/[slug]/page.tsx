import { notFound } from "next/navigation";
import Catalog from "@/components/Catalog";
import { createClient } from "@/lib/supabase/server";
import { getStoreBySlug } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function StorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  if (!store) notFound();

  const supabase = await createClient();

  // El filtro por tienda es explícito porque quien mira el catálogo es
  // anónimo: la base no puede deducir de qué negocio se trata.
  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select("*")
      .eq("store_id", store.id)
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabase
      .from("categories")
      .select("*")
      .eq("store_id", store.id)
      .order("name", { ascending: true }),
  ]);

  return <Catalog products={products ?? []} categories={categories ?? []} />;
}
