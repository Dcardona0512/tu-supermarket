import { ImageResponse } from "next/og";
import { getStoreBySlug } from "@/lib/store";
import { readableText } from "@/lib/brand";

/**
 * Icono de la tienda, servido como ruta propia en lugar de con el archivo
 * especial `icon.tsx` de Next.
 *
 * El motivo es la caché: el archivo especial genera una URL con un hash del
 * build y la sirve como inmutable durante un año, así que al cambiar de color o
 * de logo el navegador seguía mostrando el icono anterior. Aquí la versión va en
 * la propia URL (`?v=`, la fecha de la última edición de la tienda), de modo que
 * personalizar produce una dirección nueva y el icono se actualiza.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);

  const lado = Number(new URL(request.url).searchParams.get("size")) || 64;
  const size = { width: lado, height: lado };

  const color = store?.brandColor ?? "#334155";

  const cabeceras = {
    // Seguro de cachear un año porque la URL cambia con cada edición
    "Cache-Control": "public, max-age=31536000, immutable",
  };

  if (store?.logoUrl) {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            background: color,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={store.logoUrl}
            alt=""
            width={lado}
            height={lado}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      ),
      { ...size, headers: cabeceras }
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: color,
          // Con color libre el blanco fijo dejaba las iniciales ilegibles
          // sobre un amarillo.
          color: readableText(color),
          fontSize: Math.round(lado * 0.46),
          fontWeight: 700,
          letterSpacing: 1,
        }}
      >
        {store?.initials ?? "?"}
      </div>
    ),
    { ...size, headers: cabeceras }
  );
}
