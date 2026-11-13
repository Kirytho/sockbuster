/**
 * Nucleo - Bus de eventos
 * Canal de decoupling entre dominio y presentacion: el dominio emite hechos
 * (carrito-modificado, pedido-confirmado) y la capa de presentacion decide que
 * pintar. Evita acoplar los casos de uso a la UI.
 */
const suscriptores = new Map();

/**
 * Suscribe un listener a un evento del dominio.
 * @param {string} evento
 * @param {Function} listener
 * @returns {Function} funcion para cancelar la suscripcion
 */
export function suscribir(evento, listener) {
  if (!suscriptores.has(evento)) suscriptores.set(evento, new Set());
  suscriptores.get(evento).add(listener);
  return () => suscriptores.get(evento)?.delete(listener);
}

/** Publica un evento del dominio con su detalle. */
export function publicar(evento, detalle) {
  const conjunto = suscriptores.get(evento);
  if (!conjunto) return;
  for (const listener of [...conjunto]) {
    try {
      listener(detalle);
    } catch (error) {
      console.error(`[bus] fallo en listener de "${evento}"`, error);
    }
  }
}

/** Nombres de eventos emitidos por el dominio. */
export const EVENTOS = {
  CarritoModificado: 'carrito:modificado',
  PedidoConfirmado: 'pedido:confirmado',
  SesionCambiada: 'sesion:cambiada',
  ProductoModificado: 'producto:modificado',
  ResenaPublicada: 'resena:publicada',
};
