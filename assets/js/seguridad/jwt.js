/**
 * Seguridad - JWT
 * Implementacion de JSON Web Tokens (HS256) sobre WebCrypto, sin librerias
 * externas. Es el componente que respalda el RNF02 del caso de estudio:
 * "garantizar la autenticacion de usuarios mediante tokens (JWT) para funciones
 * administrativas".
 *
 * El prototipo es 100% cliente, por lo que la clave secreta vive en el bundle
 * del navegador. La View Fisica documenta explicitamente que en produccion la
 * firma debe performed contra un IdP externo con JWKS published.
 */

const encoder = new TextEncoder();

/** Codifica bytes a base64url (sin padding). */
function aBase64Url(bytes) {
  let binario = '';
  for (const byte of bytes) binario += String.fromCharCode(byte);
  return btoa(binario).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

/** Decodifica base64url a cadena UTF-8. */
function deBase64Url(texto) {
  const normalizado = texto.replaceAll('-', '+').replaceAll('_', '/');
  const binario = atob(normalizado.padEnd(normalizado.length + ((4 - (normalizado.length % 4)) % 4), '='));
  return new TextDecoder().decode(Uint8Array.from(binario, (c) => c.charCodeAt(0)));
}

/** Convierte una clave en bytes a clave HMAC usable por WebCrypto. */
async function claveHmac(secret, usages) {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, usages);
}

/**
 * Firma un payload y devuelve un JWT en formato compacto.
 * @param {object} payload
 * @param {string} secret
 */
export async function firmarToken(payload, secret) {
  const cabecera = aBase64Url(encoder.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const cuerpo = aBase64Url(encoder.encode(JSON.stringify(payload)));
  const contenido = `${cabecera}.${cuerpo}`;
  const clave = await claveHmac(secret, ['sign']);
  const firma = await crypto.subtle.sign('HMAC', clave, encoder.encode(contenido));
  return `${contenido}.${aBase64Url(new Uint8Array(firma))}`;
}

/**
 * Verifica la firma y la vigencia de un token.
 * @returns {Promise<{valido: boolean, payload?: object, motivo?: string}>}
 */
export async function verificarToken(token, secret) {
  if (typeof token !== 'string') return { valido: false, motivo: 'Token ausente' };
  const partes = token.split('.');
  if (partes.length !== 3) return { valido: false, motivo: 'Formato de token invalido' };

  const [cabecera, cuerpo, firma] = partes;
  const contenido = `${cabecera}.${cuerpo}`;
  try {
    const clave = await claveHmac(secret, ['verify']);
    const ok = await crypto.subtle.verify('HMAC', clave, deBase64UrlABytes(firma), encoder.encode(contenido));
    if (!ok) return { valido: false, motivo: 'Firma no valida' };

    const payload = JSON.parse(deBase64Url(cuerpo));
    if (typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()) {
      return { valido: false, motivo: 'Token expirado', payload };
    }
    return { valido: true, payload };
  } catch (error) {
    return { valido: false, motivo: `Token ilegible: ${error.message}` };
  }
}

/** Convierte una cadena base64url a bytes. */
function deBase64UrlABytes(texto) {
  const normalizado = texto.replaceAll('-', '+').replaceAll('_', '/');
  const binario = atob(normalizado.padEnd(normalizado.length + ((4 - (normalizado.length % 4)) % 4), '='));
  return Uint8Array.from(binario, (c) => c.charCodeAt(0));
}

/** Decodifica el payload de un token sin verificarlo (solo para inspeccion). */
export function leerPayload(token) {
  try {
    return JSON.parse(deBase64Url(token.split('.')[1]));
  } catch {
    return null;
  }
}
