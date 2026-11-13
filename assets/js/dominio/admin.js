/**
 * Dominio - Administracion
 * Caso de uso "Administrar inventario y tematicas" (RF03).
 *
 * Todas las operaciones de escritura exigen rol ADMIN y un token JWT valido.
 * La verificacion se hace en el dominio, no solo en la interfaz: si el token
 * no valida o el rol no es ADMIN, la operacion se rechaza.
 */
import { actualizarProducto, registrarProducto, resumenInventario } from '../datos/catalogo.js';
import { usuarioActual } from '../seguridad/sesion.js';

/** Exige una sesion administrativa valida antes de ejecutar la operacion. */
export async function exigirPermisoAdministracion() {
  const usuario = await usuarioActual();
  if (!usuario) return { ok: false, mensaje: 'Debes iniciar sesion.' };
  if (usuario.rol !== 'ADMIN') return { ok: false, mensaje: 'Operacion restringida al administrador.' };
  return { ok: true, usuario };
}

/** Lista el inventario con indicadores de gestion. */
export async function consultarInventario() {
  const permiso = await exigirPermisoAdministracion();
  if (!permiso.ok) return { ok: false, mensaje: permiso.mensaje };
  return { ok: true, ...(await resumenInventario()) };
}

/** Actualiza el stock de un calcetin (RF03). */
export async function actualizarStock(productoId, stock) {
  const permiso = await exigirPermisoAdministracion();
  if (!permiso.ok) return { ok: false, mensaje: permiso.mensaje };
  const valor = Number(stock);
  if (!Number.isInteger(valor) || valor < 0) return { ok: false, mensaje: 'El stock debe ser un entero mayor o igual a 0.' };
  const producto = await actualizarProducto(productoId, { stock: valor });
  return { ok: true, producto };
}

/** Actualiza el precio de un calcetin (RF03). */
export async function actualizarPrecio(productoId, precio) {
  const permiso = await exigirPermisoAdministracion();
  if (!permiso.ok) return { ok: false, mensaje: permiso.mensaje };
  const valor = Number(precio);
  if (!Number.isFinite(valor) || valor <= 0) return { ok: false, mensaje: 'El precio debe ser mayor a 0.' };
  const producto = await actualizarProducto(productoId, { precio: Math.round(valor) });
  return { ok: true, producto };
}

/** Asocia un calcetin a una pelicula o serie (RF03). */
export async function asociarPelicula(productoId, peliculaSerieId) {
  const permiso = await exigirPermisoAdministracion();
  if (!permiso.ok) return { ok: false, mensaje: permiso.mensaje };
  const producto = await actualizarProducto(productoId, { peliculaSerieId: Number(peliculaSerieId) });
  return { ok: true, producto };
}

/** Registra un modelo nuevo de calcetin (RF03). */
export async function registrarModelo(datos) {
  const permiso = await exigirPermisoAdministracion();
  if (!permiso.ok) return { ok: false, mensaje: permiso.mensaje };
  if (!String(datos.nombre ?? '').trim()) return { ok: false, mensaje: 'El nombre del modelo es obligatorio.' };
  const producto = await registrarProducto(datos);
  return { ok: true, producto };
}

/** Da de baja un calcetin del catalogo. */
export async function desactivarProducto(productoId) {
  const permiso = await exigirPermisoAdministracion();
  if (!permiso.ok) return { ok: false, mensaje: permiso.mensaje };
  const producto = await actualizarProducto(productoId, { activo: false });
  return { ok: true, producto };
}
