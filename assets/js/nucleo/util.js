/**
 * Nucleo - Utilidades
 * Funciones puras compartidas por todas las capas: formato, DOM y validacion.
 */

/** Formatea un numero como moneda chilena sin decimales. */
export function formatearMoneda(valor) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(valor ?? 0);
}

/** Formatea una fecha ISO como fecha corta legible. */
export function formatearFecha(iso) {
  const f = new Date(iso);
  if (Number.isNaN(f.getTime())) return '-';
  return f.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Escapa texto para insertarlo de forma segura en HTML. */
export function escapar(texto) {
  return String(texto ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/** Crea un elemento del DOM con atributos y contenido en una sola llamada. */
export function crear(tag, atributos = {}, ...hijos) {
  const el = document.createElement(tag);
  for (const [clave, valor] of Object.entries(atributos)) {
    if (valor === null || valor === undefined || valor === false) continue;
    if (clave === 'class') el.className = valor;
    else if (clave === 'html') el.innerHTML = valor;
    else if (clave === 'text') el.textContent = valor;
    else if (clave.startsWith('on') && typeof valor === 'function') {
      el.addEventListener(clave.slice(2).toLowerCase(), valor);
    } else el.setAttribute(clave, valor);
  }
  for (const hijo of hijos.flat()) {
    if (hijo === null || hijo === undefined || hijo === false) continue;
    el.append(hijo instanceof Node ? hijo : document.createTextNode(String(hijo)));
  }
  return el;
}

/** Devuelve el elemento del DOM con el id indicado. */
export function porId(id) {
  return document.getElementById(id);
}

/** Aplica un retardo a la ejecucion de una funcion (para busquedas). */
export function retrasar(fn, ms = 220) {
  let id;
  return (...args) => {
    clearTimeout(id);
    id = setTimeout(() => fn(...args), ms);
  };
}

/** Normaliza texto para busquedas: sin acentos y en minusculas. */
export function normalizar(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/** Genera un identificador unico de pedido con formato SB-AAAA-NNNNN. */
export function generarIdPedido(numero) {
  const anio = new Date().getFullYear();
  return `SB-${anio}-${String(numero).padStart(5, '0')}`;
}

/** Convierte un valor a slug URL-safe. */
export function slug(texto) {
  return normalizar(texto)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
