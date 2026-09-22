# Portal de procesos

El lugar donde están todas las herramientas del equipo de contabilidad de
**Grupo Opencars**, cada una con su instructivo.

Hasta ahora cada proceso vivía en la máquina de quien lo armó, sin un lugar
común y sin un paso a paso que le sirviera a otro. El portal junta las dos
cosas: la herramienta y cómo se usa.

---

## Cómo se abre

Doble clic en **`index.html`**. No hace falta instalar nada, ni levantar un
servidor, ni tener internet.

Si la carpeta está sincronizada con OneDrive o SharePoint, todo el equipo ve la
misma versión. Conviene marcar `index.html` como favorito en el navegador.

## Qué hay en la portada

- **Buscador.** Busca por nombre, descripción, autor, empresa, número de cuenta
  y palabras clave. `115201` encuentra Stock VO; `mercado pago` encuentra la
  conciliación de MP Propio.
- **Filtros por categoría**, con la cantidad de procesos de cada una.
- **Una ficha por proceso**, con quién lo armó, cada cuánto se corre, qué
  empresas cubre, cuándo se actualizó, y dos botones: **Abrir** la herramienta
  y ver el **Instructivo**.

Del teclado: `/` va al buscador, `Enter` abre el primer resultado, `↓` y `↑`
recorren las fichas y `Esc` limpia la búsqueda.

### Las fichas que dicen "Falta el archivo"

Son procesos que ya están relevados y tienen su instructivo, pero cuyo HTML
todavía no se subió al portal. El botón **Abrir** lleva a una página que
explica exactamente dónde va el archivo. No es un error: es el relevamiento a
la vista.

## Sumar un proceso propio

Entrá a **`sumar-proceso.html`** desde el botón de arriba a la derecha:
completás la ficha y la página te devuelve el bloque para pegar en
`registro.js` y el instructivo ya armado para descargar.

El paso a paso completo, con el detalle de cada campo, está en
[`COMO-SUMAR-UN-PROCESO.md`](COMO-SUMAR-UN-PROCESO.md).

## Mapa de la carpeta

```
index.html                  la portada
registro.js                 el listado de procesos (se edita a mano)
sumar-proceso.html          el formulario para sumar el tuyo
pendiente.html              qué hacer cuando falta el HTML de una herramienta
verificar.mjs               las pruebas (node verificar.mjs)
assets/                     estilos, íconos y los tres scripts del portal
plantillas/proceso-ejemplo/ herramienta e instructivo para copiar
procesos/<proceso>/         tool.html + instructivo.html de cada proceso
```

## Cómo está hecho

HTML, CSS y JavaScript a secas. Sin framework, sin dependencias, sin paso de
compilación y sin conexión a internet. La razón es una sola: el portal tiene
que funcionar abriéndolo con doble clic desde una carpeta compartida, y en ese
contexto el navegador bloquea casi todo lo demás.

De ahí salen las dos decisiones que más llaman la atención:

- **El listado es `registro.js` y no `registro.json`.** Un `.json` habría que
  leerlo con `fetch`, y el navegador lo bloquea al abrir el portal como
  archivo. Un `<script src>` no. El contenido es JSON común, se edita igual.
- **Los instructivos son `.html` y no `.md`.** Cada uno lleva su texto en
  markdown adentro, en un bloque `<script type="text/markdown">`: se escribe
  como markdown, se ve renderizado al abrirlo, y no hay dos copias del mismo
  texto.

Las reglas completas para trabajar sobre el portal están en
[`AGENTS.md`](AGENTS.md).

### Tokens de diseño

Salen de las variables de `:root` en `assets/portal.css`. Si algo necesita un
color o un espaciado nuevo, primero se agrega ahí.

| Token | Valor | Para qué |
|---|---|---|
| `--papel` | `#F2F4F3` | Fondo de página. Blanco frío, de papelería |
| `--ficha` | `#FFFFFF` | Fondo de fichas y documentos |
| `--tinta` | `#16222E` | Texto principal |
| `--tinta-media` | `#55636E` | Texto secundario y etiquetas |
| `--regla` | `#D4DAD8` | Bordes y líneas de tabla |
| `--sello` | `#0F5C4A` | Verde de la acción principal |
| `--pendiente` | `#8A5A12` | Lo que falta relevar. Nunca para acciones |
| `--cat-gastos` | `#0F5C4A` | Regla de la categoría Gastos |
| `--cat-stock` | `#1E4E79` | Regla de la categoría Stock |
| `--cat-reportes` | `#6E2C4E` | Regla de la categoría Reportes |
| `--cat-otro` | `#5A6670` | Regla de la categoría Otro |

Tipografías: **Cambria** (con Georgia de respaldo) para títulos, **Segoe UI**
para la interfaz y **Consolas** solo para datos donde la alineación importa
—números de cuenta y fechas—. Son las del sistema: no se descarga ninguna, así
el portal se ve igual sin internet.

## Pruebas

```bash
node verificar.mjs
```

Comprueba que el registro sea coherente, que cada ficha apunte a archivos que
existen, que el renderizador de markdown escape el HTML, y que no se haya
colado nada que rompa el portal al abrirlo con doble clic. No instala nada.

Después, siempre, el navegador: abrir `index.html` con doble clic y probar la
portada, un instructivo y el formulario.

## Dónde alojarlo

Hoy funciona desde cualquier carpeta. Las opciones, de menos a más:

| Dónde | Costo | A favor | En contra |
|---|---|---|---|
| Carpeta de OneDrive / SharePoint sincronizada | Incluido | Los permisos ya están, cada uno abre `index.html` | No hay un link único para mandar |
| SharePoint, abriendo el archivo desde el sitio | Incluido | Nada que migrar | A veces fuerza la descarga en vez de mostrar la página |
| GitHub Pages en un repositorio privado | Gratis | Un link único y el historial de cambios | El repositorio tiene que ser privado: son datos internos |

**Recomendación para arrancar:** la carpeta sincronizada. Es lo que menos
fricción tiene y no expone nada. Si más adelante aparece la necesidad de un
link único, el paso a GitHub Pages privado es copiar esta carpeta a su propio
repositorio y activar Pages: no hay que cambiar una línea de código.

> La carpeta es autónoma a propósito: se puede mover entera a otro lado sin
> arrastrar nada.
