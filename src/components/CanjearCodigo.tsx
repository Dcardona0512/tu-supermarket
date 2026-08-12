"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Canje del código para quien ya entró pero todavía no tiene tienda.
 *
 * Es el caso del tendero que entra con Google, Facebook o Apple sin que su
 * correo estuviera reservado en la invitación: la cuenta se crea, pero la tienda
 * la abre este código. Así el control de quién trabaja en la plataforma sigue
 * siendo del código, no del proveedor.
 */
export default function CanjearCodigo({ correo }: { correo: string }) {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");
  const [canjeando, setCanjeando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCanjeando(true);

    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc("canjear_invitacion", {
      p_code: codigo.trim().toUpperCase(),
    });

    if (rpcError) {
      setCanjeando(false);
      setError(traducir(rpcError.message));
      return;
    }

    // La tienda ya existe: el panel la encuentra en cuanto se recarga.
    router.push("/admin");
    router.refresh();
  }

  async function salir() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="grid min-h-screen place-items-center bg-neutral-100 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-brand text-lg font-black text-brand-text">
            TS
          </span>
          <h1 className="mt-3 text-lg font-bold">Falta tu código</h1>
          <p className="text-sm text-neutral-500">
            Entraste como <strong>{correo}</strong>, pero esta cuenta todavía no
            tiene tienda.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">
              Código de invitación
            </label>
            <input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              placeholder="ABCD-2345"
              autoCapitalize="characters"
              spellCheck={false}
              required
              className="w-full rounded-lg border border-black/10 px-3 py-2 font-mono text-sm tracking-widest outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            <p className="mt-1 text-xs text-neutral-400">
              Es el que te dieron en TU SUPERMARKET.
            </p>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={canjeando}
            className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-text transition hover:bg-brand-dark disabled:bg-neutral-300"
          >
            {canjeando ? "Abriendo tu tienda..." : "Abrir mi tienda"}
          </button>

          <p className="text-center text-xs text-neutral-500">
            ¿Entraste con la cuenta equivocada?{" "}
            <button
              type="button"
              onClick={salir}
              className="font-medium text-brand-ink"
            >
              Salir
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}

/** Los mensajes vienen como excepción de Postgres. */
function traducir(mensaje: string): string {
  if (mensaje.includes("no existe")) {
    return "Ese código no existe. Revísalo con quien te lo dio.";
  }
  if (mensaje.includes("ya se usó")) {
    return "Ese código ya se usó para abrir otra tienda.";
  }
  if (mensaje.includes("venció")) {
    return "Ese código ya venció. Pide uno nuevo.";
  }
  if (mensaje.includes("ya tiene una tienda")) {
    return "Esta cuenta ya tiene una tienda.";
  }
  if (mensaje.includes("iniciar sesión")) {
    return "Se cerró la sesión. Vuelve a entrar.";
  }
  if (mensaje.includes("Hace falta un código")) {
    return "Escribe el código de invitación que recibiste.";
  }
  return mensaje;
}
