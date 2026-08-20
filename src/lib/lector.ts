"use client";

import { useEffect, useRef } from "react";

/**
 * Escucha la pistola lectora en toda la pantalla, sin depender del foco.
 *
 * Las pistolas USB se presentan al sistema como un teclado: "teclean" el código
 * carácter a carácter y casi siempre terminan con Enter. Sin esto, en cuanto el
 * cajero toca un botón o una tarjeta de producto el foco se va y el siguiente
 * disparo se pierde.
 *
 * **Cómo distingue un disparo de alguien escribiendo.** La primera versión
 * medía el hueco entre cada dos teclas y cortaba la lectura en cuanto uno
 * superaba el límite. Eso resultó ser un error grave: cuando la pistola tropieza
 * a mitad de un código —y tropieza—, el principio se descartaba y la cola se
 * entregaba como si fuera el código entero. En la tienda eso se vio como
 * productos guardados con códigos falsos, de 6 y 10 dígitos.
 *
 * Ahora se juzga la ráfaga entera y no cada tecla:
 *
 *   - se acumula todo lo que llegue y solo cierra el **silencio**, no un hueco
 *     suelto, así que un tropiezo ya no parte el código;
 *   - al cerrar se exige que la **media** por tecla sea de máquina, cosa que
 *     tolera ese tropiezo pero sigue descartando a una persona tecleando;
 *   - y se exige que el resultado tenga una **longitud de código de barras de
 *     verdad**. Esto es lo que de veras cierra la puerta: un trozo de código no
 *     mide 8, 12, 13 ni 14, así que no puede colarse por muy rápido que llegue.
 *
 * Termina de tres formas, porque las pistolas se configuran distinto: con Enter,
 * con Tab, o sin sufijo, cerrando sola tras el silencio.
 */

/** Media máxima por tecla para considerarlo una máquina y no una persona. */
const PAUSA_MEDIA_MAXIMA = 60;

/** Silencio tras el que se da por terminada la lectura. */
const PAUSA_FINAL = 250;

/**
 * Longitudes de un código de barras de producto: EAN-8, UPC-A, EAN-13 e ITF-14.
 *
 * Solo restringe lo que entra por la pistola. El campo de código sigue
 * admitiendo a mano lo que el tendero quiera, por si usa numeración propia.
 */
const LARGOS_VALIDOS = new Set([8, 12, 13, 14]);

type Campo = HTMLInputElement | HTMLTextAreaElement;

/** ¿El foco está en algo donde la persona escribe? */
function esCampo(destino: EventTarget | null): destino is Campo {
  if (!(destino instanceof HTMLElement)) return false;
  if (destino.isContentEditable) return true;
  return destino.tagName === "INPUT" || destino.tagName === "TEXTAREA";
}

/**
 * Devuelve un campo a un valor anterior avisando a React.
 *
 * Cambiar `value` a secas no sirve: React no se entera y en el siguiente
 * repintado vuelve a poner lo suyo. Hay que usar el asignador nativo y lanzar el
 * evento `input`, que es lo que React escucha.
 */
function restaurar(campo: Campo, valor: string) {
  const prototipo =
    campo instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  const asignar = Object.getOwnPropertyDescriptor(prototipo, "value")?.set;
  asignar?.call(campo, valor);
  campo.dispatchEvent(new Event("input", { bubbles: true }));
}

export function useLectorDeCodigos(
  alLeer: (codigo: string) => void,
  activo = true,
  opciones: {
    /**
     * Capturar también con el foco dentro de un campo.
     *
     * Hace falta en formularios, donde el tendero casi siempre está escribiendo
     * en algún campo cuando dispara. Los caracteres llegan al campo mientras
     * dura el disparo, y al reconocerlo se le devuelve su valor anterior.
     */
    enCampos?: boolean;
  } = {}
) {
  const { enCampos = false } = opciones;

  // En referencias y no en el estado: cambian con cada tecla y no deben
  // repintar nada.
  const buffer = useRef("");
  const inicio = useRef(0);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tocado = useRef<{ campo: Campo; previo: string } | null>(null);

  const alLeerRef = useRef(alLeer);
  useEffect(() => {
    alLeerRef.current = alLeer;
  }, [alLeer]);

  useEffect(() => {
    if (!activo) return;

    function limpiar() {
      buffer.current = "";
      tocado.current = null;
      if (temporizador.current) {
        clearTimeout(temporizador.current);
        temporizador.current = null;
      }
    }

    /** ¿La ráfaga acumulada puede ser un código leído por una máquina? */
    function esDisparo(codigo: string, transcurrido: number): boolean {
      if (!LARGOS_VALIDOS.has(codigo.length)) return false;
      // Con una sola tecla no hay hueco que medir, y con una no se llega nunca
      // a las longitudes válidas.
      const media = transcurrido / (codigo.length - 1);
      return media <= PAUSA_MEDIA_MAXIMA;
    }

    function entregar() {
      const codigo = buffer.current;
      const campo = tocado.current;
      const transcurrido = Date.now() - inicio.current;
      limpiar();

      if (!esDisparo(codigo, transcurrido)) return;

      // El código alcanzó a escribirse dentro del campo enfocado: se le devuelve
      // lo que había antes del disparo.
      if (campo && campo.campo.value !== campo.previo) {
        restaurar(campo.campo, campo.previo);
      }
      alLeerRef.current(codigo);
    }

    function alPulsar(e: KeyboardEvent) {
      const dentroDeCampo = esCampo(e.target);
      if (dentroDeCampo && !enCampos) return;

      if (e.key === "Enter" || e.key === "Tab") {
        const transcurrido = Date.now() - inicio.current;
        if (esDisparo(buffer.current, transcurrido)) {
          // Se corta aquí para que no pulse el botón que tenga el foco ni envíe
          // el formulario.
          e.preventDefault();
          entregar();
        } else {
          limpiar();
        }
        return;
      }

      // Solo dígitos: exigirlo es lo que hace imposible confundir un disparo con
      // alguien usando el teclado.
      if (e.key.length !== 1 || !/\d/.test(e.key)) {
        limpiar();
        return;
      }

      if (buffer.current === "") {
        inicio.current = Date.now();
        // Se anota el campo y lo que tenía escrito **antes** de que el navegador
        // meta este carácter, por si resulta ser un disparo y hay que deshacerlo.
        tocado.current = dentroDeCampo
          ? { campo: e.target as Campo, previo: (e.target as Campo).value }
          : null;
      }
      buffer.current += e.key;

      // Solo el silencio cierra la lectura. Un hueco suelto ya no la parte.
      if (temporizador.current) clearTimeout(temporizador.current);
      temporizador.current = setTimeout(entregar, PAUSA_FINAL);
    }

    // En captura, para llegar antes que cualquier manejador de la página.
    window.addEventListener("keydown", alPulsar, true);
    return () => {
      window.removeEventListener("keydown", alPulsar, true);
      limpiar();
    };
  }, [activo, enCampos]);
}
