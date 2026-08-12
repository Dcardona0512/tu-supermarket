import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CartProvider } from "@/lib/cart";
import { StoreProvider } from "@/lib/store-context";
import { getStoreBySlug } from "@/lib/store";
import { darken, readableText, inkOnWhite } from "@/lib/brand";
import StoreShell from "@/components/StoreShell";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  if (!store) return { title: "Tienda no encontrada" };

  // La pestaña del navegador lleva el nombre del negocio, no el de la
  // plataforma: es la tienda del tendero, no la nuestra.
  //
  // El icono lleva la versión de la tienda en la URL: sin ella, el navegador
  // conservaría el de antes de personalizar durante un año.
  const icono = `/${store.slug}/icono?v=${store.version}`;

  return {
    title: store.name,
    description: `Haz tu pedido en línea en ${store.name} y paga en efectivo o por transferencia al recibir.`,
    icons: {
      icon: [{ url: icono, type: "image/png", sizes: "64x64" }],
      apple: [
        { url: `${icono}&size=180`, type: "image/png", sizes: "180x180" },
      ],
    },
  };
}

export default async function StoreLayout({
  children,
  params,
}: Params & { children: React.ReactNode }) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);

  // No existe, o está suspendida: 404 en vez de una página a medias.
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
              // Si la tienda eligió un color claro, el texto encima pasa a
              // oscuro: si no, sus botones serían ilegibles.
              "--brand-text": readableText(store.brandColor),
              // Y al contrario para los textos que van sobre el fondo claro
              "--brand-ink": inkOnWhite(store.brandColor),
            } as React.CSSProperties
          }
        >
          <StoreShell>{children}</StoreShell>
        </div>
      </CartProvider>
    </StoreProvider>
  );
}
