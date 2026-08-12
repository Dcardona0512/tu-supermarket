"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createCategory,
  renameCategory,
  deleteCategory,
  moveCategory,
} from "@/app/admin/(panel)/productos/actions";
import { buildTree } from "@/lib/categories";
import type { Category, Product } from "@/lib/database.types";

/**
 * Gestión de categorías en dos niveles: categorías principales y, dentro de
 * cada una, sus subcategorías.
 *
 * Al eliminar no se borra ningún producto: los que la usaban quedan
 * "sin categoría", y se avisa cuántos son antes de confirmar.
 */
export default function CategoryManager({
  categories,
  products,
  onClose,
}: {
  categories: Category[];
  products: Product[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  // Categoría principal a la que le estamos agregando una subcategoría
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [subName, setSubName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tree = buildTree(categories);

  const countFor = (id: string) =>
    products.filter((p) => p.category_id === id).length;

  /** Una categoría principal "tiene" también los productos de sus subcategorías. */
  const countWithChildren = (cat: Category) => {
    const hijas = categories.filter((c) => c.parent_id === cat.id);
    return countFor(cat.id) + hijas.reduce((s, h) => s + countFor(h.id), 0);
  };

  async function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setBusy(true);
    setError(null);
    const res = await fn();
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "No se pudo completar la acción");
      return false;
    }
    router.refresh();
    return true;
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    const ok = await run(() => createCategory(newName));
    if (ok) setNewName("");
  }

  async function handleAddSub(e: React.FormEvent, parentId: string) {
    e.preventDefault();
    if (!subName.trim()) return;
    const ok = await run(() => createCategory(subName, parentId));
    if (ok) {
      setSubName("");
      setAddingTo(null);
    }
  }

  async function handleRename(id: string) {
    if (!editingName.trim()) return;
    const ok = await run(() => renameCategory(id, editingName));
    if (ok) setEditingId(null);
  }

  async function handleDelete(cat: Category, subcount = 0) {
    const used = cat.parent_id ? countFor(cat.id) : countWithChildren(cat);
    const avisos = [
      subcount > 0
        ? `Se eliminarán también sus ${subcount} subcategoría(s).`
        : "",
      used > 0
        ? `${used} producto(s) quedarán sin categoría (no se eliminan).`
        : "",
    ].filter(Boolean);

    const texto = `¿Eliminar "${cat.name}"?${
      avisos.length ? `\n\n${avisos.join("\n")}` : ""
    }`;
    if (!confirm(texto)) return;
    await run(() => deleteCategory(cat.id));
  }

  function startRename(c: Category) {
    setEditingId(c.id);
    setEditingName(c.name);
    setError(null);
  }

  /**
   * A dónde se puede mover una categoría. Una principal que ya tiene
   * subcategorías no puede meterse dentro de otra: solo hay dos niveles.
   */
  function destinos(c: Category): { id: string; label: string }[] {
    const tieneHijas = categories.some((x) => x.parent_id === c.id);
    if (tieneHijas) return [];
    return [
      { id: "", label: "Categoría principal" },
      ...tree
        .filter((n) => n.category.id !== c.id)
        .map((n) => ({ id: n.category.id, label: `Dentro de ${n.category.name}` })),
    ];
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-bold">Categorías</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700"
          >
            ✕
          </button>
        </div>
        <p className="mb-4 text-xs text-neutral-500">
          Cada categoría puede tener subcategorías dentro. Los productos nunca
          se borran: quedan sin categoría.
        </p>

        {/* Crear categoría principal */}
        <form onSubmit={handleAdd} className="mb-4 flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nueva categoría"
            className="flex-1 rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
          <button
            type="submit"
            disabled={busy || !newName.trim()}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-text hover:bg-brand-dark disabled:bg-neutral-300"
          >
            Agregar
          </button>
        </form>

        {error && (
          <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        )}

        {tree.length === 0 ? (
          <p className="py-8 text-center text-sm text-neutral-400">
            No hay categorías todavía.
          </p>
        ) : (
          <ul className="divide-y divide-black/5">
            {tree.map(({ category, children }) => (
              <li key={category.id} className="py-2">
                <Fila
                  nombre={category.name}
                  productos={countWithChildren(category)}
                  editando={editingId === category.id}
                  valorEdicion={editingName}
                  onCambioEdicion={setEditingName}
                  onGuardar={() => handleRename(category.id)}
                  onCancelar={() => setEditingId(null)}
                  onRenombrar={() => startRename(category)}
                  onEliminar={() => handleDelete(category, children.length)}
                  busy={busy}
                  destinos={destinos(category)}
                  destinoActual=""
                  onMover={(destino) =>
                    run(() => moveCategory(category.id, destino || null))
                  }
                />

                {/* Subcategorías */}
                {children.length > 0 && (
                  <ul className="mt-1 space-y-1 border-l-2 border-black/5 pl-3">
                    {children.map((sub) => (
                      <li key={sub.id}>
                        <Fila
                          nombre={sub.name}
                          productos={countFor(sub.id)}
                          editando={editingId === sub.id}
                          valorEdicion={editingName}
                          onCambioEdicion={setEditingName}
                          onGuardar={() => handleRename(sub.id)}
                          onCancelar={() => setEditingId(null)}
                          onRenombrar={() => startRename(sub)}
                          onEliminar={() => handleDelete(sub)}
                          busy={busy}
                          pequeña
                          destinos={destinos(sub)}
                          destinoActual={sub.parent_id ?? ""}
                          onMover={(destino) =>
                            run(() => moveCategory(sub.id, destino || null))
                          }
                        />
                      </li>
                    ))}
                  </ul>
                )}

                {/* Agregar subcategoría */}
                {addingTo === category.id ? (
                  <form
                    onSubmit={(e) => handleAddSub(e, category.id)}
                    className="mt-2 flex gap-2 pl-3"
                  >
                    <input
                      value={subName}
                      onChange={(e) => setSubName(e.target.value)}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          setAddingTo(null);
                          setSubName("");
                        }
                      }}
                      placeholder={`Subcategoría de ${category.name}`}
                      className="flex-1 rounded-lg border border-black/10 px-2 py-1.5 text-sm outline-none focus:border-brand"
                    />
                    <button
                      type="submit"
                      disabled={busy || !subName.trim()}
                      className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-brand-text hover:bg-brand-dark disabled:bg-neutral-300"
                    >
                      Crear
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAddingTo(null);
                        setSubName("");
                      }}
                      className="text-xs text-neutral-500 hover:underline"
                    >
                      Cancelar
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => {
                      setAddingTo(category.id);
                      setSubName("");
                      setError(null);
                    }}
                    className="mt-1 pl-3 text-xs font-medium text-brand-ink hover:underline"
                  >
                    + Subcategoría
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Fila({
  nombre,
  productos,
  editando,
  valorEdicion,
  onCambioEdicion,
  onGuardar,
  onCancelar,
  onRenombrar,
  onEliminar,
  busy,
  pequeña,
  destinos,
  destinoActual,
  onMover,
}: {
  nombre: string;
  productos: number;
  editando: boolean;
  valorEdicion: string;
  onCambioEdicion: (v: string) => void;
  onGuardar: () => void;
  onCancelar: () => void;
  onRenombrar: () => void;
  onEliminar: () => void;
  busy: boolean;
  pequeña?: boolean;
  /** A dónde se puede mover. Vacío = no se puede mover. */
  destinos: { id: string; label: string }[];
  destinoActual: string;
  onMover: (destino: string) => void;
}) {
  if (editando) {
    return (
      <div className="flex items-center gap-2">
        <input
          value={valorEdicion}
          onChange={(e) => onCambioEdicion(e.target.value)}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") onGuardar();
            if (e.key === "Escape") onCancelar();
          }}
          className="flex-1 rounded-lg border border-black/10 px-2 py-1.5 text-sm outline-none focus:border-brand"
        />
        <button
          onClick={onGuardar}
          disabled={busy}
          className="text-xs font-medium text-brand-ink hover:underline"
        >
          Guardar
        </button>
        <button
          onClick={onCancelar}
          className="text-xs text-neutral-500 hover:underline"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span
        className={`flex-1 ${pequeña ? "text-sm text-neutral-700" : "text-sm font-medium"}`}
      >
        {nombre}
        <span className="ml-2 text-xs text-neutral-400">
          {productos} producto{productos === 1 ? "" : "s"}
        </span>
      </span>
      {destinos.length > 0 && (
        <select
          value={destinoActual}
          disabled={busy}
          onChange={(e) => onMover(e.target.value)}
          title="Mover a otra categoría"
          className="max-w-[9rem] shrink-0 rounded-md border border-black/10 bg-white px-1 py-0.5 text-xs text-neutral-600 outline-none focus:border-brand"
        >
          {destinos.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>
      )}
      <button
        onClick={onRenombrar}
        className="text-xs font-medium text-brand-ink hover:underline"
      >
        Renombrar
      </button>
      <button
        onClick={onEliminar}
        disabled={busy}
        className="text-xs font-medium text-red-600 hover:underline"
      >
        Eliminar
      </button>
    </div>
  );
}
