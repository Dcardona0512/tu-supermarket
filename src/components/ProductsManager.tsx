"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatCOP } from "@/lib/format";
import CategoryManager from "@/components/CategoryManager";
import ScanButton from "@/components/ScanButton";
import { compressImage, formatBytes } from "@/lib/image";
import { EXPIRY_STYLES, expiryStatus } from "@/lib/expiry";
import { categoryOptions, categoryPath } from "@/lib/categories";
import {
  saveProduct,
  deleteProduct,
  createCategory,
  type ProductInput,
} from "@/app/admin/(panel)/productos/actions";
import type { Category, Product } from "@/lib/database.types";

type Props = {
  products: Product[];
  categories: Category[];
};

const emptyForm: ProductInput = {
  name: "",
  barcode: "",
  description: "",
  brand: "",
  category_id: null,
  price: 0,
  cost_price: 0,
  discount_price: null,
  unit: "unidad",
  stock: 0,
  image_url: null,
  is_active: true,
  expires_at: null,
};

export default function ProductsManager({ products, categories }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState<ProductInput | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

  function openNew() {
    setEditing({ ...emptyForm });
    setShowForm(true);
  }

  function openEdit(p: Product) {
    setEditing({
      id: p.id,
      name: p.name,
      barcode: p.barcode ?? "",
      description: p.description ?? "",
      brand: p.brand ?? "",
      category_id: p.category_id,
      price: Number(p.price),
      cost_price: Number(p.cost_price ?? 0),
      discount_price: p.discount_price != null ? Number(p.discount_price) : null,
      unit: p.unit,
      stock: p.stock,
      image_url: p.image_url,
      is_active: p.is_active,
      expires_at: p.expires_at,
    });
    setShowForm(true);
  }

  async function handleDelete(p: Product) {
    if (!confirm(`¿Eliminar "${p.name}"?`)) return;
    const res = await deleteProduct(p.id);
    if (!res.ok) alert(res.error);
    else router.refresh();
  }

  function categoryName(id: string | null) {
    return categoryPath(categories, id) ?? "—";
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold">Productos</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCategories(true)}
            className="rounded-lg border border-black/10 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Categorías
          </button>
          <button
            onClick={openNew}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            + Nuevo producto
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-black/5 bg-white">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="border-b border-black/5 text-left text-xs uppercase text-neutral-400">
            <tr>
              <th className="px-4 py-3 font-medium">Producto</th>
              <th className="px-4 py-3 font-medium">Categoría</th>
              <th className="px-4 py-3 font-medium">Costo</th>
              <th className="px-4 py-3 font-medium">Precio</th>
              <th className="px-4 py-3 font-medium">Margen</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Vence</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {products.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-neutral-400">
                  No hay productos. Crea el primero.
                </td>
              </tr>
            )}
            {products.map((p) => {
              const hasDiscount =
                p.discount_price != null && p.discount_price < p.price;
              const sellPrice = hasDiscount ? p.discount_price! : p.price;
              const cost = Number(p.cost_price ?? 0);
              const unitProfit = sellPrice - cost;
              const marginPct = sellPrice
                ? Math.round((unitProfit / sellPrice) * 100)
                : 0;
              return (
                <tr key={p.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-black/5 bg-white">
                        {p.image_url && (
                          <Image
                            src={p.image_url}
                            alt={p.name}
                            fill
                            sizes="40px"
                            className="object-contain p-0.5"
                          />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-neutral-400">
                          {p.brand}
                          {p.brand && p.barcode ? " · " : ""}
                          {p.barcode && (
                            <span className="font-mono">{p.barcode}</span>
                          )}
                          {!p.brand && !p.barcode && "—"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {categoryName(p.category_id)}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {cost > 0 ? (
                      formatCOP(cost)
                    ) : (
                      <span className="text-neutral-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{formatCOP(sellPrice)}</span>
                    {hasDiscount && (
                      <span className="ml-1 text-xs text-neutral-400 line-through">
                        {formatCOP(p.price)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {cost > 0 ? (
                      <span
                        className={
                          unitProfit < 0
                            ? "font-semibold text-red-600"
                            : "text-neutral-700"
                        }
                      >
                        {formatCOP(unitProfit)}
                        <span className="ml-1 text-xs text-neutral-400">
                          {marginPct}%
                        </span>
                      </span>
                    ) : (
                      <span className="text-xs text-neutral-300">
                        sin costo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        p.stock <= 5 ? "font-semibold text-red-600" : ""
                      }
                    >
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {p.expires_at ? (
                      <span
                        className={`text-xs ${
                          EXPIRY_STYLES[expiryStatus(p.expires_at).tone]
                        }`}
                      >
                        {expiryStatus(p.expires_at).label}
                      </span>
                    ) : (
                      <span className="text-xs text-neutral-300">No vence</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {p.is_active ? (
                      <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
                        Visible
                      </span>
                    ) : (
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-500">
                        Oculto
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEdit(p)}
                      className="mr-2 text-xs font-medium text-brand-dark hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
                      className="text-xs font-medium text-red-600 hover:underline"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showForm && editing && (
        <ProductForm
          initial={editing}
          categories={categories}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            router.refresh();
          }}
        />
      )}

      {showCategories && (
        <CategoryManager
          categories={categories}
          products={products}
          onClose={() => setShowCategories(false)}
        />
      )}
    </div>
  );
}

function ProductForm({
  initial,
  categories,
  onClose,
  onSaved,
}: {
  initial: ProductInput;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<ProductInput>(initial);
  const [cats, setCats] = useState<Category[]>(categories);
  const [hasExpiry, setHasExpiry] = useState(Boolean(initial.expires_at));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageNote, setImageNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof ProductInput>(key: K, value: ProductInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const original = e.target.files?.[0];
    if (!original) return;

    setUploading(true);
    setError(null);
    setImageNote(null);

    // Las fotos de celular pesan varios MB: se reducen antes de subirlas
    const file = await compressImage(original);

    const supabase = createClient();
    const path = `${crypto.randomUUID()}.jpg`;
    const { error: upErr } = await supabase.storage
      .from("product-images")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (upErr) {
      setUploading(false);
      setError("No se pudo subir la imagen: " + upErr.message);
      return;
    }

    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    set("image_url", data.publicUrl);

    if (file.size < original.size) {
      setImageNote(
        `Optimizada: ${formatBytes(original.size)} → ${formatBytes(file.size)}`
      );
    }
    setUploading(false);
  }

  /**
   * Atajo para no salir del formulario. Crea una categoría principal; las
   * subcategorías se manejan en el botón "Categorías" de la lista.
   */
  async function handleNewCategory() {
    const name = prompt("Nombre de la nueva categoría principal:");
    if (!name) return;
    const res = await createCategory(name);
    if (!res.ok || !res.id) {
      alert(res.error ?? "Error al crear categoría");
      return;
    }
    const newCat: Category = {
      id: res.id,
      name: name.trim(),
      parent_id: null,
      created_at: "",
    };
    setCats((c) => [...c, newCat]);
    set("category_id", res.id);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (hasExpiry && !form.expires_at) {
      setError("Indica la fecha de vencimiento o desmarca la casilla.");
      return;
    }

    setSaving(true);
    const res = await saveProduct(form);
    setSaving(false);
    if (!res.ok) {
      setError(res.error ?? "Error al guardar");
      return;
    }
    onSaved();
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {form.id ? "Editar producto" : "Nuevo producto"}
          </h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Imagen */}
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-black/10 bg-white">
              {form.image_url && (
                <Image
                  src={form.image_url}
                  alt="preview"
                  fill
                  sizes="80px"
                  className="object-contain p-1"
                />
              )}
            </div>
            <div>
              <label className="cursor-pointer rounded-lg border border-black/10 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
                {uploading ? "Subiendo..." : "Subir imagen"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImage}
                  disabled={uploading}
                />
              </label>
              {form.image_url && (
                <button
                  type="button"
                  onClick={() => {
                    set("image_url", null);
                    setImageNote(null);
                  }}
                  className="ml-2 text-xs text-red-600 hover:underline"
                >
                  Quitar
                </button>
              )}
              {imageNote && (
                <p className="mt-1 text-xs text-green-700">{imageNote}</p>
              )}
            </div>
          </div>

          <Input
            label="Nombre *"
            value={form.name}
            onChange={(v) => set("name", v)}
          />

          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">
              Código de barras
            </label>
            <div className="flex gap-2">
              <input
                value={form.barcode}
                onChange={(e) => set("barcode", e.target.value)}
                placeholder="Escanea o escribe el código"
                className="w-full rounded-lg border border-black/10 px-3 py-2 font-mono text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
              <ScanButton
                onDetected={(code) => set("barcode", code)}
                title="Escanear producto"
              />
            </div>
            <p className="mt-1 text-xs text-neutral-400">
              Usa la cámara o, con el campo enfocado, dispara la pistola
              lectora.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">
              Descripción
            </label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={2}
              className="w-full resize-none rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Marca"
              value={form.brand}
              onChange={(v) => set("brand", v)}
            />
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-600">
                Categoría
              </label>
              <div className="flex gap-1">
                <select
                  value={form.category_id ?? ""}
                  onChange={(e) => set("category_id", e.target.value || null)}
                  className="w-full rounded-lg border border-black/10 px-2 py-2 text-sm outline-none focus:border-brand"
                >
                  <option value="">Sin categoría</option>
                  {/* Las subcategorías van con sangría, debajo de la suya */}
                  {categoryOptions(cats).map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.isChild ? `   ${o.label}` : o.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleNewCategory}
                  title="Nueva categoría"
                  className="shrink-0 rounded-lg border border-black/10 px-2 text-sm hover:bg-neutral-50"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <NumberInput
              label="Costo *"
              value={form.cost_price}
              onChange={(v) => set("cost_price", v ?? 0)}
            />
            <NumberInput
              label="Precio venta *"
              value={form.price}
              onChange={(v) => set("price", v ?? 0)}
            />
            <NumberInput
              label="Oferta"
              value={form.discount_price}
              onChange={(v) => set("discount_price", v)}
              nullable
            />
          </div>

          <MarginHint
            cost={form.cost_price}
            price={form.discount_price ?? form.price}
          />

          <div className="grid grid-cols-2 gap-3">
            <NumberInput
              label="Stock *"
              value={form.stock}
              onChange={(v) => set("stock", v ?? 0)}
              integer
            />
            <Input
              label="Unidad de medida"
              value={form.unit}
              onChange={(v) => set("unit", v)}
              placeholder="unidad, kg, litro..."
            />
          </div>

          {/* Vencimiento: no todos los productos vencen */}
          <div className="rounded-lg bg-neutral-50 p-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={hasExpiry}
                onChange={(e) => {
                  setHasExpiry(e.target.checked);
                  if (!e.target.checked) set("expires_at", null);
                }}
                className="h-4 w-4 accent-brand"
              />
              Este producto tiene fecha de vencimiento
            </label>

            {hasExpiry && (
              <div className="mt-2">
                <input
                  type="date"
                  value={form.expires_at ?? ""}
                  onChange={(e) => set("expires_at", e.target.value || null)}
                  className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
                {form.expires_at && (
                  <ExpiryNote date={form.expires_at} />
                )}
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => set("is_active", e.target.checked)}
              className="h-4 w-4 accent-brand"
            />
            Visible en la tienda
          </label>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-black/10 px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="flex-1 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:bg-neutral-300"
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/** Aviso bajo el campo de fecha mientras se edita el producto. */
function ExpiryNote({ date }: { date: string }) {
  const { label, tone } = expiryStatus(date);
  return <p className={`mt-1.5 text-xs ${EXPIRY_STYLES[tone]}`}>{label}</p>;
}

/** Muestra la ganancia por unidad y el margen mientras se edita el producto. */
function MarginHint({ cost, price }: { cost: number; price: number }) {
  if (!price) return null;

  const profit = price - cost;
  const margin = Math.round((profit / price) * 100);
  const negative = profit < 0;

  return (
    <div
      className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs ${
        negative ? "bg-red-50 text-red-700" : "bg-neutral-50 text-neutral-600"
      }`}
    >
      <span>
        {negative ? "Estás vendiendo por debajo del costo" : "Ganancia por unidad"}
      </span>
      <span className="font-semibold">
        {formatCOP(profit)}
        {cost > 0 && <span className="ml-1 font-normal">({margin}% margen)</span>}
      </span>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-neutral-600">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  nullable,
  integer,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  nullable?: boolean;
  integer?: boolean;
}) {
  /**
   * El texto se guarda aparte del número para poder dejar el campo vacío
   * mientras se escribe: si se forzara el valor, al borrar reaparecería el 0
   * y habría que sortearlo con el cursor.
   */
  const [text, setText] = useState(value == null ? "" : String(value));

  function handleChange(raw: string) {
    setText(raw);

    if (raw.trim() === "") {
      onChange(nullable ? null : 0);
      return;
    }
    const n = integer ? parseInt(raw, 10) : parseFloat(raw);
    if (!Number.isNaN(n)) onChange(n);
  }

  /** Al salir del campo se muestra lo que realmente se va a guardar. */
  function handleBlur() {
    if (text.trim() === "") {
      if (!nullable) setText("0");
      return;
    }
    const n = integer ? parseInt(text, 10) : parseFloat(text);
    setText(Number.isNaN(n) ? (nullable ? "" : "0") : String(n));
  }

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-neutral-600">
        {label}
      </label>
      <input
        type="number"
        min={0}
        step={integer ? 1 : "any"}
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        onFocus={(e) => e.target.select()}
        className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
    </div>
  );
}
