/**
 * Paginas - Catalogo
 * Pagina unica que materializa los cuatro requerimientos funcionales:
 *   RF01 catalogo con filtros por coleccion, precio, talla y stock.
 *   RF02 carrito de compras y checkout simulado con identificador unico.
 *   RF03 administracion de inventario y tematicas (rol ADMIN + JWT).
 *   RF04 resenas de fanaticos (1 a 5 estrellas + comentario) para registrados.
 */
import { COLECCIONES, TALLAS, METODOS_PAGO, RUTAS } from '../nucleo/config.js';
import { crear, porId, formatearMoneda, formatearFecha, retrasar, normalizar } from '../nucleo/util.js';
import { conectarCabecera, refrescarContadorCarrito } from '../presentacion/cabecera.js';
import { tarjetaProducto, estrellas, badgeStock, estadoVacio, badgeRequisito } from '../presentacion/componentes.js';
import { abrirModal, cerrarModal } from '../presentacion/modal.js';
import { avisar } from '../presentacion/aviso.js';
import { renderizarCarrito } from '../presentacion/carritoPanel.js';
import { dibujarBarras } from '../presentacion/grafico.js';

import { obtenerColecciones, obtenerPeliculasSeries, listarProductos, cargarOverrides } from '../datos/catalogo.js';
import { buscarConFiltros, ordenar, calcularPromedio } from '../dominio/producto.js';
import { agregarItem, cambiarCantidad, quitarItem, obtenerCarrito, calcularTotal, contarUnidades } from '../dominio/carrito.js';
import { confirmarPedido, listarPedidos } from '../dominio/pedido.js';
import { listarResenas, publicarResena } from '../dominio/resena.js';
import {
  consultarInventario,
  actualizarStock,
  actualizarPrecio,
  asociarPelicula,
  registrarModelo,
} from '../dominio/admin.js';
import { usuarioActual, registrarCliente, iniciarSesion, asegurarAdminSemilla, listarClientes } from '../seguridad/sesion.js';

/** Estado local de la pagina. */
const estado = {
  criterios: { colecciones: [], busqueda: '', precioMax: Infinity, tallas: [], soloConStock: false },
  orden: 'destacado',
  usuario: null,
  productos: [],
  colecciones: [],
  peliculasSeries: new Map(),
};

// ---------------------------------------------------------------------------------------------
// Catalogo y filtros (RF01)
// ---------------------------------------------------------------------------------------------

/** Construye el panel lateral de filtros. */
async function pintarFiltros() {
  const contenedor = porId('panelFiltros');
  if (!contenedor) return;
  estado.colecciones = await obtenerColecciones();
  estado.peliculasSeries = await obtenerPeliculasSeries();

  const grupoColecciones = crear('div', { class: 'grupo-check' });
  for (const coleccion of estado.colecciones) {
    const entrada = crear('input', { type: 'checkbox', value: String(coleccion.id), 'data-filtro': 'coleccion' });
    entrada.addEventListener('change', () => aplicarFiltros());
    grupoColecciones.append(crear('label', {}, entrada, ` ${coleccion.nombre} (${coleccion.total})`));
  }

  const grupoTallas = crear('div', { class: 'grupo-check' });
  for (const talla of TALLAS) {
    const entrada = crear('input', { type: 'checkbox', value: talla, 'data-filtro': 'talla' });
    entrada.addEventListener('change', () => aplicarFiltros());
    grupoTallas.append(crear('label', {}, entrada, ` Talla ${talla}`));
  }

  const soloStock = crear('input', { type: 'checkbox', 'data-filtro': 'stock' });
  soloStock.addEventListener('change', () => aplicarFiltros());

  const precioMax = crear('input', {
    type: 'number',
    min: '0',
    step: '1000',
    placeholder: 'Sin limite',
    'data-filtro': 'precio',
    'aria-label': 'Precio maximo',
  });
  precioMax.addEventListener('input', retrasar(() => aplicarFiltros(), 400));

  const limpiar = crear('button', { class: 'boton boton--fantasma boton--chico boton--bloque', type: 'button' }, 'Limpiar filtros');
  limpiar.addEventListener('click', () => {
    estado.criterios = { colecciones: [], busqueda: '', precioMax: Infinity, tallas: [], soloConStock: false };
    contenedor.querySelectorAll('input[type="checkbox"]').forEach((c) => (c.checked = false));
    const buscador = porId('busqueda');
    if (buscador) buscador.value = '';
    if (precioMax) precioMax.value = '';
    aplicarFiltros();
  });

  contenedor.replaceChildren(
    crear('h3', {}, 'Colecciones'),
    grupoColecciones,
    crear('h3', {}, 'Tallas'),
    grupoTallas,
    crear('h3', {}, 'Precio maximo'),
    crear('div', { class: 'rango' }, precioMax),
    crear('h3', {}, 'Disponibilidad'),
    crear('label', { style: 'display:flex;gap:.5rem;align-items:center;font-size:.92rem;cursor:pointer' }, soloStock, ' Solo con stock'),
    crear('div', { style: 'margin-top:1.1rem' }, limpiar)
  );
}

