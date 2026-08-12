import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Aterrizaje del correo de confirmación.
 *
 * Sin esta ruta, el enlace del correo devolvía al tendero a la raíz del sitio
 * con el código de acceso colgando en la dirección, y ahí no había nada que lo
 * canjeara: veía una página que no funcionaba justo cuando acababa de abrir su
 * tienda. Aquí se canjea el código, queda la sesión abierta y entra derecho a
 * su panel.
 *
 * Se admiten las dos formas en que Supabase puede devolver la confirmación:
 *
 *   - `token_hash` + `type`, del enlace por plantilla. Es el bueno: se valida
 *     entero en el servidor, así que sirve aunque el tendero se registre en el
 *     computador y abra el correo en el celular. Requiere dejar la plantilla
 *     como se explica en el README.
 *   - `code`, del flujo PKCE, que es lo que manda Supabase con la plantilla de
 *     fábrica. Solo funciona en el mismo navegador donde se hizo el registro,
 *     porque el verificador queda en sus cookies.
 *
 * Si algo falla se manda al acceso con el motivo en español, nunca a una página
 * en blanco.
 */

/** Tipos de enlace que puede traer un correo nuestro. */
const TIPOS: EmailOtpType[] = [
  "email",
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
];

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  // A dónde va después de confirmar. Se acepta solo una ruta interna: un
  // `next` con dominio ajeno convertiría el correo en un salto a otro sitio.
  const next = searchParams.get("next");
  const destino = next && /^\/[^/\\]/.test(next) ? next : "/admin";

  // El propio Supabase puede avisar de que el enlace venció o ya se usó
  const errorEnlace =
    searchParams.get("error_description") ?? searchParams.get("error");
  if (errorEnlace) return alAcceso(origin, traducir(errorEnlace));

  const supabase = await createClient();

  if (tokenHash && type && TIPOS.includes(type as EmailOtpType)) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    });
    if (!error) return NextResponse.redirect(`${origin}${destino}`);
    return alAcceso(origin, traducir(error.message));
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${destino}`);
    return alAcceso(origin, traducir(error.message));
  }

  return alAcceso(origin, "El enlace del correo está incompleto.");
}

/** Recibe el motivo ya en español: los de Supabase pasan antes por `traducir`. */
function alAcceso(origin: string, motivo: string) {
  const url = new URL("/admin/login", origin);
  url.searchParams.set("aviso", motivo);
  return NextResponse.redirect(url);
}

/**
 * Los fallos de confirmación llegan en inglés y a veces hablando de detalles
 * internos. Al tendero se le dice qué pasó y qué hacer.
 */
function traducir(mensaje: string): string {
  const m = mensaje.toLowerCase();

  if (m.includes("expired") || m.includes("invalid")) {
    return "Ese enlace ya venció o se usó.";
  }
  if (m.includes("code verifier")) {
    // Pasa cuando el correo se abre en otro navegador o en otro equipo
    return "Ese enlace hay que abrirlo en el mismo navegador donde te registraste. Tu cuenta ya quedó confirmada.";
  }
  if (m.includes("already") || m.includes("confirmed")) {
    return "Tu cuenta ya estaba confirmada.";
  }
  if (m.includes("access_denied")) {
    return "No se pudo confirmar con ese enlace.";
  }
  return "No se pudo confirmar con ese enlace.";
}
