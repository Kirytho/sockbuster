#!/usr/bin/env python3
"""Genera las ilustraciones SVG de los calcetines de Sockbuster.

Cada calcetin se dibuja como un vector plano parametrizado por su paleta y el
motivo de su pelicula/serie. Se generan en build y quedan versionadas en el
repositorio, de modo que la web no depende de ningun CDN externo (requisito de
despliegue estatico: todo se sirve desde el repo).

Uso: python3 scripts/generar_assets.py
"""
import json
import pathlib
import colorsys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
DESTINO = RAIZ / "assets" / "img" / "calcetines"

W = 200
H = 200

CUERPO = (
    "M 68 26 Q 100 15 132 26 L 132 104 Q 132 123 146 135 "
    "L 166 152 Q 181 165 181 180 Q 181 192 166 192 L 82 192 "
    "Q 58 192 58 168 L 58 48 Q 58 31 68 26 Z"
)
PUÑO = "M 58 44 Q 100 33 132 44 L 132 22 Q 100 11 68 22 Q 58 27 58 44 Z"
TALON = "M 58 168 Q 58 192 82 192 L 104 192 Q 92 180 92 164 Q 92 150 104 138 L 92 138 Q 58 140 58 168 Z"
PUNTA = "M 181 180 Q 181 192 166 192 L 150 192 Q 160 186 160 174 Q 160 162 152 155 L 166 152 Q 181 165 181 180 Z"


def _rgb(hex_color):
    h = hex_color.lstrip("#")
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))


def _luma(hex_color):
    r, g, b = _rgb(hex_color)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def acento_sobre(fondo):
    """Devuelve un color de acento legible sobre el color de fondo."""
    r, g, b = _rgb(fondo)
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    if l > 0.55:
        l = min(0.28, l - 0.3)
    else:
        l = min(0.92, l + 0.42)
    rr, gg, bb = colorsys.hls_to_rgb(h, l, min(1.0, s * 0.85 + 0.15))
    return "#%02x%02x%02x" % (int(rr * 255), int(gg * 255), int(bb * 255))


def _motivo_planeta(cx, cy, s, c):
    r = s * 0.30
    return (
        f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{c}"/>'
        f'<ellipse cx="{cx}" cy="{cy}" rx="{r*1.75:.1f}" ry="{r*0.42:.1f}" fill="none" '
        f'stroke="{c}" stroke-width="{s*0.09:.1f}" transform="rotate(-22 {cx} {cy})"/>'
        f'<circle cx="{cx - r*0.55:.1f}" cy="{cy - r*0.5:.1f}" r="{r*0.22:.1f}" fill="#ffffff" opacity="0.55"/>'
    )


def _motivo_robot(cx, cy, s, c):
    w = s * 0.62
    h = s * 0.50
    x, y = cx - w / 2, cy - h / 2
    return (
        f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{s*0.10:.1f}" fill="{c}"/>'
        f'<circle cx="{cx - w*0.22:.1f}" cy="{cy:.1f}" r="{s*0.09:.1f}" fill="#0b0b0b"/>'
        f'<circle cx="{cx + w*0.22:.1f}" cy="{cy:.1f}" r="{s*0.09:.1f}" fill="#0b0b0b"/>'
        f'<rect x="{cx - w*0.26:.1f}" y="{cy + h*0.22:.1f}" width="{w*0.52:.1f}" height="{s*0.06:.1f}" rx="{s*0.03:.1f}" fill="#0b0b0b"/>'
        f'<line x1="{cx}" y1="{y:.1f}" x2="{cx}" y2="{y - s*0.18:.1f}" stroke="{c}" stroke-width="{s*0.05:.1f}"/>'
        f'<circle cx="{cx}" cy="{y - s*0.22:.1f}" r="{s*0.07:.1f}" fill="{c}"/>'
    )


def _motivo_lluvia(cx, cy, s, c):
    partes = []
    for i, dx in enumerate((-0.30, -0.10, 0.10, 0.30)):
        alto = s * (0.55 if i % 2 == 0 else 0.38)
        x = cx + s * dx
        partes.append(
            f'<rect x="{x:.1f}" y="{cy - alto/2:.1f}" width="{s*0.07:.1f}" height="{alto:.1f}" rx="{s*0.035:.1f}" fill="{c}"/>'
        )
    return "".join(partes)


def _motivo_gota(cx, cy, s, c):
    r = s * 0.26
    return (
        f'<path d="M {cx} {cy - r*1.7:.1f} Q {cx + r*1.35:.1f} {cy - r*0.1:.1f} {cx} {cy + r*0.75:.1f} '
        f'Q {cx - r*1.35:.1f} {cy - r*0.1:.1f} {cx} {cy - r*1.7:.1f} Z" fill="{c}"/>'
    )


