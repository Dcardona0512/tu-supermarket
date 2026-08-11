import { ImageResponse } from "next/og";
import { getStoreBySlug } from "@/lib/store";

/**
 * Dibuja el icono de una tienda: su logo si lo tiene, y si no sus iniciales
 * sobre su color.
 *
 * Lo comparten el icono del navegador y el de iOS, que solo se diferencian en
 * el tamaño y en el redondeo. Si la tienda no existe devuelve un cuadrado
 * neutro en lugar de fallar: un error aquí rompería la carga de la página.
 */
export async function renderStoreIcon(
  slug: string,
  size: { width: number; height: number },
  /** iOS aplica su propia máscara, así que su icono va a sangre. */
  rounded = false
) {
  const store = await getStoreBySlug(slug);
  const color = store?.brandColor ?? "#334155";
  const radius = rounded ? Math.round(size.width * 0.22) : 0;

  if (store?.logoUrl) {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            background: color,
            borderRadius: radius,
            overflow: "hidden",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={store.logoUrl}
            alt=""
            width={size.width}
            height={size.height}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      ),
      size
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
          borderRadius: radius,
          color: "#ffffff",
          // Las iniciales ocupan algo menos de la mitad del lado, igual que en
          // el distintivo de la cabecera.
          fontSize: Math.round(size.width * 0.46),
          fontWeight: 700,
          letterSpacing: 1,
        }}
      >
        {store?.initials ?? "?"}
      </div>
    ),
    size
  );
}
