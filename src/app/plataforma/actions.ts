"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { toSlug } from "@/lib/slug";

type Result = { ok: boolean; error?: string };

/**
 * Puerta del panel de plataforma.
 *
 * La comprobación real la hacen las políticas de la base: `platform_admins` y
 * `stores` solo se dejan tocar por quien está en esa tabla. Esto es la primera
 * barrera, para devolver un mensaje claro en vez de un error de permisos.
 */
async function requirePlatformAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");

  const { data } = await supabase
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) throw new Error("Esta cuenta no administra la plataforma");

  return { supabase, user };
}


/**
 * Crea un código de invitación con el nombre y el enlace ya reservados.
 *
 * El tendero se registra él mismo con ese código y elige su contraseña: así
 * nadie entra sin permiso y tú no llegas a conocer su clave.
 */
export async function createInvite(
  storeName: string,
  slug: string,
  diasValidez = 30
): Promise<Result & { code?: string }> {
  try {
    const { supabase, user } = await requirePlatformAdmin();

    const nombre = storeName.trim();
    if (!nombre) return { ok: false, error: "El nombre es obligatorio" };

    const enlace = toSlug(slug || storeName);
    if (enlace.length < 3) {
      return { ok: false, error: "El enlace debe tener al menos 3 caracteres" };
    }

    const { data: codigo, error: errCodigo } = await supabase.rpc(
      "generar_codigo_invitacion"
    );
    if (errCodigo) return { ok: false, error: errCodigo.message };

    const expira = new Date();
    expira.setDate(expira.getDate() + diasValidez);

    const { error } = await supabase.from("store_invites").insert({
      code: codigo as string,
      store_name: nombre,
      slug: enlace,
      created_by: user.id,
      expires_at: expira.toISOString(),
    });

    if (error) {
      // El slug es único entre invitaciones, pero además puede chocar con una
      // tienda que ya exista o con un nombre reservado de la plataforma.
      const msg = error.message.includes("slug")
        ? `El enlace "${enlace}" ya está tomado o es un nombre reservado`
        : error.message;
      return { ok: false, error: msg };
    }

    revalidatePath("/plataforma");
    return { ok: true, code: codigo as string };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** Publica o suspende una tienda. Es la palanca para quien deja de pagar. */
export async function setStorePublished(
  storeId: string,
  published: boolean
): Promise<Result> {
  try {
    const { supabase } = await requirePlatformAdmin();

    const { error } = await supabase
      .from("stores")
      .update({ is_published: published })
      .eq("id", storeId);

    if (error) return { ok: false, error: error.message };

    revalidatePath("/plataforma");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** Retira una invitación que aún no se ha usado. */
export async function deleteInvite(inviteId: string): Promise<Result> {
  try {
    const { supabase } = await requirePlatformAdmin();

    const { error } = await supabase
      .from("store_invites")
      .delete()
      .eq("id", inviteId)
      .is("used_at", null);

    if (error) return { ok: false, error: error.message };

    revalidatePath("/plataforma");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
