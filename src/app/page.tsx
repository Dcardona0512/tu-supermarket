import { redirect } from "next/navigation";

/**
 * La raíz del dominio lleva al acceso.
 *
 * Es también donde cae Supabase cuando no puede usar el destino que pide la
 * aplicación, y en ese caso llega con el motivo colgando de la dirección
 * (`?error_description=...`). Si se descartara, el tendero vería el formulario de
 * acceso sin ninguna explicación de por qué su enlace no funcionó; así que el
 * motivo se pasa al acceso, que ya sabe traducirlo y mostrarlo.
 *
 * La tienda de demostración sigue en `/demo`, como cualquier otra.
 *
 * Cuando exista una portada de la plataforma, esto se reemplaza por ella.
 */
export default async function RootPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const motivo =
    primero(params.error_description) ?? primero(params.error_code) ??
    primero(params.error);

  if (motivo) {
    redirect(`/login?aviso=${encodeURIComponent(traducir(motivo))}`);
  }

  redirect("/login");
}

function primero(valor: string | string[] | undefined): string | null {
  if (Array.isArray(valor)) return valor[0] ?? null;
  return valor ?? null;
}

/** Los motivos de Supabase llegan en inglés y con guiones bajos. */
function traducir(mensaje: string): string {
  const m = mensaje.toLowerCase();

  if (m.includes("expired") || m.includes("invalid")) {
    return "Ese enlace ya venció o se usó. Pide uno nuevo.";
  }
  if (m.includes("access_denied")) {
    return "No se pudo confirmar con ese enlace.";
  }
  return "No se pudo confirmar con ese enlace.";
}
