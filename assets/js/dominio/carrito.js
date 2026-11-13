/**
 * Dominio - Carrito
 * Caso de uso "Gestionar carrito de compras" (RF02).
 *
 * El carrito se persiste por usuario: para un cliente registrado usa su correo,
 * para un visitante usa la clave de sesion anonima. Cada cambio emite el
 * evento CarritoModificado, que la presentacion escucha para repintar.
 */
import { ALMACENAMIENTOS, guardar, leer } from '../datos/repositorio.js';
import { obtenerProducto } from '../datos/catalogo.js';
import { publicar, EVENTOS } from '../nucleo/eventos.js';

const CLAVE_ANONIMA = 'sockbuster.carrito.anonimo';

/**
 * Cola de serializacion de las mutaciones del carrito.
 * Sin esto, dos clics rapidos en "Agregar" leen el carrito antes de que la
 * primera escritura termine y la segunda pisa a la primera: se pierde un item.
 */
let cola = Promise.resolve();

function serializar(tarea) {
  const siguiente = cola.then(() => tarea());
  cola = siguiente.then(
    () => undefined,
    () => undefined
  );
  return siguiente;
}

/** Devuelve la clave de carrito segun la identidad del usuario. */
export function claveCarrito(usuario) {
  return usuario?.email ?? (sessionStorage.getItem(CLAVE_ANONIMA) ?? (() => {
    const nueva = `anon-${crypto.randomUUID()}`;
    sessionStorage.setItem(CLAVE_ANONIMA, nueva);
    return nueva;
  })());
}

/** Carga el carrito almacenado. */
export async function obtenerCarrito(usuario) {
  const registro = await leer(ALMACENAMIENTOS.carritos, claveCarrito(usuario));
  return registro?.items ?? [];
}

/** Guarda el carrito completo. */
async function persistir(items, usuario) {
  await guardar(ALMACENAMIENTOS.carritos, { clave: claveCarrito(usuario), items, actualizadoEn: new Date().toISOString() });
  publicar(EVENTOS.CarritoModificado, { items });
  return items;
}

/**
 * Agrega un producto al carrito validando stock y tamanos (RF02).
 * @returns {Promise<{ok: boolean, items: Array, mensaje?: string}>}
 */
export async function agregarItem(productoId, cantidad = 1, talla = null, usuario = null) {
  return serializar(() => agregarItemInterno(productoId, cantidad, talla, usuario));
}

async function agregarItemInterno(productoId, cantidad = 1, talla = null, usuario = null) {
  const producto = await obtenerProducto(productoId);
  if (!producto) return { ok: false, items: [], mensaje: 'El producto no existe.' };
  if (!producto.activo) return { ok: false, items: [], mensaje: 'El producto ya no esta disponible.' };
  if (producto.stock <= 0) return { ok: false, items: [], mensaje: 'Producto agotado.' };

  const items = await obtenerCarrito(usuario);
  const indice = items.findIndex((i) => i.productoId === Number(productoId) && i.talla === talla);
  const cantidadActual = indice >= 0 ? items[indice].cantidad : 0;

  if (cantidadActual + cantidad > producto.stock) {
    return {
      ok: false,
      items,
      mensaje: `Solo quedan ${producto.stock} unidades de ${producto.nombre}.`,
    };
  }

  if (indice >= 0) {
    items[indice].cantidad += cantidad;
    items[indice].precioUnitario = producto.precio;
  } else {
    items.push({
      productoId: Number(productoId),
      nombre: producto.nombre,
      imagen: producto.imagen,
      precioUnitario: producto.precio,
      cantidad,
      talla: talla ?? producto.tallas[0],
      stock: producto.stock,
    });
  }
  await persistir(items, usuario);
  return { ok: true, items };
}

/** Cambia la cantidad de un item del carrito (RF02). */
export async function cambiarCantidad(productoId, cantidad, talla = null, usuario = null) {
  return serializar(() => cambiarCantidadInterna(productoId, cantidad, talla, usuario));
}

async function cambiarCantidadInterna(productoId, cantidad, talla = null, usuario = null) {
  const items = await obtenerCarrito(usuario);
  const indice = items.findIndex((i) => i.productoId === Number(productoId) && i.talla === talla);
  if (indice < 0) return { ok: false, items };

  if (cantidad <= 0) {
    items.splice(indice, 1);
  } else {
    const producto = await obtenerProducto(productoId);
    if (cantidad > (producto?.stock ?? 0)) {
      return { ok: false, items, mensaje: `Stock insuficiente: quedan ${producto.stock} unidades.` };
    }
    items[indice].cantidad = cantidad;
    items[indice].precioUnitario = producto?.precio ?? items[indice].precioUnitario;
  }
  await persistir(items, usuario);
  return { ok: true, items };
}

/** Elimina un item del carrito. */
export async function quitarItem(productoId, talla = null, usuario = null) {
  return serializar(async () => {
    const items = await obtenerCarrito(usuario);
    const filtrados = items.filter((i) => !(i.productoId === Number(productoId) && i.talla === talla));
    await persistir(filtrados, usuario);
    return { ok: true, items: filtrados };
  });
}

/** Vacia el carrito. */
export async function vaciarCarrito(usuario = null) {
  return serializar(async () => {
    await persistir([], usuario);
    return { ok: true, items: [] };
  });
}

/** Calcula el total del carrito. */
export function calcularTotal(items) {
  return (items ?? []).reduce((acc, i) => acc + i.precioUnitario * i.cantidad, 0);
}

/** Cantidad total de unidades en el carrito. */
export function contarUnidades(items) {
  return (items ?? []).reduce((acc, i) => acc + i.cantidad, 0);
}
