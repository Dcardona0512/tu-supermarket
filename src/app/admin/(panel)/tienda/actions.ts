"use server";

import { revalidatePath } from "next/cache";
import { requireStore } from "@/lib/store";

export type StoreSettingsInput = {
  name: string;
  tagline: string;
  brandColor: string;
  logoUrl: string | null;
  phone: string;
  address: string;
  deliveryFee: number;
};

/**
 * Guarda la personalización de la tienda del usuario.
 *
 * Solo se escriben los campos de esta lista. El enlace, el dueño y si la tienda
 * está publicada no entran: son decisiones de la plataforma, no del tendero, y
 * la base los rechaza con un trigger aunque alguien llame a la API directamente.
 */
export async function updateStore(
  input: StoreSettingsInput
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { supabase, store } = await requireStore();

    const name = input.name.trim();
    if (!name) return { ok: false, error: "El nombre no puede estar vacío" };
    if (name.length > 60) {
      return { ok: false, error: "El nombre no puede pasar de 60 caracteres" };
    }

    // Cualquier color vale, pero tiene que ser un hexadecimal de verdad: la
    // base lo exige con un check y el valor entra en una variable CSS, así que
    // un texto arbitrario aquí rompería el estilo de toda la tienda.
    const color = input.brandColor.trim().toLowerCase();
    if (!/^#[0-9a-f]{6}$/.test(color)) {
      return { ok: false, error: "El color no es válido" };
    }

    if (!Number.isFinite(input.deliveryFee) || input.deliveryFee < 0) {
      return { ok: false, error: "El domicilio no puede ser negativo" };
    }

    const { error } = await supabase
      .from("stores")
      .update({
        name,
        tagline: input.tagline.trim() || null,
        brand_color: color,
        logo_url: input.logoUrl,
        phone: input.phone.trim() || null,
        address: input.address.trim() || null,
        delivery_fee: input.deliveryFee,
      })
      .eq("id", store.id);

    if (error) return { ok: false, error: error.message };

    // El escaparate y la cabecera del panel muestran estos datos
    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/admin/tienda");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
