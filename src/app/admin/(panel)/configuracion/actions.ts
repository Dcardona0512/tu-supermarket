"use server";

import { revalidatePath } from "next/cache";
import { requireStore } from "@/lib/store";
import { digitoVerificacion, soloDigitos } from "@/lib/documento";

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
    revalidatePath("/admin/configuracion");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export type DatosDelNegocioInput = {
  legalName: string;
  docType: "CC" | "NIT" | "";
  docNumber: string;
  ivaResponsable: boolean;
  city: string;
  billingEmail: string;
  ownerName: string;
  ownerPhone: string;
};

/**
 * Guarda los datos con los que el negocio se identifica en un papel.
 *
 * Van aparte de la personalización porque son otra cosa: aquello es lo que ven
 * los clientes, esto es lo que va en un comprobante y, más adelante, en una
 * factura. Separarlos evita que la lista de campos permitidos crezca hasta
 * volverse imposible de revisar.
 *
 * El dígito de verificación no se recibe: se calcula. Es un dato que se deduce
 * del NIT, y aceptarlo del formulario solo abriría la puerta a guardarlo mal.
 */
export async function updateDatosDelNegocio(
  input: DatosDelNegocioInput
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { supabase, store } = await requireStore();

    const tipo = input.docType === "CC" || input.docType === "NIT"
      ? input.docType
      : null;
    const numero = soloDigitos(input.docNumber);

    if (numero && !tipo) {
      return { ok: false, error: "Elige si es cédula o NIT" };
    }
    if (numero && numero.length > 15) {
      return { ok: false, error: "Ese número de documento es demasiado largo" };
    }

    const correo = input.billingEmail.trim().toLowerCase();
    if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      return { ok: false, error: "Ese correo no parece válido" };
    }

    const { error } = await supabase
      .from("stores")
      .update({
        legal_name: input.legalName.trim() || null,
        doc_type: numero ? tipo : null,
        doc_number: numero || null,
        // Solo el NIT lleva dígito de verificación; una cédula no tiene.
        doc_dv: numero && tipo === "NIT" ? digitoVerificacion(numero) : null,
        iva_responsable: input.ivaResponsable,
        city: input.city.trim() || null,
        billing_email: correo || null,
        owner_name: input.ownerName.trim() || null,
        owner_phone: input.ownerPhone.trim() || null,
      })
      .eq("id", store.id);

    if (error) return { ok: false, error: error.message };

    revalidatePath("/admin/configuracion");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