/** Lee los filtros del panel y aplica el conjunto de criterios (RF01). */
async function aplicarFiltros() {
  const contenedor = porId('panelFiltros');
  if (!contenedor) return;

  estado.criterios.colecciones = [...contenedor.querySelectorAll('input[data-filtro="coleccion"]:checked')].map((c) => Number(c.value));
  estado.criterios.tallas = [...contenedor.querySelectorAll('input[data-filtro="talla"]:checked')].map((c) => c.value);
  estado.criterios.soloConStock = Boolean(contenedor.querySelector('input[data-filtro="stock"]:checked'));
  const precio = Number(contenedor.querySelector('input[data-filtro="precio"]')?.value);
  estado.criterios.precioMax = Number.isFinite(precio) && precio > 0 ? precio : Infinity;
  estado.criterios.busqueda = porId('busqueda')?.value ?? '';

  const productos = await buscarConFiltros(estado.criterios);
  estado.productos = ordenar(productos, estado.orden);
  pintarResultados();
}

/** Pinta la grilla de resultados y el resumen de la busqueda. */
function pintarResultados() {
  const grilla = porId('rejillaProductos');
  const resumen = porId('resumenResultados');
  if (!grilla) return;

  if (resumen) {
    const total = estado.productos.length;
    resumen.textContent = total === 1 ? '1 modelo encontrado' : `${total} modelos encontrados`;
  }

  if (!estado.productos.length) {
    grilla.replaceChildren(
      estadoVacio('No encontramos calcetines con esos filtros', 'Prueba a quitar alguno o a limpiar la busqueda.')
    );
    return;
  }

  grilla.replaceChildren(
    ...estado.productos.map((producto) =>
      tarjetaProducto(producto, { alVerDetalle: abrirFichaProducto, alAgregar: agregarAlCarritoRapido })
    )
  );
  pintarChips();
}

/** Muestra los filtros activos como chips removibles. */
function pintarChips() {
  const contenedor = porId('chipsActivos');
  if (!contenedor) return;
  const chips = [];

  for (const id of estado.criterios.colecciones) {
    const coleccion = estado.colecciones.find((c) => c.id === id);
    chips.push(chip(`Coleccion: ${coleccion?.nombre ?? id}`, () => {
      estado.criterios.colecciones = estado.criterios.colecciones.filter((c) => c !== id);
      const entrada = porId('panelFiltros')?.querySelector(`input[data-filtro="coleccion"][value="${id}"]`);
      if (entrada) entrada.checked = false;
      aplicarFiltros();
    }));
  }
  for (const talla of estado.criterios.tallas) {
    chips.push(chip(`Talla ${talla}`, () => {
      estado.criterios.tallas = estado.criterios.tallas.filter((t) => t !== talla);
      const entrada = porId('panelFiltros')?.querySelector(`input[data-filtro="talla"][value="${talla}"]`);
      if (entrada) entrada.checked = false;
      aplicarFiltros();
    }));
  }
  if (estado.criterios.busqueda) {
    chips.push(chip(`Busqueda: "${estado.criterios.busqueda}"`, () => {
      estado.criterios.busqueda = '';
      const buscador = porId('busqueda');
      if (buscador) buscador.value = '';
      aplicarFiltros();
    }));
  }
  if (estado.criterios.precioMax !== Infinity) {
    chips.push(chip(`Hasta ${formatearMoneda(estado.criterios.precioMax)}`, () => {
      estado.criterios.precioMax = Infinity;
      const entrada = porId('panelFiltros')?.querySelector('input[data-filtro="precio"]');
      if (entrada) entrada.value = '';
      aplicarFiltros();
    }));
  }
  if (estado.criterios.soloConStock) {
    chips.push(chip('Solo con stock', () => {
      estado.criterios.soloConStock = false;
      const entrada = porId('panelFiltros')?.querySelector('input[data-filtro="stock"]');
      if (entrada) entrada.checked = false;
      aplicarFiltros();
    }));
  }

  contenedor.replaceChildren(...chips);
}

