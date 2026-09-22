# AGENTS.md — Portal de procesos

Instrucciones para cualquier persona (o agente de IA) que trabaje en esta
carpeta.

> **Esta carpeta es un proyecto independiente.** No comparte stack, diseño,
> dependencias ni reglas con ningún otro proyecto que pueda estar alojado en el
> mismo repositorio. No importes nada de afuera de `portal-procesos/`, no
> apliques convenciones de otro proyecto acá, y no toques archivos de otro
> proyecto desde acá. Está pensada para moverse tal cual a su propio
> repositorio el día que se decida.

---

## Qué es

El índice de las herramientas y los instructivos de los procesos contables del
equipo de Grupo Opencars (Fortecar, Granville y Automotores Pampeanos). Cada
proceso tiene su carpeta con la herramienta HTML y su instructivo; la portada
los lista, los busca y los filtra.

## Reglas de trabajo

1. **Sin dependencias, sin build, sin instalación.** No hay `npm install`, no
   hay `package.json`, no hay paso de compilación. Lo que está en la carpeta es
   lo que corre. Si una tarea parece necesitar una librería, casi siempre se
   resuelve con menos código propio.
2. **Tiene que funcionar abriendo `index.html` con doble clic**, desde una
   carpeta sincronizada de OneDrive o SharePoint, sin servidor y sin internet.
   Esta es la restricción que manda sobre todas las decisiones técnicas. Ver
   "Las tres prohibiciones".
3. **Los datos contables no se guardan acá.** Las herramientas leen los
   archivos que la persona carga en el momento y no los mandan a ningún lado.
   Nunca commitees un export, un extracto ni una planilla con datos reales.
4. **Una sola fuente de verdad por cosa.** El listado de procesos vive solo en
   `registro.js`. El texto de un instructivo vive solo dentro de su
   `instructivo.html`. Los estilos viven solo en `assets/portal.css`. No
   dupliques.
5. **Los tokens de diseño mandan.** Colores, tipografías y espaciados salen de
   las variables de `:root` en `assets/portal.css`, documentadas en
   `README.md`. Si falta un token, agregalo ahí primero y después usalo. Nada
   de colores sueltos en el medio del código.
6. **Antes de dar algo por terminado, corré `node verificar.mjs`** y abrí el
   portal en el navegador. Las dos cosas, siempre. El detalle está abajo.
7. **Escribí en castellano rioplatense**, en el código y en los textos de
   pantalla: comentarios, nombres de variables, mensajes y documentación. Es el
   idioma del equipo que lo usa y lo mantiene.
8. **Lo que no se sabe, no se inventa.** En un instructivo, un dato sin
   confirmar va en una cita `> Por relevar: …`, que se pinta en ámbar. Es
   preferible un hueco visible a un paso inventado que alguien siga creyendo
   que está verificado.
9. **Si aprendés algo importante, escribilo acá**, en "Lo aprendido a los
   golpes", antes de cerrar la tarea.

## Las tres prohibiciones

Salen todas de la regla 2: el portal se abre con `file://`.

1. **Nada de `fetch()` ni `XMLHttpRequest` a archivos de la carpeta.** El
   navegador los bloquea en `file://` (origen opaco). Por eso el registro es
   `registro.js` —un objeto asignado a `window`, que carga con `<script src>`—
   y no `registro.json`. Por el mismo motivo los instructivos son `.html` con
   el markdown adentro y no archivos `.md` leídos aparte.
2. **Nada de módulos ES.** `<script type="module">` se carga con reglas de CORS
   y falla en `file://`. Todo va como script clásico, y por eso el código usa
   IIFE y `var` en vez de `import`/`export`.
3. **Nada de CDN.** Ni librerías, ni tipografías de Google, ni hojas de estilo
   remotas: la carpeta tiene que abrir sin internet. Las tipografías son las
   del sistema.

Hay una cuarta, que no es técnica: **nada de rutas locales** tipo
`C:\Users\nombre\...` dentro de una herramienta. En la máquina del resto del
equipo no existen.

## Mapa de la carpeta

