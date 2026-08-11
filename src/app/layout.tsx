import type { Metadata } from "next";
import "./globals.css";

/**
 * Metadatos de la plataforma. Cada tienda sobreescribe el título y la
 * descripción con los suyos en `[slug]/layout.tsx`: aquí no se habla como una
 * tienda porque esto cubre el panel, el registro y la administración.
 */
export const metadata: Metadata = {
  title: "TU SUPERMARKET",
  description:
    "Sistema de inventario y pedidos en línea para tiendas tradicionales y supermercados.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
