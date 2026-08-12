"use client";

import { useCart } from "@/lib/cart";
import CartPanel from "@/components/CartPanel";

/**
 * Carrito como panel lateral, solo en pantallas grandes.
 *
 * Arranca debajo de la barra superior para no tapar el botón del carrito, que
 * es el mismo que lo abre y lo cierra. El catálogo no se mueve: el panel se
 * monta encima, así que la página queda quieta al abrirlo y cerrarlo.
 */
export default function CartDrawer() {
  const { panelOpen, closePanel } = useCart();

  if (!panelOpen) return null;

  return (
    <aside
      className="fixed right-0 top-[var(--header-h)] z-30 hidden h-[calc(100dvh-var(--header-h))] w-[26rem] flex-col border-l border-black/5 bg-neutral-50 shadow-xl lg:flex"
      aria-label="Tu pedido"
    >
      <header className="flex shrink-0 items-center gap-2 border-b border-black/5 bg-white px-4 py-3">
        <h2 className="flex-1 text-base font-bold">Tu pedido</h2>
        <button
          onClick={closePanel}
          title="Cerrar"
          aria-label="Cerrar"
          className="grid h-8 w-8 place-items-center rounded-lg text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-800"
        >
          <CloseIcon />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <CartPanel onSeguirComprando={closePanel} />
      </div>

      <footer className="shrink-0 border-t border-black/5 bg-white px-4 py-2 text-center">
        <button
          onClick={closePanel}
          className="text-xs font-medium text-brand-ink hover:underline"
        >
          Seguir escogiendo productos
        </button>
      </footer>
    </aside>
  );
}

function CloseIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}
