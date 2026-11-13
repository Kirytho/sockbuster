/**
 * Presentacion - Cabecera
 * Estado compartido de la cabecera: navegacion activa, contador del carrito,
 * menu de sesion y acceso al panel de administracion.
 */
import { crear, porId } from '../nucleo/util.js';
import { usuarioActual, cerrarSesion, esAdministrador } from '../seguridad/sesion.js';
import { obtenerCarrito, contarUnidades } from '../dominio/carrito.js';
import { suscribir, EVENTOS } from '../nucleo/eventos.js';

/** Marca como activa la pestana de la pagina actual. */
export function marcarNavegacionActiva() {
  const pagina = location.pathname.split('/').pop() || 'index.html';
  for (const enlace of document.querySelectorAll('.nav-principal a')) {
    const destino = enlace.getAttribute('href');
    if (destino === pagina) enlace.classList.add('activo');
  }
}

/** Actualiza el contador de unidades del carrito. */
export async function refrescarContadorCarrito(usuario = null) {
  const badge = porId('contadorCarrito');
  if (!badge) return;
  const items = await obtenerCarrito(usuario);
  const unidades = contarUnidades(items);
  badge.textContent = String(unidades);
  badge.hidden = unidades === 0;
}

/** Pinta el menu de sesion segun el estado de autenticacion. */
export async function refrescarSesion() {
  const zona = porId('zonaSesion');
  if (!zona) return;
  const usuario = await usuarioActual();
  zona.replaceChildren();

  if (!usuario) {
    const boton = crear('button', { class: 'boton boton--secundario boton--chico', type: 'button', id: 'botonIniciarSesion' }, 'Ingresar');
    boton.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('sockbuster:abrir-sesion', { detail: { modo: 'login' } }));
    });
    zona.append(boton);
    return;
  }

  if (usuario.rol === 'ADMIN') {
    const botonAdmin = crear('button', { class: 'boton boton--fantasma boton--chico', type: 'button', id: 'botonPanelAdmin' }, 'Panel admin');
    botonAdmin.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('sockbuster:abrir-admin'));
    });
    zona.append(botonAdmin);
  }

  const salir = crear('button', { class: 'boton boton--fantasma boton--chico', type: 'button' }, 'Salir');
  salir.addEventListener('click', async () => {
    cerrarSesion();
    await refrescarSesion();
    await refrescarContadorCarrito(null);
  });

  zona.append(crear('span', { style: 'font-size:.9rem;font-weight:650;margin-right:.35rem' }, usuario.nombre), salir);
}

/** Conecta los eventos de dominio con el repintado de la cabecera. */
export function conectarCabecera() {
  marcarNavegacionActiva();
  suscribir(EVENTOS.SesionCambiada, async () => {
    await refrescarSesion();
    await refrescarContadorCarrito();
  });
  suscribir(EVENTOS.CarritoModificado, () => refrescarContadorCarrito());
  refrescarSesion();
  refrescarContadorCarrito();
}

/** Indica si el usuario actual es administrador. */
export { esAdministrador };
