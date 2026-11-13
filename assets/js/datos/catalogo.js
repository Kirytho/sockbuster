/**
 * Datos - Catalogo
 * Combina el catalogo semilla (JSON servido desde el repositorio) con los
 * overrides de inventario guardados localmente (stock, precio, activo, nuevos
 * modelos). Expone la operacion de consulta y filtrado que usa la View de
 * Procesos en el diagrama de actividades de filtrado.
 */
import { RUTAS } from '../nucleo/config.js';
import { normalizar } from '../nucleo/util.js';
import { ALMACENAMIENTOS, leerTodos, guardar } from './repositorio.js';

let semilla = null;
let overrides = new Map();

/** Descarga y cachea el catalogo semilla. */
export async function cargarSemilla() {
  if (semilla) return semilla;
  const respuesta = await fetch(RUTAS.catalogoDatos, { cache: 'no-cache' });
  if (!respuesta.ok) throw new Error(`No se pudo cargar el catalogo (${respuesta.status})`);
  semilla = await respuesta.json();
  return semilla;
}

/** Carga los overrides de inventario desde la base local. */
export async function cargarOverrides() {
  const registros = await leerTodos(ALMACENAMIENTOS.productos);
  overrides = new Map((registros ?? []).map((r) => [r.id, r]));
  return overrides;
}

/** Devuelve el catalogo semilla completo. */
export async function obtenerSemilla() {
  return (await cargarSemilla()) ?? { colecciones: [], peliculasSeries: [], productos: [] };
}

/** Devuelve la lista de colecciones tematicas con el conteo de productos. */
export async function obtenerColecciones() {
  const { colecciones } = await obtenerSemilla();
  const productos = await listarProductos();
  return colecciones.map((c) => ({
    ...c,
    total: productos.filter((p) => p.coleccionId === c.id).length,
  }));
}

/** Devuelve la lista de peliculas y series indexada por id. */
export async function obtenerPeliculasSeries() {
  const { peliculasSeries } = await obtenerSemilla();
  return new Map((peliculasSeries ?? []).map((p) => [p.id, p]));
}

/**
 * Devuelve el catalogo efectivo: productos semilla + overrides locales.
 * Si un producto fue dado de baja se conserva con activo=false.
 */
export async function listarProductos() {
  const { productos } = await obtenerSemilla();
  if (!overrides.size) await cargarOverrides();
  return (productos ?? []).map((p) => {
    const override = overrides.get(p.id);
    return override ? { ...p, ...override } : { ...p };
  });
}

/** Devuelve un producto por id. */
export async function obtenerProducto(id) {
  const productos = await listarProductos();
  return productos.find((p) => p.id === Number(id)) ?? null;
}

/**
 * Aplica los filtros del catalogo. Cada filtro es independiente y se evalua
 * en paralelo, tal como se documenta en el diagrama de actividades de filtrado.
 * @param {object} criterios
 */
export async function filtrarProductos(criterios = {}) {
  const productos = await listarProductos();
  const { colecciones = [], busqueda = '', precioMax = Infinity, tallas = [], soloConStock = false } = criterios;

  const coincide = (producto) => {
    if (!producto.activo) return false;
    if (colecciones.length && !colecciones.includes(producto.coleccionId)) return false;
    if (precioMax !== Infinity && producto.precio > precioMax) return false;
    if (tallas.length && !tallas.some((t) => producto.tallas.includes(t))) return false;
    if (soloConStock && producto.stock <= 0) return false;
    if (busqueda) {
      const texto = normalizar(`${producto.nombre} ${producto.descripcion}`);
      if (!texto.includes(normalizar(busqueda))) return false;
    }
    return true;
  };

  return productos.filter(coincide);
}

/** Guarda un override de inventario para un producto. */
export async function actualizarProducto(id, cambios) {
  const producto = await obtenerProducto(id);
  if (!producto) throw new Error('Producto inexistente');
  const registro = { ...producto, ...cambios, id: Number(id), actualizadoEn: new Date().toISOString() };
  await guardar(ALMACENAMIENTOS.productos, registro);
  overrides.set(registro.id, registro);
  return registro;
}

/** Registra un modelo nuevo de calcetin (RF03). */
export async function registrarProducto(datos) {
  const productos = await listarProductos();
  const nuevoId = Math.max(0, ...productos.map((p) => p.id)) + 1;
  const registro = {
    id: nuevoId,
    nombre: datos.nombre,
    descripcion: datos.descripcion ?? 'Nuevo modelo de la coleccion Sockbuster.',
    precio: Number(datos.precio) || 0,
    stock: Number(datos.stock) || 0,
    tallas: datos.tallas ?? ['M'],
    colorPrimario: datos.colorPrimario ?? '#e8402a',
    colorSecundario: datos.colorSecundario ?? '#1d2733',
    motivo: datos.motivo ?? 'planeta',
    coleccionId: Number(datos.coleccionId) || 1,
    peliculaSerieId: Number(datos.peliculaSerieId) || 1,
    imagen: `assets/img/calcetines/calcetin-${String(nuevoId).padStart(2, '0')}.svg`,
    destacado: Boolean(datos.destacado),
    activo: true,
    creadoEn: new Date().toISOString(),
  };
  await guardar(ALMACENAMIENTOS.productos, registro);
  overrides.set(registro.id, registro);
  return registro;
}

/** Resumen de inventario para el panel de administracion. */
export async function resumenInventario() {
  const productos = await listarProductos();
  const valor = productos.reduce((acc, p) => acc + p.precio * p.stock, 0);
  const unidades = productos.reduce((acc, p) => acc + p.stock, 0);
  const agotados = productos.filter((p) => p.stock <= 0).length;
  const porColeccion = new Map();
  for (const p of productos) {
    porColeccion.set(p.coleccionId, (porColeccion.get(p.coleccionId) ?? 0) + p.stock);
  }
  return { productos, valor, unidades, agotados, porColeccion };
}
