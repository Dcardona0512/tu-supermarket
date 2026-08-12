import Link from "next/link";

/**
 * El pie del escaparate, con las entradas al panel.
 *
 * En la tienda de demostración hay dos, porque son dos cosas distintas:
 *
 *   - **conocer el panel:** una muestra que se abre sin cuenta. No es el panel de
 *     verdad, es una página que lo retrata, así que no hay nada que estropear.
 *   - **entrar al panel:** el acceso normal, con correo y contraseña.
 *
 * En una tienda de un cliente solo aparece la segunda: su panel no se enseña.
 */
export default function EntrarAlPanel({
  slug,
  esDemo,
}: {
  slug: string;
  esDemo: boolean;
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
      {esDemo && (
        <Link
          href={`/${slug}/panel`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 bg-white px-3 py-1.5 font-medium text-neutral-600 transition hover:bg-neutral-50 hover:text-neutral-900"
        >
          <IconoOjo />
          Conocer el panel
        </Link>
      )}

      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
      >
        <IconCandado />
        Entrar al panel
      </Link>
    </div>
  );
}

function IconoOjo() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconCandado() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}