function chip(texto, alCerrar) {
  const boton = crear('button', { type: 'button', 'aria-label': `Quitar filtro ${texto}` }, '×');
  boton.addEventListener('click', alCerrar);
  return crear('span', { class: 'chip' }, texto, boton);
}

// ---------------------------------------------------------------------------------------------
// Carrito (RF02)
// ---------------------------------------------------------------------------------------------

/** Agrega un producto al carrito con la primera talla disponible. */
async function agregarAlCarritoRapido(producto) {
  const resultado = await agregarItem(producto.id, 1, producto.tallas[0], estado.usuario);
  if (resultado.ok) {
    avisar(`${producto.nombre} agregado al carrito`, 'ok');
    abrirCarrito();
  } else {
    avisar(resultado.mensaje ?? 'No se pudo agregar al carrito', 'error');
  }
}

/** Abre el panel lateral del carrito. */
function abrirCarrito() {
  const panel = porId('panelCarrito');
  panel?.classList.add('abierto');
  porId('fondoCarrito')?.classList.remove('oculto');
  refrescarCarrito();
}

/** Cierra el panel lateral del carrito. */
function cerrarCarrito() {
  porId('panelCarrito')?.classList.remove('abierto');
  porId('fondoCarrito')?.classList.add('oculto');
}

/** Vuelve a pintar el contenido del carrito. */
async function refrescarCarrito() {
  const items = await obtenerCarrito(estado.usuario);
  renderizarCarrito(porId('cuerpoCarrito'), items, {
    usuario: estado.usuario,
    alCambiarCantidad: async (productoId, cantidad, talla) => {
      const resultado = await cambiarCantidad(productoId, cantidad, talla, estado.usuario);
      if (!resultado.ok && resultado.mensaje) avisar(resultado.mensaje, 'error');
      refrescarCarrito();
      refrescarContadorCarrito(estado.usuario);
    },
    alQuitar: async (productoId, talla) => {
      await quitarItem(productoId, talla, estado.usuario);
      refrescarCarrito();
      refrescarContadorCarrito(estado.usuario);
    },
    alIrAlCheckout: () => {
      cerrarCarrito();
      abrirCheckout();
    },
    alRefrescar: () => {
      refrescarCarrito();
      refrescarContadorCarrito(estado.usuario);
    },
  });
  await refrescarContadorCarrito(estado.usuario);
}

// ---------------------------------------------------------------------------------------------
// Ficha de producto y resenas (RF01 + RF04)
// ---------------------------------------------------------------------------------------------

