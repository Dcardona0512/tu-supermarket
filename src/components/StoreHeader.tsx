"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";

export default function StoreHeader() {
  const { totalItems, panelOpen, togglePanel } = useCart();

  return (
    <header className="sticky top-0 z-40 h-[var(--header-h)] border-b border-black/5 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-lg font-black text-white">
            TS
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-bold tracking-wide text-foreground">
              TU SUPERMARKET
            </span>
            <span className="block text-xs text-neutral-500">
              Pedidos a domicilio
            </span>
          </span>
        </Link>

        {/* En el celular se abre la página del carrito... */}
        <Link
          href="/carrito"
          className="relative inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark lg:hidden"
        >
          <CartIcon />
          <span className="hidden sm:inline">Carrito</span>
          {totalItems > 0 && <Badge>{totalItems}</Badge>}
        </Link>

        {/* ...y en el computador el mismo botón abre y cierra el panel de al lado */}
        <button
          onClick={togglePanel}
          aria-expanded={panelOpen}
          className={`relative hidden items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition lg:inline-flex ${
            panelOpen
              ? "bg-brand-dark text-white"
              : "bg-brand text-white hover:bg-brand-dark"
          }`}
        >
          <CartIcon />
          <span>{panelOpen ? "Cerrar carrito" : "Carrito"}</span>
          {totalItems > 0 && <Badge>{totalItems}</Badge>}
        </button>
      </div>
    </header>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-xs font-bold text-white">
      {children}
    </span>
  );
}

function CartIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}
