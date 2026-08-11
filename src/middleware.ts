import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // El panel de una tienda y el de la plataforma. `/registro` queda fuera a
  // propósito: hay que poder abrirlo sin sesión.
  matcher: ["/admin/:path*", "/plataforma/:path*"],
};
