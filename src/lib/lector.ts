"use client";

import { useEffect, useRef } from "react";

/**
 * Escucha la pistola lectora en toda la pantalla, sin depender del foco.
 *
 * Las pistolas USB se presentan al sistema como un teclado: "teclean" el código
 * carácter a carácter y casi siempre terminan con Enter. Por eso cada pantalla
 * que escanea ya tenía un campo enfocado que lo recogía.
 *
 * El problema es el mostrador: en cuanto el cajero toca un botón, una tarjeta de
 * producto o el campo del efectivo, el foco se va y **el siguiente disparo se
 * pierde**. Este enganche lo recoge igual.
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
 */

/** Un disparo teclea cada carácter en pocos milisegundos. */
const PAUSA_MAXIMA = 60;

/** Silencio tras el que se da por terminado un código sin sufijo. */
const PAUSA_FINAL = 120;

/** Por debajo de esto no se considera un código de barras. */
const LARGO_MINIMO = 6;

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
     * Hace falta en formularios, donde el cajero casi siempre está escribiendo
     * en algún campo cuando dispara: sin esto, los dígitos del código acabarían
     * dentro del nombre del producto. Los caracteres sí llegan al campo mientras
     * dura el disparo, y al reconocerlo se le devuelve su valor anterior.
     *
     * Fuera de un formulario conviene dejarlo apagado: si el cajero está
     * escribiendo, manda lo que escribe.
     */
    enCampos?: boolean;
  } = {}
) {
  const { enCampos = false } = opciones;

  // En referencias y no en el estado: cambian con cada tecla y no deben
  // repintar nada.
  const buffer = useRef("");
  const ultima = useRef(0);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tocado = useRef<{ campo: Campo; previo: string } | null>(null);

  // La función más reciente, para no volver a suscribirse en cada repintado.
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

    function entregar() {
      const codigo = buffer.current;
      const campo = tocado.current;
      limpiar();
      if (codigo.length < LARGO_MINIMO) return;

      // El código alcanzó a escribirse dentro del campo que tenía el foco: se le
      // devuelve lo que había antes del disparo.
      if (campo && campo.campo.value !== campo.previo) {
        restaurar(campo.campo, campo.previo);
      }
      alLeerRef.current(codigo);
    }

    function alPulsar(e: KeyboardEvent) {
      const dentroDeCampo = esCampo(e.target);
      if (dentroDeCampo && !enCampos) return;

      const ahora = Date.now();
      const seguido = ahora - ultima.current <= PAUSA_MAXIMA;
      ultima.current = ahora;

      if (e.key === "Enter" || e.key === "Tab") {
        if (buffer.current.length >= LARGO_MINIMO) {
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

      if (seguido) {
        buffer.current += e.key;
      } else {
        // Empieza una secuencia nueva. Se anota el campo y lo que tenía escrito
        // **antes** de que el navegador meta este carácter, por si resulta ser
        // un disparo y hay que deshacerlo.
        buffer.current = e.key;
        tocado.current = dentroDeCampo
          ? { campo: e.target as Campo, previo: (e.target as Campo).value }
          : null;
      }

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
  }, [activo, enCampos]);
}
