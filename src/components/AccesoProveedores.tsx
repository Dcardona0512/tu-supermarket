"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { proveedoresHabilitados, type Proveedor } from "@/lib/proveedores";

/**
 * Botones para entrar con Google, Facebook o Apple.
 *
 * Sirven igual para registrarse que para volver a entrar: el proveedor no
 * distingue, y Supabase crea la cuenta la primera vez. Quién termina con tienda
 * lo sigue decidiendo la invitación:
 *
 *   - si su correo estaba reservado en el código que generaste, su tienda se
 *     crea sola al entrar;
 *   - si no, entra sin tienda y la aplicación le pide el código.
 */
export default function AccesoProveedores({
  etiqueta = "o entra con",
}: {
  /** El texto de la línea divisoria. En el registro conviene otro. */
  etiqueta?: string;
}) {
  const [cargando, setCargando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [proveedores, setProveedores] = useState<Proveedor[] | null>(null);

  useEffect(() => {
    let vivo = true;
    void proveedoresHabilitados().then((lista) => {
      if (vivo) setProveedores(lista);
    });
    return () => {
      vivo = false;
    };
  }, []);

  // Mientras no se sepa, no se dibuja nada: un botón que aparece y desaparece
  // es peor que uno que tarda medio segundo en aparecer.
  if (proveedores === null || proveedores.length === 0) return null;

  async function entrar(p: Proveedor) {
    setError(null);
    setCargando(p.id);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: p.id,
      options: {
        // Vuelve a la misma ruta que el correo de confirmación, que ya sabe
        // canjear el código y abrir la sesión.
        redirectTo: `${window.location.origin}/auth/confirmar`,
      },
    });

    // Si sale bien, el navegador ya se fue al proveedor y esto no se ejecuta.
    if (authError) {
      setCargando(null);
      setError(traducir(authError.message, p.nombre));
    }
  }

  return (
    <div>
      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-black/10" />
        <span className="text-xs text-neutral-400">{etiqueta}</span>
        <span className="h-px flex-1 bg-black/10" />
      </div>

      <div className="space-y-2">
        {proveedores.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => entrar(p)}
            disabled={cargando !== null}
            className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50"
          >
            <Logo id={p.id} />
            {cargando === p.id ? "Abriendo..." : `Continuar con ${p.nombre}`}
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * El error más probable es el de un proveedor que todavía no se habilitó en
 * Supabase, y tal cual llega no dice qué hacer.
 */
function traducir(mensaje: string, nombre: string): string {
  if (/not enabled|unsupported provider/i.test(mensaje)) {
    return `Entrar con ${nombre} todavía no está habilitado.`;
  }
  return `No se pudo abrir ${nombre}: ${mensaje}`;
}

function Logo({ id }: { id: Proveedor["id"] }) {
  if (id === "google") {
    return (
      <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden="true">
        <path
          fill="#EA4335"
          d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
        />
        <path
          fill="#4285F4"
          d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
        />
        <path
          fill="#FBBC05"
          d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
        />
        <path
          fill="#34A853"
          d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
        />
      </svg>
    );
  }

  if (id === "facebook") {
    return (
      <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="#1877F2"
          d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.25h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07z"
        />
      </svg>
    );
  }

  return (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#111111"
        d="M17.05 12.54c.02 2.83 2.48 3.77 2.5 3.78-.02.06-.4 1.35-1.31 2.68-.79 1.15-1.61 2.29-2.9 2.31-1.27.02-1.68-.75-3.13-.75-1.45 0-1.9.73-3.1.78-1.25.05-2.2-1.23-3-2.37-1.71-2.37-2.96-6.67-1.29-9.55.83-1.44 2.31-2.35 3.92-2.37 1.23-.02 2.39.83 3.13.83.75 0 2.16-1.02 3.64-.87.62.03 2.36.22 3.48 1.7-.09.06-2.08 1.21-2.06 3.61M14.63 4.7c.66-.8 1.1-1.91.98-3.02-.98.04-2.16.65-2.85 1.45-.62.71-1.14 1.84-1 2.93 1.09.08 2.21-.55 2.87-1.36"
      />
    </svg>
  );
}
