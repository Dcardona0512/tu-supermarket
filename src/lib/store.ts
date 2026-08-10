import { createClient } from "@/lib/supabase/server";
import type { StoreInfo } from "@/lib/store-context";

/** Fila de `stores` tal como la devuelve Supabase. */
type StoreRow = {
  id: string;
  slug: string;
  name: string;
  delivery_fee: number;
  is_published: boolean;
};

const CAMPOS = "id, slug, name, delivery_fee, is_published";

function toStoreInfo(row: StoreRow): StoreInfo {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    deliveryFee: Number(row.delivery_fee),
  };
}

/**
 * Busca una tienda por el nombre que aparece en su enlace.
 *
 * Devuelve `null` si no existe o si no está publicada, para que quien llame
 * responda con un 404 en vez de una página a medias.
 */
export async function getStoreBySlug(
  slug: string
): Promise<StoreInfo | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("stores")
    .select(CAMPOS)
    .eq("slug", slug.toLowerCase())
    .eq("is_published", true)
    .maybeSingle();

  return data ? toStoreInfo(data as StoreRow) : null;
}

/**
 * La tienda del usuario que tiene la sesión abierta, para el panel.
 *
 * Sustituye al `requireAdmin` que solo comprobaba que existiera un usuario:
 * ahora además garantiza que ese usuario tenga una tienda, que es lo que
 * delimita todo lo que puede ver y tocar.
 */
export async function requireStore() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No autorizado");

  const { data } = await supabase
    .from("stores")
    .select(CAMPOS)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!data) throw new Error("Esta cuenta no tiene una tienda asociada");

  return { supabase, user, store: toStoreInfo(data as StoreRow) };
}
