"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resetDemo } from "@/app/admin/(panel)/actions";

/**
 * Restaura el catálogo de demostración.
 *
 * Como el panel está abierto al público, cualquiera puede crear, editar o
 * borrar cosas. Esto lo devuelve todo a como estaba.
 *
 * Pide confirmación en dos pasos a propósito: borra el historial de ventas
 * y no hay forma de deshacerlo.
 */
export default function ResetDemoButton() {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function ejecutar() {
    setError(null);
    setResultado(null);
    startTransition(async () => {
      const r = await resetDemo();
      setConfirmando(false);
      if (!r.ok) {
        setError(r.error ?? "No se pudo restaurar.");
        return;
      }
      setResultado(
        `Listo: ${r.productos} productos y ${r.categorias} categorías. Pedidos borrados.`
      );
      router.refresh();
    });
  }

  return (
    <section className="mt-6 rounded-xl border border-black/5 bg-white p-5">
      <h2 className="text-sm font-bold">Restaurar la demostración</h2>
      <p className="mt-1 text-xs text-neutral-500">
        Vuelve a dejar el catálogo de ejemplo como estaba y borra todos los
        pedidos. Útil después de que alguien pruebe el panel.
      </p>

      {!confirmando ? (
        <button
          onClick={() => {
            setConfirmando(true);
            setResultado(null);
            setError(null);
          }}
          disabled={pending}
          className="mt-3 rounded-lg border border-black/10 px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50"
        >
          Restaurar datos de demostración
        </button>
      ) : (
        <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3">
          <p className="text-xs font-medium text-amber-900">
            Esto borra todos los pedidos y el inventario actual, y no se puede
            deshacer. ¿Seguro?
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <button
              onClick={ejecutar}
              disabled={pending}
              className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              {pending ? "Restaurando..." : "Sí, restaurar"}
            </button>
            <button
              onClick={() => setConfirmando(false)}
              disabled={pending}
              className="rounded-lg px-3 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {resultado && (
        <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-xs text-green-800">
          {resultado}
        </p>
      )}
      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}
    </section>
  );
}
