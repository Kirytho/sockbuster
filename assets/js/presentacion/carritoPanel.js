/**
 * Presentacion - Carrito (panel lateral)
 * Render del panel de carrito: lista de items, control de cantidades y totales.
 */
import { crear, formatearMoneda } from '../nucleo/util.js';
import { calcularTotal, contarUnidades } from '../dominio/carrito.js';
import { vaciarCarrito } from '../dominio/carrito.js';

/**
 * Renderiza el contenido del panel de carrito.
 * @param {HTMLElement} contenedor
 * @param {Array} items
 * @param {object} acciones
 */
export function renderizarCarrito(contenedor, items, acciones) {
  contenedor.replaceChildren();

  if (!items.length) {
    contenedor.append(
      crear(
        'div',
        { style: 'text-align:center;padding:2rem 1rem;color:var(--tinta-suave)' },
        crear('p', { style: 'font-weight:650;color:var(--tinta)' }, 'Tu carrito esta vacio'),
        crear('p', { style: 'font-size:.9rem' }, 'Agrega calcetines desde el catalogo para continuar.')
      )
    );
    return;
  }

  const lista = crear('div', {});
  for (const item of items) {
    const menos = crear('button', { type: 'button', 'aria-label': `Quitar una unidad de ${item.nombre}` }, '−');
    const mas = crear('button', { type: 'button', 'aria-label': `Agregar una unidad de ${item.nombre}` }, '+');
    const quitar = crear(
      'button',
      { class: 'boton boton--peligro boton--chico', type: 'button' },
      'Quitar'
    );

    menos.addEventListener('click', () => acciones.alCambiarCantidad(item.productoId, item.cantidad - 1, item.talla));
    mas.addEventListener('click', () => acciones.alCambiarCantidad(item.productoId, item.cantidad + 1, item.talla));
    quitar.addEventListener('click', () => acciones.alQuitar(item.productoId, item.talla));

    lista.append(
      crear(
        'div',
        { class: 'item-carrito' },
        crear('img', { src: item.imagen, alt: item.nombre, width: 54, height: 54, loading: 'lazy' }),
        crear(
          'div',
          {},
          crear('div', { class: 'item-carrito__nombre' }, item.nombre),
          crear('div', { class: 'item-carrito__precio' }, `${formatearMoneda(item.precioUnitario)} · Talla ${item.talla}`),
          crear(
            'div',
            { style: 'margin-top:.35rem' },
            crear('span', { class: 'cantidad' }, menos, crear('span', {}, String(item.cantidad)), mas)
          )
        ),
        crear(
          'div',
          { style: 'text-align:right' },
          crear('div', { style: 'font-weight:700' }, formatearMoneda(item.precioUnitario * item.cantidad)),
          quitar
        )
      )
    );
  }

  const vaciar = crear('button', { class: 'boton boton--fantasma boton--chico', type: 'button' }, 'Vaciar carrito');
  vaciar.addEventListener('click', async () => {
    await vaciarCarrito(acciones.usuario);
    acciones.alRefrescar();
  });

  const irAlCheckout = crear('button', { class: 'boton boton--primario boton--bloque', type: 'button' }, 'Ir al checkout');
  irAlCheckout.addEventListener('click', () => acciones.alIrAlCheckout());

  const pie = crear(
    'div',
    { class: 'carrito-panel__pie' },
    crear('div', { class: 'total-carrito' }, crear('span', {}, 'Total'), crear('span', {}, formatearMoneda(calcularTotal(items)))),
    crear('div', { style: 'display:flex;gap:.5rem;margin-bottom:.6rem' }, crear('span', { class: 'etiqueta' }, `${contarUnidades(items)} unidades`), vaciar),
    irAlCheckout
  );

  contenedor.append(lista);
  const pieExistente = contenedor.parentElement?.querySelector('.carrito-panel__pie');
  if (pieExistente) pieExistente.replaceWith(pie);
  else contenedor.append(pie);
}
