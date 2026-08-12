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
 *
 * El correo es opcional y sirve para un caso concreto: si entra con Google,
 * Facebook o Apple no hay forma de mandar el código en el registro, así que la
 * base reconoce la invitación por el correo y le abre la tienda sola.
 */
export async function createInvite(
  storeName: string,
  slug: string,
  email = "",
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

    const correo = email.trim().toLowerCase();
    if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      return { ok: false, error: "Ese correo no parece válido" };
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
      email: correo || null,
      expires_at: expira.toISOString(),
    });

    if (error) {
      // El slug es único entre invitaciones, pero además puede chocar con una
      // tienda que ya exista o con un nombre reservado de la plataforma.
      if (error.message.includes("slug")) {
        return {
          ok: false,
          error: `El enlace "${enlace}" ya está tomado o es un nombre reservado`,
        };
      }
      // Solo puede haber una invitación abierta por correo: si no, la segunda
      // quedaría muerta sin que nadie se diera cuenta.
      if (error.message.includes("email")) {
        return {
          ok: false,
          error: `Ya hay una invitación sin usar para ${correo}`,
        };
      }
      return { ok: false, error: error.message };
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
