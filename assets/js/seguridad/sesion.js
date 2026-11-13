/**
 * Seguridad - Sesion
 * Registro, autenticacion y control de rol del prototipo.
 *
 * - Las contrasenas nunca se guardan en claro: se derivan con PBKDF2 (SHA-256,
 *   100000 iteraciones) y sal aleatoria por usuario.
 * - La sesion se transporta en un JWT HS256 firmado, que es lo que valida el
 *   panel de administracion (RF03) antes de cada operacion sensible.
 */
import { CLAVE_TOKEN } from '../nucleo/config.js';
import { firmarToken, verificarToken } from './jwt.js';
import { ALMACENAMIENTOS, guardar, leer, leerTodos } from '../datos/repositorio.js';
import { publicar, EVENTOS } from '../nucleo/eventos.js';

/**
 * Secreto de firma del prototipo.
 * En un despliegue real este secreto vive en el servidor (o se usa un IdP con
 * JWKS), nunca en el bundle del navegador.
 */
export const SECRETO_JWT = 'sockbuster-prototipo-secreto-hs256-cambiar-en-produccion';

const DURACION_TOKEN_SEGUNDOS = 60 * 60 * 8;
const ITERACIONES_PBKDF2 = 100000;

/** Deriva el hash de una contrasena con PBKDF2 y sal aleatoria. */
export async function derivarContrasena(password, salBase64) {
  const sal = salBase64
    ? Uint8Array.from(atob(salBase64), (c) => c.charCodeAt(0))
    : crypto.getRandomValues(new Uint8Array(16));
  const clave = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: sal, iterations: ITERACIONES_PBKDF2, hash: 'SHA-256' },
    clave,
    256
  );
  return {
    sal: btoa(String.fromCharCode(...sal)),
    hash: btoa(String.fromCharCode(...new Uint8Array(bits))),
  };
}

/** Comparacion en tiempo constante-ish entre dos hashes base64. */
function hashesCoinciden(a, b) {
  if (a.length !== b.length) return false;
  let diferencia = 0;
  for (let i = 0; i < a.length; i += 1) diferencia |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diferencia === 0;
}

/** Crea el usuario administrador semilla si todavia no existe. */
export async function asegurarAdminSemilla() {
  const existente = await leer(ALMACENAMIENTOS.usuarios, 'admin@sockbuster.cl');
  if (existente) return existente;
  const { sal, hash } = await derivarContrasena('Sockbuster2026');
  const admin = {
    email: 'admin@sockbuster.cl',
    nombre: 'Administrador',
    rol: 'ADMIN',
    sal,
    hash,
    creadoEn: new Date().toISOString(),
  };
  await guardar(ALMACENAMIENTOS.usuarios, admin);
  return admin;
}

/** Registra un cliente nuevo. */
export async function registrarCliente({ nombre, email, password }) {
  const correo = String(email).trim().toLowerCase();
  const existente = await leer(ALMACENAMIENTOS.usuarios, correo);
  if (existente) throw new Error('Ya existe una cuenta con ese correo.');

  const { sal, hash } = await derivarContrasena(password);
  const usuario = {
    email: correo,
    nombre: String(nombre).trim(),
    rol: 'CLIENTE',
    sal,
    hash,
    creadoEn: new Date().toISOString(),
  };
  await guardar(ALMACENAMIENTOS.usuarios, usuario);
  return emitirToken(usuario);
}

/** Autentica a un usuario y devuelve su token JWT. */
export async function iniciarSesion({ email, password }) {
  const correo = String(email).trim().toLowerCase();
  const usuario = await leer(ALMACENAMIENTOS.usuarios, correo);
  if (!usuario) throw new Error('Credenciales invalidas.');
  const { hash } = await derivarContrasena(password, usuario.sal);
  if (!hashesCoinciden(hash, usuario.hash)) throw new Error('Credenciales invalidas.');
  return emitirToken(usuario);
}

/** Genera el JWT de sesion para un usuario. */
async function emitirToken(usuario) {
  const ahora = Math.floor(Date.now() / 1000);
  const token = await firmarToken(
    {
      sub: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol,
      iat: ahora,
      exp: ahora + DURACION_TOKEN_SEGUNDOS,
    },
    SECRETO_JWT
  );
  guardarToken(token);
  publicar(EVENTOS.SesionCambiada, { usuario: usuarioPublico(usuario) });
  return token;
}

/** Proyecta un usuario interno a su forma publica (sin material sensible). */
function usuarioPublico(usuario) {
  return { email: usuario.email, nombre: usuario.nombre, rol: usuario.rol };
}

/** Guarda el token en sessionStorage. */
export function guardarToken(token) {
  sessionStorage.setItem(CLAVE_TOKEN, token);
}

/** Recupera el token guardado. */
export function leerToken() {
  return sessionStorage.getItem(CLAVE_TOKEN);
}

/** Cierra la sesion y limpia el token. */
export function cerrarSesion() {
  sessionStorage.removeItem(CLAVE_TOKEN);
  publicar(EVENTOS.SesionCambiada, { usuario: null });
}

/**
 * Devuelve el usuario autenticado en la sesion actual, validando el token.
 * @returns {Promise<object|null>}
 */
export async function usuarioActual() {
  const token = leerToken();
  if (!token) return null;
  const { valido, payload } = await verificarToken(token, SECRETO_JWT);
  if (!valido) {
    cerrarSesion();
    return null;
  }
  return { email: payload.sub, nombre: payload.nombre, rol: payload.rol };
}

/** Indica si la sesion actual tiene rol ADMIN. */
export async function esAdministrador() {
  const usuario = await usuarioActual();
  return usuario?.rol === 'ADMIN';
}

/** Lista de clientes registrados (para el panel de administracion). */
export async function listarClientes() {
  const usuarios = await leerTodos(ALMACENAMIENTOS.usuarios);
  return (usuarios ?? [])
    .filter((u) => u.rol === 'CLIENTE')
    .map((u) => ({ email: u.email, nombre: u.nombre, creadoEn: u.creadoEn }));
}
