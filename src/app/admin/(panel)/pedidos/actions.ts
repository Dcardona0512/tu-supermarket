"use server";

import { revalidatePath } from "next/cache";
import { requireStore } from "@/lib/store";
import type { OrderStatus, PaymentMethod } from "@/lib/database.types";

const VALID: OrderStatus[] = ["pendiente", "entregado", "cancelado"];
const PAGOS: PaymentMethod[] = ["efectivo", "transferencia"];

/** Estados de los que un pedido ya no sale. */
const FINALES: OrderStatus[] = ["entregado", "cancelado"];

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  /**
   * Cómo pagó el cliente. Solo se registra al entregar: en los pedidos en
   * línea muchos dicen que van a transferir y terminan pagando en efectivo,
   * así que lo confirma quien hace la entrega.
   */
  paymentMethod?: PaymentMethod
): Promise<{ ok: boolean; error?: string }> {
  let supabase;
  try {
    ({ supabase } = await requireStore());
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  if (!VALID.includes(status)) return { ok: false, error: "Estado inválido" };

  // Entregado y cancelado son finales: el primero ya se cobró y entró al
  // cierre de caja, el segundo ya devolvió las unidades al inventario. La
  // base lo impide con un trigger; aquí se traduce a un mensaje legible.
  const { data: actual } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .single();

  if (actual && FINALES.includes(actual.status as OrderStatus)) {
    return {
      ok: false,
      error: `El pedido está ${actual.status}: su estado ya no se puede cambiar.`,
    };
  }

  const cambios: { status: OrderStatus; payment_method?: PaymentMethod } = {
    status,
  };

  if (status === "entregado") {
    if (!paymentMethod || !PAGOS.includes(paymentMethod)) {
      return { ok: false, error: "Indica si pagó en efectivo o por transferencia" };
    }
    cambios.payment_method = paymentMethod;
  }

  const { error } = await supabase
    .from("orders")
    .update(cambios)
    .eq("id", orderId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/pedidos");
  revalidatePath("/admin");
  revalidatePath("/admin/informes");
  // Cancelar o reactivar un pedido ajusta el inventario (trigger en Postgres)
  revalidatePath("/admin/productos");
  revalidatePath("/");
  return { ok: true };
}
