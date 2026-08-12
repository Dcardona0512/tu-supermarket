/**
 * Nombre corto de la tienda de demostración.
 *
 * Vive en un módulo suyo, sin `"use client"` ni importaciones de servidor, porque
 * lo necesitan los dos lados: el escaparate —que es de cliente— para saber que su
 * pie lleva el botón de la muestra, y la página de la muestra —que es de
 * servidor— para responder solo a esta tienda.
 *
 * Estuvo un rato en `store-context.tsx`, que es de cliente, y desde el servidor
 * llegaba `undefined`: Next sustituye los módulos de cliente por una referencia
 * cuando los importa el servidor, y las constantes se quedan por el camino. El
 * síntoma era un 404 sin ningún error.
 */
export const SLUG_DEMO = "demo";
