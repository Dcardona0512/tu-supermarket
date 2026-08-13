"use client";

import { useMemo, useState } from "react";
import ProductCard from "@/components/ProductCard";
import { buildTree, categoryWithChildren } from "@/lib/categories";
import type { Category, Product } from "@/lib/database.types";

export default function Catalog({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
}) {
  const [search, setSearch] = useState("");
  // Categoría principal elegida y, dentro de ella, la subcategoría
  const [rootId, setRootId] = useState<string | "all">("all");
  const [subId, setSubId] = useState<string | null>(null);
  // El acordeón arranca cerrado: lo primero que se ve son los productos.
  const [abierto, setAbierto] = useState(false);

  const tree = useMemo(() => buildTree(categories), [categories]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    // Una categoría principal muestra también lo que hay en sus subcategorías
    const permitidas =
      rootId === "all"
        ? null
        : subId
          ? new Set([subId])
          : categoryWithChildren(categories, rootId);

    return products.filter((p) => {
      const matchesCat =
        !permitidas || (p.category_id != null && permitidas.has(p.category_id));
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.brand ?? "").toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [products, categories, search, rootId, subId]);

  /**
   * Lo que se muestra en la cabecera del acordeón: qué está filtrado ahora.
   *
   * Hace falta justo porque las categorías dejan de estar a la vista: si no se
   * dice aquí, el cliente no tiene forma de saber por qué el catálogo se le
   * quedó corto.
   */
  const seleccion = useMemo(() => {
    if (rootId === "all") return "Todas las categorías";
    const rama = tree.find((n) => n.category.id === rootId);
    if (!rama) return "Todas las categorías";
    if (!subId) return rama.category.name;
    const sub = rama.children.find((c) => c.id === subId);
    return sub ? `${rama.category.name} · ${sub.name}` : rama.category.name;
  }, [tree, rootId, subId]);

  function elegir(root: string | "all", sub: string | null = null) {
    setRootId(root);
    setSubId(sub);
    // Elegir es el final de la tarea: se cierra y quedan los productos a la vista
    setAbierto(false);
  }

  return (
    <div>
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-brand to-brand-dark p-6 text-brand-text">
        <h1 className="text-2xl font-bold sm:text-3xl">
          Haz tu mercado en línea
        </h1>
        <p className="mt-1 max-w-xl text-sm text-brand-text/90">
          Elige tus productos y confirma tu pedido. Pagas en efectivo o por
          transferencia cuando lo recibas. Sin registro, es muy fácil.
        </p>
      </div>

      <div className="mb-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar producto o marca..."
          className="w-full rounded-lg border border-black/10 bg-white px-4 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      </div>

      {/* Categorías, en acordeón. Antes estaban todas desplegadas y con muchas
          categorías eso empujaba los productos fuera de la pantalla, sobre todo
          en el celular. */}
      {tree.length > 0 && (
        <div className="mb-6 overflow-hidden rounded-xl border border-black/10 bg-white">
          <button
            onClick={() => setAbierto((v) => !v)}
            aria-expanded={abierto}
            className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-neutral-50"
          >
            <IconoCategorias />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">Categorías</span>
              <span className="block truncate text-xs text-neutral-500">
                {seleccion}
              </span>
            </span>
            {rootId !== "all" && (
              <span className="shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand-ink">
                filtrando
              </span>
            )}
            <IconoChevron abierto={abierto} />
          </button>

          {abierto && (
            <div className="border-t border-black/5 p-4">
              {/* Una columna por categoría principal, con sus subcategorías
                  debajo. En el celular queda una sola columna. */}
              <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                {tree.map(({ category, children }) => {
                  const activaLaRama = rootId === category.id;
                  return (
                    <div key={category.id} className="min-w-0">
                      <button
                        onClick={() => elegir(category.id)}
                        className={`block w-full truncate text-left text-sm font-bold transition ${
                          activaLaRama && !subId
                            ? "text-brand-ink"
                            : "text-neutral-900 hover:text-brand-ink"
                        }`}
                      >
                        {category.name}
                      </button>

                      {children.length > 0 && (
                        <ul className="mt-1.5 space-y-1 border-l border-black/10 pl-3">
                          {children.map((c) => (
                            <li key={c.id}>
                              <button
                                onClick={() => elegir(category.id, c.id)}
                                className={`block w-full truncate text-left text-sm transition ${
                                  subId === c.id
                                    ? "font-semibold text-brand-ink"
                                    : "text-neutral-600 hover:text-brand-ink"
                                }`}
                              >
                                {c.name}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>

              {rootId !== "all" && (
                <button
                  onClick={() => elegir("all")}
                  className="mt-5 rounded-lg border border-black/10 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50"
                >
                  Ver todas las categorías
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-sm text-neutral-500">
          No se encontraron productos.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function IconoCategorias() {
  return (
    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand-ink">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    </span>
  );
}

function IconoChevron({ abierto }: { abierto: boolean }) {
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
      className={`shrink-0 text-neutral-400 transition-transform ${
        abierto ? "rotate-180" : ""
      }`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
