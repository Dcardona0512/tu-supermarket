import ProductsManager from "@/components/ProductsManager";
import { requireStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  // Las políticas ya limitan lo que devuelve cada consulta a la tienda del
  // dueño; la tienda se necesita aquí para saber en qué carpeta del bucket
  // guardar las fotos que se suban.
  const { supabase, store } = await requireStore();

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("categories").select("*").order("name", { ascending: true }),
  ]);

  return (
    <ProductsManager
      products={products ?? []}
      categories={categories ?? []}
      storeId={store.id}
    />
  );
}
