"use client";

import { useState } from "react";
import BarcodeScanner from "@/components/BarcodeScanner";

/** Botón que abre la cámara para leer un código de barras. */
export default function ScanButton({
  onDetected,
  label = "Escanear",
  title,
  className,
}: {
  onDetected: (code: string) => void;
  label?: string;
  title?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          "inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
        }
      >
        <CameraIcon />
        {label}
      </button>

      {open && (
        <BarcodeScanner
          onDetected={onDetected}
          onClose={() => setOpen(false)}
          title={title}
        />
      )}
    </>
  );
}

function CameraIcon() {
  return (
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
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}
