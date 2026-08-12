"use client";

import StoreHeader from "@/components/StoreHeader";
import CartDrawer from "@/components/CartDrawer";
import EntrarAlPanel from "@/components/EntrarAlPanel";
import { useStore } from "@/lib/store-context";
import { SLUG_DEMO } from "@/lib/demo";

/**
 * Estructura de la tienda. El panel del carrito se abre encima del catálogo,
 * sin correr la página: así abrirlo y cerrarlo no mueve nada de sitio.
 */
export default function StoreShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const store = useStore();

  return (
    <>
      <StoreHeader />

      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>

      <footer className="mt-10 border-t border-black/5 py-8 text-center text-xs text-neutral-500">
        <p>
          {store.name} · {new Date().getFullYear()}
        </p>

        {/* Entrada al panel. Va aquí abajo y no en la barra de arriba a
            propósito: al cliente que viene a mercar no le sirve de nada y
            competiría con el carrito. Quien la busca es el tendero. */}
        <EntrarAlPanel slug={store.slug} esDemo={store.slug === SLUG_DEMO} />
      </footer>

      <CartDrawer />
    </>
  );
}
