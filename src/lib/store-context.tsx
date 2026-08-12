"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * Nombre corto de la tienda de demostración.
 *
 * Vive aquí, y no junto a las consultas del servidor, porque lo necesitan los
 * dos lados: el escaparate para saber que su botón entra sin contraseña, y el
 * servidor para resolver la tienda de una sesión anónima.
 */
export const SLUG_DEMO = "demo";

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
  /**
   * Marca de la última edición, para versionar el icono.
   *
   * El icono se cachea un año, así que sin algo que cambie en su URL el
   * navegador seguiría mostrando el de antes de personalizar.
   */
  version: string;
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
