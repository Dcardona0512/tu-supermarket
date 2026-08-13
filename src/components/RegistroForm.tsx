"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AccesoProveedores from "@/components/AccesoProveedores";
import ReglasClave from "@/components/ReglasClave";
import { claveValida } from "@/lib/password";
import { toLoginEmail } from "@/lib/admin-user";

/** Lo que se acepta como nombre de usuario: sin espacios, sin arroba, sin tildes. */
const USUARIO_VALIDO = /^[a-z0-9._-]{3,30}$/;

/**
 * Alta de una tienda con código de invitación.
 *
 * El código llega por la URL cuando se comparte el enlace completo, y si no se
 * escribe a mano. Quien valida el código es la base de datos al crear la
 * cuenta: si no sirve, el alta se aborta entera y no queda usuario a medias.
 *
 * Se puede abrir la tienda de dos formas, y la diferencia importa:
 *
 *   - **con un correo:** hay que confirmarlo por un enlace, y después se puede
 *     recuperar la contraseña sin ayuda de nadie.
 *   - **con un usuario:** entra de inmediato, sin correo de por medio. Es para el
 *     tendero que no tiene o no recuerda uno. El precio es que **no hay
 *     recuperación de contraseña**: si la olvida, solo la plataforma puede
 *     ayudarle.
 */
export default function RegistroForm() {
  const router = useRouter();
  const params = useSearchParams();

  const [modo, setModo] = useState<"correo" | "usuario">("correo");
  const [codigo, setCodigo] = useState(params.get("codigo") ?? "");
  const [email, setEmail] = useState("");
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState<"entrar" | "confirmar" | null>(null);

  const conUsuario = modo === "usuario";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (conUsuario && !USUARIO_VALIDO.test(usuario)) {
      setError(
        "El usuario va sin espacios ni arroba, entre 3 y 30 letras o números"
      );
      return;
    }

    if (!claveValida(password)) {
      setError("La contraseña todavía no cumple lo que se pide debajo");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    // Supabase solo autentica con correos, así que el usuario se convierte en una
    // dirección interna. La base la reconoce por el dominio y da la cuenta por
    // confirmada, porque ese buzón no existe y esperar un correo la dejaría sin
    // poder entrar nunca.
    const correoDeAcceso = conUsuario
      ? toLoginEmail(usuario)
      : email.trim().toLowerCase();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: correoDeAcceso,
      password,
      options: {
        // La base lee el código de aquí para validar la invitación y crear la
        // tienda en la misma operación.
        data: { invite_code: codigo.trim().toUpperCase() },
        // A dónde vuelve el tendero al pulsar el enlace del correo. Se toma del
        // navegador y no de una constante para que funcione igual en local, en
        // una vista previa y en producción.
        emailRedirectTo: `${window.location.origin}/auth/confirmar`,
      },
    });

    if (signUpError) {
      setLoading(false);
      setError(traducir(signUpError.message));
      return;
    }

    if (data.session) {
      setLoading(false);
      setListo("entrar");
      router.push("/admin");
      router.refresh();
      return;
    }

    // Sin sesión: con un correo de verdad toca confirmarlo. Con un usuario no hay
    // nada que confirmar —la cuenta ya nació confirmada—, así que se entra en el
    // acto. Se intenta y no se da por hecho: si algo faltara, se dice.
    if (conUsuario) {
      const { error: entrarError } = await supabase.auth.signInWithPassword({
        email: correoDeAcceso,
        password,
      });
      setLoading(false);

      if (entrarError) {
        setError(
          "Tu tienda quedó creada, pero no se pudo entrar sola. Ve al acceso y entra con tu usuario."
        );
        return;
      }
      setListo("entrar");
      router.push("/admin");
      router.refresh();
      return;
    }

    setLoading(false);
    setListo("confirmar");
  }

  if (listo === "confirmar") {
    return (
      <Marco>
        <h1 className="text-lg font-bold">Ya casi</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Te enviamos un correo a <strong>{email}</strong> para confirmar tu
          cuenta. Ábrelo y el enlace te trae de vuelta al acceso, para que entres
          con el correo y la contraseña que acabas de elegir.
        </p>
        <p className="mt-2 text-xs text-neutral-500">
          Si no lo ves en unos minutos, revisa la carpeta de correo no deseado.
        </p>
        <Link
          href="/login"
          className="mt-5 inline-block rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
        >
          Ir al acceso
        </Link>
      </Marco>
    );
  }

  return (
    <Marco>
      <div className="mb-6 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-brand text-lg font-black text-white">
          TS
        </span>
        <h1 className="mt-3 text-lg font-bold">Abre tu tienda</h1>
        <p className="text-sm text-neutral-500">
          Con el código que te dieron en TU SUPERMARKET
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
        </div>

        {/* Con qué va a entrar. Se elige antes de escribirlo, porque las dos
            opciones no son intercambiables después. */}
        <div>
          <p className="mb-1 text-xs font-medium text-neutral-600">
            ¿Con qué quieres entrar?
          </p>
          <div className="flex gap-1 rounded-lg bg-neutral-100 p-1">
            <button
              type="button"
              onClick={() => setModo("correo")}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                !conUsuario
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500"
              }`}
            >
              Mi correo
            </button>
            <button
              type="button"
              onClick={() => setModo("usuario")}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                conUsuario
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500"
              }`}
            >
              Un usuario
            </button>
          </div>
        </div>

        {conUsuario ? (
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">
              Tu usuario
            </label>
            <input
              value={usuario}
              onChange={(e) =>
                setUsuario(e.target.value.toLowerCase().replace(/\s/g, ""))
              }
              placeholder="autola50"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            <p className="mt-1 text-xs text-neutral-400">
              Sin espacios ni arroba. Es el nombre con el que entrarás.
            </p>
            {/* Que quede dicho antes de elegir, no después de olvidar la clave */}
            <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Sin correo no podrás recuperar la contraseña por tu cuenta. Si la
              olvidas, tendrás que pedirnos ayuda.
            </p>
          </div>
        ) : (
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">
              Tu correo
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              required
              className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            <p className="mt-1 text-xs text-neutral-400">
              Te llegará un enlace para confirmarlo. Con correo puedes recuperar
              tu contraseña cuando quieras.
            </p>
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">
            Tu contraseña
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              className="w-full rounded-lg border border-black/10 py-2 pl-3 pr-11 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
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
              {showPassword ? "🙈" : "👁"}
            </button>
          </div>
          <ReglasClave clave={password} />
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
          {loading ? "Creando tu tienda..." : "Crear mi tienda"}
        </button>

        <p className="text-center text-xs text-neutral-500">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-medium text-brand-ink">
            Entra aquí
          </Link>
        </p>
      </form>

      {/* Con estos no se puede mandar el código en el registro, así que después
          de entrar la aplicación lo pide, salvo que su correo ya estuviera
          reservado en la invitación. */}
      <AccesoProveedores etiqueta="o usa una cuenta que ya tengas" />
    </Marco>
  );
}

/**
 * Los errores de la base llegan como texto de excepción de Postgres. Se
 * traducen a algo que un tendero entienda.
 */
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
  if (mensaje.includes("Hace falta un código")) {
    return "Escribe el código de invitación que recibiste.";
  }
  if (mensaje.toLowerCase().includes("already registered")) {
    return "Ya existe una cuenta con ese correo.";
  }
  return mensaje;
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
