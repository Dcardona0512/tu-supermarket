"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { compressImage, formatBytes, LOGO_SIDE } from "@/lib/image";
import { initials, darken, PALETA } from "@/lib/brand";
import { formatCOP } from "@/lib/format";
import { updateStore } from "@/app/admin/(panel)/tienda/actions";
import type { StoreInfo } from "@/lib/store-context";

/**
 * Personalización de la tienda: lo que ven los clientes del tendero.
 *
 * Lleva vista previa en vivo porque nadie elige un color de marca a ciegas: se
 * ve el resultado antes de guardar.
 */
export default function StoreSettings({ store }: { store: StoreInfo }) {
  const router = useRouter();

  const [name, setName] = useState(store.name);
  const [tagline, setTagline] = useState(store.tagline ?? "");
  const [brandColor, setBrandColor] = useState(store.brandColor);
  const [logoUrl, setLogoUrl] = useState<string | null>(store.logoUrl);
  const [phone, setPhone] = useState(store.phone ?? "");
  const [address, setAddress] = useState(store.address ?? "");
  const [deliveryFee, setDeliveryFee] = useState(String(store.deliveryFee));

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageNote, setImageNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const enlace = `tusupermarket.vercel.app/${store.slug}`;

  async function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const original = e.target.files?.[0];
    if (!original) return;

    setUploading(true);
    setError(null);
    setImageNote(null);

    // Mismo camino que las fotos de producto, pero a menor tamaño
    const file = await compressImage(original, LOGO_SIDE);

    const supabase = createClient();
    const path = `${store.id}/logo/${crypto.randomUUID()}.jpg`;
    const { error: upErr } = await supabase.storage
      .from("product-images")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (upErr) {
      setUploading(false);
      setError("No se pudo subir el logo: " + upErr.message);
      return;
    }

    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    setLogoUrl(data.publicUrl);
    if (file.size < original.size) {
      setImageNote(
        `Optimizado: ${formatBytes(original.size)} → ${formatBytes(file.size)}`
      );
    }
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    const res = await updateStore({
      name,
      tagline,
      brandColor,
      logoUrl,
      phone,
      address,
      deliveryFee: Number(deliveryFee) || 0,
    });

    setSaving(false);
    if (!res.ok) {
      setError(res.error ?? "No se pudo guardar");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold">Personalizar tienda</h1>
        <p className="text-xs text-neutral-500">
          Así ven tu tienda los clientes cuando abren tu enlace.
        </p>
      </div>

      {/* Vista previa: la misma cabecera que verá el cliente */}
      <section className="mb-5 overflow-hidden rounded-xl border border-black/5 bg-white">
        <p className="border-b border-black/5 bg-neutral-50 px-4 py-2 text-xs font-medium text-neutral-500">
          Vista previa
        </p>
        <div className="flex items-center gap-2 px-4 py-3">
          {logoUrl ? (
            <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg">
              <Image
                src={logoUrl}
                alt=""
                fill
                sizes="36px"
                className="object-cover"
              />
            </span>
          ) : (
            <span
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-lg font-black text-white"
              style={{ backgroundColor: brandColor }}
            >
              {initials(name || "?")}
            </span>
          )}
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-sm font-bold">
              {name || "Nombre de tu tienda"}
            </span>
            {tagline && (
              <span className="block truncate text-xs text-neutral-500">
                {tagline}
              </span>
            )}
          </span>
          <span
            className="ml-auto shrink-0 rounded-full px-4 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: brandColor }}
          >
            Carrito
          </span>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Enlace: se muestra pero no se toca */}
        <section className="rounded-xl border border-black/5 bg-white p-5">
          <h2 className="text-sm font-bold">Tu enlace</h2>
          <p className="mt-1 text-xs text-neutral-500">
            Esta es la dirección que compartes con tus clientes. No se puede
            cambiar: si cambiara, los enlaces que ya repartiste dejarían de
            funcionar.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-lg bg-neutral-100 px-3 py-2 text-sm">
              {enlace}
            </code>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard?.writeText(`https://${enlace}`);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="shrink-0 rounded-lg border border-black/10 px-3 py-2 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50"
            >
              {copied ? "¡Copiado!" : "Copiar"}
            </button>
          </div>
        </section>

        {/* Marca */}
        <section className="rounded-xl border border-black/5 bg-white p-5">
          <h2 className="mb-3 text-sm font-bold">Tu marca</h2>

          <Field
            label="Nombre de la tienda *"
            value={name}
            onChange={setName}
            placeholder="Ej: Autoservicio La Esquina"
            maxLength={60}
          />

          <div className="mt-3">
            <Field
              label="Frase corta (opcional)"
              value={tagline}
              onChange={setTagline}
              placeholder="Ej: Domicilios en el barrio"
              maxLength={60}
            />
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-xs font-medium text-neutral-600">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {PALETA.map((c) => (
                <button
                  key={c.valor}
                  type="button"
                  onClick={() => setBrandColor(c.valor)}
                  title={c.nombre}
                  aria-label={c.nombre}
                  aria-pressed={brandColor === c.valor}
                  className={`h-9 w-9 rounded-lg transition ${
                    brandColor === c.valor
                      ? "ring-2 ring-neutral-900 ring-offset-2"
                      : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: c.valor }}
                />
              ))}
            </div>
            <p className="mt-2 text-xs text-neutral-400">
              Los botones de tu tienda usarán este color, y un tono más oscuro
              ({darken(brandColor)}) al pasar el dedo o el ratón por encima.
            </p>
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-xs font-medium text-neutral-600">
              Logo (opcional)
            </label>
            <p className="mb-2 text-xs text-neutral-400">
              Si no subes ninguno, se usan las iniciales de tu nombre sobre tu
              color, como se ve arriba.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <label className="cursor-pointer rounded-lg border border-black/10 px-3 py-2 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50">
                {uploading ? "Subiendo..." : logoUrl ? "Cambiar" : "Subir logo"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogo}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
              {logoUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setLogoUrl(null);
                    setImageNote(null);
                  }}
                  className="rounded-lg px-3 py-2 text-xs font-medium text-red-600 hover:underline"
                >
                  Quitar logo
                </button>
              )}
              {imageNote && (
                <span className="text-xs text-neutral-500">{imageNote}</span>
              )}
            </div>
          </div>
        </section>

        {/* Datos del negocio */}
        <section className="rounded-xl border border-black/5 bg-white p-5">
          <h2 className="mb-3 text-sm font-bold">Datos y domicilio</h2>

          <Field
            label="Celular de contacto"
            value={phone}
            onChange={(v) => setPhone(v.replace(/\D/g, "").slice(0, 10))}
            placeholder="Ej: 3001234567"
            type="tel"
            inputMode="numeric"
            maxLength={10}
          />

          <div className="mt-3">
            <Field
              label="Dirección"
              value={address}
              onChange={setAddress}
              placeholder="Calle, número, barrio"
            />
          </div>

          <div className="mt-3">
            <label className="mb-1 block text-xs font-medium text-neutral-600">
              Valor del domicilio
            </label>
            <input
              type="number"
              min={0}
              step={100}
              value={deliveryFee}
              onChange={(e) => setDeliveryFee(e.target.value)}
              className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            <p className="mt-1 text-xs text-neutral-400">
              Se suma al total de cada pedido a domicilio:{" "}
              {formatCOP(Number(deliveryFee) || 0)}. No cuenta como venta en tus
              informes ni en el cierre de caja.
            </p>
          </div>
        </section>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        {saved && (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
            Guardado. Tu tienda ya se ve así para tus clientes.
          </p>
        )}

        <button
          type="submit"
          disabled={saving || uploading}
          className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:bg-neutral-300"
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: "numeric" | "text" | "tel";
  maxLength?: number;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-neutral-600">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        maxLength={maxLength}
        className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
    </div>
  );
}
