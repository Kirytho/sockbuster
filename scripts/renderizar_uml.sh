#!/usr/bin/env bash
# =============================================================================
# renderizar_uml.sh - genera los SVG de los diagramas PlantUML.
#
# REGLA CRITICA (verificada empiricamente en esta maquina):
# PlantUML ante un error de sintaxis IGUAL ESCRIBE el archivo de salida, y
# su contenido es el volcado del codigo fuente con el mensaje de error, no el
# diagrama. Por eso este script NO confia en la existencia del .svg: exige
# exit code 0 y ademas valida que el SVG generado sea un diagrama real.
#
# Uso:  scripts/renderizar_uml.sh
# Exit: 0 si todo salio bien, 1 si algun diagrama fallo.
# =============================================================================
set -uo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ORIGEN="$RAIZ/uml/diagramas"
DESTINO="$RAIZ/uml/diagramas"

RED=$'\033[31m'; VERDE=$'\033[32m'; GRIS=$'\033[90m'; RESET=$'\033[0m'
fallos=0
procesados=0

if ! command -v plantuml >/dev/null 2>&1; then
  echo "${RED}ERROR: plantuml no esta instalado.${RESET}"
  exit 1
fi

cd "$ORIGEN" || exit 1

for fuente in *.puml; do
  [ -e "$fuente" ] || continue
  base="${fuente%.puml}"
  salida="${base}.svg"
  salida_png="${base}.png"

  # Renderiza el SVG. PlantUML devuelve 200 si hay errores de sintaxis.
  salida_plantuml="$(plantuml -tsvg -charset UTF-8 "$fuente" 2>&1)"
  codigo=$?

  if [ $codigo -ne 0 ]; then
    echo "${RED}[FALLA]${RESET} ${fuente} (exit ${codigo})"
    echo "${GRIS}$(echo "$salida_plantuml" | head -3)${RESET}"
    rm -f "$salida" "$salida_png"
    fallos=$((fallos + 1))
    continue
  fi

  # Valida que el SVG sea un diagrama y no un volcado de error.
  if ! grep -q "<svg" "$salida" 2>/dev/null; then
    echo "${RED}[FALLA]${RESET} ${fuente}: no genero un SVG valido"
    fallos=$((fallos + 1))
    continue
  fi
  if grep -qi "syntax error" "$salida" 2>/dev/null; then
    echo "${RED}[FALLA]${RESET} ${fuente}: el SVG contiene un error de sintaxis"
    rm -f "$salida"
    fallos=$((fallos + 1))
    continue
  fi

  # Genera tambien el PNG (respaldo y revision rapida).
  plantuml -tpng -charset UTF-8 "$fuente" >/dev/null 2>&1 || true

  peso=$(du -h "$salida" | cut -f1)
  echo "${VERDE}[OK]${RESET}    ${fuente} -> ${salida} (${peso})"
  procesados=$((procesados + 1))
done

# Verifica que no quede ningun SVG huerfano sin su fuente .puml.
for svg in *.svg; do
  [ -e "$svg" ] || continue
  if [ ! -f "${svg%.svg}.puml" ]; then
    echo "${RED}[FALLA]${RESET} ${svg} no tiene su fuente .puml"
    fallos=$((fallos + 1))
  fi
done

echo ""
if [ $fallos -eq 0 ]; then
  echo "${VERDE}${procesados} diagramas renderizados sin errores.${RESET}"
  exit 0
fi
echo "${RED}${fallos} fallo(s) en el render.${RESET}"
exit 1
