import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TU SUPERMARKET",
  description:
    "Haz tu pedido en línea en TU SUPERMARKET y paga en efectivo o por transferencia al recibir.",
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
