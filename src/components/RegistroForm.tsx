"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AccesoProveedores from "@/components/AccesoProveedores";
import ReglasClave from "@/components/ReglasClave";
import { claveValida } from "@/lib/password";

/** Lo que se acepta como nombre de usuario: sin espacios, sin arroba, sin tildes. */
const USUARIO_VALIDO = /^[a-z0-9._-]{3,30}$/;

/**
 * Alta de una tienda con código de invitación.
 *
 * El código llega por la URL cuando se comparte el enlace completo, y si no se
 * escribe a mano. Quien valida el código es la base de datos al crear la
 * cuenta: si no sirve, el alta se aborta entera y no queda usuario a medias.
 *
 * Se piden las dos cosas, correo y nombre de usuario, porque después sirven las
 * dos para entrar. El correo es el de la cuenta —Supabase solo autentica con
 * correos— y con él funcionan el confirmar y el recuperar. El usuario se guarda
 * en la tienda y el acceso lo traduce a ese correo antes de autenticar.
 */
export default function RegistroForm() {
  const router = useRouter();
  const params = useSearchParams();

  const [codigo, setCodigo] = useState(params.get("codigo") ?? "");
  const [email, setEmail] = useState("");
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState<"entrar" | "confirmar" | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!USUARIO_VALIDO.test(usuario)) {
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

    // Se comprueba antes de intentar el alta, y no por gusto: cuando el
    // disparador de la base lanza su excepción, Supabase la envuelve y el texto
    // no llega hasta aquí — el formulario recibía `{}` y eso era lo que el
    // tendero leía en pantalla. Comprobando antes se le puede decir qué pasa.
    // La puerta de verdad sigue siendo el disparador, que decide al crear.
    const [{ data: codigoSirve }, { data: usuarioLibre }] = await Promise.all([
      supabase.rpc("invitacion_valida", { p_code: codigo.trim().toUpperCase() }),
      supabase.rpc("usuario_disponible", { p_usuario: usuario }),
    ]);

    if (codigoSirve === false) {
      setLoading(false);
      setError("Ese código no sirve: no existe, ya se usó o venció.");
      return;
    }
    if (usuarioLibre === false) {
      setLoading(false);
      setError("Ese nombre de usuario ya lo tiene otra tienda. Elige otro.");
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        // La base lee estos dos de aquí: valida el código, crea la tienda y le
        // guarda el usuario, todo en la misma operación. Si el usuario ya está
        // tomado, el alta se aborta entera y no queda una cuenta a medias.
        data: {
          invite_code: codigo.trim().toUpperCase(),
          usuario,
        },
        // A dónde vuelve el tendero al pulsar el enlace del correo. Se toma del
        // navegador y no de una constante para que funcione igual en local, en
        // una vista previa y en producción.
        emailRedirectTo: `${window.location.origin}/auth/confirmar`,
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(traducir(signUpError.message));
      return;
    }

    // Con confirmación de correo activada no hay sesión todavía.
    if (data.session) {
      setListo("entrar");
      router.push("/admin");
      router.refresh();
    } else {
      setListo("confirmar");
    }
  }

  if (listo === "confirmar") {
    return (
      <Marco>
        <h1 className="text-lg font-bold">Ya casi</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Te enviamos un correo a <strong>{email}</strong> para confirmar tu
          cuenta. Ábrelo y el enlace te trae de vuelta al acceso.
        </p>

        {/* Sus dos llaves, juntas y a la vista. Es el momento en que puede
            anotarlas; la contraseña no se muestra ni se manda por correo, que es
            donde se quedaría para siempre al alcance de cualquiera. */}
        <dl className="mt-4 space-y-1 rounded-lg bg-neutral-50 px-3 py-3 text-sm">
          <div className="flex gap-2">
            <dt className="w-20 shrink-0 text-xs text-neutral-500">
              Tu correo
            </dt>
            <dd className="min-w-0 truncate font-medium">{email}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-20 shrink-0 text-xs text-neutral-500">
              Tu usuario
            </dt>
            <dd className="min-w-0 truncate font-medium">{usuario}</dd>
          </div>
        </dl>
        <p className="mt-2 text-xs text-neutral-500">
          Con cualquiera de los dos entras, junto con la contraseña que acabas de
          elegir. Esa contraseña no la guardamos ni te la mandamos por correo:
          solo la sabes tú.
        </p>
        <p className="mt-2 text-xs text-neutral-500">
          Si el correo no llega en unos minutos, revisa la carpeta de correo no
          deseado.
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
            Te llegará un enlace para confirmarlo, y es con el que podrás
            recuperar tu contraseña.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">
            Nombre de usuario
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
            Sin espacios ni arroba. Para entrar te servirán los dos: este nombre o
            tu correo.
          </p>
        </div>

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
 *
 * El último caso es el importante: cuando el disparador del alta lanza su
 * excepción, Supabase la envuelve y aquí llega `{}` o un «Database error». Sin
 * este remate, eso era lo que aparecía en pantalla.
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
  if (mensaje.includes("usuario ya está tomado")) {
    return "Ese nombre de usuario ya lo tiene otra tienda. Elige otro.";
  }
  if (mensaje.includes("El usuario solo admite")) {
    return "El usuario va sin espacios ni arroba, entre 3 y 30 letras o números.";
  }
  if (mensaje.toLowerCase().includes("already registered")) {
    return "Ya existe una cuenta con ese correo.";
  }

  // Nada reconocible: el texto de la base se quedó por el camino. Se dice lo que
  // se sabe, que es en qué mirar, en vez de enseñar `{}`.
  const limpio = mensaje.trim();
  if (!limpio || limpio === "{}" || /database error|unexpected/i.test(limpio)) {
    return "No se pudo crear tu tienda. Revisa el código y que el nombre de usuario no esté tomado.";
  }
  return limpio;
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
