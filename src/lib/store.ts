import { createClient } from "@/lib/supabase/server";
import { initials } from "@/lib/brand";
import type { StoreInfo } from "@/lib/store-context";

/** Fila de `stores` tal como la devuelve Supabase. */
type StoreRow = {
  id: string;
  slug: string;
  name: string;
  brand_color: string;
  logo_url: string | null;
  tagline: string | null;
  phone: string | null;
  address: string | null;
  delivery_fee: number;
  is_published: boolean;
  updated_at: string;
  legal_name: string | null;
  doc_type: string | null;
  doc_number: string | null;
  doc_dv: string | null;
  iva_responsable: boolean;
  city: string | null;
  billing_email: string | null;
  owner_name: string | null;
  owner_phone: string | null;
  username: string | null;
};

/**
 * Va en una sola línea a propósito, por larga que sea: si se parte con `+`,
 * TypeScript deja de verla como literal y el cliente de Supabase ya no puede
 * deducir la forma de la fila.
 */
const CAMPOS =
  "id, slug, name, brand_color, logo_url, tagline, phone, address, delivery_fee, is_published, updated_at, legal_name, doc_type, doc_number, doc_dv, iva_responsable, city, billing_email, owner_name, owner_phone, username";

function toStoreInfo(row: StoreRow): StoreInfo {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    initials: initials(row.name),
    brandColor: row.brand_color,
    logoUrl: row.logo_url,
    tagline: row.tagline,
    phone: row.phone,
    address: row.address,
    deliveryFee: Number(row.delivery_fee),
    legalName: row.legal_name,
    docType: (row.doc_type as "CC" | "NIT" | null) ?? null,
    docNumber: row.doc_number,
    docDv: row.doc_dv,
    ivaResponsable: row.iva_responsable,
    city: row.city,
    billingEmail: row.billing_email,
    ownerName: row.owner_name,
    ownerPhone: row.owner_phone,
    username: row.username,
    // Sirve de número de versión del icono: cambia con cada guardado
    version: String(Date.parse(row.updated_at) || 0),
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
 * La tienda de la sesión abierta.
 *
 * Es el mismo criterio que aplica la base en `my_store_id()`: la tienda de la que
 * el usuario es dueño. Vive aquí en un solo sitio para que el panel y las
 * acciones del panel no puedan discrepar.
 */
export async function getSessionStore() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase, user: null, store: null };

  const { data } = await supabase
    .from("stores")
    .select(CAMPOS)
    .eq("owner_id", user.id)
    .maybeSingle();

  return {
    supabase,
    user,
    store: data ? toStoreInfo(data as StoreRow) : null,
  };
}

/**
 * Igual que `getSessionStore`, pero para las acciones del panel: si no hay
 * sesión o no hay tienda, no sigue.
 *
 * Sustituye al `requireAdmin` que solo comprobaba que existiera un usuario:
 * ahora además garantiza que ese usuario tenga una tienda, que es lo que
 * delimita todo lo que puede ver y tocar.
 */
export async function requireStore() {
  const { supabase, user, store } = await getSessionStore();

  if (!user) throw new Error("No autorizado");
  if (!store) throw new Error("Esta cuenta no tiene una tienda asociada");

  return { supabase, user, store };
}
