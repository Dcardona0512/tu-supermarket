import type { ReportGranularity } from "@/lib/database.types";

/** Fecha local en formato YYYY-MM-DD (el que usan los <input type="date">). */
export function toDateInput(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function todayInput(): string {
  return toDateInput(new Date());
}

function parse(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** Instante en que empieza ese día, en hora local. */
export function startOfDayISO(value: string): string {
  const d = parse(value);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/** Instante en que termina ese día, en hora local. */
export function endOfDayISO(value: string): string {
  const d = parse(value);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

/** Días que abarca el rango, ambos extremos incluidos. */
export function daysBetween(from: string, to: string): number {
  const ms = parse(to).getTime() - parse(from).getTime();
  return Math.floor(ms / 86_400_000) + 1;
}

/**
 * Agrupación razonable para el rango: si son muchos días, agrupar por día
 * llenaría el gráfico de barras ilegibles.
 */
export function suggestGranularity(
  from: string,
  to: string
): ReportGranularity {
  const days = daysBetween(from, to);
  if (days <= 45) return "day";
  if (days <= 200) return "week";
  return "month";
}

/** Etiqueta del rango: "Del 1 al 20 de julio de 2026". */
export function rangeLabel(from: string, to: string): string {
  const a = parse(from);
  const b = parse(to);
  const full: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
  };

  if (from === to) return a.toLocaleDateString("es-CO", full);

  const sameYear = a.getFullYear() === b.getFullYear();
  const sameMonth = sameYear && a.getMonth() === b.getMonth();

  if (sameMonth) {
    return `Del ${a.getDate()} al ${b.toLocaleDateString("es-CO", full)}`;
  }
  if (sameYear) {
    const start = a.toLocaleDateString("es-CO", {
      day: "numeric",
      month: "long",
    });
    return `Del ${start} al ${b.toLocaleDateString("es-CO", full)}`;
  }
  return `Del ${a.toLocaleDateString("es-CO", full)} al ${b.toLocaleDateString(
    "es-CO",
    full
  )}`;
}

