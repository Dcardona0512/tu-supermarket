"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ReglasClave from "@/components/ReglasClave";
import { claveValida } from "@/lib/password";

/**
 * Poner la contraseña nueva.
 *
 * Aquí se llega desde el enlace del correo, que ya dejó la sesión abierta al
 * pasar por `/auth/confirmar`. Sirve igual para cambiarla estando dentro.
 */
export default function ClavePage() {
  const router = useRouter();
  const [clave, setClave] = useState("");
  const [repetida, setRepetida] = useState("");
  const [verClave, setVerClave] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conSesion, setConSesion] = useState<boolean | null>(null);

  // Sin sesión no hay contraseña que cambiar: pasa si el enlace ya se usó o si
  // alguien abre esta dirección a pelo.
  useEffect(() => {
    const supabase = createClient();
    void supabase.auth
      .getUser()
      .then(({ data }) => setConSesion(Boolean(data.user)));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!claveValida(clave)) {
      setError("La contraseña todavía no cumple lo que se pide debajo");
      return;
    }
    if (clave !== repetida) {
      setError("Las dos contraseñas no son iguales");
      return;
    }

    setGuardando(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password: clave,
    });
    setGuardando(false);

    if (updateError) {
      setError(
        /should be different|same as/i.test(updateError.message)
          ? "Esa es la contraseña que ya tenías. Escribe una distinta."
          : updateError.message
      );
      return;
    }

    setListo(true);
    router.refresh();
  }

  if (conSesion === false) {
    return (
      <Marco>
        <h1 className="text-lg font-bold">Ese enlace ya no sirve</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Los enlaces de recuperación sirven una sola vez. Pide uno nuevo.
        </p>
        <Link
          href="/admin/recuperar"
          className="mt-5 inline-block rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-text transition hover:bg-brand-dark"
        >
          Pedir otro enlace
        </Link>
      </Marco>
    );
  }

  if (listo) {
    return (
      <Marco>
        <h1 className="text-lg font-bold">Contraseña cambiada</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Ya puedes entrar con la nueva.
        </p>
        <Link
          href="/admin"
          className="mt-5 inline-block rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-text transition hover:bg-brand-dark"
        >
          Ir a mi panel
        </Link>
      </Marco>
    );
  }

  return (
    <Marco>
      <h1 className="text-lg font-bold">Nueva contraseña</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Escríbela dos veces para no equivocarte.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">
            Contraseña nueva
          </label>
          <div className="relative">
            <input
              type={verClave ? "text" : "password"}
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              autoComplete="new-password"
              required
              className="w-full rounded-lg border border-black/10 py-2 pl-3 pr-11 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            <button
              type="button"
              onClick={() => setVerClave((v) => !v)}
              aria-label={verClave ? "Ocultar contraseña" : "Mostrar contraseña"}
              aria-pressed={verClave}
              className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-lg text-neutral-400 transition hover:text-neutral-700"
            >
              {verClave ? "🙈" : "👁"}
            </button>
          </div>
          <ReglasClave clave={clave} />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">
            Repítela
          </label>
          <input
            type={verClave ? "text" : "password"}
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

        <button
          type="submit"
          disabled={guardando || conSesion === null}
          className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-text transition hover:bg-brand-dark disabled:bg-neutral-300"
        >
          {guardando ? "Guardando..." : "Guardar contraseña"}
        </button>
      </form>
    </Marco>
  );
}

function Marco({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center bg-neutral-100 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
        {children}
      </div>
    </div>
  );
}
