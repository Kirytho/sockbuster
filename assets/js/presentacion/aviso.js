/**
 * Presentacion - Avisos
 * Notificaciones efimeras (toasts) para comunicar el resultado de las
 * acciones del usuario.
 */
import { crear } from '../nucleo/util.js';

let contenedor = null;

function obtenerContenedor() {
  if (!contenedor) {
    contenedor = crear('div', { class: 'avisos', 'aria-live': 'polite', 'aria-atomic': 'true' });
    document.body.append(contenedor);
  }
  return contenedor;
}

/**
 * Muestra un aviso.
 * @param {string} mensaje
 * @param {'info'|'ok'|'error'} tipo
 */
export function avisar(mensaje, tipo = 'info') {
  const clases = { ok: 'aviso--ok', error: 'aviso--error' };
  const elemento = crear('div', { class: `aviso ${clases[tipo] ?? ''}`.trim(), role: 'status' }, mensaje);
  obtenerContenedor().append(elemento);
  setTimeout(() => {
    elemento.style.transition = 'opacity .25s ease';
    elemento.style.opacity = '0';
    setTimeout(() => elemento.remove(), 260);
  }, 3200);
  return elemento;
}
