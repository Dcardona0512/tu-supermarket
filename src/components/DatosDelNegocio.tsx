"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { digitoVerificacion, soloDigitos } from "@/lib/documento";
import { updateDatosDelNegocio } from "@/app/admin/(panel)/configuracion/actions";
import type { StoreInfo } from "@/lib/store-context";

/**
 * Los datos con los que el negocio se identifica en un papel.
 *
 * Es la pestaña que hoy arregla los comprobantes —el del punto de venta y el PDF
 * del cierre de caja salen sin NIT ni razón social— y la que después alimentará
 * la factura electrónica.
 *
 * Se pide poco a propósito: solo lo que un tendero sabe de memoria. La resolución
 * de facturación y el código de actividad económica llegarán cuando esa parte se
 * construya, no antes.
 */
export default function DatosDelNegocio({ store }: { store: StoreInfo }) {
  const router = useRouter();

  const [legalName, setLegalName] = useState(store.legalName ?? "");
  const [docType, setDocType] = useState<"CC" | "NIT" | "">(
    store.docType ?? ""
  );
  const [docNumber, setDocNumber] = useState(store.docNumber ?? "");
  const [ivaResponsable, setIvaResponsable] = useState(store.ivaResponsable);
  const [city, setCity] = useState(store.city ?? "");
  const [billingEmail, setBillingEmail] = useState(store.billingEmail ?? "");
  const [ownerName, setOwnerName] = useState(store.ownerName ?? "");
  const [ownerPhone, setOwnerPhone] = useState(store.ownerPhone ?? "");

  const [guardando, setGuardando] = useState(false);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // El dígito de verificación no se escribe: se deduce del NIT.
  const dv =
    docType === "NIT" ? digitoVerificacion(soloDigitos(docNumber)) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    setListo(false);

    const res = await updateDatosDelNegocio({
      legalName,
      docType,
      docNumber,
      ivaResponsable,
      city,
      billingEmail,
      ownerName,
      ownerPhone,
    });

    setGuardando(false);
    if (!res.ok) {
      setError(res.error ?? "No se pudo guardar");
      return;
    }
    setListo(true);
    router.refresh();
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold">Datos del negocio</h1>
        <p className="text-xs text-neutral-500">
          Con esto se identifica tu negocio en los comprobantes. No se le muestra
          a tus clientes en la tienda.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <section className="rounded-xl border border-black/5 bg-white p-5">
          <h2 className="mb-3 text-sm font-bold">Identificación</h2>

          <Campo
            label="Razón social o tu nombre completo"
            value={legalName}
            onChange={setLegalName}
            placeholder="Ej: María Gómez Restrepo, o Comercial La 45 S.A.S."
            nota="Si el negocio está a tu nombre, escribe tu nombre completo como aparece en el documento."
          />

          <div className="mt-3 flex flex-wrap items-end gap-2">
            <div className="w-28">
              <label className="mb-1 block text-xs font-medium text-neutral-600">
                Documento
              </label>
              <select
                value={docType}
                onChange={(e) =>
                  setDocType(e.target.value as "CC" | "NIT" | "")
                }
                className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
              >
                <option value="">—</option>
                <option value="CC">Cédula</option>
                <option value="NIT">NIT</option>
              </select>
            </div>

            <div className="min-w-40 flex-1">
              <label className="mb-1 block text-xs font-medium text-neutral-600">
                Número
              </label>
              <input
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                placeholder="Sin puntos ni guiones"
                inputMode="numeric"
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>

            {/* El dígito de verificación se calcula, no se pide: es un dato que
                sale del propio número, y escribirlo a mano solo abre la puerta a
                equivocarse justo en lo que después va impreso. */}
            {docType === "NIT" && (
              <div className="w-20">
                <label className="mb-1 block text-xs font-medium text-neutral-600">
                  DV
                </label>
                <p className="rounded-lg bg-neutral-100 px-3 py-2 text-center text-sm font-semibold">
                  {dv ?? "—"}
                </p>
              </div>
            )}
          </div>
          {docType === "NIT" && (
            <p className="mt-1 text-xs text-neutral-400">
              El dígito de verificación se calcula solo.
            </p>
          )}

          <label className="mt-4 flex cursor-pointer items-start gap-2">
            <input
              type="checkbox"
              checked={ivaResponsable}
              onChange={(e) => setIvaResponsable(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--brand)]"
            />
            <span className="text-sm">
              Soy responsable de IVA
              <span className="block text-xs text-neutral-500">
                Si no sabes, déjalo sin marcar y pregúntale a tu contador. Esto no
                cambia nada hoy: se usará cuando se emitan facturas.
              </span>
            </span>
          </label>
        </section>

        <section className="rounded-xl border border-black/5 bg-white p-5">
          <h2 className="mb-3 text-sm font-bold">Contacto</h2>

          <Campo
            label="Ciudad"
            value={city}
            onChange={setCity}
            placeholder="Ej: Medellín"
          />

          <div className="mt-3">
            <Campo
              label="Correo para facturas"
              value={billingEmail}
              onChange={setBillingEmail}
              placeholder="facturas@tunegocio.com"
              type="email"
              nota="Puede ser el mismo con el que entras, o el de tu contador."
            />
          </div>

          <div className="mt-3">
            <Campo
              label="Quién atiende"
              value={ownerName}
              onChange={setOwnerName}
              placeholder="Tu nombre, como quieres que aparezca"
            />
          </div>

          <div className="mt-3">
            <Campo
              label="Tu celular"
              value={ownerPhone}
              onChange={setOwnerPhone}
              placeholder="3001234567"
              type="tel"
              nota="El tuyo, para contactarte. Es distinto del teléfono de la tienda que ven los clientes."
            />
          </div>
        </section>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        {listo && (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
            Datos guardados.
          </p>
        )}

        <button
          type="submit"
          disabled={guardando}
          className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-text transition hover:bg-brand-dark disabled:bg-neutral-300"
        >
          {guardando ? "Guardando..." : "Guardar datos"}
        </button>
      </form>
    </div>
  );
}

function Campo({
  label,
  value,
  onChange,
  placeholder,
  nota,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  nota?: string;
  type?: string;
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
        autoCapitalize={type === "email" ? "none" : undefined}
        spellCheck={type === "email" ? false : undefined}
        className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
      {nota && <p className="mt-1 text-xs text-neutral-400">{nota}</p>}
    </div>
  );
}
