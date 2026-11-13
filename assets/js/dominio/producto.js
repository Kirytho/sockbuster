/**
 * Dominio - Producto
 * Entidad Calcetin y reglas de consulta del catalogo (RF01).
 */
import { filtrarProductos, listarProductos, obtenerProducto } from '../datos/catalogo.js';
import { normalizar } from '../nucleo/util.js';

/** Devuelve el catalogo completo con stock, precio y tallas (RF01). */
export async function consultarCatalogo() {
  return listarProductos();
}

/** Aplica el conjunto de filtros activos sobre el catalogo (RF01). */
export async function buscarConFiltros(criterios) {
  return filtrarProductos(criterios);
}

/** Devuelve los productos destacados para la pagina de inicio. */
export async function destacados(limite = 8) {
  const productos = await listarProductos();
  const seleccionados = productos.filter((p) => p.destacado && p.activo);
  return seleccionados.slice(0, limite);
}

/** Devuelve un producto por identificador. */
export async function consultarProducto(id) {
  return obtenerProducto(id);
}

/** Calcula el promedio de las valoraciones de un producto (RF04). */
export function calcularPromedio(resenas) {
  if (!resenas?.length) return { promedio: 0, total: 0 };
  const suma = resenas.reduce((acc, r) => acc + r.puntaje, 0);
  return { promedio: Math.round((suma / resenas.length) * 10) / 10, total: resenas.length };
}

/** Indica si el producto puede comprarse en la cantidad solicitada. */
export function puedeReservar(producto, cantidad) {
  if (!producto || !producto.activo) return false;
  if (producto.stock <= 0) return false;
  return cantidad <= producto.stock;
}

/** Ordena el catalogo segun el criterio elegido por el usuario. */
export function ordenar(productos, criterio) {
  const copia = [...productos];
  switch (criterio) {
    case 'precio-asc':
      return copia.sort((a, b) => a.precio - b.precio);
    case 'precio-desc':
      return copia.sort((a, b) => b.precio - a.precio);
    case 'nombre':
      return copia.sort((a, b) => normalizar(a.nombre).localeCompare(normalizar(b.nombre)));
    case 'novedad':
      return copia.sort((a, b) => (b.creadoEn ?? '').localeCompare(a.creadoEn ?? ''));
    default:
      return copia;
  }
}
