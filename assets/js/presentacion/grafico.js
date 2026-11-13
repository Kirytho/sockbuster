/**
 * Presentacion - Grafico
 * Envoltura del componente grafico, que usa la libreria Chart.js vendorizada
 * en assets/vendor/chart.umd.js. La libreria se carga bajo demanda para no
 * penalizar la carga inicial (RNF01) en las paginas que no la necesitan.
 *
 * Esta clase es la "libreria" que declara el Diagrama de Componentes de la
 * Vista de Desarrollo.
 */

// grafico.js vive en assets/js/presentacion/, por lo que la libreria
// vendorizada esta dos niveles arriba, en assets/vendor/.
const RUTA_CHART = new URL('../../vendor/chart.umd.js', import.meta.url).href;

let promesaCarga = null;

/** Carga Chart.js una sola vez y devuelve el global Chart. */
function cargarChart() {
  if (window.Chart) return Promise.resolve(window.Chart);
  if (promesaCarga) return promesaCarga;
  promesaCarga = new Promise((resolver, rechazar) => {
    const script = document.createElement('script');
    script.src = RUTA_CHART;
    script.onload = () => (window.Chart ? resolver(window.Chart) : rechazar(new Error('Chart.js no se pudo cargar')));
    script.onerror = () => rechazar(new Error('No se pudo cargar assets/vendor/chart.umd.js'));
    document.head.append(script);
  });
  return promesaCarga;
}

/** Paleta de la marca, alineada con la hoja de estilos. */
const PALETA = ['#3b6fd4', '#8b2f6b', '#1f7a5c', '#d98324', '#e8402a', '#7b3fa0'];

/**
 * Dibuja un grafico de barras.
 * @param {HTMLCanvasElement} lienzo
 * @param {object} opciones
 */
export async function dibujarBarras(lienzo, { etiquetas, valores, titulo = '' }) {
  const Chart = await cargarChart();
  if (Chart.getChart(lienzo)) Chart.getChart(lienzo).destroy();

  return new Chart(lienzo, {
    type: 'bar',
    data: {
      labels: etiquetas,
      datasets: [
        {
          label: titulo || 'Unidades',
          data: valores,
          backgroundColor: PALETA,
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: { display: Boolean(titulo), text: titulo, color: '#55636f', font: { weight: '600' } },
      },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0, color: '#55636f' }, grid: { color: '#ece5d6' } },
        x: { ticks: { color: '#55636f' }, grid: { display: false } },
      },
    },
  });
}

/** Indica si la libreria grafica esta disponible. */
export function graficoDisponible() {
  return Boolean(window.Chart);
}
