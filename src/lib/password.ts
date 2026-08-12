/**
 * Reglas de la contraseña, en un solo sitio.
 *
 * Las comparte el alta de la tienda y el cambio de contraseña: si cada pantalla
 * llevara las suyas, una acabaría aceptando lo que la otra rechaza.
 *
 * Son las mismas cuatro clases de carácter que sabe exigir Supabase, a
 * propósito: esto es la ayuda para que el tendero vea qué le falta mientras
 * escribe, pero **quien manda es la base**. Si solo estuviera aquí, bastaría con
 * llamar a la API sin pasar por la pantalla. Ver el README para dejarlo puesto en
 * *Authentication → Password Requirements*.
 */

export const LARGO_MINIMO = 8;

export type Regla = {
  id: string;
  texto: string;
  cumple: boolean;
};

export function revisarClave(clave: string): Regla[] {
  return [
    {
      id: "largo",
      texto: `Al menos ${LARGO_MINIMO} caracteres`,
      cumple: clave.length >= LARGO_MINIMO,
    },
    {
      id: "mayuscula",
      texto: "Una letra mayúscula",
      cumple: /[A-ZÁÉÍÓÚÑÜ]/.test(clave),
    },
    {
      id: "minuscula",
      texto: "Una letra minúscula",
      cumple: /[a-záéíóúñü]/.test(clave),
    },
    { id: "numero", texto: "Un número", cumple: /[0-9]/.test(clave) },
    {
      id: "signo",
      texto: "Un signo (!, ?, *, #, …)",
      // Cualquier cosa que no sea letra ni número ni espacio. Se define así, y
      // no con una lista, para no rechazar el signo que se le ocurra a nadie.
      cumple: /[^\p{L}\p{N}\s]/u.test(clave),
    },
  ];
}

export function claveValida(clave: string): boolean {
  return revisarClave(clave).every((r) => r.cumple);
}