/** Abre la ficha del producto con sus resenas y el formulario de valoracion. */
async function abrirFichaProducto(producto) {
  const resenas = await listarResenas(producto.id);
  const promedio = calcularPromedio(resenas);
  const pelicula = estado.peliculasSeries.get(producto.peliculaSerieId);
  const coleccion = estado.colecciones.find((c) => c.id === producto.coleccionId);

  let tallaSeleccionada = producto.tallas[0];

  const selectorTallas = crear('div', { style: 'display:flex;gap:.4rem;flex-wrap:wrap' });
  const botonesTalla = producto.tallas.map((talla) => {
    const boton = crear('button', { class: 'boton boton--fantasma boton--chico', type: 'button' }, talla);
    boton.addEventListener('click', () => {
      tallaSeleccionada = talla;
      botonesTalla.forEach((b, i) => {
        b.className = `boton boton--chico ${producto.tallas[i] === talla ? 'boton--primario' : 'boton--fantasma'}`;
      });
    });
    return boton;
  });
  botonesTalla.forEach((b, i) => {
    b.className = `boton boton--chico ${i === 0 ? 'boton--primario' : 'boton--fantasma'}`;
    selectorTallas.append(b);
  });

  const botonAgregar = crear('button', { class: 'boton boton--primario', type: 'button' }, 'Agregar al carrito');
  botonAgregar.addEventListener('click', async () => {
    const resultado = await agregarItem(producto.id, 1, tallaSeleccionada, estado.usuario);
    if (resultado.ok) {
      avisar(`${producto.nombre} (talla ${tallaSeleccionada}) agregado`, 'ok');
      cerrarModal();
      abrirCarrito();
    } else {
      avisar(resultado.mensaje ?? 'No se pudo agregar', 'error');
    }
  });

  const listaResenas = crear('div', {});
  if (!resenas.length) {
    listaResenas.append(crear('p', { style: 'color:var(--tinta-suave);font-size:.92rem' }, 'Todavia no hay resenas para este modelo.'));
  } else {
    for (const resena of resenas) {
      listaResenas.append(
        crear(
          'div',
          { class: 'resena' },
          crear(
            'div',
            { class: 'resena__cabecera' },
            estrellas(resena.puntaje),
            crear('span', { class: 'resena__autor' }, resena.usuarioNombre),
            crear('span', { class: 'resena__fecha' }, formatearFecha(resena.fecha))
          ),
          crear('p', { class: 'resena__texto' }, resena.comentario)
        )
      );
    }
  }

  const bloqueResena = construirFormularioResena(producto, async () => {
    await abrirFichaProducto(producto);
  });

  const contenido = crear(
    'div',
    { style: 'display:grid;grid-template-columns:1fr 1.15fr;gap:1.4rem' },
    crear(
      'div',
      {},
      crear('div', { style: 'background:linear-gradient(160deg,#f3eee3,#e6ddca);border-radius:var(--radio);padding:1rem' },
        crear('img', { src: producto.imagen, alt: producto.nombre, width: 200, height: 200, style: 'margin-inline:auto' })
      ),
      crear('div', { style: 'display:flex;gap:.4rem;flex-wrap:wrap;margin-top:.8rem' },
        badgeStock(producto),
        crear('span', { class: 'etiqueta' }, `Tallas: ${producto.tallas.join(' - ')}`),
        coleccion ? crear('span', { class: 'etiqueta etiqueta--azul' }, coleccion.nombre) : null
      ),
      pelicula
        ? crear('p', { style: 'font-size:.9rem;color:var(--tinta-suave);margin-top:.8rem' }, `Inspirado en ${pelicula.titulo} (${pelicula.anio})`)
        : null
    ),
    crear(
      'div',
      {},
      crear('h3', { style: 'font-size:1.35rem' }, producto.nombre),
      crear('div', { style: 'display:flex;align-items:center;gap:.6rem;margin:.4rem 0 .8rem' },
        estrellas(promedio.promedio),
        crear('span', { style: 'font-size:.88rem;color:var(--tinta-suave)' }, `${promedio.promedio} · ${promedio.total} resenas`)
      ),
      crear('p', { style: 'font-size:.95rem;color:var(--tinta-suave)' }, producto.descripcion),
      crear('p', { class: 'precio', style: 'font-size:1.5rem;margin:.4rem 0 1rem' }, formatearMoneda(producto.precio)),
      crear('p', { style: 'font-size:.88rem;font-weight:650;margin-bottom:.35rem' }, 'Talla'),
      selectorTallas,
      crear('div', { style: 'margin-top:1rem' }, botonAgregar),
      crear('h4', { style: 'margin-top:1.5rem' }, 'Resenas de fanaticos'),
      bloqueResena,
      listaResenas
    )
  );

  abrirModal({ titulo: `Ficha del producto · ${producto.nombre}`, contenido, clase: 'modal--ancho' });
}

/** Construye el formulario para publicar una resena (RF04). */
function construirFormularioResena(producto, alPublicar) {
  if (!estado.usuario) {
    return crear(
      'div',
      { style: 'background:var(--crema);border:1px solid var(--borde);border-radius:var(--radio-chico);padding:.9rem;margin:.8rem 0' },
      crear('p', { style: 'font-size:.9rem;margin:0 0 .6rem' }, 'Inicia sesion para publicar tu valoracion.'),
      crear('button', { class: 'boton boton--fantasma boton--chico', type: 'button', id: 'iniciarSesionDesdeFicha' }, 'Ingresar o registrarme')
    );
  }

  let puntaje = 5;
  const contenedor = crear('div', { class: 'campo', style: 'margin:.8rem 0' });
  const zonaEstrellas = crear('div', { class: 'selector-estrellas', role: 'radiogroup', 'aria-label': 'Valoracion' });
  const botones = [];
  for (let i = 1; i <= 5; i += 1) {
    const boton = crear('button', { type: 'button', 'aria-label': `${i} estrellas` }, '★');
    boton.addEventListener('click', () => {
      puntaje = i;
      botones.forEach((b, j) => b.classList.toggle('vacia', j >= i));
    });
    botones.push(boton);
    zonaEstrellas.append(boton);
  }

  const comentario = crear('textarea', { rows: '3', placeholder: 'Que te parecio el diseno y la calidad?' });
  const error = crear('p', { class: 'mensaje-error oculto' });
  const enviar = crear('button', { class: 'boton boton--secundario boton--chico', type: 'button' }, 'Publicar resena');

  enviar.addEventListener('click', async () => {
    const resultado = await publicarResena({
      productoId: producto.id,
      usuario: estado.usuario,
      puntaje,
      comentario: comentario.value,
    });
    if (!resultado.ok) {
      error.textContent = resultado.mensaje;
      error.classList.remove('oculto');
      return;
    }
    avisar('Resena publicada', 'ok');
    await alPublicar();
  });

  contenedor.append(
    crear('label', {}, 'Tu valoracion'),
    zonaEstrellas,
    crear('label', { style: 'margin-top:.5rem' }, 'Comentario'),
    comentario,
    error,
    crear('div', { style: 'margin-top:.6rem' }, enviar)
  );
  return contenedor;
}

