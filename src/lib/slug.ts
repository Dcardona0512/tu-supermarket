/**
 * Convierte lo que se escriba en el nombre corto que va en la URL.
 *
 *   "Autoservicio La Esquina"    -> "autoservicio-la-esquina"
 *   "autola50.ts.vercel.app"     -> "autola50"
 *   "https://mitienda.com/algo"  -> "mitienda"
 *
 * Lo de los dominios importa: el campo se rellena pensando en un enlace y es
 * natural pegar una dirección entera. Sin esta limpieza salía
 * "autola50-ts-vercel-app".
 *
 * Vive aquí y no en la acción del servidor porque el formulario necesita la
 * misma regla para mostrar el enlace antes de crearlo: si estuviera duplicada,
 * la vista previa y el resultado acabarían discrepando.
 */
export function toSlug(texto: string): string {
  let limpio = texto.trim();

  // Fuera protocolo, ruta y parámetros
  limpio = limpio
    .replace(/^[a-z]+:\/\//i, "")
    .split(/[/?#]/)[0]
    .trim();

  // Si no tiene espacios y sí puntos, parece un dominio: vale la primera parte.
  // Un nombre con espacios ("Súper S.A.") no se toca.
  if (!/\s/.test(limpio) && /\.[a-z]{2,}/i.test(limpio)) {
    limpio = limpio.split(".")[0];
  }

  return limpio
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}
