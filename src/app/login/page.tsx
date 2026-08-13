"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AccesoProveedores from "@/components/AccesoProveedores";

export default function AdminLoginPage() {
  // El formulario lee la dirección para mostrar el aviso que puede dejar el
  // enlace del correo, y eso obliga a envolverlo.
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  // Los dos los deja `/auth/confirmar`: `aviso` cuando el enlace del correo
  // falló, `confirmado` cuando salió bien y ya solo falta que entre.
  const aviso = params.get("aviso");
  const confirmado = params.get("confirmado") === "1";
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /** El mismo mensaje para todo lo que falle: si no, el formulario diría cuáles
   *  usuarios y correos existen. */
  const NO_COINCIDE =
    "Los datos no coinciden. Revisa tu correo o usuario y tu contraseña.";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const entrada = user.trim().toLowerCase();

    // Supabase autentica por correo. Si escribió su nombre de usuario, hay que
    // traducirlo antes: la tienda guarda cuál es el correo de ese usuario.
    let correo = entrada;
    if (!entrada.includes("@")) {
      const { data } = await supabase.rpc("correo_de_usuario", {
        p_usuario: entrada,
      });
      if (!data) {
        setLoading(false);
        setError(NO_COINCIDE);
        return;
      }
      correo = data;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: correo,
      password,
    });

    if (signInError) {
      setLoading(false);
      setError(NO_COINCIDE);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="grid min-h-screen place-items-center bg-neutral-100 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-brand text-lg font-black text-white">
            TS
          </span>
          <h1 className="mt-3 text-lg font-bold">Panel de administración</h1>
          <p className="text-sm tracking-wide text-neutral-500">TU SUPERMARKET</p>
        </div>

        {confirmado && !error && (
          <p className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-xs text-green-800">
            ¡Tu cuenta quedó confirmada! Entra con tu correo y tu contraseña.
          </p>
        )}

        {aviso && !error && (
          <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {aviso} Entra por aquí.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">
              Correo o usuario
            </label>
            <input
              type="text"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              required
            />
          </div>
          <div>
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <label className="text-xs font-medium text-neutral-600">
                Contraseña
              </label>
              <Link
                href="/recuperar"
                className="text-xs font-medium text-brand-ink hover:underline"
              >
                ¿La olvidaste?
              </Link>
            </div>
            {/* El ojo deja comprobar lo que se escribió: en el celular es fácil
                equivocarse y el error de acceso no dice en qué campo falló. */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full rounded-lg border border-black/10 py-2 pl-3 pr-11 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-lg text-neutral-400 transition hover:text-neutral-700"
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:bg-neutral-300"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <AccesoProveedores />
      </div>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg
      width="18"
      height="18"
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

function EyeOffIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10.6 6.2A9.9 9.9 0 0 1 12 6c6.4 0 10 6 10 6a17 17 0 0 1-3 3.6M6.6 6.8A17 17 0 0 0 2 12s3.6 7 10 7a9.7 9.7 0 0 0 4.3-.9" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      <path d="m2 2 20 20" />
    </svg>
  );
}
