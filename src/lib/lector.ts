"use client";

import { useEffect, useRef } from "react";

/**
 * Escucha la pistola lectora en toda la pantalla, sin depender del foco.
 *
 * Las pistolas USB se presentan al sistema como un teclado: "teclean" el código
 * carácter a carácter y casi siempre terminan con Enter. Por eso cada pantalla ya
 * tenía un campo enfocado que lo recogía.
 *
 * El problema es el mostrador: en cuanto el cajero toca un botón, una tarjeta de
 * producto o el campo del efectivo, el foco se va del campo de búsqueda y **el
 * siguiente disparo se pierde**. Este enganche lo recoge igual.
 *
 * Cómo distingue un disparo de alguien escribiendo:
 *
 *   - los caracteres llegan **muy seguidos**, en menos de `PAUSA_MAXIMA`
 *     milisegundos; una persona no teclea así de rápido de forma sostenida;
 *   - el resultado son **solo dígitos** y al menos `LARGO_MINIMO`, que es como
 *     son los códigos de barras de producto (EAN-13, UPC-A y compañía).
 *
 * Y termina de tres formas, porque las pistolas se configuran distinto según la
 * marca: con Enter, con Tab, o sin sufijo ninguno — en ese último caso se cierra
 * sola cuando pasan `PAUSA_FINAL` milisegundos sin más teclas.
 *
 * No se mete cuando el cajero está escribiendo en un campo: ahí manda el campo,
 * que ya tiene su propio manejador de Enter.
 */

/** Un disparo teclea cada carácter en pocos milisegundos. */
const PAUSA_MAXIMA = 60;

/** Silencio tras el que se da por terminado un código sin sufijo. */
const PAUSA_FINAL = 120;

/** Por debajo de esto no se considera un código de barras. */
const LARGO_MINIMO = 6;

/** ¿El foco está en algo donde la persona escribe? */
function escribiendoEnUnCampo(destino: EventTarget | null): boolean {
  if (!(destino instanceof HTMLElement)) return false;
  if (destino.isContentEditable) return true;
  const etiqueta = destino.tagName;
  return etiqueta === "INPUT" || etiqueta === "TEXTAREA" || etiqueta === "SELECT";
}

export function useLectorDeCodigos(
  alLeer: (codigo: string) => void,
  activo = true
) {
  // En una referencia y no en el estado: cambia con cada tecla y no debe
  // repintar nada.
  const buffer = useRef("");
  const ultima = useRef(0);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  // La función más reciente, para no volver a suscribirse en cada repintado.
  const alLeerRef = useRef(alLeer);
  useEffect(() => {
    alLeerRef.current = alLeer;
  }, [alLeer]);

  useEffect(() => {
    if (!activo) return;

    function limpiar() {
      buffer.current = "";
      if (temporizador.current) {
        clearTimeout(temporizador.current);
        temporizador.current = null;
      }
    }

    function entregar() {
      const codigo = buffer.current;
      limpiar();
      if (codigo.length >= LARGO_MINIMO) alLeerRef.current(codigo);
    }

    function alPulsar(e: KeyboardEvent) {
      if (escribiendoEnUnCampo(e.target)) return;

      const ahora = Date.now();
      const seguido = ahora - ultima.current <= PAUSA_MAXIMA;
      ultima.current = ahora;

      if (e.key === "Enter" || e.key === "Tab") {
        if (buffer.current.length >= LARGO_MINIMO) {
          // Se corta aquí para que el Enter no pulse el botón que tenga el foco
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

      buffer.current = seguido ? buffer.current + e.key : e.key;

      // Por si la pistola no manda sufijo: se cierra sola tras el silencio.
      if (temporizador.current) clearTimeout(temporizador.current);
      temporizador.current = setTimeout(entregar, PAUSA_FINAL);
    }

    // En captura, para llegar antes que cualquier manejador de la página.
    window.addEventListener("keydown", alPulsar, true);
    return () => {
      window.removeEventListener("keydown", alPulsar, true);
      limpiar();
    };
  }, [activo]);
}
