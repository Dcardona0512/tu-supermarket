"use client";

import { useState } from "react";
import StoreSettings from "@/components/StoreSettings";
import DatosDelNegocio from "@/components/DatosDelNegocio";
import CambiarClave from "@/components/CambiarClave";
import type { StoreInfo } from "@/lib/store-context";

const PESTANAS = [
  { valor: "tienda", label: "Mi tienda" },
  { valor: "negocio", label: "Datos del negocio" },
  { valor: "cuenta", label: "Mi cuenta" },
] as const;

/**
 * Configuración del panel, en dos pestañas.
 *
 * Se separan porque son dos cosas distintas: una es lo que ven los clientes del
 * tendero —su nombre, su color, su logo— y la otra es cómo entra él. Antes solo
 * existía la primera, colgando del menú como «Personalizar tienda».
 */
export default function Configuracion({
  store,
  correo,
}: {
  store: StoreInfo;
  /** El correo con el que entra, para mostrarlo y para comprobar su contraseña. */
  correo: string;
}) {
  const [pestana, setPestana] =
    useState<(typeof PESTANAS)[number]["valor"]>("tienda");

  return (
    <div>
      <div className="mb-5 flex gap-1 rounded-lg bg-white p-1">
        {PESTANAS.map((p) => (
          <button
            key={p.valor}
            onClick={() => setPestana(p.valor)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
              pestana === p.valor
                ? "bg-brand text-brand-text"
                : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {pestana === "tienda" && <StoreSettings store={store} />}

      {pestana === "negocio" && <DatosDelNegocio store={store} />}

      {pestana === "cuenta" && (
        <div>
          <div className="mb-5">
            <h1 className="text-xl font-bold">Mi cuenta</h1>
            <p className="text-xs text-neutral-500">
              Con qué entras a tu panel.
            </p>
          </div>
          <CambiarClave correo={correo} usuario={store.username} />
        </div>
      )}
    </div>
  );
}
