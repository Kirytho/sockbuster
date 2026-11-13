/**
 * Paginas - Inicio
 * Landing de la marca: hero, colecciones tematicas, destacados y el bloque de
 * trazabilidad de requerimientos (RF/RNF), que es el artefacto que sostiene el
 * criterio 2.1.1 de la rubrica.
 */
import { REQUISITOS } from '../nucleo/config.js';
import { crear, porId, formatearMoneda } from '../nucleo/util.js';
import { conectarCabecera } from '../presentacion/cabecera.js';
import { tarjetaProducto, badgeRequisito } from '../presentacion/componentes.js';
import { obtenerColecciones } from '../datos/catalogo.js';
import { destacados } from '../dominio/producto.js';
import { avisar } from '../presentacion/aviso.js';

/** Imagen de edicion navideña por coleccion (orden: 1-4). */
const IMG_COLECCIONES = {
  1: 'assets/img/navidad/col-ciencia-ficcion.jpg',
  2: 'assets/img/navidad/col-terror-80s.jpg',
  3: 'assets/img/navidad/col-series-drama.jpg',
  4: 'assets/img/navidad/col-animacion.jpg',
};

/** Pinta las tarjetas de colecciones tematicas. */
async function renderColecciones() {
  const contenedor = porId('rejillaColecciones');
  if (!contenedor) return;
  const colecciones = await obtenerColecciones();
  contenedor.replaceChildren(
    ...colecciones.map((coleccion) => {
      const foto = IMG_COLECCIONES[coleccion.id] ?? IMG_COLECCIONES[1];
      return crear(
        'a',
        { class: 'tarjeta-coleccion', href: `catalogo.html?coleccion=${coleccion.id}` },
        crear(
          'div',
          {
            class: 'tarjeta-coleccion__foto',
            style: `background-image:url('${foto}')`,
            role: 'img',
            'aria-label': `Coleccion ${coleccion.nombre}, edicion Navidad 2026`,
          },
          crear('span', { class: 'tarjeta-coleccion__nombre' }, coleccion.nombre)
        ),
        crear(
          'div',
          { class: 'tarjeta-coleccion__cuerpo' },
          crear('p', {}, coleccion.descripcion),
          crear('span', { class: 'tarjeta-coleccion__meta' }, `${coleccion.total} modelos · Ver coleccion →`)
        )
      );
    })
  );
}

/** Pinta la grilla de productos destacados. */
async function renderDestacados() {
  const contenedor = porId('rejillaDestacados');
  if (!contenedor) return;
  const productos = await destacados(8);
  contenedor.replaceChildren(
    ...productos.map((producto) =>
      tarjetaProducto(producto, {
        alVerDetalle: (p) => {
          location.href = `catalogo.html?producto=${p.id}`;
        },
        alAgregar: () => {
          location.href = 'catalogo.html';
        },
      })
    )
  );
}

/** Pinta la tabla de trazabilidad RF/RNF. */
function renderRequisitos() {
  const cuerpo = porId('cuerpoRequisitos');
  if (!cuerpo) return;
  cuerpo.replaceChildren(
    ...REQUISITOS.map((req) =>
      crear(
        'tr',
        {},
        crear('td', {}, crear('span', { style: 'display:inline-flex;gap:.4rem;align-items:center' }, badgeRequisito(req.id))),
        crear('td', {}, crear('strong', {}, req.titulo), crear('br'), crear('span', { style: 'color:var(--tinta-suave);font-size:.87rem' }, req.descripcion)),
        crear('td', { style: 'font-size:.86rem' }, req.vista),
        crear('td', { style: 'font-size:.86rem' }, req.web)
      )
    )
  );
}

/** Muestra el precio mas bajo del catalogo en el bloque de metricas. */
async function renderMetricas() {
  const { listarProductos } = await import('../datos/catalogo.js');
  const productos = await listarProductos();
  const desde = Math.min(...productos.map((p) => p.precio));
  const nodo = porId('precioDesde');
  if (nodo) nodo.textContent = formatearMoneda(desde);
  const nodoModelos = porId('totalModelos');
  if (nodoModelos) nodoModelos.textContent = String(productos.length);
}

/** Genera copos de nieve decorativos en el hero (se omiten con movimiento reducido). */
function sembrarCopos() {
  const contenedor = porId('copos');
  if (!contenedor || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const total = 26;
  for (let i = 0; i < total; i += 1) {
    const copo = document.createElement('span');
    copo.className = 'copo';
    const tam = (3 + Math.random() * 6).toFixed(1);
    copo.style.width = `${tam}px`;
    copo.style.height = `${tam}px`;
    copo.style.left = `${(Math.random() * 100).toFixed(1)}%`;
    copo.style.animationDuration = `${(9 + Math.random() * 9).toFixed(1)}s`;
    copo.style.animationDelay = `${(-Math.random() * 14).toFixed(1)}s`;
    copo.style.opacity = (0.5 + Math.random() * 0.5).toFixed(2);
    contenedor.append(copo);
  }
}

/** Inicializa la pagina de inicio. */
async function iniciar() {
  conectarCabecera();
  sembrarCopos();
  renderRequisitos();
  await Promise.all([renderColecciones(), renderDestacados(), renderMetricas()]);

  const avisoDemo = porId('botonCredencialesDemo');
  if (avisoDemo) {
    avisoDemo.addEventListener('click', () => {
      avisar('Las credenciales de administrador se indican en la seccion de administracion.', 'ok');
    });
  }
}

iniciar().catch((error) => {
  console.error('[inicio] fallo al inicializar', error);
});
