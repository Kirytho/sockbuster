/**
 * Dominio - Resena
 * Caso de uso "Publicar valoracion y comentario" (RF04).
 *
 * Solo los usuarios registrados pueden publicar resenas: el caso de uso
 * valida el rol antes de persistir, igual que valida el panel de administracion.
 */
import { ALMACENAMIENTOS, insertar, leerTodos, eliminar } from '../datos/repositorio.js';
import { publicar, EVENTOS } from '../nucleo/eventos.js';

/** Lista las resenas de un producto, mas recientes primero. */
export async function listarResenas(productoId) {
  const resenas = await leerTodos(ALMACENAMIENTOS.resenas);
  return (resenas ?? [])
    .filter((r) => r.productoId === Number(productoId))
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
}

/** Lista todas las resenas del sistema (panel de administracion). */
export async function listarTodasResenas() {
  const resenas = await leerTodos(ALMACENAMIENTOS.resenas);
  return (resenas ?? []).sort((a, b) => b.fecha.localeCompare(a.fecha));
}

/**
 * Publica una resena de 1 a 5 estrellas con comentario (RF04).
 * @returns {Promise<{ok: boolean, mensaje?: string, resena?: object}>}
 */
export async function publicarResena({ productoId, usuario, puntaje, comentario }) {
  if (!usuario?.email) {
    return { ok: false, mensaje: 'Debes iniciar sesion para publicar una resena.' };
  }
  const nota = Number(puntaje);
  if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
    return { ok: false, mensaje: 'La valoracion debe estar entre 1 y 5 estrellas.' };
  }
  const texto = String(comentario ?? '').trim();
  if (texto.length < 5) {
    return { ok: false, mensaje: 'Escribe un comentario de al menos 5 caracteres.' };
  }

  const resena = {
    productoId: Number(productoId),
    usuarioEmail: usuario.email,
    usuarioNombre: usuario.nombre,
    puntaje: nota,
    comentario: texto,
    fecha: new Date().toISOString(),
  };
  const clave = await insertar(ALMACENAMIENTOS.resenas, resena);
  const guardada = { ...resena, id: clave };
  publicar(EVENTOS.ResenaPublicada, guardada);
  return { ok: true, resena: guardada };
}

/** Elimina una resena (uso administrativo). */
export async function eliminarResena(id) {
  await eliminar(ALMACENAMIENTOS.resenas, id);
  return { ok: true };
}
