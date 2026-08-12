"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Aviso permanente del panel de la demostración, con el botón de restaurar.
 *
 * A este panel entra cualquiera desde el escaparate, sin contraseña, y puede
 * cambiar lo que quiera. El botón es lo que hace que eso no sea un problema: en
 * un clic la demostración vuelve a su catálogo, su marca y sus tres pedidos de
 * ejemplo.
 *
 * Se pide confirmación porque el visitante puede haber estado mostrándole algo a
 * alguien y no espera que un botón le borre lo que acaba de escribir.
 */
export default function DemoBanner() {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [restaurando, setRestaurando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function restaurar() {
    setError(null);
    setRestaurando(true);

    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc("reset_demo");

    setRestaurando(false);
    setConfirmando(false);

    if (rpcError) {
      setError("No se pudo restaurar: " + rpcError.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex flex-wrap items-start gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-700">
          <IconoOjo />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-amber-900">
            Estás en la demostración
          </p>
          <p className="mt-0.5 text-xs text-amber-800">
            Prueba lo que quieras: crea productos, cambia precios, atiende
            pedidos. No es una tienda real y nada de esto le afecta a nadie.
            Cuando quieras, devuélvela a como estaba.
          </p>
          <p className="mt-1 text-xs text-amber-700">
            Lo único que no se puede aquí es subir fotos.
          </p>
        </div>

        {confirmando ? (
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={restaurar}
              disabled={restaurando}
              className="rounded-lg bg-amber-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-800 disabled:bg-neutral-300"
            >
              {restaurando ? "Restaurando..." : "Sí, restaurar"}
            </button>
            <button
              onClick={() => setConfirmando(false)}
              disabled={restaurando}
              className="rounded-lg border border-amber-300 px-3 py-2 text-xs font-semibold text-amber-900 transition hover:bg-amber-100"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmando(true)}
            className="shrink-0 rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-900 transition hover:bg-amber-100"
          >
            Restaurar la demostración
          </button>
        )}
      </div>

      {confirmando && !restaurando && (
        <p className="mt-3 text-xs text-amber-800">
          Se borra todo lo que hayas cambiado y vuelven el catálogo de muestra y
          los tres pedidos de ejemplo.
        </p>
      )}

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

function IconoOjo() {
  return (
    <svg
      width="16"
      height="16"
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
