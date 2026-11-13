/**
 * Presentacion - Componentes
 * Piezas visuales reutilizables: tarjetas de producto, estrellas, badges.
 */
import { crear, escapar, formatearMoneda } from '../nucleo/util.js';

/** Dibuja una fila de estrellas (1 a 5). */
export function estrellas(puntaje, conTexto = false) {
  const completa = Math.round(puntaje ?? 0);
  const marcas = Array.from({ length: 5 }, (_, i) => (i < completa ? '★' : '<span class="vacias">★</span>')).join('');
  return crear('span', {
    class: 'estrellas',
    html: marcas,
    title: `${completa} de 5 estrellas`,
    'aria-label': `${completa} de 5 estrellas`,
  }, conTexto ? crear('span', { class: 'sr-solo' }, ` ${completa} de 5 estrellas`) : null);
}

/** Badge de disponibilidad de stock. */
export function badgeStock(producto) {
  if (!producto.activo) return crear('span', { class: 'etiqueta etiqueta--roja' }, 'Retirado');
  if (producto.stock <= 0) return crear('span', { class: 'etiqueta etiqueta--roja' }, 'Agotado');
  if (producto.stock <= 10) return crear('span', { class: 'etiqueta etiqueta--ambar' }, `Ultimas ${producto.stock}`);
  return crear('span', { class: 'etiqueta etiqueta--verde' }, 'Disponible');
}

/**
 * Tarjeta de producto del catalogo.
 * @param {object} producto
 * @param {object} contexto
 * @param {Function} contexto.alVerDetalle
 * @param {Function} contexto.alAgregar
 */
export function tarjetaProducto(producto, { alVerDetalle, alAgregar }) {
  const imagen = crear('img', {
    src: producto.imagen,
    alt: `Calcetin tematico ${producto.nombre}`,
    loading: 'lazy',
    width: 200,
    height: 200,
  });

  const botonDetalle = crear(
    'button',
    { class: 'boton boton--fantasma boton--chico', type: 'button', 'data-accion': 'detalle' },
    'Ver ficha'
  );
  botonDetalle.addEventListener('click', () => alVerDetalle(producto));

  const botonAgregar = crear(
    'button',
    {
      class: 'boton boton--primario boton--chico',
      type: 'button',
      'data-accion': 'agregar',
      disabled: producto.stock <= 0 || !producto.activo,
    },
    producto.stock <= 0 ? 'Sin stock' : 'Agregar'
  );
  botonAgregar.addEventListener('click', () => alAgregar(producto));

  return crear(
    'article',
    { class: 'tarjeta-producto', 'data-producto-id': producto.id },
    crear('div', { class: 'tarjeta-producto__arte' }, imagen),
    crear(
      'div',
      { class: 'tarjeta-producto__cuerpo' },
      crear('h3', { class: 'tarjeta-producto__nombre' }, producto.nombre),
      crear('p', { class: 'tarjeta-producto__meta' }, producto.descripcion),
      crear('div', {}, badgeStock(producto)),
      crear(
        'div',
        { class: 'tarjeta-producto__pie' },
        crear('span', { class: 'precio' }, formatearMoneda(producto.precio)),
        crear('div', { style: 'display:flex;gap:.35rem' }, botonDetalle, botonAgregar)
      )
    )
  );
}

/** Badge de identificador de requerimiento (RF01..RNF02). */
export function badgeRequisito(id) {
  const clases = { RF: 'etiqueta--azul', RNF: 'etiqueta--ambar' };
  const prefijo = id.startsWith('RNF') ? 'RNF' : 'RF';
  return crear('span', { class: `etiqueta ${clases[prefijo]}` }, id);
}

/** Estado vacio con mensaje y accion opcional. */
export function estadoVacio(mensaje, detalle = '') {
  return crear(
    'div',
    { style: 'text-align:center;padding:2.5rem 1rem;color:var(--tinta-suave)' },
    crear('p', { style: 'font-weight:650;color:var(--tinta);margin-bottom:.3rem' }, mensaje),
    detalle ? crear('p', { style: 'font-size:.9rem;margin:0' }, detalle) : null
  );
}

/** Convierte texto a un nodo HTML escapado. */
export function textoSeguro(texto) {
  const fragmento = document.createDocumentFragment();
  fragmento.textContent = escapar(texto);
  return fragmento;
}
