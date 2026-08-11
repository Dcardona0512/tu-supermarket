/**
 * Marca de cada tienda: iniciales y tonos derivados de su color.
 *
 * Se calcula todo a partir de lo que el tendero escribe al registrarse, para no
 * pedirle que diseñe nada ni suba imágenes.
 */

/**
 * Iniciales para el distintivo cuadrado, a partir del nombre del negocio.
 *
 *   "Autoservicio La Esquina" -> "AE"
 *   "Mercado"                 -> "ME"
 *
 * Se ignoran las palabras de enlace, que no aportan nada y se repetirían entre
 * negocios distintos.
 */
const PALABRAS_VACIAS = new Set([
  "de", "del", "la", "las", "el", "los", "y", "e", "en", "al", "a",
]);

export function initials(name: string): string {
  const palabras = name
    .trim()
    .split(/\s+/)
    .map((p) => p.replace(/[^\p{L}\p{N}]/gu, ""))
    .filter((p) => p.length > 0 && !PALABRAS_VACIAS.has(p.toLowerCase()));

  if (palabras.length === 0) {
    // Nombre hecho solo de palabras vacías o de símbolos: se usa tal cual.
    const limpio = name.replace(/[^\p{L}\p{N}]/gu, "");
    return (limpio.slice(0, 2) || "?").toUpperCase();
  }

  if (palabras.length === 1) {
    return palabras[0].slice(0, 2).toUpperCase();
  }

  return (palabras[0][0] + palabras[1][0]).toUpperCase();
}

/** #1d4ed8 -> [29, 78, 216] */
function toRgb(hex: string): [number, number, number] {
  const v = hex.replace("#", "");
  return [
    parseInt(v.slice(0, 2), 16),
    parseInt(v.slice(2, 4), 16),
    parseInt(v.slice(4, 6), 16),
  ];
}

function toHex([r, g, b]: [number, number, number]): string {
  const dos = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${dos(r)}${dos(g)}${dos(b)}`;
}

/**
 * Variante más oscura, para el estado `hover` de los botones.
 *
 * Se oscurece un 22%, que es aproximadamente el salto que había entre los dos
 * tonos fijos que usaba la interfaz antes de que el color fuera por tienda.
 */
export function darken(hex: string, amount = 0.22): string {
  const [r, g, b] = toRgb(hex);
  return toHex([r * (1 - amount), g * (1 - amount), b * (1 - amount)]);
}

/**
 * Colores sugeridos.
 *
 * Son atajos para quien no tiene un color de marca definido, no una lista
 * cerrada: junto a ellos hay un selector libre. Lo que antes obligaba a cerrar
 * la lista era que la interfaz escribía siempre en blanco; ahora el color del
 * texto se decide con `readableText`, así que un amarillo también funciona.
 */
export const PALETA = [
  { valor: "#1d4ed8", nombre: "Azul" },
  { valor: "#0f766e", nombre: "Verde mar" },
  { valor: "#15803d", nombre: "Verde" },
  { valor: "#b91c1c", nombre: "Rojo" },
  { valor: "#c2410c", nombre: "Naranja" },
  { valor: "#a16207", nombre: "Mostaza" },
  { valor: "#7e22ce", nombre: "Morado" },
  { valor: "#be185d", nombre: "Fucsia" },
  { valor: "#334155", nombre: "Gris pizarra" },
] as const;

/**
 * Si sobre este color hay que escribir en blanco o en negro.
 *
 * Es lo que permite dejar elegir cualquier color sin que los botones queden
 * ilegibles: un azul oscuro lleva texto blanco, un amarillo lo lleva negro. Usa
 * la luminancia relativa de la WCAG.
 */
export function readableText(hex: string): "#ffffff" | "#111111" {
  const [r, g, b] = toRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];

  const luminancia = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  // Umbral donde el contraste con blanco y con negro se igualan
  return luminancia > 0.36 ? "#111111" : "#ffffff";
}
