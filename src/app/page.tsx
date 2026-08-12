import { redirect } from "next/navigation";

/**
 * La raíz del dominio lleva al acceso.
 *
 * Antes llevaba a `/demo`, de cuando la raíz servía el catálogo de la tienda de
 * demostración. Eso dejaba a quien escribiera el dominio pelado dentro de una
 * tienda de muestra, como si fuera el sitio.
 *
 * Y tenía una consecuencia peor: el dominio pelado es el valor al que Supabase
 * manda cuando no puede usar el destino que pide la aplicación, así que confirmar
 * el correo podía terminar en la tienda de muestra en vez de en el acceso. Con
 * esto, los dos caminos acaban en el mismo sitio.
 *
 * La tienda de demostración sigue en `/demo`, como cualquier otra.
 *
 * Cuando exista una portada de la plataforma, esto se reemplaza por ella.
 */
export default function RootPage() {
  redirect("/admin/login");
}
