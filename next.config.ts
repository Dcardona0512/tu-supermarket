import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : "rvdnausjvfkrydynxjws.supabase.co";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHost,
        pathname: "/storage/v1/object/public/**",
      },
      // TEMPORAL — el Supabase antiguo de La 53. Su inventario se migró con las
      // fotos todavía alojadas allí, y sin esta entrada `next/image` se niega a
      // servirlas y la tienda sale sin ninguna imagen. Se quita junto con
      // `/admin/migrar-fotos` en cuanto los archivos estén aquí.
      {
        protocol: "https",
        hostname: "svoeeqodivfkmmwyqlxh.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
