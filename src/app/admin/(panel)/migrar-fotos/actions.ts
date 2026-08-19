"use server";

import { revalidatePath } from "next/cache";
import { requireStore } from "@/lib/store";

/**
 * Traer las fotos de la 53 al almacenamiento de esta plataforma.
 *
 * Es una herramienta de un solo uso, no una función del panel: cuando termine se
 * borra esta carpeta entera.
 *
 * El inventario de La 53 se copió con sus `image_url` tal como estaban, y esas
 * direcciones apuntan al almacenamiento de su antiguo proyecto de Supabase. Los
 * productos se ven bien hoy porque ese proyecto está despierto, pero el día que
 * se pause los 74 productos se quedan sin foto. Hay que traerse los archivos.
 *
 * Corre en el servidor por dos razones. Una, la descarga: pedir desde el
 * navegador un archivo alojado en otro dominio depende de que ese dominio lo
 * permita, y desde el servidor esa pregunta no existe. Y dos, la subida: usa la
 * sesión del dueño de la tienda, así que la política del bucket —que solo deja
 * escribir dentro de la carpeta de la propia tienda— se cumple sin abrir ningún
 * permiso extra.
 */

/** El proyecto viejo. Es lo que distingue una foto por traer de una ya traída. */
const DOMINIO_VIEJO = "svoeeqodivfkmmwyqlxh.supabase.co";

/**
 * Cuántas por llamada.
 *
 * Cinco y no las setenta y cuatro de golpe porque cada una son dos viajes por la
 * red, y una función en Vercel tiene su tiempo contado. El cliente vuelve a
 * llamar hasta que no queden.
 */
const LOTE = 5;

const BUCKET = "product-images";

export type ResultadoLote = {
  movidas: number;
  restantes: number;
  fallos: { producto: string; motivo: string }[];
};

export async function migrarLoteDeFotos(): Promise<ResultadoLote> {
  const { supabase, store } = await requireStore();

  const pendientes = supabase
    .from("products")
    .select("id, name, image_url")
    .eq("store_id", store.id)
    .like("image_url", `%${DOMINIO_VIEJO}%`);

  const { data: lote, error } = await pendientes.limit(LOTE);
  if (error) throw new Error(error.message);

  const fallos: ResultadoLote["fallos"] = [];
  let movidas = 0;

  for (const producto of lote ?? []) {
    if (!producto.image_url) continue;
    try {
      const respuesta = await fetch(producto.image_url);
      if (!respuesta.ok) {
        throw new Error(`el archivo respondió ${respuesta.status}`);
      }

      const contenido = await respuesta.arrayBuffer();
      const tipo = respuesta.headers.get("content-type") ?? "image/jpeg";

      // Se conserva el nombre del archivo y solo cambia la carpeta, que pasa a
      // ser la de la tienda. Así, si esto se reintenta, se sobrescribe el mismo
      // archivo en vez de dejar copias sueltas.
      const archivo = producto.image_url.split("/").pop() ?? `${producto.id}.jpg`;
      const ruta = `${store.id}/${archivo}`;

      const { error: errorSubida } = await supabase.storage
        .from(BUCKET)
        .upload(ruta, contenido, { contentType: tipo, upsert: true });
      if (errorSubida) throw new Error(errorSubida.message);

      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET).getPublicUrl(ruta);

      // Solo después de que el archivo esté arriba: si se actualizara antes y la
      // subida fallara, el producto quedaría apuntando a un sitio vacío.
      const { error: errorFila } = await supabase
        .from("products")
        .update({ image_url: publicUrl })
        .eq("id", producto.id);
      if (errorFila) throw new Error(errorFila.message);

      movidas++;
    } catch (e) {
      fallos.push({ producto: producto.name, motivo: (e as Error).message });
    }
  }

  const { count } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("store_id", store.id)
    .like("image_url", `%${DOMINIO_VIEJO}%`);

  if (movidas > 0) {
    revalidatePath("/admin/productos");
    revalidatePath(`/${store.slug}`);
  }

  return { movidas, restantes: count ?? 0, fallos };
}

/** Cuántas quedan por traer, para poder enseñarlo antes de empezar. */
export async function contarFotosPendientes(): Promise<number> {
  const { supabase, store } = await requireStore();
  const { count } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("store_id", store.id)
    .like("image_url", `%${DOMINIO_VIEJO}%`);
  return count ?? 0;
}
