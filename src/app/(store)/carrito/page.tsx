"use client";

import CartPanel from "@/components/CartPanel";

/**
 * Página del carrito, pensada para el celular. En computador el carrito se
 * abre como panel lateral desde el encabezado, sin salir del catálogo.
 */
export default function CartPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-xl font-bold">Tu pedido</h1>
      <CartPanel />
    </div>
  );
}
