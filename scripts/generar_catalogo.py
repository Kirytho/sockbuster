#!/usr/bin/env python3
"""Genera data/catalogo.json con el catalogo semilla de Sockbuster.

El catalogo semilla es la "base de datos de solo lectura" que se sirve desde el
repositorio (via CDN de GitHub Pages). Las escrituras del prototipo (carrito,
pedidos, resenas, stock editado por el admin) viven en IndexedDB del cliente.
"""
import json
import pathlib

RAIZ = pathlib.Path(__file__).resolve().parent.parent

COLECCIONES = [
    {
        "id": 1,
        "nombre": "Ciencia Ficción",
        "slug": "ciencia-ficcion",
        "descripcion": "Tripulaciones, robots y mundos de la ficcion espacial.",
        "color": "#3b6fd4",
        "icono": "planeta",
    },
    {
        "id": 2,
        "nombre": "Terror 80s",
        "slug": "terror-80s",
        "descripcion": "Pesadillas clasicas del cine de terror de los ochenta.",
        "color": "#8b2f6b",
        "icono": "fantasma",
    },
    {
        "id": 3,
        "nombre": "Series de Drama",
        "slug": "series-drama",
        "descripcion": "Tronos, poder, dinero y decisiones que pesan.",
        "color": "#1f7a5c",
        "icono": "corona",
    },
    {
        "id": 4,
        "nombre": "Animación",
        "slug": "animacion",
        "descripcion": "Pixeles, dibujos animados clasicos y disenos de culto.",
        "color": "#d98324",
        "icono": "corazon",
    },
]

PELICULAS_SERIES = [
    {"id": 1, "titulo": "Star Wars", "anio": 1977, "tipo": "PELICULA", "coleccionId": 1},
    {"id": 2, "titulo": "Blade Runner", "anio": 1982, "tipo": "PELICULA", "coleccionId": 1},
    {"id": 3, "titulo": "The Matrix", "anio": 1999, "tipo": "PELICULA", "coleccionId": 1},
    {"id": 4, "titulo": "Dune", "anio": 2021, "tipo": "PELICULA", "coleccionId": 1},
    {"id": 5, "titulo": "2001: A Space Odyssey", "anio": 1968, "tipo": "PELICULA", "coleccionId": 1},
    {"id": 6, "titulo": "A Space Odyssey 2", "anio": 1999, "tipo": "PELICULA", "coleccionId": 1},
    {"id": 7, "titulo": "The Shining", "anio": 1980, "tipo": "PELICULA", "coleccionId": 2},
    {"id": 8, "titulo": "A Nightmare on Elm Street", "anio": 1984, "tipo": "PELICULA", "coleccionId": 2},
    {"id": 9, "titulo": "The Exorcist", "anio": 1973, "tipo": "PELICULA", "coleccionId": 2},
    {"id": 10, "titulo": "Halloween", "anio": 1978, "tipo": "PELICULA", "coleccionId": 2},
    {"id": 11, "titulo": "Alien", "anio": 1979, "tipo": "PELICULA", "coleccionId": 2},
    {"id": 12, "titulo": "Game of Thrones", "anio": 2011, "tipo": "SERIE", "coleccionId": 3},
    {"id": 13, "titulo": "The Sopranos", "anio": 1999, "tipo": "SERIE", "coleccionId": 3},
    {"id": 14, "titulo": "Breaking Bad", "anio": 2008, "tipo": "SERIE", "coleccionId": 3},
    {"id": 15, "titulo": "Better Call Saul", "anio": 2015, "tipo": "SERIE", "coleccionId": 3},
    {"id": 16, "titulo": "The Wire", "anio": 2002, "tipo": "SERIE", "coleccionId": 3},
    {"id": 17, "titulo": "Akira", "anio": 1988, "tipo": "PELICULA", "coleccionId": 4},
    {"id": 18, "titulo": "El Principito", "anio": 1973, "tipo": "PELICULA", "coleccionId": 4},
    {"id": 19, "titulo": "Los Simpson", "anio": 1989, "tipo": "SERIE", "coleccionId": 4},
    {"id": 20, "titulo": "Dragon Ball", "anio": 1986, "tipo": "SERIE", "coleccionId": 4},
    {"id": 21, "titulo": "Totoro", "anio": 1988, "tipo": "PELICULA", "coleccionId": 4},
]

