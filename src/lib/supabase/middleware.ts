import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAdminArea =
    path.startsWith("/admin") || path.startsWith("/plataforma");
  const isLoginPage = path === "/admin/login";

  // Cuelgan de `/admin` pero son justo para quien no puede entrar. `/admin/clave`
  // se deja pasar sin sesión a propósito: así explica que el enlace ya se usó,
  // en vez de rebotar al acceso sin decir por qué. Sin sesión no puede cambiar
  // ninguna contraseña.
  const esPublica =
    isLoginPage || path === "/admin/recuperar" || path === "/admin/clave";

  // Proteger el dashboard: sin sesión -> login
  if (isAdminArea && !esPublica && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  // Si ya hay sesión y visita el login, enviarlo al dashboard
  if (isLoginPage && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
