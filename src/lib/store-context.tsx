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

  /* Datos del negocio: los que van en un comprobante, no en el escaparate. */

  /** Razón social, o el nombre del responsable si es persona natural. */
  legalName: string | null;
  docType: "CC" | "NIT" | null;
  docNumber: string | null;
  /** Dígito de verificación del NIT. Se calcula, no se escribe. */
  docDv: string | null;
  ivaResponsable: boolean;
  city: string | null;
  /** A dónde llegan las facturas del negocio. */
  billingEmail: string | null;
  /** Quién atiende, y su celular. Distinto del teléfono público de la tienda. */
  ownerName: string | null;
  ownerPhone: string | null;
  /** Nombre de usuario del dueño: la otra forma de entrar, además del correo. */
  username: string | null;
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
