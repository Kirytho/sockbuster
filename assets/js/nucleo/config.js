/**
 * Nucleo - Configuracion
 * Constantes de la aplicacion: rutas, formato de moneda y catalogo de
 * requerimientos funcionales y no funcionales (RF/RNF) que la solucion cubre.
 * Es la unica fuente de verdad para la trazabilidad entre vistas UML y web.
 */

export const RUTAS = {
  // config.js vive en assets/js/nucleo/, asi que la raiz del repositorio
  // esta tres niveles arriba.
  catalogoDatos: new URL('../../../data/catalogo.json', import.meta.url).href,
  diagramas: {
    logica: new URL('../../../uml/diagramas/01-vista-logica-clases.svg', import.meta.url).href,
    logicaPaquetes: new URL('../../../uml/diagramas/02-vista-logica-paquetes.svg', import.meta.url).href,
    desarrollo: new URL('../../../uml/diagramas/03-vista-desarrollo-componentes.svg', import.meta.url).href,
    secuenciaCheckout: new URL('../../../uml/diagramas/04-vista-procesos-secuencia-checkout.svg', import.meta.url).href,
    actividadesFiltrado: new URL('../../../uml/diagramas/05-vista-procesos-actividades-filtrado.svg', import.meta.url).href,
    despliegue: new URL('../../../uml/diagramas/06-vista-fisica-despliegue.svg', import.meta.url).href,
    despliegueObjetivo: new URL('../../../uml/diagramas/07-vista-fisica-objetivo-produccion.svg', import.meta.url).href,
    casosUso: new URL('../../../uml/diagramas/08-escenarios-casos-de-uso.svg', import.meta.url).href,
    historias: new URL('../../../uml/diagramas/09-escenarios-historias-usuario.svg', import.meta.url).href,
  },
};

export const MONEDA = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
});

/** Clave de almacenamiento del token JWT en el navegador. */
export const CLAVE_TOKEN = 'sockbuster.token';

/** Nombre de la base IndexedDB del prototipo. */
export const NOMBRE_BD = 'sockbuster';

/** Version del esquema de la base local. */
export const VERSION_BD = 1;

/**
 * Requerimientos del caso de estudio "Sockbuster Video & Socks".
 * Cada entrada indica en que vista UML se modela y en que parte de la web se
 * materializa: es la matriz de trazabilidad que exige el criterio 2.1.1.
 */
export const REQUISITOS = [
  {
    id: 'RF01',
    titulo: 'Catalogo por Colecciones Tematicas',
    descripcion:
      'Explorar y filtrar el catalogo por categorias, mostrando foto del producto, precio, stock y tallas disponibles.',
    vista: 'Vista Logica + Vista de Procesos',
    web: 'catalogo.html - filtros, grilla y ficha de producto',
  },
  {
    id: 'RF02',
    titulo: 'Carrito y Gestion de Pedidos',
    descripcion:
      'Agregar productos al carrito, modificar cantidades y simular la verificacion de pago generando un resumen del pedido con identificador unico.',
    vista: 'Vista Logica + Vista de Procesos (Checkout)',
    web: 'catalogo.html - panel de carrito y flujo de checkout',
  },
  {
    id: 'RF03',
    titulo: 'Administracion de Inventario y Tematicas',
    descripcion:
      'Registrar nuevos modelos de calcetines, asociarlos a una pelicula/serie, actualizar stock y modificar precios.',
    vista: 'Vista Logica + Vista de Desarrollo',
    web: 'catalogo.html - panel de administracion (JWT rol ADMIN)',
  },
  {
    id: 'RF04',
    titulo: 'Gestion de Resenas de Fanaticos',
    descripcion:
      'Los usuarios registrados publican valoraciones de 1 a 5 estrellas y comentarios en la ficha de cada producto.',
    vista: 'Vista Logica + Vista de Escenarios',
    web: 'catalogo.html - ficha de producto con resenas y formulario de valoracion',
  },
  {
    id: 'RNF01',
    titulo: 'Disponibilidad y Despliegue en la Nube',
    descripcion:
      'Interfaz web publica disponible en linea, carga inicial inferior a 2 segundos y alojada en un entorno de hosting accesible via web.',
    vista: 'Vista Fisica',
    web: 'GitHub Pages + CDN de borde con TLS',
  },
  {
    id: 'RNF02',
    titulo: 'Seguridad en Acceso y Autenticacion',
    descripcion:
      'Comunicacion sobre HTTPS y autenticacion de usuarios mediante tokens JWT para las funciones administrativas.',
    vista: 'Vista Fisica + Vista de Desarrollo',
    web: 'HTTPS en el borde + modulo de autenticacion JWT (HS256) con control de rol',
  },
];

/** Colecciones tematicas del caso de estudio. */
export const COLECCIONES = [
  { id: 'cf', nombre: 'Ciencia Ficción', color: '#3b6fd4', descripcion: 'Tripulaciones, robots y mundos de la ficcion espacial.' },
  { id: 'terror', nombre: 'Terror 80s', color: '#8b2f6b', descripcion: 'Pesadillas clasicas del cine de terror de los ochenta.' },
  { id: 'drama', nombre: 'Series de Drama', color: '#1f7a5c', descripcion: 'Tronos, poder, dinero y decisiones que pesan.' },
  { id: 'animacion', nombre: 'Animación', color: '#d98324', descripcion: 'Pixeles, animacion clasica y disenos que Alegran.' },
];

/** Tamanos disponibles en el catalogo. */
export const TALLAS = ['S', 'M', 'L', 'XL'];

/** Metodos de pago simulados en el checkout. */
export const METODOS_PAGO = [
  { id: 'TARJETA', nombre: 'Tarjeta de credito (simulada)' },
  { id: 'TRANSFERENCIA', nombre: 'Transferencia bancaria (simulada)' },
];
