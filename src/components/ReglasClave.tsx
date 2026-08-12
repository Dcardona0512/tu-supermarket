"use client";

import { revisarClave } from "@/lib/password";

/**
 * Lista de requisitos de la contraseña, marcándose mientras se escribe.
 *
 * Se muestran todos desde el principio en vez de soltar el error al enviar: así
 * el tendero sabe qué le piden antes de inventarse una contraseña, y no después.
 */
export default function ReglasClave({ clave }: { clave: string }) {
  const reglas = revisarClave(clave);

  return (
    <ul className="mt-2 space-y-1">
      {reglas.map((r) => (
        <li
          key={r.id}
          className={`flex items-center gap-1.5 text-xs ${
            r.cumple ? "text-green-700" : "text-neutral-500"
          }`}
        >
          <span aria-hidden="true" className="shrink-0">
            {r.cumple ? <Listo /> : <Falta />}
          </span>
          {r.texto}
          <span className="sr-only">{r.cumple ? " (cumple)" : " (falta)"}</span>
        </li>
      ))}
    </ul>
  );
}

function Listo() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 13 4 4L19 7" />
    </svg>
  );
}

function Falta() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.35" />
    </svg>
  );
}
