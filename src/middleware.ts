import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // El panel de una tienda, el de la plataforma y el registro. `/registro` entra
  // solo para que le refresque la sesión: quien ya entró con un proveedor y aún
  // no tiene tienda ve ahí el canje del código, y con el token vencido se le
  // mostraría el formulario de alta como si no hubiera entrado. Sin sesión sigue
  // abriéndose igual; el bloqueo solo mira `/admin` y `/plataforma`.
  matcher: ["/admin/:path*", "/plataforma/:path*", "/registro"],
};
