import { notFound } from "next/navigation";
import { CartProvider } from "@/lib/cart";
import { StoreProvider } from "@/lib/store-context";
import { getStoreBySlug } from "@/lib/store";
import StoreShell from "@/components/StoreShell";

/**
 * Transitorio: mientras la raíz siga siendo el catálogo, sirve la tienda de
 * demostración. Cuando `/` pase a ser la portada de la plataforma, estas
 * páginas se mueven a `/[slug]` y el slug saldrá de la propia URL.
 */
const SLUG_POR_DEFECTO = "demo";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const store = await getStoreBySlug(SLUG_POR_DEFECTO);
  if (!store) notFound();

  return (
    <StoreProvider store={store}>
      <CartProvider slug={store.slug}>
        <StoreShell>{children}</StoreShell>
      </CartProvider>
    </StoreProvider>
  );
}
