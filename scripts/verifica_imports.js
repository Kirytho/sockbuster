#!/usr/bin/env node
/**
 * verifica_imports.js - chequea que todo import nombrado tenga su export.
 *
 * Los modulos ES fallan en tiempo de ejecucion (no de compilacion), asi que un
 * nombre mal escrito rompe la pagina en silencio hasta que se navega a ella.
 * Este script revisa el arbol completo antes de publicar.
 *
 * Uso: node scripts/verifica_imports.js
 * Exit: 0 si todo coincide, 1 si hay desajustes.
 */
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const BASE = path.join(RAIZ, 'assets', 'js');

/** Lista recursivamente los .js de un directorio. */
function listarJs(dir) {
  const salida = [];
  for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
    const completo = path.join(dir, entrada.name);
    if (entrada.isDirectory()) salida.push(...listarJs(completo));
    else if (entrada.name.endsWith('.js')) salida.push(completo);
  }
  return salida;
}

/** Extrae los nombres exportados por un modulo. */
function exportsDe(codigo) {
  const nombres = new Set();
  const patrones = [
    /export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g,
    /export\s+class\s+([A-Za-z_$][\w$]*)/g,
    /export\s+(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g,
  ];
  for (const patron of patrones) {
    let m;
    while ((m = patron.exec(codigo)) !== null) nombres.add(m[1]);
  }
  // export { a, b as c }
  const bloque = /export\s*\{([^}]*)\}/g;
  let m;
  while ((m = bloque.exec(codigo)) !== null) {
    for (const parte of m[1].split(',')) {
      const limpio = parte.trim();
      if (!limpio) continue;
      const alias = limpio.includes(' as ') ? limpio.split(' as ')[1] : limpio;
      nombres.add(alias.trim());
    }
  }
  return nombres;
}

/** Extrae los imports con nombre desde un modulo. */
function importsDe(codigo) {
  const lista = [];
  const patron = /import\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g;
  let m;
  while ((m = patron.exec(codigo)) !== null) {
    const origen = m[2];
    for (const parte of m[1].split(',')) {
      const limpio = parte.trim();
      if (!limpio) continue;
      const nombre = limpio.includes(' as ') ? limpio.split(' as ')[0].trim() : limpio;
      lista.push({ nombre, origen });
    }
  }
  return lista;
}

const archivos = listarJs(BASE);
const exportaPorArchivo = new Map();
for (const archivo of archivos) {
  exportaPorArchivo.set(archivo, exportsDe(fs.readFileSync(archivo, 'utf8')));
}

const problemas = [];
for (const archivo of archivos) {
  const codigo = fs.readFileSync(archivo, 'utf8');
  for (const imp of importsDe(codigo)) {
    if (!imp.origen.startsWith('.')) continue;
    const destino = path.resolve(path.dirname(archivo), imp.origen);
    if (!fs.existsSync(destino)) {
      problemas.push(`${path.relative(RAIZ, archivo)} -> ${imp.origen}: el archivo no existe`);
      continue;
    }
    const disponibles = exportaPorArchivo.get(destino) ?? new Set();
    if (!disponibles.has(imp.nombre)) {
      problemas.push(
        `${path.relative(RAIZ, archivo)} importa "${imp.nombre}" de ${imp.origen}, ` +
          `pero ese modulo exporta: [${[...disponibles].join(', ') || 'nada'}]`
      );
    }
  }
}

if (problemas.length) {
  console.error(`\n[FAIL] ${problemas.length} problema(s) de importacion:\n`);
  for (const problema of problemas) console.error(`  - ${problema}`);
  process.exit(1);
}
console.log(`[OK] ${archivos.length} modulos: todos los imports tienen su export.`);
