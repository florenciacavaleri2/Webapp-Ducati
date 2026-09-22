# Cómo sumar un proceso al portal

Si armaste una herramienta para un proceso tuyo, esto es lo que hace falta para
que el resto del equipo la encuentre y sepa usarla. Son tres pasos y no hace
falta saber programar.

> El camino corto: abrí **`sumar-proceso.html`** desde el portal. Completás la
> ficha y te devuelve el bloque para pegar y el instructivo descargado. Igual
> conviene leer lo de abajo una vez.

---

## Antes de empezar: que tu HTML sea autocontenido

El archivo se va a abrir en la máquina de otra persona. Revisá tres cosas:

1. **Se abre con doble clic y funciona.** Probalo en una carpeta distinta de
   donde lo armaste, para descubrir si dependía de algo que solo tenés vos.
2. **No busca archivos en tu disco.** Nada de `C:\Users\tunombre\...` adentro
   del código: los datos los carga la persona al usarlo.
3. **No necesita internet.** Si trae una librería de una dirección web, hay que
   resolverlo antes: el portal tiene que funcionar sin conexión.

¿Arrancás de cero? Copiá `plantillas/proceso-ejemplo/tool.html`: ya lee
archivos CSV (con el punto y coma y la codificación que usa el Excel en
español), muestra una tabla y copia el resultado para pegar en Excel. Solo hay
que escribir la lógica del proceso.

## Paso 1 — Creá la carpeta

Copiá `plantillas/proceso-ejemplo/` dentro de `procesos/` y renombrala con el
nombre de tu proceso, en minúsculas y con guiones:

```
procesos/conciliacion-de-tarjetas/
  tool.html          ← tu herramienta
  instructivo.html   ← el paso a paso
```

Ese nombre de carpeta es el `id` del proceso y tiene que coincidir con el del
registro. Solo minúsculas, números y guiones: sin espacios, sin acentos y sin
eñes.

## Paso 2 — Escribí el instructivo

Abrí `instructivo.html` con el editor de texto (clic derecho → Abrir con →
Bloc de notas, o el editor que uses) y escribí adentro del bloque que ya está
marcado. Se escribe en markdown, que es texto común con unas pocas marcas:

```markdown
# Título del proceso
## Subtítulo
**negrita**
- lista
1. lista numerada
`115201`  ← un número de cuenta o un nombre de archivo
> Por relevar: algo que todavía no está confirmado
```

Tres reglas para que se vea bien:

- El texto va **pegado al margen izquierdo**, sin espacios adelante.
- Un `Enter` corta la línea y dos `Enter` empiezan un párrafo nuevo: se ve como
  lo escribís.
- Lo que no esté confirmado va en una cita `> Por relevar: …`. Se pinta en
  ámbar y se ve de lejos. Es preferible un hueco visible a un paso inventado.
- No escribas la etiqueta de cierre de un script dentro del texto: corta el
  instructivo ahí mismo.

Guardá y abrí el archivo en el navegador: ya se ve como una página.

La plantilla trae la estructura estándar del equipo (objetivo, antes de
empezar, paso a paso, resultado esperado, notas). Respetala: es lo que hace que
cualquier instructivo se lea igual.

## Paso 3 — Agregá tu proceso al registro

Abrí `registro.js`, copiá un bloque de los que ya están y pegalo al final de la
lista, antes del corchete que la cierra. Cambiá los datos por los tuyos:

```js
    {
      id: 'conciliacion-de-tarjetas',
      nombre: 'Conciliación de tarjetas',
      categoria: 'gastos',
      descripcion:
        'Cruza los cupones de tarjeta contra el mayor del mes.',
      autor: 'Nombre y Apellido',
      actualizado: '22/09/2026',
      frecuencia: 'Mensual',
      empresas: ['FOR'],
      cuentas: ['411000'],
      palabrasClave: ['cupones', 'visa', 'posnet'],
      icono: 'planilla',
      estado: 'listo',
    },
```

| Campo | Qué va | Ojo con |
|---|---|---|
| `id` | El nombre exacto de la carpeta | Tiene que coincidir, o el botón Abrir no encuentra nada |
| `nombre` | Cómo lo llama el equipo | Es lo que se lee en la tarjeta |
| `categoria` | `gastos`, `stock`, `reportes` u `otro` | Si necesitás una nueva, agregala arriba en `categorias` |
| `descripcion` | Una línea: qué resuelve | Hasta 140 caracteres |
| `autor` | Quién lo desarrolló | Para saber a quién preguntarle |
| `actualizado` | `DD/MM/AAAA` | Actualizala cada vez que cambies la herramienta |
| `frecuencia` | `Mensual`, `Semanal`, `A demanda`… | |
| `empresas` | `FOR`, `GRA`, `PAM` | Vacío `[]` si aplica a todas o a ninguna en particular |
| `cuentas` | Las cuentas contables que toca | Entran al buscador: es como mucha gente lo va a buscar |
| `palabrasClave` | Cómo lo buscaría alguien que no sabe el nombre | |
| `icono` | Uno de los del portal | `banco`, `planilla`, `carrito`, `auto`, `reporte`, `cheque`, `conciliacion`, `proceso` |
| `estado` | `listo` o `pendiente` | `pendiente` si todavía no subiste el `tool.html` |

Cuidado con dos cosas al pegar: que el bloque anterior termine en coma, y que
los textos vayan entre comillas simples. Si un texto tiene un apóstrofo
(`Ana O'Higgins`), va escapado: `'Ana O\'Higgins'`.

## Listo

Abrí `index.html`: tu proceso ya aparece en la portada, se busca y se filtra
como los demás.

Si algo no aparece, casi siempre es una coma o una comilla. Quien tenga Node a
mano puede correr `node verificar.mjs` en la carpeta del portal: te dice
exactamente qué está mal.
