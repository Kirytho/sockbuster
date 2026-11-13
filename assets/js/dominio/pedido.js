/**
 * Dominio - Pedido
 * Caso de uso "Confirmar pedido / checkout" (RF02).
 *
 * El checkout simula la verificacion de pago y genera el identificador unico
 * del pedido. La secuencia de pasos refleja el diagrama de secuencia de la
 * Vista de Procesos: validacion de stock y verificacion de pago se ejecutan
 * en paralelo y se sincronizan antes de confirmar.
 */
import { ALMACENAMIENTOS, guardar, insertar, leerTodos, siguienteContador } from '../datos/repositorio.js';
import { actualizarProducto, obtenerProducto } from '../datos/catalogo.js';
import { calcularTotal } from './carrito.js';
import { generarIdPedido } from '../nucleo/util.js';
import { publicar, EVENTOS } from '../nucleo/eventos.js';

export const ESTADOS_PEDIDO = {
  PENDIENTE: 'PENDIENTE',
  CONFIRMADO: 'CONFIRMADO',
  DESPACHADO: 'DESPACHADO',
};

/**
 * Verifica el stock de todos los items del carrito.
 * @returns {Promise<{ok: boolean, faltantes: Array}>}
 */
export async function verificarStock(items) {
  const faltantes = [];
  for (const item of items) {
    const producto = await obtenerProducto(item.productoId);
    if (!producto || !producto.activo) {
      faltantes.push({ ...item, motivo: 'Ya no esta disponible' });
    } else if (producto.stock < item.cantidad) {
      faltantes.push({ ...item, motivo: `Stock insuficiente (quedan ${producto.stock})` });
    }
  }
  return { ok: faltantes.length === 0, faltantes };
}

/**
 * Simula la verificacion del medio de pago.
 * En un despliegue real este paso lo resuelve una pasarela externa; aqui se
 * modela la frontera del sistema con el proveedor de pago.
 */
export async function verificarPago({ metodo, email, total }) {
  await new Promise((r) => setTimeout(r, 320));
  if (!email) return { ok: false, motivo: 'Se requiere un correo para facturar.' };
  if (total <= 0) return { ok: false, motivo: 'El pedido no tiene monto.' };
  return { ok: true, autorizacion: `AUTH-${Math.random().toString(36).slice(2, 10).toUpperCase()}`, metodo };
}

/**
 * Confirma el pedido: descuenta stock, persiste el pedido con su identificador
 * unico y emite el evento PedidoConfirmado.
 */
export async function confirmarPedido({ items, usuario, metodoPago, direccion, email }) {
  const total = calcularTotal(items);
  const correoFacturacion = (email ?? usuario?.email ?? '').trim();

  // Verificacion de stock y verificacion de pago en paralelo (paralelismo del
  // diagrama de secuencia) con punto de sincronizacion antes de confirmar.
  const [stock, pago] = await Promise.all([
    verificarStock(items),
    verificarPago({ metodo: metodoPago, email: correoFacturacion, total }),
  ]);

  if (!stock.ok) {
    return { ok: false, etapa: 'stock', mensaje: 'Sin stock suficiente para completar el pedido.', faltantes: stock.faltantes };
  }
  if (!pago.ok) {
    return { ok: false, etapa: 'pago', mensaje: pago.motivo };
  }

  const numero = await siguienteContador('pedido', 1);
  const id = generarIdPedido(numero);
  const pedido = {
    id,
    numero,
    usuarioEmail: usuario?.email ?? null,
    usuarioNombre: usuario?.nombre ?? 'Visitante',
    emailFacturacion: correoFacturacion || null,
    items: items.map((i) => ({ ...i })),
    total,
    estado: ESTADOS_PEDIDO.CONFIRMADO,
    metodoPago,
    autorizacionPago: pago.autorizacion,
    direccion: direccion ?? null,
    creadoEn: new Date().toISOString(),
  };

  await insertar(ALMACENAMIENTOS.pedidos, pedido);

  for (const item of items) {
    const producto = await obtenerProducto(item.productoId);
    await actualizarProducto(item.productoId, { stock: Math.max(0, (producto?.stock ?? 0) - item.cantidad) });
  }

  publicar(EVENTOS.PedidoConfirmado, pedido);
  return { ok: true, pedido };
}

/** Lista los pedidos del usuario autenticado. */
export async function listarPedidos(usuario) {
  if (!usuario?.email) return [];
  const pedidos = await leerTodos(ALMACENAMIENTOS.pedidos);
  return (pedidos ?? []).filter((p) => p.usuarioEmail === usuario.email).sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
}

/** Actualiza el estado de un pedido (uso administrativo). */
export async function cambiarEstadoPedido(id, estado) {
  const pedidos = await leerTodos(ALMACENAMIENTOS.pedidos);
  const pedido = (pedidos ?? []).find((p) => p.id === id);
  if (!pedido) return { ok: false, mensaje: 'Pedido no encontrado.' };
  pedido.estado = estado;
  await guardar(ALMACENAMIENTOS.pedidos, pedido);
  return { ok: true, pedido };
}
