"use client";

import Link from "next/link";
import StoreHeader from "@/components/StoreHeader";
import CartDrawer from "@/components/CartDrawer";
import { useStore } from "@/lib/store-context";

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

        {/* Entrada al panel para el dueño de la tienda.
            Va aquí abajo y no en la barra de arriba a propósito: al cliente que
            viene a mercar no le sirve de nada y competiría con el carrito. Quien
            la busca es el tendero, que ya sabe que existe. No revela nada: sin
            sesión, `/admin` pide correo y contraseña. */}
        <Link
          href="/admin"
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
        >
          <IconCandado />
          Entrar al panel
        </Link>
      </footer>

      <CartDrawer />
    </>
  );
}

function IconCandado() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}