// ---------------------------------------------------------------------------------------------
// Checkout (RF02)
// ---------------------------------------------------------------------------------------------

/** Abre el flujo de checkout con el resumen del pedido. */
async function abrirCheckout() {
  const items = await obtenerCarrito(estado.usuario);
  if (!items.length) {
    avisar('El carrito esta vacio', 'error');
    return;
  }
  const total = calcularTotal(items);

  const correo = crear('input', { type: 'email', placeholder: 'tu@correo.cl', value: estado.usuario?.email ?? '', required: true });
  const direccion = crear('input', { type: 'text', placeholder: 'Calle, numero, ciudad' });
  const metodo = crear('select', {}, ...METODOS_PAGO.map((m) => crear('option', { value: m.id }, m.nombre)));
  const error = crear('p', { class: 'mensaje-error oculto' });

  const lista = crear('div', {});
  for (const item of items) {
    lista.append(
      crear(
        'div',
        { style: 'display:flex;justify-content:space-between;gap:1rem;padding:.35rem 0;border-bottom:1px solid var(--borde-suave);font-size:.92rem' },
        crear('span', {}, `${item.nombre} (${item.talla}) x${item.cantidad}`),
        crear('span', { style: 'font-weight:650' }, formatearMoneda(item.precioUnitario * item.cantidad))
      )
    );
  }

  const confirmar = crear('button', { class: 'boton boton--primario boton--bloque', type: 'button' }, 'Confirmar pedido (simulacion)');
  confirmar.addEventListener('click', async () => {
    error.classList.add('oculto');
    confirmar.disabled = true;
    confirmar.textContent = 'Verificando pago...';

    const resultado = await confirmarPedido({
      items,
      usuario: estado.usuario,
      metodoPago: metodo.value,
      direccion: direccion.value.trim() || null,
      email: correo.value.trim(),
    });

    confirmar.disabled = false;
    confirmar.textContent = 'Confirmar pedido (simulacion)';

    if (!resultado.ok) {
      error.textContent = resultado.mensaje;
      error.classList.remove('oculto');
      return;
    }

    cerrarModal();
    await vaciarCarritoSilencioso();
    mostrarPedidoConfirmado(resultado.pedido);
    await aplicarFiltros();
  });

  const contenido = crear(
    'div',
    {},
    crear('h4', {}, 'Resumen del pedido'),
    lista,
    crear('div', { class: 'total-carrito', style: 'margin-top:.8rem' }, crear('span', {}, 'Total'), crear('span', {}, formatearMoneda(total))),
    crear('h4', { style: 'margin-top:1.2rem' }, 'Datos de facturacion'),
    crear(
      'div',
      { class: 'formulario-rejilla', style: 'margin-top:.6rem' },
      crear('div', { class: 'campo' }, crear('label', {}, 'Correo'), correo),
      crear('div', { class: 'campo' }, crear('label', {}, 'Direccion de entrega'), direccion),
      crear('div', { class: 'campo ancho-total' }, crear('label', {}, 'Metodo de pago'), metodo)
    ),
    error,
    crear('div', { style: 'margin-top:1rem' }, confirmar),
    crear('p', { style: 'font-size:.82rem;color:var(--tinta-suave);margin-top:.7rem' },
      'El pago es una simulacion: el sistema no cobra dinero real, solo genera el identificador unico del pedido.')
  );

  abrirModal({ titulo: 'Checkout', contenido, clase: 'modal--estrecho' });
}

/** Vacia el carrito tras confirmar el pedido. */
async function vaciarCarritoSilencioso() {
  const { vaciarCarrito } = await import('../dominio/carrito.js');
  await vaciarCarrito(estado.usuario);
  await refrescarCarrito();
}

