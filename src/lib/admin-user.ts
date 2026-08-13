/**
 * Cómo se muestra en pantalla la cuenta con la que se entró.
 *
 * Aquí vivía también `toLoginEmail`, que convertía un nombre suelto en un correo
 * interno `nombre@tusupermarket.com`. Se eliminó al darle a cada tienda un nombre
 * de usuario de verdad: ahora el acceso traduce el usuario a su correo
 * preguntándole a la base, y un nombre ya no se disfraza de dirección. Dejarla
 * habría sido una trampa, porque seguiría compilando y llevaría a una dirección
 * que no existe.
 */
export function toDisplayUser(email: string | null | undefined): string {
  return email ?? "";
}
