"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { initials, readableText } from "@/lib/brand";

/** Nombre de la herramienta, el mismo para todas las tiendas que la usan. */
const PLATAFORMA = "TU SUPERMARKET";

type NavLink = {
  href: string;
  label: string;
  exact?: boolean;
  icon: React.ReactNode;
};

const LINKS: NavLink[] = [
  { href: "/admin", label: "Resumen", exact: true, icon: <IconHome /> },
  { href: "/admin/venta", label: "Venta en tienda", icon: <IconRegister /> },
  { href: "/admin/inventario", label: "Inventario", icon: <IconBox /> },
  { href: "/admin/productos", label: "Productos", icon: <IconTag /> },
  { href: "/admin/pedidos", label: "Pedidos", icon: <IconList /> },
  { href: "/admin/informes", label: "Informes", icon: <IconChart /> },
  { href: "/admin/tienda", label: "Personalizar tienda", icon: <IconPaint /> },
];

/**
 * Barra lateral izquierda. Se muestra siempre como una franja de iconos y se
 * despliega con el botón de tres puntos para ver los nombres.
 */
export default function AdminSidebar({
  user,
  pendingOrders = 0,
  storeName,
  storeSlug,
  storeLogoUrl = null,
  storeBrandColor = "#1d4ed8",
}: {
  user: string;
  /** Pedidos en línea sin atender, para avisar en el menú. */
  pendingOrders?: number;
  /** Nombre de la tienda del dueño, en la cabecera del menú. */
  storeName: string;
  /** Para que "Ver tienda" lleve a su enlace público. */
  storeSlug: string;
  /** Logo de la tienda. Si no hay, se usan sus iniciales. */
  storeLogoUrl?: string | null;
  /** Color de la tienda, solo para el distintivo: el resto del panel no cambia. */
  storeBrandColor?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const close = () => setOpen(false);

  return (
    <>
      {/* Al desplegarse, tocar fuera lo cierra */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/30"
          onClick={close}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-black/5 bg-white ${
          open ? "w-56 shadow-lg" : "w-20"
        }`}
      >
        {/* Logo y botón de menú, ambos dentro del ancho de la franja */}
        <div className="flex h-14 shrink-0 items-center gap-1 border-b border-black/5 px-1.5">
          {/* El tendero entra a su propio panel: su negocio va primero, y la
              herramienta firma debajo. El distintivo lleva su logo, o sus
              iniciales sobre su color si todavía no ha subido ninguno. */}
          {storeLogoUrl ? (
            <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg">
              <Image
                src={storeLogoUrl}
                alt={storeName}
                fill
                sizes="32px"
                className="object-cover"
              />
            </span>
          ) : (
            <span
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-sm font-black"
              style={{
                backgroundColor: storeBrandColor,
                color: readableText(storeBrandColor),
              }}
            >
              {initials(storeName)}
            </span>
          )}
          {open && (
            <span className="ml-1 min-w-0 flex-1 leading-tight">
              <span className="block truncate text-sm font-bold" title={storeName}>
                {storeName}
              </span>
              <span className="block truncate text-xs text-neutral-500">
                {PLATAFORMA}
              </span>
            </span>
          )}
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Contraer menú" : "Desplegar menú"}
            aria-expanded={open}
            title={open ? "Contraer menú" : "Desplegar menú"}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-800"
          >
            <IconMenu />
          </button>
        </div>

        {/* Secciones */}
        <nav className="flex-1 overflow-y-auto p-2">
          <ul className="space-y-1">
            {LINKS.map((l) => {
              const active = l.exact
                ? pathname === l.href
                : pathname.startsWith(l.href);
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={close}
                    title={l.label}
                    className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      active
                        ? "bg-brand/10 text-brand-ink"
                        : "text-neutral-600 hover:bg-neutral-100"
                    } ${open ? "" : "justify-center px-0"}`}
                  >
                    <span className="shrink-0">{l.icon}</span>
                    {open && <span className="truncate">{l.label}</span>}

                    {/* Pedidos por atender */}
                    {l.href === "/admin/pedidos" && pendingOrders > 0 && (
                      <span
                        className={`grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-xs font-bold text-white ${
                          open ? "ml-auto" : "absolute right-1 top-1"
                        }`}
                      >
                        {pendingOrders}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Pie: tienda, usuario y salir */}
        <div className="shrink-0 border-t border-black/5 p-2">
          <Link
            href={`/${storeSlug}`}
            target="_blank"
            title="Ver tienda"
            onClick={close}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 ${
              open ? "" : "justify-center px-0"
            }`}
          >
            <span className="shrink-0">
              <IconStore />
            </span>
            {open && <span className="truncate">Ver tienda</span>}
          </Link>

          {/* Aquí había un atajo a la administración de la plataforma. Se quitó
              al separar las dos: este panel es de la tienda y nada más, y quien
              administra la plataforma no atiende ninguna tienda. */}

          {open && (
            <p className="truncate px-3 pt-2 text-xs text-neutral-400">
              {user}
            </p>
          )}

          <button
            onClick={logout}
            title="Salir"
            className={`mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 ${
              open ? "" : "justify-center px-0"
            }`}
          >
            <span className="shrink-0">
              <IconExit />
            </span>
            {open && <span className="truncate">Salir</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

/* --- Iconos --- */

function svgProps() {
  return {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
}

function IconMenu() {
  return (
    <svg {...svgProps()} strokeWidth={2}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function IconHome() {
  return (
    <svg {...svgProps()}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </svg>
  );
}

function IconRegister() {
  return (
    <svg {...svgProps()}>
      <rect x="3" y="9" width="18" height="12" rx="2" />
      <path d="M7 9V5h10v4M7 14h4" />
    </svg>
  );
}

function IconBox() {
  return (
    <svg {...svgProps()}>
      <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" />
      <path d="m3 8 9 5 9-5M12 13v8" />
    </svg>
  );
}

function IconTag() {
  return (
    <svg {...svgProps()}>
      <path d="M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9-9-9Z" />
      <circle cx="7.5" cy="7.5" r="1.2" />
    </svg>
  );
}

function IconList() {
  return (
    <svg {...svgProps()}>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg {...svgProps()}>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
  );
}

function IconStore() {
  return (
    <svg {...svgProps()}>
      <path d="M4 9h16v11H4zM3 9l1.5-5h15L21 9" />
      <path d="M9 20v-6h6v6" />
    </svg>
  );
}

/** Brocha: personalizar el aspecto de la tienda. */
function IconPaint() {
  return (
    <svg {...svgProps()}>
      <path d="M19 3H5a2 2 0 0 0-2 2v4h18V5a2 2 0 0 0-2-2Z" />
      <path d="M13 9v4a2 2 0 0 1-2 2h-1v3a2 2 0 0 0 4 0v-3" />
    </svg>
  );
}

function IconExit() {
  return (
    <svg {...svgProps()}>
      <path d="M15 17v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v2" />
      <path d="M10 12h11m0 0-3-3m3 3-3 3" />
    </svg>
  );
}
