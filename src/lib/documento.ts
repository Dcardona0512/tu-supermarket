/**
 * Dígito de verificación de un NIT colombiano.
 *
 * No se le pide al tendero: es un dato que se deduce del número, y pedirlo solo
 * abre la puerta a que lo escriba mal justo en el campo que después va impreso en
 * una factura.
 *
 * El cálculo es el de la DIAN: cada dígito, de derecha a izquierda, por su peso;
 * la suma módulo 11; y si el resto es mayor que 1, el dígito es 11 menos el
 * resto. Comprobado contra el NIT de la propia DIAN, 800197268-4.
 */

const PESOS = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];

export function digitoVerificacion(nit: string): string | null {
  const digitos = nit.replace(/\D/g, "");
  if (digitos.length === 0 || digitos.length > PESOS.length) return null;

  let suma = 0;
  for (let i = 0; i < digitos.length; i++) {
    suma += Number(digitos[digitos.length - 1 - i]) * PESOS[i];
  }

  const resto = suma % 11;
  return String(resto > 1 ? 11 - resto : resto);
}

/** "900.373.115" -> "900373115". Lo que se guarda va sin puntos ni guiones. */
export function soloDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}
