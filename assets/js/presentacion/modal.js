/**
 * Presentacion - Modal
 * Ventana modal accesible: foco atrapado, cierre con Escape y restauracion
 * del foco al cerrarse.
 */
import { crear } from '../nucleo/util.js';

let modalAbierto = null;

/**
 * Abre un modal.
 * @param {object} opciones
 * @param {string} opciones.titulo
 * @param {Node|Node[]} opciones.contenido
 * @param {string} [opciones.clase] clase adicional del panel
 * @returns {{cerrar: Function, panel: HTMLElement}}
 */
export function abrirModal({ titulo, contenido, clase = '' }) {
  cerrarModal();

  const panel = crear('div', { class: `modal ${clase}`.trim(), role: 'dialog', 'aria-modal': 'true', 'aria-label': titulo });
  const botonCerrar = crear('button', { class: 'cerrar', type: 'button', 'aria-label': 'Cerrar' }, '×');

  const cabecera = crear(
    'div',
    { class: 'modal__cabecera' },
    crear('h3', {}, titulo),
    botonCerrar
  );

  panel.append(cabecera, contenido);
  const fondo = crear('div', { class: 'modal-fondo' }, panel);

  const focoPrevio = document.activeElement;
  const cerrar = () => {
    fondo.remove();
    document.removeEventListener('keydown', alPulsarTecla);
    modalAbierto = null;
    if (focoPrevio instanceof HTMLElement) focoPrevio.focus();
  };

  function alPulsarTecla(evento) {
    if (evento.key === 'Escape') {
      evento.preventDefault();
      cerrar();
      return;
    }
    if (evento.key !== 'Tab') return;
    const focoables = panel.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!focoables.length) return;
    const primero = focoables[0];
    const ultimo = focoables[focoables.length - 1];
    if (evento.shiftKey && document.activeElement === primero) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
      evento.preventDefault();
      primero.focus();
    }
  }

  botonCerrar.addEventListener('click', cerrar);
  fondo.addEventListener('mousedown', (evento) => {
    if (evento.target === fondo) cerrar();
  });
  document.addEventListener('keydown', alPulsarTecla);

  document.body.append(fondo);
  document.body.style.overflow = 'hidden';
  modalAbierto = { cerrar, panel };

  const primeroEnfocable = panel.querySelector('input, select, textarea, button:not(.cerrar)');
  if (primeroEnfocable instanceof HTMLElement) primeroEnfocable.focus();
  else botonCerrar.focus();

  return modalAbierto;
}

/** Cierra el modal abierto, si hay. */
export function cerrarModal() {
  if (modalAbierto) modalAbierto.cerrar();
}