/** Muestra la confirmacion con el identificador unico del pedido (RF02). */
function mostrarPedidoConfirmado(pedido) {
  const contenido = crear(
    'div',
    { style: 'text-align:center' },
    crear('div', { style: 'font-size:3rem;line-height:1' }, '✓'),
    crear('h3', { style: 'margin-top:.6rem' }, 'Pedido confirmado'),
    crear('p', { style: 'color:var(--tinta-suave)' }, 'Tu pedido fue registrado correctamente.'),
    crear('p', { style: 'margin:1rem 0' },
      crear('span', { class: 'etiqueta etiqueta--verde' }, `Identificador unico: ${pedido.id}`)
    ),
    crear('div', { class: 'total-carrito' }, crear('span', {}, 'Total pagado (simulado)'), crear('span', {}, formatearMoneda(pedido.total))),
    crear('p', { style: 'font-size:.84rem;color:var(--tinta-suave);margin-top:.8rem' },
      `Metodo: ${pedido.metodoPago} · Autorizacion ${pedido.autorizacionPago}`)
  );
  abrirModal({ titulo: 'Pedido registrado', contenido, clase: 'modal--estrecho' });
}

// ---------------------------------------------------------------------------------------------
// Sesion (RNF02)
// ---------------------------------------------------------------------------------------------

/** Abre el modal de inicio de sesion / registro. */
function abrirSesion(modo = 'login') {
  const nombre = crear('input', { type: 'text', placeholder: 'Nombre completo', required: true });
  const correo = crear('input', { type: 'email', placeholder: 'tu@correo.cl', required: true });
  const password = crear('input', { type: 'password', placeholder: 'Contrasena', required: true });
  const error = crear('p', { class: 'mensaje-error oculto' });

  const camposRegistro = crear('div', { class: 'campo' }, crear('label', {}, 'Nombre'), nombre);
  if (modo === 'login') camposRegistro.classList.add('oculto');
  const enviar = crear('button', { class: 'boton boton--primario boton--bloque', type: 'button' }, modo === 'login' ? 'Ingresar' : 'Crear cuenta');

  const alternar = crear('button', { class: 'boton boton--fantasma boton--bloque', type: 'button', style: 'margin-top:.5rem' },
    modo === 'login' ? 'No tengo cuenta, registrarme' : 'Ya tengo cuenta, ingresar');

  const contenido = crear(
    'div',
    {},
    crear(
      'div',
      { class: 'campos' },
      camposRegistro,
      crear('div', { class: 'campo' }, crear('label', {}, 'Correo'), correo),
      crear('div', { class: 'campo' }, crear('label', {}, 'Contrasena'), password),
      error,
      enviar,
      alternar
    ),
    crear('p', { style: 'font-size:.8rem;color:var(--tinta-suave);margin-top:1rem' },
      'La contrasena se deriva con PBKDF2 y la sesion se transporta en un token JWT (HS256).'),
    crear(
      'p',
      { style: 'font-size:.8rem;color:var(--tinta-suave);background:var(--crema);border:1px solid var(--borde);border-radius:9px;padding:.6rem .7rem;margin:.8rem 0 0' },
      'Credenciales de administracion del prototipo: ',
      crear('code', {}, 'admin@sockbuster.cl'),
      ' / ',
      crear('code', {}, 'Sockbuster2026')
    )
  );

  const ejecutar = async () => {
    error.classList.add('oculto');
    try {
      if (modo === 'login') {
        await iniciarSesion({ email: correo.value, password: password.value });
      } else {
        await registrarCliente({ nombre: nombre.value, email: correo.value, password: password.value });
      }
      estado.usuario = await usuarioActual();
      cerrarModal();
      avisar(`Hola, ${estado.usuario.nombre}`, 'ok');
      await refrescarSesionUI();
    } catch (excepcion) {
      error.textContent = excepcion.message;
      error.classList.remove('oculto');
    }
  };

  enviar.addEventListener('click', ejecutar);
  alternar.addEventListener('click', () => {
    cerrarModal();
    abrirSesion(modo === 'login' ? 'registro' : 'login');
  });

  abrirModal({ titulo: modo === 'login' ? 'Iniciar sesion' : 'Crear cuenta', contenido, clase: 'modal--estrecho' });
}

/** Refresca el estado de sesion en la cabecera. */
async function refrescarSesionUI() {
  const { refrescarSesion } = await import('../presentacion/cabecera.js');
  await refrescarSesion();
  await refrescarContadorCarrito(estado.usuario);
}

// ---------------------------------------------------------------------------------------------
// Panel de administracion (RF03)
// ---------------------------------------------------------------------------------------------

