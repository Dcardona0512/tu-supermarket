export type ExpiryTone = "ok" | "warn" | "danger";

/** Días de antelación con los que se avisa que un producto va a vencer. */
export const EXPIRY_ALERT_DAYS = 7;

/**
 * Hoy en Colombia. Se calcula así y no con `new Date()` porque en el servidor
 * el reloj está en UTC y de madrugada daría un día de diferencia.
 */
function today(): Date {
  const iso = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Días que faltan para la fecha (negativo si ya pasó). */
export function daysUntil(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  const target = new Date(y, (m ?? 1) - 1, d ?? 1);
  return Math.round((target.getTime() - today().getTime()) / 86_400_000);
}

/** Cómo debe leerse el vencimiento de un producto. */
export function expiryStatus(date: string): {
  label: string;
  tone: ExpiryTone;
  days: number;
} {
  const days = daysUntil(date);
  const [y, m, d] = date.split("-").map(Number);
  const fecha = new Date(y, (m ?? 1) - 1, d ?? 1).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  if (days < 0) {
    return {
      days,
      tone: "danger",
      label: `Vencido hace ${-days} ${-days === 1 ? "día" : "días"}`,
    };
  }
  if (days === 0) return { days, tone: "danger", label: "Vence hoy" };
  if (days <= 30) {
    return {
      days,
      tone: "warn",
      label: `Vence en ${days} ${days === 1 ? "día" : "días"}`,
    };
  }
  return { days, tone: "ok", label: fecha };
}

export const EXPIRY_STYLES: Record<ExpiryTone, string> = {
  ok: "text-neutral-600",
  warn: "text-amber-700 font-medium",
  danger: "text-red-600 font-semibold",
};

/** Fecha límite (YYYY-MM-DD) para consultar los productos por vencer. */
export function expiryCutoff(days = EXPIRY_ALERT_DAYS): string {
  const limit = today();
  limit.setDate(limit.getDate() + days);
  return `${limit.getFullYear()}-${String(limit.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(limit.getDate()).padStart(2, "0")}`;
}
