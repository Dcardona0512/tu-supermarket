import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Aterrizaje de los correos y de los proveedores de acceso.
 *
 * Sin esta ruta, el enlace del correo devolvía al tendero a la raíz del sitio
 * con el código de acceso colgando en la dirección, y ahí no había nada que lo
 * canjeara: veía una página que no funcionaba justo cuando acababa de abrir su
 * tienda.
 *
 * Se admiten las dos formas en que Supabase puede devolver un enlace:
 *
 *   - `token_hash` + `type`, del enlace por plantilla. Es el bueno: se valida
 *     entero en el servidor, así que sirve aunque el tendero se registre en el
 *     computador y abra el correo en el celular. Requiere dejar la plantilla
 *     como se explica en el README.
 *   - `code`, del flujo PKCE, que es lo que manda Supabase con la plantilla de
 *     fábrica y también lo que devuelven Google, Facebook y Apple. Con el correo
 *     solo funciona en el mismo navegador donde se hizo el registro, porque el
 *     verificador queda en sus cookies.
 *
 * A dónde cae después depende de para qué era el enlace:
 *
 *   - **confirmar la cuenta:** al acceso, y se cierra la sesión que acababa de
 *     abrirse. Confirmar el correo demuestra que la dirección es suya, no que
 *     quien abrió el correo sea él, así que entra escribiendo sus credenciales.
 *   - **recuperar la contraseña:** a la pantalla de la contraseña nueva, con la
 *     sesión abierta, que es justo lo que hace falta para poder cambiarla.
 *   - **un proveedor:** a su panel. Ahí la identidad la acaba de comprobar
 *     Google, Facebook o Apple, y volver a pedirle contraseña no tendría
 *     sentido: puede que ni tenga una.
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

  // Solo se acepta una ruta interna: un `next` con dominio ajeno convertiría el
  // correo en un salto a otro sitio.
  const next = searchParams.get("next");
  const pedido = next && /^\/[^/\\]/.test(next) ? next : null;

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
    if (error) return alAcceso(origin, traducir(error.message));

    if (type === "recovery") {
      return NextResponse.redirect(`${origin}${pedido ?? "/admin/clave"}`);
    }

    // Cuenta confirmada: se cierra la sesión y entra él con sus credenciales.
    await supabase.auth.signOut();
    return alAcceso(origin, null, "confirmado");
  }

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return alAcceso(origin, traducir(error.message));

    // Este mismo camino sirve para el correo y para los proveedores. Cuál fue lo
    // dice el propio usuario: `email` cuando la cuenta es de correo y
    // contraseña, y el nombre del proveedor cuando entró con uno.
    const proveedor = data.user?.app_metadata?.provider ?? "email";
    if (proveedor !== "email") {
      return NextResponse.redirect(`${origin}${pedido ?? "/admin"}`);
    }

    if (pedido) return NextResponse.redirect(`${origin}${pedido}`);

    await supabase.auth.signOut();
    return alAcceso(origin, null, "confirmado");
  }

  return alAcceso(origin, "El enlace del correo está incompleto.");
}

/**
 * Al acceso, con un aviso. `motivo` va ya en español: los de Supabase pasan
 * antes por `traducir`. `bandera` es para las buenas noticias, que las pinta el
 * formulario de otro color.
 */
function alAcceso(origin: string, motivo: string | null, bandera?: string) {
  const url = new URL("/admin/login", origin);
  if (motivo) url.searchParams.set("aviso", motivo);
  if (bandera) url.searchParams.set(bandera, "1");
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
  return "No se pudo confirmar con ese enlace.";
}