# (nombre, peliculaId, precio, stock, tallas, color base, color secundario, motivo, destacado)
CALCETINES = [
    ("Calcetin Jedi", 1, 19990, 42, ["S", "M", "L", "XL"], "#e8b931", "#3b2a12", "planeta", True),
    ("Calcetin C3PO", 1, 18990, 27, ["S", "M", "L"], "#d8d3c4", "#8a7f63", "robot", False),
    ("Calcetin Blade Runner", 2, 21990, 15, ["M", "L"], "#1d2733", "#00e5c3", "lluvia", False),
    ("Calcetin replicante", 2, 24990, 8, ["M", "L", "XL"], "#0f1114", "#ff3b6b", "robot", True),
    ("Calcetin Neo", 3, 21990, 33, ["S", "M", "L", "XL"], "#1a1a1a", "#3fa93f", "gota", True),
    ("Calcetin Zion", 3, 18990, 19, ["S", "M"], "#2b2b2b", "#9b59b6", "planeta", False),
    ("Calcetin Dune", 4, 24990, 24, ["M", "L", "XL"], "#c8a165", "#3d2b1f", "sol", True),
    ("Calcetin Fremen", 4, 19990, 11, ["M", "L"], "#8a6a3a", "#c8a165", "sol", False),
    ("Calcetin HAL 9000", 5, 18990, 6, ["S", "M"], "#0b3d91", "#ff3b30", "gota", False),
    ("Calcetin Odisea", 5, 21990, 14, ["L", "XL"], "#20222b", "#e8e8e8", "planeta", False),
    ("Calcetin Jack Torrance", 7, 21990, 21, ["M", "L", "XL"], "#7a1416", "#e8b931", "lluvia", True),
    ("Calcetin Freddy Krueger", 8, 24990, 9, ["M", "L"], "#4a1b1b", "#a8321f", "fantasma", True),
    ("Calcetin Regan", 9, 19990, 17, ["S", "M", "L"], "#d9c7b0", "#7a1416", "fantasma", False),
    ("Calcetin Myers", 10, 22990, 12, ["M", "L", "XL"], "#3c6e3f", "#2a2a2a", "calabaza", True),
    ("Calcetin Xenomorph", 11, 24990, 4, ["L", "XL"], "#2b3a2e", "#111111", "gota", False),
    ("Calcetin Jon Snow", 12, 21990, 38, ["S", "M", "L", "XL"], "#3d3d3d", "#8a8a8a", "corona", True),
    ("Calcetin Tony Soprano", 13, 22990, 16, ["M", "L"], "#1f2430", "#8b0000", "corona", False),
    ("Calcetin Heisenberg", 14, 21990, 25, ["S", "M", "L"], "#2f4f4f", "#d4d400", "gota", True),
    ("Calcetin Saul Goodman", 15, 19990, 31, ["M", "L"], "#c9a227", "#1a1a1a", "rayo", False),
    ("Calcetin Bunk Moreland", 16, 18990, 13, ["S", "M"], "#37474f", "#cfd8dc", "corona", False),
    ("Calcetin Kaneda", 17, 24990, 18, ["M", "L", "XL"], "#e63946", "#1d1d1d", "rayo", True),
    ("Calcetin Principito", 18, 17990, 29, ["S", "M", "L"], "#f4a259", "#2a6f97", "planeta", False),
    ("Calcetin Simpson", 19, 16990, 45, ["S", "M", "L", "XL"], "#ffd23f", "#3a7ca5", "corazon", True),
    ("Calcetin Goku", 20, 22990, 22, ["M", "L", "XL"], "#f77f00", "#1d3557", "rayo", False),
    ("Calcetin Totoro", 21, 19990, 26, ["S", "M", "L"], "#6b8f71", "#f2e8cf", "nube", False),
    ("Calcetin Neiman", 1, 17990, 0, ["S", "M"], "#8a8a8a", "#4a4a4a", "rayo", False),
]

DESCRIPCIONES = {
    "planeta": "Tejido con planeta en órbita y estrellas tejidas a mano.",
    "robot": "Estampado robotico con costuras de circuito y ojo LED.",
    "lluvia": "Franjas verticales con motivo de lluvia y brillo neon.",
    "gota": "Base oscura con la gota de verde Matrix que recorre el calcetin.",
    "sol": "Degradado desertico con un sol de dos tonos sobre el tobillo.",
    "fantasma": "Huella fantasmagorica en contraste sobre fondo Oscuro.",
    "calabaza": "Calabaza tallada y Ptrera con contraste naranja.",
    "corona": "Bordado de corona y escudos en la parte superior.",
    "rayo": "Rayo electrico de alta costura sobre fondo liso.",
    "nube": "Nubes redondas y una silueta de Totoro en el pie.",
    "corazon": "Corazon de pixel con la paleta clasica de la serie.",
}


def main() -> None:
    productos = []
    for i, (nombre, ps_id, precio, stock, tallas, c1, c2, motivo, destacado) in enumerate(CALCETINES, start=1):
        pelicula = next(p for p in PELICULAS_SERIES if p["id"] == ps_id)
        productos.append(
            {
                "id": i,
                "nombre": nombre,
                "descripcion": DESCRIPCIONES.get(motivo, "Diseno tematico de la coleccion Sockbuster."),
                "precio": precio,
                "stock": stock,
                "tallas": tallas,
                "colorPrimario": c1,
                "colorSecundario": c2,
                "motivo": motivo,
                "coleccionId": pelicula["coleccionId"],
                "peliculaSerieId": ps_id,
                "imagen": f"assets/img/calcetines/calcetin-{i:02d}.svg",
                "destacado": destacado,
                "activo": True,
            }
        )

    # usuario administrador semilla (la contrasena se deriva en el cliente, nunca se guarda en claro)
    datos = {
        "version": 1,
        "generadoPor": "scripts/generar_catalogo.py",
        "colecciones": COLECCIONES,
        "peliculasSeries": PELICULAS_SERIES,
        "productos": productos,
        "usuarioAdminSemilla": {"nombre": "Administrador", "email": "admin@sockbuster.cl", "rol": "ADMIN"},
    }

    destino = RAIZ / "data" / "catalogo.json"
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(json.dumps(datos, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"OK {destino} :: {len(productos)} productos, {len(COLECCIONES)} colecciones, "
          f"{len(datos['peliculasSeries'])} peliculas/series")


if __name__ == "__main__":
    main()
