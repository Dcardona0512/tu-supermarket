import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : "rvdnausjvfkrydynxjws.supabase.co";

const nextConfig: NextConfig = {
  /**
   * El acceso se mudó de `/admin/login` a `/login`, y con él las dos pantallas
   * de contraseña. Las direcciones viejas siguen llevando a la nueva porque hay
   * correos de recuperación ya enviados que apuntan a `/admin/clave`.
   *
   * No son permanentes a propósito: un 308 se queda cacheado en el navegador
   * para siempre, y esto todavía se está moviendo.
   */
  async redirects() {
    return [
      { source: "/admin/login", destination: "/login", permanent: false },
      {
        source: "/admin/recuperar",
        destination: "/recuperar",
        permanent: false,
      },
      { source: "/admin/clave", destination: "/clave", permanent: false },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHost,
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
