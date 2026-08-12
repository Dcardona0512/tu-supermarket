import { createClient } from "@/lib/supabase/server";
import { initials } from "@/lib/brand";
import { SLUG_DEMO, type StoreInfo } from "@/lib/store-context";

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
};

const CAMPOS =
  "id, slug, name, brand_color, logo_url, tagline, phone, address, delivery_fee, is_published, updated_at";

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
 * La tienda que administra la sesión abierta.
 *
 * Casi siempre es la que le pertenece, pero hay un caso más: al panel de la
 * demostración se entra sin usuario ni contraseña, con una sesión anónima. Ese
 * visitante no es dueño de nada, así que su tienda es la demo.
 *
 * Es el mismo criterio que aplica la base en `my_store_id()`. Vive aquí en un
 * solo sitio para que el panel y las acciones no puedan discrepar.
 */
export async function getSessionStore() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase, user: null, store: null, esDemo: false };

  const esDemo = Boolean(user.is_anonymous);

  const consulta = supabase.from("stores").select(CAMPOS);
  const { data } = esDemo
    ? await consulta.eq("slug", SLUG_DEMO).maybeSingle()
    : await consulta.eq("owner_id", user.id).maybeSingle();

  return {
    supabase,
    user,
    store: data ? toStoreInfo(data as StoreRow) : null,
    esDemo,
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
  const { supabase, user, store, esDemo } = await getSessionStore();

  if (!user) throw new Error("No autorizado");
  if (!store) throw new Error("Esta cuenta no tiene una tienda asociada");

  return { supabase, user, store, esDemo };
}
