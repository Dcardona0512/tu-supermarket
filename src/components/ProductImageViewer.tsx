"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const MIN_SCALE = 1;
const MAX_SCALE = 4;

/**
 * Vista grande de la foto de un producto, con zoom.
 *
 * Funciona con rueda del ratón, botones, doble clic/toque y pellizco en
 * pantallas táctiles. Cuando hay zoom se puede arrastrar para desplazarse.
 */
export default function ProductImageViewer({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const pinchStart = useRef<{ dist: number; scale: number } | null>(null);

  // Cerrar con Escape y bloquear el desplazamiento del fondo
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  function clampScale(value: number) {
    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));
  }

  function applyScale(next: number) {
    const value = clampScale(next);
    setScale(value);
    if (value === 1) setOffset({ x: 0, y: 0 });
  }

  function toggleZoom() {
    applyScale(scale > 1 ? 1 : 2.5);
  }

  function onWheel(e: React.WheelEvent) {
    if (e.deltaY === 0) return;
    applyScale(scale + (e.deltaY < 0 ? 0.4 : -0.4));
  }

  function onPointerDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinchStart.current = {
        dist: Math.hypot(a.x - b.x, a.y - b.y),
        scale,
      };
      dragStart.current = null;
    } else if (scale > 1) {
      dragStart.current = {
        x: e.clientX - offset.x,
        y: e.clientY - offset.y,
      };
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Pellizco: dos dedos en pantalla
    if (pointers.current.size === 2 && pinchStart.current) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      applyScale(pinchStart.current.scale * (dist / pinchStart.current.dist));
      return;
    }

    if (dragStart.current && scale > 1) {
      setOffset({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y,
      });
    }
  }

  function endPointer(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
    if (pointers.current.size === 0) dragStart.current = null;
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col bg-black/95"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-white">
        <span className="truncate text-sm font-semibold">{alt}</span>
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="shrink-0 rounded-lg bg-white/15 px-3 py-1.5 text-sm font-medium hover:bg-white/25"
        >
          Cerrar
        </button>
      </div>

      <div
        className="relative flex-1 overflow-hidden"
        style={{ touchAction: "none" }}
        onWheel={onWheel}
        onDoubleClick={toggleZoom}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        // Tocar el fondo cierra, pero solo si no se está explorando con zoom
        onClick={(e) => {
          if (scale === 1 && e.target === e.currentTarget) onClose();
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transition: dragStart.current ? "none" : "transform 150ms ease-out",
            cursor: scale > 1 ? "grab" : "zoom-in",
          }}
        >
          <Image
            src={src}
            alt={alt}
            fill
            sizes="100vw"
            className="select-none object-contain p-4"
            draggable={false}
            priority
          />
        </div>
      </div>

      {/* Controles de zoom */}
      <div className="flex items-center justify-center gap-2 px-4 py-4">
        <ZoomBtn
          onClick={() => applyScale(scale - 0.5)}
          disabled={scale <= MIN_SCALE}
          label="Alejar"
        >
          −
        </ZoomBtn>

        <span className="w-16 text-center text-sm font-medium text-white/80">
          {Math.round(scale * 100)}%
        </span>

        <ZoomBtn
          onClick={() => applyScale(scale + 0.5)}
          disabled={scale >= MAX_SCALE}
          label="Acercar"
        >
          +
        </ZoomBtn>

        {scale > 1 && (
          <button
            onClick={() => applyScale(1)}
            className="ml-2 rounded-lg bg-white/15 px-3 py-2 text-sm font-medium text-white hover:bg-white/25"
          >
            Ajustar
          </button>
        )}
      </div>

      <p className="pb-4 text-center text-xs text-white/50">
        Toca dos veces para acercar · arrastra para moverte
      </p>
    </div>
  );
}

function ZoomBtn({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="grid h-11 w-11 place-items-center rounded-full bg-white/15 text-xl font-bold text-white transition hover:bg-white/25 disabled:opacity-30"
    >
      {children}
    </button>
  );
}
