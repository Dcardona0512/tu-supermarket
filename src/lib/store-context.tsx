"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * La tienda que se está viendo.
 *
 * Los componentes de la tienda son todos de cliente y necesitan saber a qué
 * negocio pertenecen: para armar sus enlaces, para separar el carrito, para
 * mostrar su marca y para decirle a `create_order` dónde va el pedido. Antes no
 * hacía falta porque había una sola.
 */
export type StoreInfo = {
  id: string;
  slug: string;
  name: string;
  /** Iniciales del distintivo, calculadas desde el nombre. */
  initials: string;
  /** Color de marca en hexadecimal. */
  brandColor: string;
  /** Logo de la tienda. Si es null, se usan las iniciales. */
  logoUrl: string | null;
  /** Frase corta bajo el nombre, si la tienda puso una. */
  tagline: string | null;
  phone: string | null;
  address: string | null;
  /** Lo que cobra esta tienda por el domicilio, en pesos. */
  deliveryFee: number;
};

const StoreContext = createContext<StoreInfo | null>(null);

export function StoreProvider({
  store,
  children,
}: {
  store: StoreInfo;
  children: ReactNode;
}) {
  return (
    <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
  );
}

export function useStore(): StoreInfo {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error("useStore debe usarse dentro de StoreProvider");
  }
  return store;
}

/** Ruta dentro de la tienda: `storePath(s, "/carrito")` -> "/mi-tienda/carrito". */
export function storePath(store: StoreInfo, path = ""): string {
  return `/${store.slug}${path}`;
}
