/**
 * Presentacion - Lupa (lightbox) para los diagramas UML
 *
 * Abre cualquier diagrama en pantalla completa con zoom real:
 *   - rueda del mouse / gesto de pellizco, con zoom hacia el cursor
 *   - botones + / − / ajustar
 *   - doble clic alterna entre ajustado y ampliado
 *   - arrastrar para desplazar (pan) con puntero o dedo
 *   - Escape o clic fuera cierra; foco atrapado y devuelto al elemento origen
 */
import { crear } from '../nucleo/util.js';

let overlay = null;
let imagen = null;
let pie = null;
let escala = 1;
let desplazamientoX = 0;
let desplazamientoY = 0;
let arrastrando = false;
let ultimoX = 0;
let ultimoY = 0;
let origenFoco = null;

const ESCALA_MIN = 0.5;
const ESCALA_MAX = 6;
const PASO = 1.25;

function construirOverlay() {
  if (overlay) return;

  imagen = document.createElement('img');
  imagen.alt = '';
  imagen.draggable = false;
  imagen.style.touchAction = 'none';

  pie = document.createElement('div');
  pie.className = 'lupa__pie';

  const botonZoomIn = crear('button', { class: 'lupa__boton', type: 'button', 'aria-label': 'Acercar' }, '+');
  const botonZoomOut = crear('button', { class: 'lupa__boton', type: 'button', 'aria-label': 'Alejar' }, '−');
  const botonAjustar = crear('button', { class: 'lupa__boton lupa__boton--texto', type: 'button', 'aria-label': 'Ajustar a pantalla' }, '100%');
  const botonCerrar = crear('button', { class: 'lupa__boton lupa__boton--cerrar', type: 'button', 'aria-label': 'Cerrar vista ampliada' }, '×');

  botonZoomIn.addEventListener('click', () => cambiarEscala(PASO, true));
  botonZoomOut.addEventListener('click', () => cambiarEscala(1 / PASO, true));
  botonAjustar.addEventListener('click', ajustarAPantalla);
  botonCerrar.addEventListener('click', cerrar);

  const barra = crear('div', { class: 'lupa__barra', role: 'toolbar', 'aria-label': 'Controles de zoom' },
    botonZoomIn, botonZoomOut, botonAjustar, botonCerrar);

  overlay = crear('div', {
    class: 'lupa', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Diagrama ampliado',
  },
    barra,
    imagen,
    pie,
    crear('p', { class: 'lupa__ayuda' }, 'Rueda o pellizco: zoom · Arrastrar: mover · Doble clic: ampliar · Esc: cerrar')
  );

  // Cerrar al tocar el fondo (no sobre la imagen ni la barra)
  overlay.addEventListener('pointerdown', (evento) => {
    if (evento.target === overlay) cerrar();
  });

  // Zoom con rueda centrado en el cursor
  overlay.addEventListener('wheel', (evento) => {
    evento.preventDefault();
    const factor = evento.deltaY < 0 ? PASO : 1 / PASO;
    aplicarZoomEn(factor, evento.clientX, evento.clientY);
  }, { passive: false });

  // Doble clic: alterna ajustado / ampliado
  imagen.addEventListener('dblclick', () => {
    if (escala > 1.2) ajustarAPantalla();
    else aplicarZoomEn(2.6, window.innerWidth / 2, window.innerHeight / 2);
  });

  // Arrastre para desplazar
  imagen.addEventListener('pointerdown', (evento) => {
    arrastrando = true;
    ultimoX = evento.clientX;
    ultimoY = evento.clientY;
    imagen.setPointerCapture(evento.pointerId);
    imagen.classList.add('lupa__imagen--arrastrando');
  });
  imagen.addEventListener('pointermove', (evento) => {
    if (!arrastrando) return;
    desplazamientoX += evento.clientX - ultimoX;
    desplazamientoY += evento.clientY - ultimoY;
    ultimoX = evento.clientX;
    ultimoY = evento.clientY;
    aplicarTransform();
  });
  const terminarArrastre = (evento) => {
    arrastrando = false;
    imagen.classList.remove('lupa__imagen--arrastrando');
    if (imagen.hasPointerCapture?.(evento.pointerId)) imagen.releasePointerCapture(evento.pointerId);
  };
  imagen.addEventListener('pointerup', terminarArrastre);
  imagen.addEventListener('pointercancel', terminarArrastre);

  // Teclado: listener global activo solo cuando la lupa esta visible
  document.addEventListener('keydown', (evento) => {
    if (!overlay.classList.contains('lupa--visible')) return;
    if (evento.key === 'Escape') { evento.preventDefault(); cerrar(); }
    else if (evento.key === '+' || evento.key === '=') { evento.preventDefault(); cambiarEscala(PASO, true); }
    else if (evento.key === '-') { evento.preventDefault(); cambiarEscala(1 / PASO, true); }
    else if (evento.key === '0') { evento.preventDefault(); ajustarAPantalla(); }
  });

  document.body.append(overlay);
}

function aplicarTransform() {
  imagen.style.transform = `translate(${desplazamientoX}px, ${desplazamientoY}px) scale(${escala})`;
  const botonAjustar = overlay.querySelector('.lupa__boton--texto');
  if (botonAjustar) botonAjustar.textContent = `${Math.round(escala * 100)}%`;
}

function aplicarZoomEn(factor, clienteX, clienteY) {
  const nueva = Math.min(ESCALA_MAX, Math.max(ESCALA_MIN, escala * factor));
  if (nueva === escala) return;
  // El overlay centra la imagen en la ventana: el punto fijo es (cx, cy)
  // relativo al centro de la ventana; al escalar, el offset se ajusta para
  // que el punto bajo el cursor no se mueva.
  const cx = clienteX - window.innerWidth / 2;
  const cy = clienteY - window.innerHeight / 2;
  const k = nueva / escala;
  desplazamientoX = cx - k * (cx - desplazamientoX);
  desplazamientoY = cy - k * (cy - desplazamientoY);
  escala = nueva;
  aplicarTransform();
}

function cambiarEscala(factor, desdeCentro = false) {
  if (desdeCentro) {
    aplicarZoomEn(factor, window.innerWidth / 2, window.innerHeight / 2);
  }
}


function ajustarAPantalla() {
  escala = 1;
  desplazamientoX = 0;
  desplazamientoY = 0;
  aplicarTransform();
}

/**
 * Abre la lupa con el diagrama indicado.
 * @param {string} src ruta del SVG
 * @param {string} titulo descripción para el pie y el alt
 * @param {HTMLElement} [origen] elemento que la activó (para devolver el foco al cerrar)
 */
export function abrirLupa(src, titulo, origen) {
  construirOverlay();
  origenFoco = origen ?? document.activeElement;
  imagen.src = src;
  imagen.alt = titulo;
  pie.textContent = titulo;
  overlay.classList.add('lupa--visible');
  document.body.style.overflow = 'hidden';
  ajustarAPantalla();
  overlay.querySelector('.lupa__boton--cerrar').focus();
}

/** Cierra la lupa y devuelve el foco al elemento que la abrió. */
export function cerrarLupa() {
  if (!overlay) return;
  overlay.classList.remove('lupa--visible');
  document.body.style.overflow = '';
  if (origenFoco && typeof origenFoco.focus === 'function') origenFoco.focus();
  origenFoco = null;
}
function cerrar() { cerrarLupa(); }
