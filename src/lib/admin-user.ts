/**
 * El panel se usa con un nombre de usuario, pero Supabase autentica con
 * correo. El usuario se convierte aquí en un correo interno; nunca se envía
 * nada a esa dirección.
 */
const INTERNAL_DOMAIN = "tusupermarket.com";

/** "miusuario" -> "miusuario@tusupermarket.com" */
export function toLoginEmail(user: string): string {
  const value = user.trim().toLowerCase();
  if (!value) return "";
  // Si alguien escribe el correo completo, se respeta
  return value.includes("@") ? value : `${value}@${INTERNAL_DOMAIN}`;
}

/** Lo contrario, para mostrar el usuario en pantalla en vez del correo. */
export function toDisplayUser(email: string | null | undefined): string {
  if (!email) return "";
  return email.endsWith(`@${INTERNAL_DOMAIN}`) ? email.split("@")[0] : email;
}
