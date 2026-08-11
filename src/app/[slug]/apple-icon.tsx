import { renderStoreIcon } from "@/lib/store-icon";

/**
 * Icono para iOS: el que queda si un comprador guarda la tienda en su pantalla
 * de inicio. Va a sangre porque iOS aplica su propia máscara redondeada.
 */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return renderStoreIcon(slug, size);
}
