"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toLoginEmail } from "@/lib/admin-user";

/**
 * Pedir el correo para volver a poner la contraseña.
 *
 * Se responde igual haya cuenta o no: decir "ese correo no existe" le confirma a
 * cualquiera qué correos tienen tienda en la plataforma.
 */
export default function RecuperarPage() {
  const [correo, setCorreo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      toLoginEmail(correo),
      {
        // La ruta canjea el enlace, abre la sesión y lo deja en la pantalla
        // donde escribe la contraseña nueva.
        redirectTo: `${window.location.origin}/auth/confirmar?next=/admin/clave`,
      }
    );

    setEnviando(false);

    // Supabase no dice si la cuenta existe, y está bien así. Un error aquí es
    // del envío: dirección mal escrita o demasiados intentos seguidos.
    if (resetError) {
      setError(
        /rate|limit|seconds/i.test(resetError.message)
          ? "Se pidieron muchos correos seguidos. Espera unos minutos."
          : "No se pudo enviar el correo. Revisa la dirección."
      );
      return;
    }
    setEnviado(true);
  }

  if (enviado) {
    return (
      <Marco>
        <h1 className="text-lg font-bold">Revisa tu correo</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Si <strong>{correo}</strong> tiene una cuenta, le llegó un enlace para
          poner una contraseña nueva. El enlace sirve una sola vez.
        </p>
        <p className="mt-2 text-xs text-neutral-500">
          Si no lo ves en unos minutos, revisa la carpeta de correo no deseado.
        </p>
        <Link
          href="/admin/login"
          className="mt-5 inline-block rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
        >
          Volver al acceso
        </Link>
      </Marco>
    );
  }

  return (
    <Marco>
      <h1 className="text-lg font-bold">Recuperar contraseña</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Te mandamos un enlace para ponerla de nuevo.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">
            Tu correo
          </label>
          <input
            type="text"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
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
          disabled={enviando}
          className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:bg-neutral-300"
        >
          {enviando ? "Enviando..." : "Enviarme el enlace"}
        </button>

        <p className="text-center text-xs text-neutral-500">
          <Link href="/admin/login" className="font-medium text-brand-ink">
            Volver al acceso
          </Link>
        </p>
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