def _motivo_sol(cx, cy, s, c):
    r = s * 0.24
    rayos = []
    for i in range(8):
        import math
        a = math.radians(i * 45)
        x1, y1 = cx + math.cos(a) * r * 1.35, cy + math.sin(a) * r * 1.35
        x2, y2 = cx + math.cos(a) * r * 1.85, cy + math.sin(a) * r * 1.85
        rayos.append(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{c}" stroke-width="{s*0.075:.1f}" stroke-linecap="round"/>')
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{c}"/>' + "".join(rayos)


def _motivo_fantasma(cx, cy, s, c):
    w = s * 0.52
    x = cx - w / 2
    y = cy - s * 0.36
    h = s * 0.72
    return (
        f'<path d="M {x:.1f} {y + h*0.75:.1f} Q {x:.1f} {y:.1f} {cx:.1f} {y:.1f} '
        f'Q {x + w:.1f} {y:.1f} {x + w:.1f} {y + h*0.75:.1f} '
        f'Q {x + w*0.78:.1f} {y + h*0.95:.1f} {x + w*0.62:.1f} {y + h*0.72:.1f} '
        f'Q {x + w*0.42:.1f} {y + h*0.95:.1f} {cx:.1f} {y + h*0.72:.1f} '
        f'Q {x + w*0.58:.1f} {y + h*0.95:.1f} {x + w*0.38:.1f} {y + h*0.72:.1f} '
        f'Q {x + w*0.22:.1f} {y + h*0.95:.1f} {x:.1f} {y + h*0.75:.1f} Z" fill="{c}"/>'
        f'<circle cx="{cx - s*0.10:.1f}" cy="{cy - s*0.08:.1f}" r="{s*0.055:.1f}" fill="#111"/>'
        f'<circle cx="{cx + s*0.10:.1f}" cy="{cy - s*0.08:.1f}" r="{s*0.055:.1f}" fill="#111"/>'
    )


def _motivo_calabaza(cx, cy, s, c):
    r = s * 0.30
    return (
        f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{c}"/>'
        f'<path d="M {cx} {cy - r:.1f} L {cx} {cy + r:.1f}" stroke="#00000055" stroke-width="{s*0.045:.1f}"/>'
        f'<path d="M {cx - r*0.62:.1f} {cy - r*0.42:.1f} L {cx - r*0.20:.1f} {cy - r*0.10:.1f} '
        f'L {cx - r*0.62:.1f} {cy + r*0.22:.1f} Z" fill="#111"/>'
        f'<path d="M {cx + r*0.62:.1f} {cy - r*0.42:.1f} L {cx + r*0.20:.1f} {cy - r*0.10:.1f} '
        f'L {cx + r*0.62:.1f} {cy + r*0.22:.1f} Z" fill="#111"/>'
        f'<path d="M {cx - r*0.42:.1f} {cy + r*0.48:.1f} Q {cx} {cy + r*0.78:.1f} {cx + r*0.42:.1f} {cy + r*0.48:.1f} '
        f'Q {cx} {cy + r*0.60:.1f} {cx - r*0.42:.1f} {cy + r*0.48:.1f} Z" fill="#111"/>'
    )


def _motivo_corona(cx, cy, s, c):
    w = s * 0.68
    x = cx - w / 2
    y = cy - s * 0.26
    h = s * 0.52
    return (
        f'<path d="M {x:.1f} {y + h:.1f} L {x:.1f} {y:.1f} L {x + w*0.25:.1f} {y + h*0.55:.1f} '
        f'L {x + w*0.50:.1f} {y - s*0.12:.1f} L {x + w*0.75:.1f} {y + h*0.55:.1f} '
        f'L {x + w:.1f} {y:.1f} L {x + w:.1f} {y + h:.1f} Z" fill="{c}"/>'
        f'<rect x="{x:.1f}" y="{y + h:.1f}" width="{w:.1f}" height="{s*0.08:.1f}" rx="{s*0.04:.1f}" fill="{c}"/>'
    )


def _motivo_rayo(cx, cy, s, c):
    return (
        f'<path d="M {cx + s*0.16:.1f} {cy - s*0.40:.1f} L {cx - s*0.20:.1f} {cy + s*0.04:.1f} '
        f'L {cx - s*0.02:.1f} {cy + s*0.04:.1f} L {cx - s*0.16:.1f} {cy + s*0.40:.1f} '
        f'L {cx + s*0.22:.1f} {cy - s*0.06:.1f} L {cx + s*0.03:.1f} {cy - s*0.06:.1f} Z" fill="{c}"/>'
    )


def _motivo_nube(cx, cy, s, c):
    return (
        f'<circle cx="{cx - s*0.22:.1f}" cy="{cy}" r="{s*0.20:.1f}" fill="{c}"/>'
        f'<circle cx="{cx + s*0.02:.1f}" cy="{cy - s*0.10:.1f}" r="{s*0.26:.1f}" fill="{c}"/>'
        f'<circle cx="{cx + s*0.26:.1f}" cy="{cy}" r="{s*0.18:.1f}" fill="{c}"/>'
        f'<rect x="{cx - s*0.40:.1f}" y="{cy}" width="{s*0.64:.1f}" height="{s*0.20:.1f}" rx="{s*0.10:.1f}" fill="{c}"/>'
    )


def _motivo_corazon(cx, cy, s, c):
    r = s * 0.30
    return (
        f'<path d="M {cx} {cy + r*0.95:.1f} C {cx - r*1.5:.1f} {cy - r*0.15:.1f} {cx - r*0.75:.1f} {cy - r*1.15:.1f} '
        f'{cx} {cy - r*0.35:.1f} C {cx + r*0.75:.1f} {cy - r*1.15:.1f} {cx + r*1.5:.1f} {cy - r*0.15:.1f} '
        f'{cx} {cy + r*0.95:.1f} Z" fill="{c}"/>'
    )


MOTIVOS = {
    "planeta": _motivo_planeta,
    "robot": _motivo_robot,
    "lluvia": _motivo_lluvia,
    "gota": _motivo_gota,
    "sol": _motivo_sol,
    "fantasma": _motivo_fantasma,
    "calabaza": _motivo_calabaza,
    "corona": _motivo_corona,
    "rayo": _motivo_rayo,
    "nube": _motivo_nube,
    "corazon": _motivo_corazon,
}


def svg_calcetin(prod):
    c1 = prod["colorPrimario"]
    c2 = prod["colorSecundario"]
    acento = acento_sobre(c1)
    tinta = "#1a1a1a" if _luma(c1) > 0.55 else "#ffffff"
    sombra = "rgba(0,0,0,.18)"
    motivo = MOTIVOS.get(prod["motivo"], _motivo_planeta)(95, 82, 52, tinta)
    # las estrellas decorativas usan el acento calculado sobre el color secundario
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img" aria-label="{prod['nombre']}">
  <title>{prod['nombre']}</title>
  <defs>
    <linearGradient id="g{prod['id']}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="{c1}"/>
      <stop offset="100%" stop-color="{_oscurecer(c1)}"/>
    </linearGradient>
  </defs>
  <ellipse cx="100" cy="188" rx="62" ry="9" fill="{sombra}"/>
  <path d="{CUERPO}" fill="url(#g{prod['id']})" stroke="{_oscurecer(c1)}" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="{PUÑO}" fill="{c2}" stroke="{_oscurecer(c1)}" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="{TALON}" fill="{c2}" opacity="0.92"/>
  <path d="{PUNTA}" fill="{c2}" opacity="0.75"/>
  {motivo}
  <g opacity="0.85">
    <circle cx="{70 + prod['id'] % 5 * 9}" cy="{112 + prod['id'] % 3 * 6}" r="2.6" fill="{acento}"/>
    <circle cx="{118 + prod['id'] % 4 * 6}" cy="{126 + prod['id'] % 3 * 7}" r="2.2" fill="{acento}"/>
  </g>
</svg>
"""


def _oscurecer(hex_color, factor=0.78):
    r, g, b = _rgb(hex_color)
    return "#%02x%02x%02x" % (int(r * 255 * factor), int(g * 255 * factor), int(b * 255 * factor))


def svg_logo():
    return """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="Sockbuster">
  <title>Sockbuster</title>
  <defs>
    <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#e8402a"/>
      <stop offset="100%" stop-color="#8f1d10"/>
    </linearGradient>
  </defs>
  <path d="M22 12 Q32 7 42 12 L42 34 Q42 40 47 44 L52 48 Q57 52 57 57 Q57 61 51 61 L27 61 Q17 61 17 51 L17 19 Q17 14 22 12 Z" fill="url(#lg)" stroke="#5d120a" stroke-width="2" stroke-linejoin="round"/>
  <path d="M17 22 Q32 17 42 22 L42 13 Q32 8 22 13 Q17 15 17 22 Z" fill="#f7f3ea"/>
  <path d="M44 47 L52 52 L44 57 L49 57 L44 61 L39 61 L44 55 L39 55 Z" fill="#ffd23f"/>
</svg>
"""


def svg_hero():
    return """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 300" width="640" height="300" role="img" aria-label="Coleccion Sockbuster">
  <title>Banner Sockbuster</title>
  <defs>
    <linearGradient id="hg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#3b6fd4"/>
      <stop offset="55%" stop-color="#7b3fa0"/>
      <stop offset="100%" stop-color="#e8402a"/>
    </linearGradient>
    <linearGradient id="hs1" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f7f3ea"/>
      <stop offset="100%" stop-color="#d8d2c4"/>
    </linearGradient>
  </defs>
  <rect width="640" height="300" rx="24" fill="url(#hg)"/>
  <g opacity="0.22" fill="#ffffff">
    <circle cx="70" cy="56" r="3"/><circle cx="150" cy="38" r="2.4"/><circle cx="232" cy="72" r="3.4"/>
    <circle cx="330" cy="44" r="2.2"/><circle cx="430" cy="80" r="3"/><circle cx="520" cy="50" r="2.6"/>
    <circle cx="596" cy="96" r="3.2"/><circle cx="110" cy="230" r="2.8"/><circle cx="470" cy="238" r="3"/>
    <circle cx="268" cy="252" r="2.4"/><circle cx="560" cy="188" r="2.6"/>
  </g>
  <g transform="translate(96 62) scale(0.92)">
    <path d="M22 12 Q32 7 42 12 L42 34 Q42 40 47 44 L52 48 Q57 52 57 57 Q57 61 51 61 L27 61 Q17 61 17 51 L17 19 Q17 14 22 12 Z" fill="url(#hs1)" stroke="#3a3128" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M17 22 Q32 17 42 22 L42 13 Q32 8 22 13 Q17 15 17 22 Z" fill="#e8402a"/>
    <path d="M22 40 Q32 36 42 40 L42 34 Q32 30 22 34 Z" fill="#7b3fa0" opacity="0.85"/>
  </g>
  <g transform="translate(210 38) scale(1.05)">
    <path d="M22 12 Q32 7 42 12 L42 34 Q42 40 47 44 L52 48 Q57 52 57 57 Q57 61 51 61 L27 61 Q17 61 17 51 L17 19 Q17 14 22 12 Z" fill="#1d2733" stroke="#0d131b" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M17 22 Q32 17 42 22 L42 13 Q32 8 22 13 Q17 15 17 22 Z" fill="#00e5c3"/>
    <circle cx="30" cy="38" r="6" fill="none" stroke="#00e5c3" stroke-width="2.4"/>
    <path d="M30 26 L30 30" stroke="#00e5c3" stroke-width="2.4" stroke-linecap="round"/>
  </g>
  <g transform="translate(330 66) scale(0.88)">
    <path d="M22 12 Q32 7 42 12 L42 34 Q42 40 47 44 L52 48 Q57 52 57 57 Q57 61 51 61 L27 61 Q17 61 17 51 L17 19 Q17 14 22 12 Z" fill="#e8b931" stroke="#8a6a1f" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M17 22 Q32 17 42 22 L42 13 Q32 8 22 13 Q17 15 17 22 Z" fill="#1d2733"/>
    <circle cx="30" cy="36" r="7" fill="none" stroke="#8a6a1f" stroke-width="2.2"/>
    <path d="M30 26 L30 30" stroke="#8a6a1f" stroke-width="2.2" stroke-linecap="round"/>
  </g>
  <g transform="translate(438 44) scale(1.0)">
    <path d="M22 12 Q32 7 42 12 L42 34 Q42 40 47 44 L52 48 Q57 52 57 57 Q57 61 51 61 L27 61 Q17 61 17 51 L17 19 Q17 14 22 12 Z" fill="#8b2f6b" stroke="#4d163c" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M17 22 Q32 17 42 22 L42 13 Q32 8 22 13 Q17 15 17 22 Z" fill="#f7f3ea"/>
    <path d="M26 44 q4 -8 8 0 q4 8 8 0" fill="none" stroke="#f7f3ea" stroke-width="2.4" stroke-linecap="round"/>
  </g>
  <text x="32" y="268" font-family="Verdana, Geneva, sans-serif" font-size="22" font-weight="bold" fill="#ffffff" opacity="0.92">SOCKBUSTER</text>
  <text x="32" y="288" font-family="Verdana, Geneva, sans-serif" font-size="12" fill="#ffffff" opacity="0.72">Video &amp; Socks - calcetines tematicos</text>
</svg>
"""


def main():
    catalogo = json.loads((RAIZ / "data" / "catalogo.json").read_text(encoding="utf-8"))
    DESTINO.mkdir(parents=True, exist_ok=True)
    for prod in catalogo["productos"]:
        destino = DESTINO / f"calcetin-{prod['id']:02d}.svg"
        destino.write_text(svg_calcetin(prod), encoding="utf-8")
    (RAIZ / "assets" / "img" / "logo.svg").write_text(svg_logo(), encoding="utf-8")
    (RAIZ / "assets" / "img" / "hero.svg").write_text(svg_hero(), encoding="utf-8")
    print(f"OK {len(catalogo['productos'])} calcetines + logo + hero en {DESTINO}")


if __name__ == "__main__":
    main()
