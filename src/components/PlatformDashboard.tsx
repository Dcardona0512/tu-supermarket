"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createInvite,
  setStorePublished,
  deleteInvite,
} from "@/app/plataforma/actions";

type Store = {
  id: string;
  slug: string;
  name: string;
  isPublished: boolean;
  createdAt: string;
};

type Invite = {
  id: string;
  code: string;
  storeName: string;
  slug: string;
  usada: boolean;
  vencida: boolean;
  expira: string;
};

/**
 * Panel de la plataforma: qué tiendas trabajan y quién puede entrar.
 *
 * Solo muestra el estado de cada tienda, no sus datos de negocio: para dar de
 * alta y suspender no hace falta ver los productos ni los pedidos de nadie.
 */
export default function PlatformDashboard({
  stores,
  invites,
}: {
  stores: Store[];
  invites: Invite[];
}) {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [enlace, setEnlace] = useState("");
  const [creando, setCreando] = useState(false);
  const [nuevoCodigo, setNuevoCodigo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);

  const activas = stores.filter((s) => s.isPublished).length;
  const pendientes = invites.filter((i) => !i.usada && !i.vencida).length;

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setCreando(true);
    setError(null);
    setNuevoCodigo(null);

    const res = await createInvite(nombre, enlace);
    setCreando(false);

    if (!res.ok) {
      setError(res.error ?? "No se pudo crear la invitación");
      return;
    }
    setNuevoCodigo(res.code ?? null);
    setNombre("");
    setEnlace("");
    router.refresh();
  }

  async function cambiarEstado(id: string, publicar: boolean) {
    const res = await setStorePublished(id, publicar);
    if (!res.ok) {
      setError(res.error ?? "No se pudo cambiar el estado");
      return;
    }
    router.refresh();
  }

  async function retirar(id: string) {
    const res = await deleteInvite(id);
    if (!res.ok) {
      setError(res.error ?? "No se pudo retirar");
      return;
    }
    router.refresh();
  }

  function copiar(texto: string, marca: string) {
    void navigator.clipboard?.writeText(texto);
    setCopiado(marca);
    setTimeout(() => setCopiado(null), 1500);
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      <header className="border-b border-black/5 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-sm font-black text-white">
            TS
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="text-sm font-bold">TU SUPERMARKET</p>
            <p className="text-xs text-neutral-500">
              Administración de la plataforma
            </p>
          </div>
          <Link
            href="/admin"
            className="rounded-lg border border-black/10 px-3 py-2 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50"
          >
            Mi tienda
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-5 px-4 py-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Tile label="Tiendas" value={String(stores.length)} />
          <Tile label="Trabajando" value={String(activas)} accent />
          <Tile label="Invitaciones sin usar" value={String(pendientes)} />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {/* Dar de alta */}
        <section className="rounded-xl border border-black/5 bg-white p-5">
          <h2 className="text-sm font-bold">Invitar una tienda</h2>
          <p className="mt-1 text-xs text-neutral-500">
            Reservas su nombre y su enlace, y le entregas el código. Ella se
            registra con su correo y elige su propia contraseña: tú nunca la
            conoces.
          </p>

          <form onSubmit={crear} className="mt-3 flex flex-wrap items-end gap-2">
            <div className="min-w-48 flex-1">
              <label className="mb-1 block text-xs font-medium text-neutral-600">
                Nombre de la tienda
              </label>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Autoservicio La Esquina"
                required
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <div className="min-w-40 flex-1">
              <label className="mb-1 block text-xs font-medium text-neutral-600">
                Enlace (opcional)
              </label>
              <input
                value={enlace}
                onChange={(e) => setEnlace(e.target.value)}
                placeholder="se genera del nombre"
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <button
              type="submit"
              disabled={creando}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:bg-neutral-300"
            >
              {creando ? "Creando..." : "Crear código"}
            </button>
          </form>

          {nuevoCodigo && (
            <div className="mt-3 rounded-lg border border-brand/20 bg-brand/5 p-3">
              <p className="text-xs font-semibold text-brand-dark">
                Código listo. Pásaselo a la tienda junto con el enlace de
                registro.
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <code className="rounded-md bg-white px-3 py-1.5 font-mono text-lg font-bold tracking-widest">
                  {nuevoCodigo}
                </code>
                <button
                  onClick={() => copiar(nuevoCodigo, "codigo")}
                  className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold"
                >
                  {copiado === "codigo" ? "¡Copiado!" : "Copiar código"}
                </button>
                <button
                  onClick={() =>
                    copiar(
                      `https://tusupermarket.vercel.app/registro?codigo=${nuevoCodigo}`,
                      "enlace"
                    )
                  }
                  className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold"
                >
                  {copiado === "enlace" ? "¡Copiado!" : "Copiar enlace"}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Tiendas */}
        <section className="rounded-xl border border-black/5 bg-white p-5">
          <h2 className="mb-3 text-sm font-bold">Tiendas</h2>
          {stores.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-400">
              Todavía no hay ninguna tienda.
            </p>
          ) : (
            <ul className="divide-y divide-black/5">
              {stores.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center gap-2 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{s.name}</p>
                    <p className="truncate text-xs text-neutral-500">
                      /{s.slug} · desde {s.createdAt}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      s.isPublished
                        ? "bg-green-50 text-green-700"
                        : "bg-neutral-100 text-neutral-500"
                    }`}
                  >
                    {s.isPublished ? "trabajando" : "suspendida"}
                  </span>
                  <button
                    onClick={() => cambiarEstado(s.id, !s.isPublished)}
                    className="shrink-0 rounded-lg border border-black/10 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50"
                  >
                    {s.isPublished ? "Suspender" : "Reactivar"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Invitaciones */}
        {invites.length > 0 && (
          <section className="rounded-xl border border-black/5 bg-white p-5">
            <h2 className="mb-3 text-sm font-bold">Invitaciones</h2>
            <ul className="divide-y divide-black/5">
              {invites.map((i) => (
                <li
                  key={i.id}
                  className="flex flex-wrap items-center gap-2 py-3"
                >
                  <code className="shrink-0 rounded bg-neutral-100 px-2 py-1 font-mono text-xs font-bold tracking-wider">
                    {i.code}
                  </code>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{i.storeName}</p>
                    <p className="truncate text-xs text-neutral-500">
                      /{i.slug} · vence {i.expira}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      i.usada
                        ? "bg-green-50 text-green-700"
                        : i.vencida
                          ? "bg-red-50 text-red-700"
                          : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {i.usada ? "usada" : i.vencida ? "vencida" : "sin usar"}
                  </span>
                  {!i.usada && (
                    <button
                      onClick={() => retirar(i.id)}
                      className="shrink-0 rounded-lg px-2 py-1.5 text-xs font-medium text-red-600 hover:underline"
                    >
                      Retirar
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}

function Tile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        accent ? "border-brand/20 bg-brand/5" : "border-black/5 bg-white"
      }`}
    >
      <p className="text-xs font-medium text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