/** Abre el panel de administracion de inventario y tematicas. */
async function abrirPanelAdmin() {
  const permiso = await consultarInventario();
  if (!permiso.ok) {
    avisar(permiso.mensaje, 'error');
    return;
  }

  const productos = permiso.productos;
  const peliculas = [...estado.peliculasSeries.values()];

  const lienzo = crear('canvas', { width: 600, height: 220, 'aria-label': 'Stock por coleccion', role: 'img' });
  const grafico = crear('div', { class: 'contenedor-grafico', style: 'height:250px' }, lienzo);

  const tabla = crear('tbody', {});
  for (const producto of productos) {
    const campoStock = crear('input', { type: 'number', min: '0', value: String(producto.stock), 'aria-label': `Stock de ${producto.nombre}` });
    const campoPrecio = crear('input', { type: 'number', min: '0', step: '1000', value: String(producto.precio), 'aria-label': `Precio de ${producto.nombre}` });
    const selectorPelicula = crear('select', { 'aria-label': `Pelicula de ${producto.nombre}` },
      ...peliculas.map((p) => crear('option', { value: String(p.id), selected: p.id === producto.peliculaSerieId }, `${p.titulo} (${p.anio})`)));

    const guardarFila = async () => {
      const resultadoStock = await actualizarStock(producto.id, campoStock.value);
      if (!resultadoStock.ok) avisar(resultadoStock.mensaje, 'error');
      const resultadoPrecio = await actualizarPrecio(producto.id, campoPrecio.value);
      if (!resultadoPrecio.ok) avisar(resultadoPrecio.mensaje, 'error');
      const resultadoPelicula = await asociarPelicula(producto.id, selectorPelicula.value);
      if (!resultadoPelicula.ok) avisar(resultadoPelicula.mensaje, 'error');
      avisar(`"${producto.nombre}" actualizado`, 'ok');
      await aplicarFiltros();
    };

    campoStock.addEventListener('change', guardarFila);
    campoPrecio.addEventListener('change', guardarFila);
    selectorPelicula.addEventListener('change', guardarFila);

    tabla.append(
      crear(
        'tr',
        {},
        crear('td', {}, crear('div', { style: 'display:flex;align-items:center;gap:.5rem' },
          crear('img', { src: producto.imagen, alt: '', width: 34, height: 34, style: 'background:var(--arena);border-radius:6px;padding:2px' }),
          crear('span', {}, producto.nombre)
        )),
        crear('td', {}, campoStock),
        crear('td', {}, campoPrecio),
        crear('td', {}, selectorPelicula)
      )
    );
  }

  // Formulario de registro de modelo nuevo (RF03).
  const formNombre = crear('input', { type: 'text', placeholder: 'Nombre del modelo', required: true });
  const formPrecio = crear('input', { type: 'number', min: '0', step: '1000', value: '19990', required: true });
  const formStock = crear('input', { type: 'number', min: '0', value: '10', required: true });
  const formColeccion = crear('select', {}, ...estado.colecciones.map((c) => crear('option', { value: String(c.id) }, c.nombre)));
  const formPelicula = crear('select', {}, ...peliculas.map((p) => crear('option', { value: String(p.id) }, `${p.titulo} (${p.anio})`)));
  const formTallas = crear('select', {}, ...TALLAS.map((t) => crear('option', { value: t }, t)));
  const formError = crear('p', { class: 'mensaje-error oculto' });
  const formEnviar = crear('button', { class: 'boton boton--primario', type: 'button' }, 'Registrar modelo');

  formEnviar.addEventListener('click', async () => {
    formError.classList.add('oculto');
    const resultado = await registrarModelo({
      nombre: formNombre.value,
      precio: formPrecio.value,
      stock: formStock.value,
      coleccionId: formColeccion.value,
      peliculaSerieId: formPelicula.value,
      tallas: [formTallas.value],
    });
    if (!resultado.ok) {
      formError.textContent = resultado.mensaje;
      formError.classList.remove('oculto');
      return;
    }
    avisar(`"${resultado.producto.nombre}" registrado`, 'ok');
    cerrarModal();
    await aplicarFiltros();
    abrirPanelAdmin();
  });

  const clientes = await listarClientes();
  const pedidos = await listarPedidos(estado.usuario);

  const contenido = crear(
    'div',
    {},
    crear('div', { style: 'display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:1rem' },
      crear('span', { class: 'etiqueta etiqueta--verde' }, `Valor de inventario: ${formatearMoneda(permiso.valor)}`),
      crear('span', { class: 'etiqueta' }, `${permiso.unidades} unidades`),
      crear('span', { class: 'etiqueta etiqueta--ambar' }, `${permiso.agotados} agotados`),
      crear('span', { class: 'etiqueta' }, `${clientes.length} clientes registrados`)
    ),
    grafico,
    crear('h4', {}, 'Inventario (edicion en linea)'),
    crear('div', { style: 'overflow-x:auto' },
      crear('table', { class: 'tabla' },
        crear('thead', {}, crear('tr', {},
          crear('th', {}, 'Modelo'),
          crear('th', {}, 'Stock'),
          crear('th', {}, 'Precio'),
          crear('th', {}, 'Pelicula / Serie')
        )),
        tabla
      )
    ),
    crear('h4', { style: 'margin-top:1.5rem' }, 'Registrar nuevo modelo'),
    crear(
      'div',
      { class: 'formulario-rejilla', style: 'margin-top:.6rem' },
      crear('div', { class: 'campo' }, crear('label', {}, 'Nombre'), formNombre),
      crear('div', { class: 'campo' }, crear('label', {}, 'Precio'), formPrecio),
      crear('div', { class: 'campo' }, crear('label', {}, 'Stock inicial'), formStock),
      crear('div', { class: 'campo' }, crear('label', {}, 'Coleccion'), formColeccion),
      crear('div', { class: 'campo' }, crear('label', {}, 'Pelicula / Serie'), formPelicula),
      crear('div', { class: 'campo' }, crear('label', {}, 'Talla inicial'), formTallas),
      crear('div', { class: 'campo ancho-total' }, formError),
      crear('div', { class: 'campo ancho-total' }, formEnviar)
    )
  );

  abrirModal({ titulo: 'Panel de administracion de inventario', contenido, clase: 'modal--ancho' });

  // Grafico de stock por coleccion (usa la libreria Chart.js vendorizada).
  const porColeccion = estado.colecciones.map((coleccion) => ({
    coleccion,
    total: productos.filter((p) => p.coleccionId === coleccion.id).reduce((acc, p) => acc + p.stock, 0),
  }));
  dibujarBarras(lienzo, {
    etiquetas: porColeccion.map((c) => c.coleccion.nombre),
    valores: porColeccion.map((c) => c.total),
    titulo: 'Unidades en stock por coleccion',
  }).catch((error) => {
    console.warn('[admin] no se pudo renderizar el grafico', error);
    lienzo.closest('.contenedor-grafico')?.classList.add('oculto');
  });
}

