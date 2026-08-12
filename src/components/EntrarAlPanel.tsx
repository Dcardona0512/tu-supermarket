"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * El enlace del pie del escaparate que lleva al panel.
 *
 * Se comporta de dos maneras según de qué tienda sea la página:
 *
 *   - **una tienda de verdad:** lleva al acceso, que le pide sus credenciales.
 *   - **la demostración:** entra directo, sin usuario ni contraseña. Abre una
 *     sesión anónima y la base la reconoce como administradora de la demo. Es lo
 *     que permite mostrarle el sistema a un tendero sin darle una cuenta.
 *
 * Las sesiones anónimas hay que habilitarlas en Supabase. Mientras no lo estén,
 * el botón lo dice en vez de fallar en silencio.
 */
export default function EntrarAlPanel({ esDemo }: { esDemo: boolean }) {
  const router = useRouter();
  const [entrando, setEntrando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clases =
    "mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700";

  if (!esDemo) {
    return (
      <Link href="/login" className={clases}>
        <IconCandado />
        Entrar al panel
      </Link>
    );
  }

  async function entrar() {
    setError(null);
    setEntrando(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInAnonymously();

    if (authError) {
      setEntrando(false);
      setError(
        /anonymous/i.test(authError.message)
          ? "Falta habilitar las sesiones anónimas en Supabase."
          : "No se pudo abrir la demostración."
      );
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <>
      <button onClick={entrar} disabled={entrando} className={clases}>
        <IconCandado />
        {entrando ? "Abriendo el panel..." : "Ver el panel de administración"}
      </button>

      {error && (
        <p className="mt-2 text-xs text-red-600">{error}</p>
      )}
    </>
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
