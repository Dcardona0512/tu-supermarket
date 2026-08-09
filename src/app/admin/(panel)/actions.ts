"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Devuelve la demostración a su estado inicial.
 *
 * El panel está abierto para que cualquiera lo pruebe, así que hace falta
 * poder deshacer lo que dejen: borra pedidos, inventario, productos y
 * categorías, y vuelve a sembrar el catálogo y los tres pedidos de ejemplo,
 * uno en cada estado.
 *
 * El trabajo real lo hace la función `reset_demo` en Postgres, en una sola
 * transacción, para no quedarse a medias si algo falla.
 */
export async function resetDemo(): Promise<{
  ok: boolean;
  productos?: number;
  categorias?: number;
  pedidos?: number;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autorizado" };

  const { data, error } = await supabase.rpc("reset_demo");
  if (error) return { ok: false, error: error.message };

  const resumen = data as {
    productos?: number;
    categorias?: number;
    pedidos?: number;
  } | null;

  for (const ruta of [
    "/",
    "/admin",
    "/admin/productos",
    "/admin/pedidos",
    "/admin/inventario",
    "/admin/informes",
    "/admin/venta",
  ]) {
    revalidatePath(ruta);
  }

  return {
    ok: true,
    productos: resumen?.productos,
    categorias: resumen?.categorias,
    pedidos: resumen?.pedidos,
  };
}
