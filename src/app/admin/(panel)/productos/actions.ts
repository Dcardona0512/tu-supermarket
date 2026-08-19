"use server";

import { revalidatePath } from "next/cache";
import { requireStore } from "@/lib/store";

export type ProductInput = {
  id?: string;
  name: string;
  barcode: string;
  description: string;
  brand: string;
  category_id: string | null;
  price: number;
  cost_price: number;
  discount_price: number | null;
  unit: string;
  stock: number;
  image_url: string | null;
  is_active: boolean;
  /** Fecha de vencimiento (YYYY-MM-DD) o null si el producto no vence. */
  expires_at: string | null;
};

type ActionResult = { ok: boolean; error?: string };

function productError(message: string): string {
  return message.includes("products_barcode")
    ? "Ese código de barras ya está asignado a otro producto"
    : message;
}

/**
 * Puerta de autorización del panel.
 *
 * Antes había aquí un `requireAdmin` que solo comprobaba que existiera un
 * usuario, sin verificar que tuviera tienda. `requireStore` exige las dos
 * cosas, y es la única puerta en todo el panel.
 */
async function requireAdmin() {
  const { supabase } = await requireStore();
  return supabase;
}

export async function saveProduct(input: ProductInput): Promise<ActionResult> {
  try {
    const supabase = await requireAdmin();

    if (!input.name.trim()) return { ok: false, error: "El nombre es obligatorio" };
    if (input.price < 0) return { ok: false, error: "Precio inválido" };
    if (input.cost_price < 0) return { ok: false, error: "Costo inválido" };
    if (
      input.discount_price != null &&
      input.discount_price > input.price
    ) {
      return { ok: false, error: "El precio de oferta no puede superar el precio" };
    }

    const row = {
      name: input.name.trim(),
      barcode: input.barcode.trim() || null,
      description: input.description.trim() || null,
      brand: input.brand.trim() || null,
      category_id: input.category_id,
      price: input.price,
      cost_price: input.cost_price,
      discount_price: input.discount_price,
      unit: input.unit.trim() || "unidad",
      stock: input.stock,
      image_url: input.image_url,
      is_active: input.is_active,
      expires_at: input.expires_at || null,
    };

    if (input.id) {
      const { error } = await supabase
        .from("products")
        .update(row)
        .eq("id", input.id);
      if (error) return { ok: false, error: productError(error.message) };
    } else {
      const { error } = await supabase.from("products").insert(row);
      if (error) return { ok: false, error: productError(error.message) };
    }

    revalidatePath("/admin/productos");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** Asigna (o borra, con null) el código de barras de un producto. */
export async function setProductBarcode(
  id: string,
  barcode: string | null
): Promise<ActionResult> {
  try {
    const supabase = await requireAdmin();
    const value = barcode?.trim() || null;

    if (value) {
      // Evita dejar dos productos con el mismo código
      const { data: taken } = await supabase
        .from("products")
        .select("id, name")
        .eq("barcode", value)
        .neq("id", id)
        .maybeSingle();

      if (taken) {
        return {
          ok: false,
          error: `Ese código ya es de "${taken.name}"`,
        };
      }
    }

    const { error } = await supabase
      .from("products")
      .update({ barcode: value })
      .eq("id", id);

    if (error) return { ok: false, error: productError(error.message) };

    revalidatePath("/admin/inventario");
    revalidatePath("/admin/productos");
    revalidatePath("/admin/venta");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  try {
    const supabase = await requireAdmin();
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/productos");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/**
 * Borra varios productos de una vez.
 *
 * Va en una sola consulta y no repitiendo `deleteProduct`: con veinte productos
 * serían veinte viajes a la base, y si uno fallara a la mitad el tendero se
 * quedaría sin saber cuáles se fueron. Una sola sentencia es atómica — o se van
 * todos o no se va ninguno.
 *
 * El aislamiento entre tiendas no depende de esta función: la política de
 * `products` solo deja tocar las filas de la tienda de quien pide, así que un
 * `id` de otra tienda colado en la lista no borra nada.
 */
export async function deleteProducts(ids: string[]): Promise<ActionResult> {
  try {
    const supabase = await requireAdmin();

    const limpios = [...new Set(ids.filter((id) => typeof id === "string" && id))];
    if (limpios.length === 0) {
      return { ok: false, error: "No hay productos seleccionados" };
    }

    const { error } = await supabase.from("products").delete().in("id", limpios);
    if (error) return { ok: false, error: error.message };

    revalidatePath("/admin/productos");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

function categoryError(message: string): string {
  // 23505 = nombre duplicado dentro del mismo nivel
  if (message.includes("categories_name_child_idx")) {
    return "Esa categoría ya tiene una subcategoría con ese nombre";
  }
  return message.includes("duplicate key") || message.includes("23505")
    ? "Ya existe una categoría con ese nombre"
    : message;
}

/**
 * Crea una categoría. Con `parentId` queda como subcategoría de esa otra,
 * por ejemplo "Enlatados" dentro de "Alimentos y despensa".
 */
export async function createCategory(
  name: string,
  parentId?: string | null
): Promise<ActionResult & { id?: string; storeId?: string }> {
  try {
    const supabase = await requireAdmin();
    if (!name.trim()) return { ok: false, error: "Nombre requerido" };
    // `store_id` lo pone el trigger; se lee de vuelta para que la lista del
    // navegador pueda añadir la categoría sin recargar la página.
    const { data, error } = await supabase
      .from("categories")
      .insert({ name: name.trim(), parent_id: parentId ?? null })
      .select("id, store_id")
      .single();
    if (error) return { ok: false, error: categoryError(error.message) };
    revalidatePath("/admin/productos");
    revalidatePath("/admin/venta");
    revalidatePath("/");
    return { ok: true, id: data.id, storeId: data.store_id };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** Mueve una categoría dentro de otra, o la deja como principal con null. */
export async function moveCategory(
  id: string,
  parentId: string | null
): Promise<ActionResult> {
  try {
    const supabase = await requireAdmin();
    if (parentId === id) {
      return { ok: false, error: "Una categoría no puede estar dentro de sí misma" };
    }
    const { error } = await supabase
      .from("categories")
      .update({ parent_id: parentId })
      .eq("id", id);
    if (error) return { ok: false, error: categoryError(error.message) };
    revalidatePath("/admin/productos");
    revalidatePath("/admin/venta");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function renameCategory(
  id: string,
  name: string
): Promise<ActionResult> {
  try {
    const supabase = await requireAdmin();
    if (!name.trim()) return { ok: false, error: "Nombre requerido" };
    const { error } = await supabase
      .from("categories")
      .update({ name: name.trim() })
      .eq("id", id);
    if (error) return { ok: false, error: categoryError(error.message) };
    revalidatePath("/admin/productos");
    revalidatePath("/admin/venta");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/**
 * Elimina una categoría y, si las tiene, sus subcategorías. Los productos que
 * las usaban no se borran: quedan como "sin categoría" (la clave foránea de
 * products es ON DELETE SET NULL).
 */
export async function deleteCategory(id: string): Promise<ActionResult> {
  try {
    const supabase = await requireAdmin();
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/productos");
    revalidatePath("/admin/venta");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
