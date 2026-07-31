"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  /** Se llama con el código leído. */
  onDetected: (code: string) => void;
  onClose: () => void;
  title?: string;
};

/** Pitido corto de confirmación, sin archivos de audio. */
function beep() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 900;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
    setTimeout(() => ctx.close(), 300);
  } catch {
    // el audio es un extra; si el navegador lo bloquea no pasa nada
  }
}

/**
 * Lector de códigos con la cámara del dispositivo.
 *
 * La librería de decodificación se descarga solo al abrir el escáner, para no
 * cargarla en quienes usan una pistola lectora USB.
 */
export default function BarcodeScanner({
  onDetected,
  onClose,
  title = "Escanear código",
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);

  // Un solo código por apertura: al leer, la cámara se cierra
  const doneRef = useRef(false);

  useEffect(() => {
    let stopped = false;
    let controls: { stop: () => void } | null = null;

    async function start() {
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        if (stopped) return;

        const reader = new BrowserMultiFormatReader();
        controls = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: "environment" } } },
          videoRef.current!,
          (result) => {
            if (!result || doneRef.current) return;
            const code = result.getText().trim();
            if (!code) return;

            // Se cierra en cuanto lee, para que se vea que funcionó
            doneRef.current = true;
            beep();
            navigator.vibrate?.(60);

            controls?.stop();
            onDetected(code);
            onClose();
          }
        );

        if (stopped) controls.stop();
        setStarting(false);
      } catch (e) {
        const msg = (e as Error)?.name === "NotAllowedError"
          ? "No diste permiso para usar la cámara. Actívalo en el candado de la barra de direcciones."
          : "No se pudo abrir la cámara. Revisa que ninguna otra aplicación la esté usando.";
        setError(msg);
        setStarting(false);
      }
    }

    start();

    return () => {
      stopped = true;
      controls?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/90">
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <span className="text-sm font-semibold">{title}</span>
        <button
          onClick={onClose}
          className="rounded-lg bg-white/15 px-3 py-1.5 text-sm font-medium hover:bg-white/25"
        >
          Cerrar
        </button>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          playsInline
          muted
        />

        {/* Guía de encuadre */}
        {!error && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="h-32 w-72 max-w-[80vw] rounded-xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
          </div>
        )}

        {starting && !error && (
          <p className="absolute inset-x-0 bottom-24 text-center text-sm text-white/80">
            Abriendo la cámara...
          </p>
        )}

        {error && (
          <div className="absolute inset-0 grid place-items-center p-6">
            <p className="max-w-sm rounded-xl bg-white p-4 text-center text-sm text-neutral-700">
              {error}
            </p>
          </div>
        )}
      </div>

      <div className="px-4 py-4 text-center">
        <p className="text-sm text-white/70">
          Centra el código de barras dentro del recuadro.
        </p>
      </div>
    </div>
  );
}
