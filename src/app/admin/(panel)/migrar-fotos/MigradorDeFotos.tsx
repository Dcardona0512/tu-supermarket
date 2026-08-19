"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { migrarLoteDeFotos, type ResultadoLote } from "./actions";

/**
 * El botón y la barra de avance.
 *
 * Llama al servidor por lotes y vuelve a llamar hasta que no quede ninguna. El
 * bucle vive aquí y no en el servidor porque así cada lote es una petición corta
 * y el tendero ve cómo avanza en vez de mirar una pantalla quieta durante un
 * minuto.
 */
export default function MigradorDeFotos({ pendientes }: { pendientes: number }) {
  const router = useRouter();
  const [total] = useState(pendientes);
  const [quedan, setQuedan] = useState(pendientes);
  const [movidas, setMovidas] = useState(0);
  const [corriendo, setCorriendo] = useState(false);
  const [fallos, setFallos] = useState<ResultadoLote["fallos"]>([]);
  const [error, setError] = useState<string | null>(null);

  async function migrar() {
    setCorriendo(true);
    setError(null);
    let restantes = quedan;
    let hechas = movidas;

    // Se para si un lote entero no consigue mover nada: seguir llamando solo
    // repetiría el mismo fallo setenta veces.
    while (restantes > 0) {
      let lote: ResultadoLote;
      try {
        lote = await migrarLoteDeFotos();
      } catch (e) {
        setError((e as Error).message);
        break;
      }

      hechas += lote.movidas;
      restantes = lote.restantes;
      setMovidas(hechas);
      setQuedan(restantes);
      if (lote.fallos.length > 0) {
        setFallos((antes) => [...antes, ...lote.fallos]);
      }
      if (lote.movidas === 0) break;
    }

    setCorriendo(false);
    router.refresh();
  }

  const porcentaje = total === 0 ? 100 : Math.round((movidas / total) * 100);

  if (total === 0) {
    return (
      <p className="mt-5 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
        No queda ninguna foto por traer. Ya puedes borrar esta pantalla.
      </p>
    );
  }

  return (
    <div className="mt-5">
      <p className="text-sm">
        Fotos por traer: <strong>{quedan}</strong> de {total}
      </p>

      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-neutral-200">
        <div
          className="h-full bg-brand transition-all"
          style={{ width: `${porcentaje}%` }}
        />
      </div>

      <button
        onClick={migrar}
        disabled={corriendo || quedan === 0}
        className="mt-4 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-text transition hover:bg-brand-dark disabled:bg-neutral-300"
      >
        {corriendo ? `Trayendo... ${movidas} de ${total}` : "Traer las fotos"}
      </button>

      {quedan === 0 && movidas > 0 && (
        <p className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
          Listo, {movidas} fotos traídas. Ya puedes pausar el proyecto viejo.
        </p>
      )}

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {fallos.length > 0 && (
        <div className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold">
            {fallos.length} no se pudieron traer:
          </p>
          <ul className="mt-1 list-disc pl-5 text-xs">
            {fallos.map((f, i) => (
              <li key={i}>
                {f.producto} — {f.motivo}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
