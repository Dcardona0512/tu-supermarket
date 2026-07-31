"use client";

import StoreHeader from "@/components/StoreHeader";
import CartDrawer from "@/components/CartDrawer";

/**
 * Estructura de la tienda. El panel del carrito se abre encima del catálogo,
 * sin correr la página: así abrirlo y cerrarlo no mueve nada de sitio.
 */
export default function StoreShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <StoreHeader />

      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>

      <footer className="mt-10 border-t border-black/5 py-8 text-center text-xs text-neutral-500">
        Mi Market · {new Date().getFullYear()}
      </footer>

      <CartDrawer />
    </>
  );
}
