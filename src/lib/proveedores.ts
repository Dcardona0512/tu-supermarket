/**
 * Proveedores de acceso: entrar con Google, Facebook o Apple.
 *
 * Cada uno hay que habilitarlo en Supabase con una aplicación creada en el
 * proveedor (ver el README). Cuáles están habilitados **se le pregunta a
 * Supabase**, no se configura aquí: el botón de un proveedor sin habilitar no
 * devuelve un error a la aplicación, se va al dominio de Supabase y deja al
 * tendero mirando un JSON. Preguntando, el botón aparece solo el día que lo
 * habilites y no hace falta desplegar nada.
 */

export type Proveedor = {
  id: "google" | "facebook" | "apple";
  nombre: string;
};

const TODOS: Proveedor[] = [
  { id: "google", nombre: "Google" },
  { id: "facebook", nombre: "Facebook" },
  { id: "apple", nombre: "Apple" },
];

type Ajustes = { external?: Record<string, boolean> };

/**
 * Los proveedores habilitados en el proyecto de Supabase.
 *
 * Si la consulta falla, devuelve la lista vacía: es mejor no ofrecer el botón
 * que ofrecer uno que no lleva a ninguna parte.
 */
export async function proveedoresHabilitados(): Promise<Proveedor[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  try {
    const res = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: key },
    });
    if (!res.ok) return [];

    const ajustes = (await res.json()) as Ajustes;
    return TODOS.filter((p) => ajustes.external?.[p.id] === true);
  } catch {
    return [];
  }
}
