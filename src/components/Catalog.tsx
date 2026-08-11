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

  const tree = useMemo(() => buildTree(categories), [categories]);
  const subcategorias = useMemo(
    () => tree.find((n) => n.category.id === rootId)?.children ?? [],
    [tree, rootId]
  );

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

  function elegirRoot(id: string | "all") {
    setRootId(id);
    setSubId(null);
  }

  return (
    <div>
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-brand to-brand-dark p-6 text-white">
        <h1 className="text-2xl font-bold sm:text-3xl">
          Haz tu mercado en línea
        </h1>
        <p className="mt-1 max-w-xl text-sm text-white/90">
          Elige tus productos y confirma tu pedido. Pagas en efectivo o por
          transferencia cuando lo recibas. Sin registro, es muy fácil.
        </p>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar producto o marca..."
          className="w-full rounded-lg border border-black/10 bg-white px-4 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      </div>

      {/* Categorías principales */}
      <div className="mb-3 flex flex-wrap gap-2">
        <CategoryChip
          active={rootId === "all"}
          onClick={() => elegirRoot("all")}
          label="Todos"
        />
        {tree.map(({ category }) => (
          <CategoryChip
            key={category.id}
            active={rootId === category.id}
            onClick={() => elegirRoot(category.id)}
            label={category.name}
          />
        ))}
      </div>

      {/* Subcategorías de la categoría elegida */}
      {subcategorias.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2 border-l-2 border-brand/30 pl-3">
          <SubChip
            active={subId === null}
            onClick={() => setSubId(null)}
            label="Todo"
          />
          {subcategorias.map((c) => (
            <SubChip
              key={c.id}
              active={subId === c.id}
              onClick={() => setSubId(c.id)}
              label={c.name}
            />
          ))}
        </div>
      )}

      {subcategorias.length === 0 && <div className="mb-6" />}

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

function CategoryChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
        active
          ? "bg-brand text-brand-text"
          : "bg-white text-neutral-600 hover:bg-neutral-100"
      }`}
    >
      {label}
    </button>
  );
}

/** Las subcategorías van más discretas, para que se vea que dependen de la de arriba. */
function SubChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
        active
          ? "bg-brand/15 text-brand-dark"
          : "bg-white text-neutral-500 hover:bg-neutral-100"
      }`}
    >
      {label}
    </button>
  );
}
