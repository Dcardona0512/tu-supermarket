import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CartProvider } from "@/lib/cart";
import { StoreProvider } from "@/lib/store-context";
import { getStoreBySlug } from "@/lib/store";
import { darken } from "@/lib/brand";
import StoreShell from "@/components/StoreShell";

/**
 * Transitorio: mientras la raíz siga siendo el catálogo, sirve la tienda de
 * demostración. Cuando `/` pase a ser la portada de la plataforma, estas
 * páginas se mueven a `/[slug]` y el slug saldrá de la propia URL.
 */
const SLUG_POR_DEFECTO = "demo";

export async function generateMetadata(): Promise<Metadata> {
  const store = await getStoreBySlug(SLUG_POR_DEFECTO);
  if (!store) return {};

  // La pestaña del navegador lleva el nombre del negocio, no el de la
  // plataforma: es la tienda del tendero, no la nuestra.
  return {
    title: store.name,
    description: `Haz tu pedido en línea en ${store.name} y paga en efectivo o por transferencia al recibir.`,
  };
}

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
        {/* El color de marca entra como variables CSS en un contenedor propio,
            así toda la interfaz (que ya usa `bg-brand` y compañía) se repinta
            sola sin tocar ni un componente. */}
        <div
          style={
            {
              "--brand": store.brandColor,
              "--brand-dark": darken(store.brandColor),
            } as React.CSSProperties
          }
        >
          <StoreShell>{children}</StoreShell>
        </div>
      </CartProvider>
    </StoreProvider>
  );
}
