/**
 * Valor del domicilio de los pedidos en línea.
 *
 * Se cobra únicamente en la tienda web; las ventas de mostrador no lo llevan.
 * Este número solo sirve para mostrarlo antes de confirmar: el que queda
 * guardado lo calcula la función `create_order` en la base de datos, así que
 * si se cambia aquí hay que cambiarlo también allí.
 */
export const DELIVERY_FEE = 2000;
