/**
 * Sonidos del panel.
 *
 * El navegador bloquea el audio hasta que la persona toca la pantalla, así que
 * estos sonidos se disparan siempre después de un clic.
 */

/** Archivo del sonido de caja, en la carpeta public. */
const CAJA_SRC = "/sonidos/caja.mp3";

/**
 * El archivo trae segundo y medio de silencio al principio. Arrancamos donde
 * empieza el sonido para que se oiga apenas se pulsa, no un rato después.
 */
const CAJA_INICIO = 1.5;

let cajaAudio: HTMLAudioElement | null = null;

/**
 * Caja registradora: entró plata.
 *
 * Suena al marcar un pedido como entregado y al cerrar una venta en tienda.
 */
export function sonidoCaja() {
  try {
    if (!cajaAudio) {
      cajaAudio = new Audio(CAJA_SRC);
      cajaAudio.preload = "auto";
    }
    const audio = cajaAudio;

    const arrancar = () => {
      try {
        // Si suenan dos ventas seguidas, la segunda vuelve a empezar
        audio.currentTime = CAJA_INICIO;
      } catch {
        // Si el navegador aún no deja mover el tiempo, suena desde el principio
      }
      void audio.play();
    };

    // Sin los datos cargados no se puede saltar el silencio inicial
    if (audio.readyState >= 1) arrancar();
    else audio.addEventListener("loadedmetadata", arrancar, { once: true });
  } catch {
    // El navegador puede bloquear el audio hasta que haya interacción
  }
}

/**
 * Aviso de pedido nuevo: dos notas cortas, distintas al sonido de la caja
 * para no confundir "llegó una orden" con "entró plata".
 */
export function sonidoPedidoNuevo() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Ctx();

    [
      { freq: 780, inicio: 0 },
      { freq: 1040, inicio: 0.18 },
    ].forEach(({ freq, inicio }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);

      const t = ctx.currentTime + inicio;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.2, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);

      osc.start(t);
      osc.stop(t + 0.22);
    });

    setTimeout(() => ctx.close(), 800);
  } catch {
    // Igual que arriba: el audio puede estar bloqueado
  }
}
