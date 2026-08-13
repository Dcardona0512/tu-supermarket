import { formatDay } from "@/lib/format";

/**
 * Los datos de la cuenta del tendero, de solo lectura.
 *
 * Las dos formas de entrar van juntas porque el usuario es fácil de olvidar: casi
 * nunca se escribe, y el día que haga falta no está en ninguna otra parte.
 *
 * Y la fecha de alta, para que sepa desde cuándo trabaja con la plataforma. Sale
 * de cuándo se creó su tienda, que es el mismo momento en que abrió su cuenta.
 */
export default function DatosDeLaCuenta({
  correo,
  usuario,
  desde,
}: {
  correo: string;
  usuario: string | null;
  /** Fecha de alta en ISO, tal como viene de la base. */
  desde: string;
}) {
  return (
    <section className="rounded-xl border border-black/5 bg-white p-5">
      <h2 className="text-sm font-bold">Tu cuenta</h2>

      <dl className="mt-3 divide-y divide-black/5 text-sm">
        <Fila etiqueta="Correo" valor={correo} />
        <Fila etiqueta="Usuario" valor={usuario ?? "—"} />
        <Fila
          etiqueta="Cliente desde"
          valor={formatDay(desde)}
          nota="El día que abriste tu tienda en TU SUPERMARKET."
        />
      </dl>

      <p className="mt-3 text-xs text-neutral-500">
        Para entrar te sirve cualquiera de los dos, el correo o el usuario, junto
        con tu contraseña.
      </p>
    </section>
  );
}

function Fila({
  etiqueta,
  valor,
  nota,
}: {
  etiqueta: string;
  valor: string;
  nota?: string;
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 py-2.5">
      <dt className="w-28 shrink-0 text-xs text-neutral-500">{etiqueta}</dt>
      <dd className="min-w-0 flex-1">
        <span className="block truncate font-medium">{valor}</span>
        {nota && <span className="block text-xs text-neutral-400">{nota}</span>}
      </dd>
    </div>
  );
}
