"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ReglasClave from "@/components/ReglasClave";
import { claveValida } from "@/lib/password";

/**
 * Cambiar la contraseña desde dentro del panel.
 *
 * Se pide **la contraseña actual** aunque la sesión ya esté abierta. Supabase no
 * la exige, pero un panel se queda abierto en el mostrador de una tienda: sin ese
 * campo, cualquiera que pase por ahí un minuto se queda con la cuenta. Se
 * comprueba iniciando sesión con ella antes de cambiar nada.
 *
 * Las reglas de la contraseña nueva son las mismas del registro, del mismo
 * archivo, para que no pueda pasar aquí lo que allá se rechaza.
 */
export default function CambiarClave({ correo }: { correo: string }) {
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [repetida, setRepetida] = useState("");
  const [ver, setVer] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setListo(false);

    if (!claveValida(nueva)) {
      setError("La contraseña nueva todavía no cumple lo que se pide debajo");
      return;
    }
    if (nueva !== repetida) {
      setError("Las dos contraseñas nuevas no son iguales");
      return;
    }
    if (nueva === actual) {
      setError("La contraseña nueva es igual a la actual");
      return;
    }

    setGuardando(true);
    const supabase = createClient();

    // Comprobar que quien está al teclado es el dueño de la cuenta
    const { error: errorActual } = await supabase.auth.signInWithPassword({
      email: correo,
      password: actual,
    });

    if (errorActual) {
      setGuardando(false);
      setError("La contraseña actual no es correcta");
      return;
    }

    const { error: errorCambio } = await supabase.auth.updateUser({
      password: nueva,
    });
    setGuardando(false);

    if (errorCambio) {
      setError(
        /should be different|same as/i.test(errorCambio.message)
          ? "Esa es la contraseña que ya tenías. Escribe una distinta."
          : errorCambio.message
      );
      return;
    }

    setListo(true);
    setActual("");
    setNueva("");
    setRepetida("");
  }

  return (
    <section className="rounded-xl border border-black/5 bg-white p-5">
      <h2 className="text-sm font-bold">Cambiar contraseña</h2>
      <p className="mt-1 text-xs text-neutral-500">
        La próxima vez entras con la nueva. Las sesiones que tengas abiertas en
        otros dispositivos siguen abiertas.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 max-w-sm space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">
            Contraseña actual
          </label>
          <input
            type={ver ? "text" : "password"}
            value={actual}
            onChange={(e) => setActual(e.target.value)}
            autoComplete="current-password"
            required
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>

        <div>
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <label className="text-xs font-medium text-neutral-600">
              Contraseña nueva
            </label>
            <button
              type="button"
              onClick={() => setVer((v) => !v)}
              aria-pressed={ver}
              className="text-xs font-medium text-brand-ink"
            >
              {ver ? "Ocultar" : "Ver"}
            </button>
          </div>
          <input
            type={ver ? "text" : "password"}
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
            autoComplete="new-password"
            required
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
          <ReglasClave clave={nueva} />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">
            Repite la nueva
          </label>
          <input
            type={ver ? "text" : "password"}
            value={repetida}
            onChange={(e) => setRepetida(e.target.value)}
            autoComplete="new-password"
            required
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        )}

        {listo && (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-xs text-green-800">
            Listo, tu contraseña quedó cambiada.
          </p>
        )}

        <button
          type="submit"
          disabled={guardando}
          className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-text transition hover:bg-brand-dark disabled:bg-neutral-300"
        >
          {guardando ? "Cambiando..." : "Cambiar contraseña"}
        </button>
      </form>
    </section>
  );
}
