# Sockbuster Video & Socks

Prototipo web funcional de una tienda de calcetines tematicos, modelado con el **paradigma 4+1 de
vistas UML** y desplegado en linea en GitHub Pages.

## Sitio publicado

**https://kirytho.github.io/sockbuster/**

> Este es el enlace que se entrega. El repositorio publico es
> https://github.com/Kirytho/sockbuster

## Las tres paginas

| Pagina | Contenido | Requerimientos que cubre |
|---|---|---|
| `index.html` | Marca, banner, colecciones tematicas, destacados y matriz de trazabilidad RF/RNF | transversal |
| `catalogo.html` | Catalogo con filtros, ficha de producto, resenas, carrito, checkout y panel de administracion | RF01, RF02, RF03, RF04, RNF02 |
| `diagramas.html` | Documentacion UML organizada por las cinco vistas del 4+1, con el fuente PlantUML de cada diagrama | 2.1.2 a 2.1.6 |

## Requerimientos y donde se cumple

| ID | Requerimiento | Vista UML | Implementacion |
|---|---|---|---|
| RF01 | Catalogo por colecciones tematicas | Logica, Procesos | Filtros por coleccion, precio, talla, stock y texto libre |
| RF02 | Carrito y gestion de pedidos | Logica, Procesos | Carrito lateral, cambio de cantidades, checkout simulado con ID unico `SB-AAAA-NNNNN` |
| RF03 | Administracion de inventario y tematicas | Logica, Desarrollo | Panel admin: stock, precio, pelicula/serie y registro de modelos nuevos |
| RF04 | Gestion de resenas de fanaticos | Logica, Escenarios | Valoracion de 1 a 5 estrellas y comentario en la ficha del producto |
| RNF01 | Disponibilidad y despliegue en la nube | Fisica | GitHub Pages + CDN de borde, carga inicial por debajo de 2 s |
| RNF02 | Seguridad en acceso y autenticacion | Fisica, Desarrollo | HTTPS forzado + token JWT HS256 con control de rol |

## Credenciales del prototipo

El panel de administracion requiere rol `ADMIN`, que se obtiene autenticandose:

```
admin@sockbuster.cl / Sockbuster2026
```

Los clientes se registran desde el boton "Ingresar" -> "No tengo cuenta, registrarme".

> La contrasena se deriva con PBKDF2 (SHA-256, 100000 iteraciones) y sal aleatoria por usuario.
> Nunca se guarda en claro. La sesion se transporta en un JWT HS256 firmado con WebCrypto.

## Arquitectura del codigo

```
.
├── index.html / catalogo.html / diagramas.html   las tres paginas
├── assets/
│   ├── css/estilos.css                            hoja de estilos unica
│   ├── img/                                       logo, banner y 26 ilustraciones SVG
│   ├── vendor/chart.umd.js                        Chart.js 4.4.7 (MIT) vendorizado
│   └── js/
│       ├── nucleo/         config, util, bus de eventos
│       ├── datos/          catalogo, repositorio (IndexedDB)
│       ├── seguridad/      jwt, sesion
│       ├── dominio/        producto, carrito, pedido, resena, admin
│       ├── presentacion/   cabecera, componentes, modal, avisos, carrito, grafico
│       └── paginas/        inicio, catalogo, diagramas
├── data/catalogo.json                             catalogo semilla (26 modelos)
├── uml/diagramas/                                 9 diagramas .puml + .svg + .png
└── scripts/                                       generadores y verificaciones
```

La web es 100 % estatica y sin paso de build: lo que se commitea es exactamente lo que se sirve.
La unica dependencia externa (Chart.js) esta vendorizada en el repositorio para que el sitio no
dependa de ningun CDN en tiempo de ejecucion.

## Scripts

```bash
scripts/generar_catalogo.py     regenera data/catalogo.json
scripts/generar_assets.py       regenera las ilustraciones SVG de los calcetines
scripts/renderizar_uml.sh       renderiza los 9 diagramas (falla si un .puml tiene error)
node scripts/verifica_imports.js comprueba que todo import tenga su export
```

`scripts/renderizar_uml.sh` es importante: PlantUML escribe el archivo de salida incluso cuando
el diagrama tiene un error de sintaxis (el SVG resultante es el volcado del codigo con el
mensaje de error). El script exige exit code 0 y valida el contenido, de modo que un diagrama
roto nunca llega al repositorio.

## Pruebas

La verificacion se hizo sobre el sitio publicado con Playwright: carga de las tres paginas,
consola sin errores, filtrado, ciclo completo del carrito, checkout con generacion del ID de
pedido, registro e inicio de sesion, publicacion de resenas, panel de administracion con
edicion de inventario y renderizado del grafico.

## Licencia

Codigo y diagramas generados para la evaluacion. Chart.js se distribuye bajo licencia MIT.
