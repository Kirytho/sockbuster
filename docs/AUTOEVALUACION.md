# Autoevaluacion contra la rubrica

Documento de control: para cada criterio de la rubrica se indica donde esta resuelto el
artefacto y que se hizo para llegar al nivel "Competente / Destacado".

---

## 2.1.1 Interpreta los resultados de la toma de requerimientos

**Nivel: Competente / Destacado (10 pts)**

- Los 4 RF y los 2 RNF estan describedos textualmente en `index.html`, en la tabla de
  trazabilidad que cruza *Requerimiento -> Vista UML -> Implementacion en la web*.
- Cada diagrama de `diagramas.html` lleva insignias con los IDs de requerimiento que cubre.
- Los 4 RF estan implementados y verificados en la web, no solo modelados.
- El README incluye la misma matriz en formato tabla.

Evidencia de cobertura por requerimiento:

| ID | Modelado en | Implementado en |
|---|---|---|
| RF01 | Diagrama de Clases, Diagrama de Paquetes, Actividades de filtrado | Filtros por coleccion, precio, talla, stock y busqueda |
| RF02 | Diagrama de Clases, Secuencia del checkout | Carrito lateral, cantidades, checkout con ID unico |
| RF03 | Diagrama de Clases, Diagrama de Componentes | Panel de administracion con stock, precio, pelicula/serie y alta de modelos |
| RF04 | Diagrama de Clases, Casos de Uso, Historias de Usuario | Ficha de producto con valoracion de 1 a 5 estrellas y comentario |
| RNF01 | Diagrama de Despliegue | GitHub Pages + CDN de borde, carga inicial medida |
| RNF02 | Diagrama de Despliegue, Diagrama de Componentes | HTTPS forzado + JWT HS256 con control de rol |

---

## 2.1.2 Vista Logica

**Nivel: Competente / Destacado (10 pts)**

- `uml/diagramas/01-vista-logica-clases.puml`: entidades con **atributos y tipos**, **metodos con
  firma y valor de retorno**, **asociaciones** y **multiplicidades** explicitas.
- Las entidades exigidas por la rubrica estan nombradas literalmente: `Calcetín`, `Pedido`,
  `Usuario` (mas `DetallePedido`, `Reseña`, `Coleccion`, `PeliculaSerie`, `Carrito`, `ItemCarrito`,
  `Credenciales` y los enums `Rol`, `EstadoPedido`, `MetodoPago`, `TipoObra`).
- Composicion con rombo relleno en `Pedido *-- DetallePedido` y `Carrito *-- ItemCarrito`.
- `02-vista-logica-paquetes.puml`: agrupacion del dominio en cinco paquetes (Catalogo,
  Identidad y Acceso, Carrito, Pedidos, Reputacion) con sus dependencias.

---

## 2.1.3 Vista de Desarrollo

**Nivel: Competente / Destacado (10 pts)**

- `03-vista-desarrollo-componentes.puml` refleja **la organizacion real del codigo**: cada
  componente lleva su ruta real (`assets/js/dominio/pedido.js`, etc.).
- Cubre los cuatro elementos que exige la rubrica: **componentes** (21 modulos), **paquetes**
  (6: Nucleo, Datos, Dominio, Seguridad, Presentacion, Paginas), **librerias** (Chart.js 4.4.7
  vendorizado) y **subsistemas** (Frontend Sockbuster).
- La desalineacion con el codigo se evita porque el diagrama se derivo **despues** de escribir el
  codigo, no al revés.

---

## 2.1.4 Vista de Procesos

**Nivel: Competente / Destacado (10 pts)**

- `04-vista-procesos-secuencia-checkout.puml`: bloque `par` con **concurrencia real**
  (validacion de stock y verificacion de pago en paralelo), **punto de sincronizacion** explicito
  en nota, `alt` con las tres salidas posibles y `loop` para el descuento de stock.
- `05-vista-procesos-actividades-filtrado.puml`: `fork`/`fork again`/`end fork` para la
  **evaluacion paralela de los cinco criterios** del filtrado (RF01), con `join` y flujo de
  trabajo completo en particiones.

---

## 2.1.5 Vista Fisica

**Nivel: Competente / Destacado (10 pts)**

- `06-vista-fisica-despliegue.puml` documenta la **topologia realmente desplegada**: navegador,
  CDN de borde con terminacion TLS, servidor de origen de GitHub Pages, pipeline de CI/CD,
  catalogo semilla en el repositorio y almacenamiento local del cliente.
- Responde explicitamente a los RNF: la nota del CDN indica terminacion TLS, HTTPS forzado,
  cache de estaticos y la medicion de carga inicial (RNF01 y RNF02).
- `07-vista-fisica-objetivo-produccion.puml` documenta **por separado y rotulado** la
  arquitectura objetivo con API, base de datos relacional e IdP externo. No se la confunde con
  el despliegue real: la nota lo dice de forma expresa.

---

## 2.1.6 Escenarios (quinta vista)

**Nivel: Competente / Destacado (10 pts)**

- `08-escenarios-casos-de-uso.puml`: actores (Visitante, Cliente registrado, Administrador y la
  pasarela de pago como actor externo), 12 casos de uso con `<<include>>` y `<<extend>>` que
  **articulan las cuatro vistas anteriores**.
- `09-escenarios-historias-usuario.puml`: 7 historias de usuario con criterios de aceptacion y
  el requerimiento y las vistas que cada una valida.

---

## Entregable transversal: web y despliegue en linea

**Nivel: Competente / Destacado (10 pts)**

- Las tres paginas existen y funcionan: `index.html`, `catalogo.html`, `diagramas.html`.
- El sitio esta **publicado y en linea**: https://kirytho.github.io/sockbuster/
- La pagina de inicio incluye el bloque **"Integrantes del equipo"** con campos editables para
  los nombres de los estudiantes.
- La pagina de diagramas esta **organizada estrictamente** por las cinco vistas del 4+1, con
  navegacion por vistas y el fuente PlantUML de cada diagrama desplegable.
- Interfaz completa y navegable: filtros, grilla, modales accesibles con foco atrapado y cierre
  con Escape, panel de carrito lateral, avisos y grafico de inventario.
