const copFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

/** Formatea un número como pesos colombianos, ej: 12500 -> "$ 12.500" */
export function formatCOP(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number(value) : value ?? 0;
  if (n === null || n === undefined || Number.isNaN(n)) return "$ 0";
  return copFormatter.format(n).replace(/ /g, " ");
}

const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatDate(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return dateFormatter.format(d);
}

const dayFormatter = new Intl.DateTimeFormat("es-CO", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

/**
 * Solo el día, sin hora: "13 de agosto de 2026".
 *
 * `formatDate` lleva la hora, que es lo que hace falta en un pedido o en un
 * cierre de caja. Para una fecha de alta la hora es ruido.
 */
export function formatDay(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return dayFormatter.format(d);
}
