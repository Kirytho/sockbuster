/**
 * Datos - Repositorio
 * Capa de persistencia del prototipo sobre IndexedDB.
 *
 * El catalogo semilla (data/catalogo.json) es la fuente de solo lectura que
 * se sirve desde el repositorio; aqui se guardan los datos que genera el
 * sistema en el navegador: usuarios, overrides de inventario, pedidos,
 * resenas y carritos.
 *
 * La View Fisica documenta esta topologia (almacenamiento local del cliente)
 * y la View de Desarrollo la expone como el componente "Repositorio".
 */
import { NOMBRE_BD, VERSION_BD } from '../nucleo/config.js';

export const ALMACENAMIENTOS = {
  usuarios: 'usuarios',
  productos: 'productos',
  pedidos: 'pedidos',
  resenas: 'resenas',
  carritos: 'carritos',
  contadores: 'contadores',
};

let promesaBd = null;

/** Abre (o crea) la base de datos local. */
function abrirBd() {
  if (promesaBd) return promesaBd;
  promesaBd = new Promise((resolver, rechazar) => {
    const solicitud = indexedDB.open(NOMBRE_BD, VERSION_BD);
    solicitud.onupgradeneeded = (evento) => {
      const bd = evento.target.result;
      if (!bd.objectStoreNames.contains(ALMACENAMIENTOS.usuarios)) {
        bd.createObjectStore(ALMACENAMIENTOS.usuarios, { keyPath: 'email' });
      }
      if (!bd.objectStoreNames.contains(ALMACENAMIENTOS.productos)) {
        bd.createObjectStore(ALMACENAMIENTOS.productos, { keyPath: 'id' });
      }
      if (!bd.objectStoreNames.contains(ALMACENAMIENTOS.pedidos)) {
        bd.createObjectStore(ALMACENAMIENTOS.pedidos, { keyPath: 'id' });
      }
      if (!bd.objectStoreNames.contains(ALMACENAMIENTOS.resenas)) {
        bd.createObjectStore(ALMACENAMIENTOS.resenas, { keyPath: 'id', autoIncrement: true });
      }
      if (!bd.objectStoreNames.contains(ALMACENAMIENTOS.carritos)) {
        bd.createObjectStore(ALMACENAMIENTOS.carritos, { keyPath: 'clave' });
      }
      if (!bd.objectStoreNames.contains(ALMACENAMIENTOS.contadores)) {
        bd.createObjectStore(ALMACENAMIENTOS.contadores, { keyPath: 'clave' });
      }
    };
    solicitud.onsuccess = () => resolver(solicitud.result);
    solicitud.onerror = () => rechazar(solicitud.error);
  });
  return promesaBd;
}

/**
 * Ejecuta una operacion dentro de una transaccion y devuelve la peticion.
 * OJO: se devuelve la IDBRequest, no su .result, porque .result solo esta
 * disponible cuando la transaccion completa. Cada operacion de abajo espera
 * el fin de la transaccion antes de leer el resultado.
 */
async function transaccion(nombreAlmacen, modo, operacion) {
  const bd = await abrirBd();
  return new Promise((resolver, rechazar) => {
    const tx = bd.transaction(nombreAlmacen, modo);
    const almacen = tx.objectStore(nombreAlmacen);
    let peticion;
    try {
      peticion = operacion(almacen);
    } catch (error) {
      tx.abort();
      rechazar(error);
      return;
    }
    tx.oncomplete = () => resolver(peticion);
    tx.onerror = () => rechazar(tx.error);
    tx.onabort = () => rechazar(tx.error);
  });
}

/** Lee todos los registros de un almacen. */
export async function leerTodos(nombre) {
  const peticion = await transaccion(nombre, 'readonly', (almacen) => almacen.getAll());
  return peticion?.result ?? [];
}

/** Lee un registro por clave. Devuelve undefined si no existe. */
export async function leer(nombre, clave) {
  const peticion = await transaccion(nombre, 'readonly', (almacen) => almacen.get(clave));
  return peticion?.result;
}

/** Inserta o actualiza un registro. */
export async function guardar(nombre, registro) {
  const peticion = await transaccion(nombre, 'readwrite', (almacen) => almacen.put(registro));
  return peticion?.result;
}

/** Inserta un registro y devuelve su clave generada. */
export async function insertar(nombre, registro) {
  const peticion = await transaccion(nombre, 'readwrite', (almacen) => almacen.add(registro));
  return peticion?.result;
}

/** Elimina un registro por clave. */
export async function eliminar(nombre, clave) {
  await transaccion(nombre, 'readwrite', (almacen) => almacen.delete(clave));
}

/** Vacia un almacen completo. */
export async function vaciar(nombre) {
  await transaccion(nombre, 'readwrite', (almacen) => almacen.clear());
}

/** Devuelve el siguiente valor de un contador atomico y lo incrementa. */
export async function siguienteContador(clave, inicio = 1) {
  const bd = await abrirBd();
  return new Promise((resolver, rechazar) => {
    const tx = bd.transaction(ALMACENAMIENTOS.contadores, 'readwrite');
    const almacen = tx.objectStore(ALMACENAMIENTOS.contadores);
    const peticion = almacen.get(clave);
    peticion.onsuccess = () => {
      const actual = peticion.result?.valor ?? inicio;
      almacen.put({ clave, valor: actual + 1 });
      tx.oncomplete = () => resolver(actual);
    };
    peticion.onerror = () => rechazar(peticion.error);
  });
}