```
index.html                  portada: buscador, filtros y fichas
registro.js                 el listado de procesos — se edita a mano
sumar-proceso.html          formulario que genera la ficha y el instructivo
pendiente.html              destino de "Abrir" mientras falta el HTML real
verificar.mjs               las pruebas del portal (node verificar.mjs)
assets/
  portal.css                tokens + todas las pantallas
  portal.js                 portada: render, buscador, filtros, atajos
  markdown.js               renderizador de markdown, propio y sin dependencias
  instructivo.js            arma la página de un instructivo
  iconos.js                 sprite SVG inyectado (en file:// no anda <use> externo)
  favicon.svg
plantillas/proceso-ejemplo/ tool.html e instructivo.html para copiar
procesos/<id>/              tool.html + instructivo.html de cada proceso
```

`plantillas/proceso-ejemplo/` está dos niveles abajo de la raíz a propósito:
las rutas relativas (`../../assets/…`) son las mismas que va a tener la carpeta
una vez copiada a `procesos/`, así que la plantilla se puede abrir y se ve bien
sin tocar nada.

## Cómo se agrega un proceso

El camino corto es `sumar-proceso.html`, que genera el bloque de `registro.js`
y descarga el instructivo pre-llenado. El camino manual son tres pasos:

1. Crear `procesos/<id>/` copiando `plantillas/proceso-ejemplo/`.
2. Reemplazar `tool.html` por la herramienta real y escribir el instructivo
   dentro de `instructivo.html`.
3. Agregar el bloque del proceso a `registro.js`.

Los campos de cada bloque están documentados en `COMO-SUMAR-UN-PROCESO.md`.
`estado: 'pendiente'` es para cuando la ficha existe pero el `tool.html` todavía
no: la portada lo marca y el botón **Abrir** explica qué falta.

## Pruebas

Dos capas, las dos locales y sin instalar nada.

```bash
node verificar.mjs      # registro, archivos en disco y renderizador de markdown
```

`verificar.mjs` es el guardián de los errores que no se ven al mirar la
pantalla: una ficha que apunta a una carpeta que no existe, una categoría mal
escrita, una fecha en otro formato, un `fetch` o un `type="module"` colado en
algún archivo. Corre en Node pelado y no depende de nada.

La segunda capa es el navegador, y no se saltea: abrí `index.html` con doble
clic (o con `file://`, nunca con un servidor) y comprobá la portada, el
buscador, un instructivo y `sumar-proceso.html`. Si algo anda servido por http
pero no con doble clic, está roto.

## Lo aprendido a los golpes

**El `<use href="archivo.svg#id">` de SVG no funciona en `file://`.** Va a
buscar el archivo y el navegador se lo bloquea, igual que un `fetch`. Por eso
el sprite de íconos se inyecta desde `iconos.js` en vez de vivir en un `.svg`.

**El `pattern` de un `<input>` se compila con la bandera `v`.** Con esa
bandera, un guion suelto al final de una clase de caracteres (`[a-z0-9-]`) es
un error de sintaxis y el navegador lo rechaza entero. Va escapado:
`[a-z0-9\-]`.

**El markdown embebido no puede llevar indentación.** Va pegado al margen
izquierdo dentro del `<script type="text/markdown">`, porque cuatro espacios
adelante de un título lo convierten en otra cosa.

**Un instructivo no puede contener la etiqueta de cierre de un script**
escrita tal cual en el texto: corta el bloque ahí mismo y el resto del
instructivo desaparece.

**El Excel en español exporta CSV con punto y coma**, no con coma, y con
codificación Windows-1252. La plantilla de herramienta ya detecta el separador
y lee con esa codificación; una herramienta nueva que lea archivos tiene que
hacer lo mismo o va a leer una sola columna llena de caracteres raros.

**Un salto de línea suelto corta la línea.** El renderizador no sigue el
markdown clásico en eso a propósito: en un instructivo, el bloque de
`**Autor:** … / **Categoría:** …` tiene que salir en líneas separadas, que es
lo que ve quien lo escribe. Para un párrafo nuevo va una línea en blanco.
