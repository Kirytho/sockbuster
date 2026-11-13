/**
 * Paginas - Diagramas
 * Pagina de arquitectura UML organizada estrictamente por las vistas del
 * paradigma 4+1 (Vista Logica, Vista de Desarrollo, Vista de Procesos,
 * Vista Fisica y Escenarios). Cada vista muestra el diagrama renderizado y
 * permite desplegar el fuente PlantUML que lo genera.
 */
import { crear, porId } from '../nucleo/util.js';
import { conectarCabecera } from '../presentacion/cabecera.js';

/** Diagramas que se renderizan en la pagina, en orden de vista. */
const DIAGRAMAS = [
  {
    id: '01-vista-logica-clases',
    titulo: 'Vista Logica - Diagrama de Clases',
    vista: 'logica',
    requiere: ['RF01', 'RF02', 'RF03', 'RF04'],
    descripcion:
      'Estructura del dominio de Sockbuster: entidades, atributos, metodos, asociaciones y multiplicidades.',
  },
  {
    id: '02-vista-logica-paquetes',
    titulo: 'Vista Logica - Diagrama de Paquetes',
    vista: 'logica',
    requiere: ['RF01', 'RF02', 'RF03', 'RF04'],
    descripcion: 'Agrupacion del dominio en paquetes coherentes y sus dependencias.',
  },
  {
    id: '03-vista-desarrollo-componentes',
    titulo: 'Vista de Desarrollo - Diagrama de Componentes',
    vista: 'desarrollo',
    requiere: ['RF01', 'RF02', 'RF03', 'RF04', 'RNF02'],
    descripcion:
      'Componentes, paquetes, librerias y subsistemas alineados con el codigo real del repositorio.',
  },
  {
    id: '04-vista-procesos-secuencia-checkout',
    titulo: 'Vista de Procesos - Secuencia del Checkout',
    vista: 'procesos',
    requiere: ['RF02'],
    descripcion:
      'Interaccion del proceso de checkout con concurrencia (validacion de stock y verificacion de pago en paralelo) y punto de sincronizacion antes de confirmar.',
  },
  {
    id: '05-vista-procesos-actividades-filtrado',
    titulo: 'Vista de Procesos - Actividades del Filtrado',
    vista: 'procesos',
    requiere: ['RF01'],
    descripcion:
      'Flujo de trabajo del filtrado del catalogo con evaluacion paralela de criterios y punto de union.',
  },
  {
    id: '06-vista-fisica-despliegue',
    titulo: 'Vista Fisica - Diagrama de Despliegue',
    vista: 'fisica',
    requiere: ['RNF01', 'RNF02'],
    descripcion:
      'Topologia desplegada: navegador, CDN de borde con TLS, origen de GitHub Pages y almacenamiento de datos.',
  },
  {
    id: '07-vista-fisica-objetivo-produccion',
    titulo: 'Vista Fisica - Arquitectura Objetivo de Produccion',
    vista: 'fisica',
    requiere: ['RNF01', 'RNF02'],
    descripcion:
      'Topologia objetivo con API, base de datos relacional e IdP externo. No es el despliegue actual: es la evolucion propuesta del prototipo.',
  },
  {
    id: '08-escenarios-casos-de-uso',
    titulo: 'Escenarios - Diagrama de Casos de Uso',
    vista: 'escenarios',
    requiere: ['RF01', 'RF02', 'RF03', 'RF04'],
    descripcion:
      'Actores y casos de uso que articulan las cuatro vistas anteriores en una quinta vista de escenarios.',
  },
  {
    id: '09-escenarios-historias-usuario',
    titulo: 'Escenarios - Historias de Usuario',
    vista: 'escenarios',
    requiere: ['RF01', 'RF02', 'RF03', 'RF04', 'RNF01', 'RNF02'],
    descripcion: 'Historias de usuario con criterios de aceptacion y su trazabilidad a los requerimientos.',
  },
];

/** Construye la seccion de un diagrama. */
function construirSeccion(diagrama) {
  const imagen = crear('img', {
    src: `uml/diagramas/${diagrama.id}.svg`,
    alt: diagrama.titulo,
    loading: 'lazy',
  });

  const codigo = crear('pre', { class: 'fuente-code' }, 'Cargando fuente...');
  const detalle = crear(
    'details',
    { class: 'fuente' },
    crear('summary', {}, `Ver fuente PlantUML de "${diagrama.titulo}"`),
    codigo
  );

  fetch(`uml/diagramas/${diagrama.id}.puml`)
    .then((respuesta) => (respuesta.ok ? respuesta.text() : '// No se pudo cargar el fuente.'))
    .then((texto) => {
      codigo.textContent = texto;
    })
    .catch(() => {
      codigo.textContent = '// No se pudo cargar el fuente PlantUML.';
    });

  const insignias = crear(
    'div',
    { style: 'display:flex;gap:.35rem;flex-wrap:wrap;margin-bottom:.8rem' },
    ...diagrama.requiere.map((id) =>
      crear(
        'span',
        { class: `etiqueta ${id.startsWith('RNF') ? 'etiqueta--ambar' : 'etiqueta--azul'}`, title: `Requerimiento ${id}` },
        id
      )
    )
  );

  return crear(
    'section',
    { class: 'vista', id: diagrama.id, 'data-vista': diagrama.vista },
    crear(
      'div',
      { class: 'vista__cabecera' },
      crear('h2', {}, diagrama.titulo)
    ),
    insignias,
    crear('p', { class: 'vista__subtitulo' }, diagrama.descripcion),
    crear('div', { class: 'diagrama' }, imagen, crear('p', { class: 'diagrama__pie' }, diagrama.titulo)),
    detalle
  );
}

/**
 * Marca la vista activa en la navegacion superior al hacer scroll.
 * La vinculacion se hace por el atributo data-vista de cada seccion, no por
 * id: los anchors de la barra apuntan al primer diagrama de cada vista, pero
 * hay varios diagramas por vista.
 */
function observarVistas() {
  const enlaces = [...document.querySelectorAll('.nav-vistas a')];
  if (!enlaces.length || !('IntersectionObserver' in window)) return;

  const idDelPrimerDiagramaDe = (vista) =>
    [...document.querySelectorAll('.vista')].find((s) => s.dataset.vista === vista)?.id ?? null;

  const observador = new IntersectionObserver(
    (entradas) => {
      for (const entrada of entradas) {
        if (!entrada.isIntersecting) continue;
        const vista = entrada.target.dataset.vista;
        const primerId = idDelPrimerDiagramaDe(vista);
        for (const enlace of enlaces) {
          enlace.classList.toggle('activo', enlace.getAttribute('href') === `#${primerId}`);
        }
      }
    },
    { rootMargin: '-80px 0px -70% 0px', threshold: 0 }
  );

  for (const seccion of document.querySelectorAll('.vista')) observador.observe(seccion);
}

/** Inicializa la pagina de diagramas. */
function iniciar() {
  conectarCabecera();
  const contenedor = porId('seccionesDiagramas');
  if (contenedor) {
    contenedor.replaceChildren(...DIAGRAMAS.map(construirSeccion));
  }
  observarVistas();
}

iniciar();
