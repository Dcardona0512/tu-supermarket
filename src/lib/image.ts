/** Lado máximo de la foto de producto. Suficiente para verla con zoom. */
const MAX_SIDE = 1400;
/** Un logo se ve pequeño en la cabecera: no necesita el tamaño de una foto. */
export const LOGO_SIDE = 320;
const QUALITY = 0.82;

/**
 * Reduce y comprime una foto en el navegador antes de subirla.
 *
 * Las fotos de celular pesan varios MB: subirlas tal cual hace lenta la tienda
 * para el cliente y roza el límite del almacenamiento. Se respeta la
 * orientación EXIF para que no salgan giradas.
 *
 * Si el resultado no mejora el original, se devuelve el archivo tal cual.
 */
export async function compressImage(
  file: File,
  maxSide: number = MAX_SIDE
): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  try {
    const bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    });

    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    // Fondo blanco: al pasar a JPEG las zonas transparentes saldrían negras
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", QUALITY)
    );

    if (!blob || blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, "") || "foto";
    return new File([blob], `${name}.jpg`, { type: "image/jpeg" });
  } catch {
    // Si el navegador no puede procesarla, se sube la original
    return file;
  }
}

/** Tamaño legible para mostrarle al usuario, ej: "2,9 MB". */
export function formatBytes(bytes: number): string {
  if (bytes >= 1_048_576) {
    return `${(bytes / 1_048_576).toFixed(1).replace(".", ",")} MB`;
  }
  return `${Math.round(bytes / 1024)} KB`;
}
