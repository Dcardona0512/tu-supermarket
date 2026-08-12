"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import ScanButton from "@/components/ScanButton";
import { setProductBarcode } from "@/app/admin/(panel)/productos/actions";
import type { Product } from "@/lib/database.types";

/**
 * Asignación de códigos producto por producto: se elige el producto, se
 * escanea su empaque y queda guardado al instante.
 */
export default function BarcodeAssigner({ products }: { products: Product[] }) {
  const router = useRouter();
  const [onlyMissing, setOnlyMissing] = useState(true);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const withCode = products.filter((p) => p.barcode).length;

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (onlyMissing && p.barcode) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.brand ?? "").toLowerCase().includes(q)
      );
    });
  }, [products, onlyMissing, search]);

  async function assign(productId: string, code: string | null) {
    setSaving(productId);
    setError(null);
    setSaved(null);

    const res = await setProductBarcode(productId, code);
    setSaving(null);

    if (!res.ok) {
      setError(res.error ?? "No se pudo guardar el código");
      return;
    }
    setSaved(productId);
    router.refresh();
    setTimeout(() => setSaved(null), 2000);
  }

  return (
    <div>
      <div className="mb-4 rounded-xl border border-black/5 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold">Códigos de barras</h2>
            <p className="text-xs text-neutral-500">
              Elige un producto, escanea su empaque y queda guardado.
            </p>
          </div>
          <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
            {withCode} de {products.length} con código
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto..."
            className="min-w-0 flex-1 rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
          <button
            onClick={() => setOnlyMissing((v) => !v)}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition ${
              onlyMissing
                ? "bg-brand text-brand-text"
                : "border border-black/10 text-neutral-600 hover:bg-neutral-50"
            }`}
          >
            {onlyMissing ? "Solo sin código" : "Mostrando todos"}
          </button>
        </div>
      </div>

      {error && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {list.length === 0 ? (
        <div className="rounded-xl border border-black/5 bg-white py-16 text-center">
          <p className="text-sm text-neutral-500">
            {onlyMissing
              ? "Todos los productos ya tienen código. 🎉"
              : "Ningún producto coincide con la búsqueda."}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {list.map((p) => (
            <li
              key={p.id}
              className={`flex flex-wrap items-center gap-3 rounded-xl border bg-white p-3 transition ${
                saved === p.id ? "border-green-400" : "border-black/5"
              }`}
            >
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                {p.image_url && (
                  <Image
                    src={p.image_url}
                    alt={p.name}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{p.name}</p>
                {p.barcode ? (
                  <p className="font-mono text-xs text-neutral-500">
                    {p.barcode}
                  </p>
                ) : (
                  <p className="text-xs text-neutral-400">Sin código</p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {saved === p.id && (
                  <span className="text-xs font-semibold text-green-700">
                    Guardado
                  </span>
                )}

                <ScanButton
                  label={p.barcode ? "Cambiar" : "Escanear"}
                  title={p.name}
                  onDetected={(code) => assign(p.id, code)}
                />

                {p.barcode && (
                  <button
                    onClick={() => assign(p.id, null)}
                    disabled={saving === p.id}
                    className="text-xs text-red-600 hover:underline disabled:opacity-40"
                  >
                    Quitar
                  </button>
                )}
              </div>

              {/* Alternativa manual / pistola lectora */}
              <ManualCode
                initial={p.barcode ?? ""}
                busy={saving === p.id}
                onSubmit={(code) => assign(p.id, code)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Campo para teclear el código o dispararlo con la pistola lectora. */
function ManualCode({
  initial,
  busy,
  onSubmit,
}: {
  initial: string;
  busy: boolean;
  onSubmit: (code: string) => void;
}) {
  const [value, setValue] = useState(initial);

  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && value.trim()) onSubmit(value.trim());
      }}
      disabled={busy}
      placeholder="o dispara la pistola aquí y pulsa Enter"
      className="w-full rounded-lg border border-black/10 px-3 py-1.5 font-mono text-xs outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:opacity-50"
    />
  );
}
