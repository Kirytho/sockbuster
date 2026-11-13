#!/usr/bin/env python3
"""Verifica que el Diagrama de Componentes refleje el codigo REAL.

La rubrica 2.1.3 penaliza un diagrama de desarrollo "desalineado con las
tecnologias usadas en la web". Este script extrae las rutas de archivo que
menciona el diagrama y las contrasta contra el arbol real del repositorio,
en los dos sentidos:
  - toda ruta mencionada debe existir
  - todo modulo real debe aparecer en el diagrama

El diagrama escribe las rutas en dos formatos: "assets/js/dominio/pedido.js"
y "dominio/pedido.js". Por eso la comparacion se hace sobre los dos ultimos
segmentos (<capa>/<archivo>), que es la parte con significado.
"""
import pathlib
import re
import sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
PUML = RAIZ / "uml" / "diagramas" / "03-vista-desarrollo-componentes.puml"

texto = PUML.read_text(encoding="utf-8")
# PlantUML usa "\n" literal como salto de linea dentro de las etiquetas:
# hay que eliminarlo o el matcher se come la primera letra de la ruta.
texto = texto.replace("\\n", " ")

# Cualquier token con forma de ruta a un .js dentro de assets/
candidatos = set(re.findall(r"(?:assets/)?(?:js/|vendor/)?[\w]+/[\w.-]+\.js\b", texto))

def clave(ruta: str) -> str:
    """Reduce una ruta a sus dos ultimos segmentos: <capa>/<archivo>."""
    partes = [p for p in ruta.replace("assets/js/", "js/").split("/") if p]
    if len(partes) >= 2:
        return "/".join(partes[-2:])
    return ruta


citadas = {r: clave(r) for r in candidatos}

reales = set()
for p in (RAIZ / "assets").rglob("*.js"):
    reales.add("/".join(p.relative_to(RAIZ / "assets").parts))

problemas = []
vistos = set()

for ruta, k in sorted(citadas.items()):
    if k in vistos:
        continue
    vistos.add(k)
    if not (RAIZ / "assets" / k if not k.startswith("vendor/") else RAIZ / "assets" / k).exists():
        # busca el archivo real que termina con esa clave
        encontrado = [r for r in reales if clave(r) == k]
        if not encontrado:
            problemas.append(f"MENCIONADA PERO NO EXISTE: {ruta}")

for real in sorted(reales):
    k = clave(real)
    if k not in vistos:
        problemas.append(f"EXISTE PERO NO APARECE EN EL DIAGRAMA: assets/{real}")

print("Rutas citadas en el diagrama:")
for ruta, k in sorted(citadas.items()):
    existe = any(clave(r) == k for r in reales)
    print(f"  [{'OK     ' if existe else 'NO EXISTE'}] {ruta}")

print()
if problemas:
    print(f"[FAIL] {len(problemas)} desalineacion(es) entre el diagrama y el codigo:\n")
    for p in problemas:
        print(f"  - {p}")
    sys.exit(1)
print(f"[OK] El diagrama de componentes esta alineado con el codigo real "
      f"({len(reales)} archivos .js, incluidos en el diagrama).")
