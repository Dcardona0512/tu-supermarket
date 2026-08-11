import { renderStoreIcon } from "@/lib/store-icon";

/**
 * Icono de la pestaña del navegador, uno por tienda.
 *
 * Era el último rastro de la plataforma dentro de la tienda de un cliente: sus
 * compradores veían el cuadrado "TS" azul.
 */
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default async function Icon({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return renderStoreIcon(slug, size);
}
