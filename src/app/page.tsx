import { redirect } from "next/navigation";

/**
 * La raíz servía el catálogo de la tienda de demostración antes de que cada
 * tienda tuviera su propia dirección. Se mantiene como redirección para que los
 * enlaces ya compartidos sigan llevando a algún sitio.
 *
 * Cuando exista una portada de la plataforma, esto se reemplaza por ella.
 */
export default function RootPage() {
  redirect("/demo");
}
