import { notFound } from "next/navigation";
import Catalog from "@/components/Catalog";
import { createClient } from "@/lib/supabase/server";
import { getStoreBySlug } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Mismo valor transitorio que el layout: ver el comentario de allí. */
const SLUG_POR_DEFECTO = "demo";

export default async function StorePage() {
  const store = await getStoreBySlug(SLUG_POR_DEFECTO);
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
