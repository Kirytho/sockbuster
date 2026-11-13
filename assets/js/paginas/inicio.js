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

/** Pinta las tarjetas de colecciones tematicas. */
async function renderColecciones() {
  const contenedor = porId('rejillaColecciones');
  if (!contenedor) return;
  const colecciones = await obtenerColecciones();
  contenedor.replaceChildren(
    ...colecciones.map((coleccion) => {
      const tarjeta = crear(
        'article',
        { class: 'tarjeta-coleccion', style: `--color-coleccion:${coleccion.color}` },
        crear('h3', {}, coleccion.nombre),
        crear('p', {}, coleccion.descripcion),
        crear('span', { class: 'etiqueta', style: `background:${coleccion.color}1f;color:${coleccion.color}` }, `${coleccion.total} modelos`),
        crear('p', { style: 'margin-top:.8rem' },
          crear('a', { href: `catalogo.html?coleccion=${coleccion.id}` }, 'Ver la coleccion →')
        )
      );
      return tarjeta;
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

/** Inicializa la pagina de inicio. */
async function iniciar() {
  conectarCabecera();
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
