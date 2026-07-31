/**
 * Paleta de los gráficos del panel.
 *
 * Los dos colores de serie (slots categóricos 1 y 2) están validados sobre la
 * superficie blanca de las tarjetas: separación para daltonismo ΔE 24.7 y
 * contraste >= 3:1. No cambiar sin volver a validar.
 */
export const CHART = {
  surface: "#ffffff",
  gridline: "#e1e0d9",
  baseline: "#c3c2b7",
  muted: "#898781",
  textPrimary: "#0b0b0b",
  textSecondary: "#52514e",
  /** Serie 1: costo · Serie 2: ganancia */
  cost: "#2a78d6",
  profit: "#eb6834",
} as const;

/** Redondea un máximo a un número "limpio" para el eje Y. */
export function niceMax(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 1000;
  const exp = Math.floor(Math.log10(value));
  const base = 10 ** exp;
  const f = value / base;
  const nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return nf * base;
}

/** Formato compacto para ejes: 45000 -> "$ 45 mil", 1200000 -> "$ 1,2 M" */
export function compactCOP(value: number): string {
  const n = Math.abs(value);
  if (n >= 1_000_000) {
    const v = value / 1_000_000;
    return `$ ${v.toFixed(v >= 10 ? 0 : 1).replace(".", ",")} M`;
  }
  if (n >= 1000) return `$ ${Math.round(value / 1000)} mil`;
  return `$ ${Math.round(value)}`;
}

/**
 * Etiqueta legible del periodo. `bucket` viene como "YYYY-MM-DD" y se
 * interpreta en hora local para que no se desplace un día por zona horaria.
 */
export function bucketLabel(
  bucket: string,
  granularity: "day" | "week" | "month",
  long = false
): string {
  const [y, m, d] = bucket.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);

  if (granularity === "month") {
    return date.toLocaleDateString("es-CO", {
      month: long ? "long" : "short",
      year: "numeric",
    });
  }

  const short = date.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
  });

  if (granularity === "week") {
    if (!long) return short;
    const end = new Date(date);
    end.setDate(end.getDate() + 6);
    const endLabel = end.toLocaleDateString("es-CO", {
      day: "numeric",
      month: "short",
    });
    return `Semana del ${short} al ${endLabel}`;
  }

  return long
    ? date.toLocaleDateString("es-CO", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : short;
}
