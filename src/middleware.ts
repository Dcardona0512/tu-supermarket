import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Las dos zonas protegidas, más las pantallas donde la sesión importa aunque
  // no se bloquee el paso:
  //
  //   - `/login` para desviar a quien ya tiene la sesión abierta.
  //   - `/clave` y `/registro` para que les llegue el token refrescado. En
  //     `/registro`, quien entró con un proveedor y aún no tiene tienda ve el
  //     canje del código, y con el token vencido se le mostraría el formulario
  //     de alta como si no hubiera entrado.
  //
  // El bloqueo solo mira `/admin` y `/plataforma`; las demás se abren sin sesión.
  matcher: [
    "/admin/:path*",
    "/plataforma/:path*",
    "/login",
    "/clave",
    "/registro",
  ],
};