// ---------------------------------------------------------------------------------------------
// Inicializacion
// ---------------------------------------------------------------------------------------------

/** Conecta los eventos de la pagina. */
function conectarEventos() {
  const buscador = porId('busqueda');
  if (buscador) buscador.addEventListener('input', retrasar(() => aplicarFiltros(), 260));

  const orden = porId('orden');
  if (orden) {
    orden.addEventListener('change', () => {
      estado.orden = orden.value;
      aplicarFiltros();
    });
  }

  porId('botonAbrirCarrito')?.addEventListener('click', abrirCarrito);
  porId('botonCerrarCarrito')?.addEventListener('click', cerrarCarrito);
  porId('fondoCarrito')?.addEventListener('click', cerrarCarrito);

  document.addEventListener('sockbuster:abrir-sesion', () => abrirSesion('login'));
  document.addEventListener('sockbuster:abrir-admin', () => abrirPanelAdmin());

  document.addEventListener('click', (evento) => {
    if (evento.target?.id === 'iniciarSesionDesdeFicha') abrirSesion('login');
  });
}

/** Lee los parametros de la URL (?coleccion=, ?producto=). */
async function leerParametrosUrl() {
  const parametros = new URLSearchParams(location.search);
  const coleccion = parametros.get('coleccion');
  if (coleccion) {
    await pintarFiltros();
    const entrada = porId('panelFiltros')?.querySelector(`input[data-filtro="coleccion"][value="${coleccion}"]`);
    if (entrada) entrada.checked = true;
    await aplicarFiltros();
  }
  const producto = parametros.get('producto');
  if (producto) {
    const encontrado = (await listarProductos()).find((p) => p.id === Number(producto));
    if (encontrado) abrirFichaProducto(encontrado);
  }
}

/** Inicializa la pagina de catalogo. */
async function iniciar() {
  conectarCabecera();
  // Los listeners de documento deben registrarse ANTES de cualquier await:
  // la cabecera se pinta de forma asincrona y el boton "Ingresar" puede
  // aparecer en pantalla antes de que el resto de la pagina este listo.
  // Si el listener se registrara despues, ese clic se perderia en silencio.
  conectarEventos();
  await asegurarAdminSemilla();
  await cargarOverrides();
  estado.usuario = await usuarioActual();
  await pintarFiltros();
  await aplicarFiltros();
  await leerParametrosUrl();
  refrescarContadorCarrito(estado.usuario);
}

iniciar().catch((error) => {
  console.error('[catalogo] fallo al inicializar', error);
});
