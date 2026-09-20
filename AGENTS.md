# AGENTS.md

Instrucciones para cualquier agente de IA que trabaje en este repositorio.

---

## Reglas de trabajo

1. **Planificá antes de escribir código.** Presentá el plan y esperá aprobación
   antes de tocar archivos. Nada de empezar a editar y ver qué pasa.
2. **Elegí el stack según el producto.** La tecnología sale del problema, no de
   la costumbre. Este proyecto es una landing de captación con un panel
   interno: por eso es Astro estático y no una SPA. Si una decisión de stack ya
   está tomada acá abajo, respetala o proponé el cambio con su motivo.
3. **Usá npm** como gestor de paquetes, y preferí librerías conocidas y bien
   mantenidas antes que dependencias marginales.
4. **Nunca hardcodees secretos ni credenciales.** Todo lo sensible va en
   variables de entorno y se documenta en `.env.example` con un valor de
   ejemplo. `.env` está en `.gitignore` y ahí se queda.
5. **Para crear o modificar pantallas usá la skill `frontend-design`** y
   Tailwind. Invocala *antes* de escribir el componente, no después.
6. **Para la documentación de cualquier librería usá la skill `find-docs`**
   (Context7). No escribas API de memoria: las versiones cambian y tu
   entrenamiento queda viejo.
7. **Para todo lo de branding y UI, `DESIGN.md` manda.** Colores, tipografías,
   espaciados, radios, componentes. Si falta un token, agregalo primero a
   `DESIGN.md` y después usalo.
8. **Para e2e usá el MCP de Playwright; para unitarios e integración, Vitest.**
   Son pruebas locales que ejecuta el agente. Toda funcionalidad nueva viene
   con su prueba en la capa que corresponda.
9. **Nunca des por terminado un cambio de código sin correr los tests
   completos.** Las tres capas, no solo la que tocaste. Si algo queda en rojo,
   decilo con la salida a la vista en lugar de declarar el trabajo listo.
   *Excepción:* si tocaste únicamente documentación (`AGENTS.md`, `README.md`,
   `DESIGN.md`, los escenarios de `tests/e2e/`), no corras nada: no hay
   producto que pueda romperse.
10. **Si aprendés algo importante del proyecto, escribilo acá.** Una trampa en
    la que caíste, una versión que no sirve, un comando que no hace lo que
    parece: va a "Lo aprendido a los golpes" antes de cerrar la tarea. Este
    archivo tiene que mejorar con cada sesión, no envejecer.
11. **Si cambiás el producto, actualizá el `README.md`.** Funcionalidad nueva,
    comportamiento distinto, variable de entorno, comando: el README describe
    lo que el proyecto hace hoy, y los cambios visibles se anotan en
    "Cambios recientes". Lo interno del proceso va acá, no ahí.
12. **Se trabaja en `dev`, nunca directo en `main`.** Antes de tocar nada,
    verificá con `git branch --show-current`. `main` queda como la rama
    estable y solo recibe cambios ya probados desde `dev`.

### Por qué las reglas 5 y 6 no son decorativas

Durante la construcción de este proyecto, consultar Context7 antes de fijar
versiones evitó tres errores concretos:

- Astro va por la **7.x**, no la 5 que asumía el plan original.
- `@astrojs/check` todavía no soporta **TypeScript 7**, así que el proyecto
  está fijado en 5.9.3.
- Tailwind 4 ya no usa `@astrojs/tailwind` ni `tailwind.config.js`: se
  configura con el plugin `@tailwindcss/vite` y `@theme` dentro del CSS.

---

## Qué es esto

Webapp de captación de leads para la gama Ducati Argentina, con un panel
interno donde el equipo comercial ve las consultas que entran.

Es un **proyecto académico**. No se publica oficialmente y no está afiliado a
Ducati Motor Holding S.p.A.

## Stack

| Pieza | Elección | Por qué |
|---|---|---|
| Framework | Astro 7 (`output: 'static'`) | Cero JS por defecto; la landing se sirve como HTML plano desde el CDN |
| Hosting | Vercel (`@astrojs/vercel`) | Las rutas con `prerender = false` corren como funciones |
| Estilos | Tailwind 4 vía `@tailwindcss/vite` | Sin archivo de config: los tokens viven en `@theme` dentro de `src/styles/global.css` |
| Base de datos | Postgres — Neon en producción, PGlite en local | Neon habla HTTP, que es lo que funciona en serverless |
| ORM | Drizzle | Schema tipado y migraciones versionadas |
| Validación | Zod 4 | Un solo esquema, **solo en el servidor** |
| Tipos | TypeScript 5.9 strict | 7.x todavía no lo soporta `@astrojs/check` |

**No hay framework de UI.** Ni React, ni Vue, ni Svelte. Fue una decisión
explícita: React + react-dom cuestan ~45 KB gzip y la única parte interactiva
del sitio es un formulario, que se resuelve con 2 KB de mejora progresiva. Si
alguna vez hace falta uno, tiene que justificar su peso contra el presupuesto
de abajo.

## Comandos

```bash
npm run dev            # servidor de desarrollo en :4321
npm run build          # build de producción
npm run preview        # sirve el build
npm run check          # errores de tipos (astro check)
npm run test           # pruebas de humo contra el server de dev
npm run inspect        # radiografía del build: peso, imágenes, SEO
npm run db:generate    # genera la migración desde src/db/schema.ts
npm run db:migrate     # la aplica
npm run db:seed        # carga 28 leads de ejemplo (solo desarrollo)
npm run db:studio      # explorador de la base (Drizzle Studio)
npm run bikes:images   # baja las fotos de los modelos del CDN
```

## Reglas del proyecto

### Presupuesto de rendimiento — no negociable

El motivo del proyecto es el posicionamiento en Google. Los números actuales:

| Métrica | Actual | Techo |
|---|---|---|
| JavaScript de la landing | 2.191 B (inline) | 20 KB |
| HTML + CSS comprimidos | 17 KB gzip | 40 KB |
| Peticiones de JS | 0 | 1 |

`npm run inspect` los mide y falla si se pasan. **Corrélo después de cualquier
cambio que sume una dependencia al cliente.**

La regla de oro: *si algo se puede hacer con HTML y CSS, se hace con HTML y
CSS.* El filtro del catálogo usa radios nativos y `:has()`. El menú mobile usa
`<details>`. Ninguno de los dos necesita JavaScript.

### El formulario tiene que funcionar sin JavaScript

`src/components/LeadForm.astro` es un `<form method="POST" action="/api/leads">`
real. Sin JavaScript se envía igual y el endpoint responde `303` a `/gracias`.
El script solo agrega validación en vivo y envío sin recargar.

**No importes `src/lib/lead-schema.ts` desde código de cliente.** Arrastra Zod
y los dos catálogos al bundle (~35 KB gzip) para repetir una validación que el
servidor hace igual. En el cliente alcanza con la validación nativa.

### El servidor no confía en el cliente

`src/pages/api/leads.ts` revalida todo con Zod, incluido que el país y el
modelo existan en los catálogos. Cualquier campo nuevo se valida ahí, no solo
en el navegador.

### Una sola fuente de verdad para el catálogo

`src/data/bikes.json` alimenta la grilla de modelos, el `<select>` del
formulario, los datos estructurados y el filtro del panel. Para agregar una
moto: agregá la entrada, corré `npm run bikes:images` y listo.

`src/data/countries.ts` está **generado**. No lo edites a mano: cambiá
`scripts/gen-countries.mjs` y volvé a correrlo.

### Seguridad

- `/admin/*` lo protege `src/middleware.ts`, no cada página. Una ruta nueva
  bajo `/admin` nace protegida.
- La sesión es una cookie firmada con HMAC-SHA256 (`SESSION_SECRET`),
  `HttpOnly` + `SameSite=Lax`. La contraseña se compara en tiempo constante.
- Los parámetros de redirección (`next`, `back`) se validan como rutas
  internas. Sin eso serían redirectores abiertos.
- El CSV neutraliza celdas que empiezan con `=`, `+`, `-` o `@`: si no, un
  nombre como `=SUM(...)` se ejecuta al abrir el archivo en Excel.
- El rate limit usa `x-vercel-forwarded-for` / `x-real-ip` antes que
  `x-forwarded-for`, que el cliente puede falsificar.

### Qué no tocar a mano

- `drizzle/` — lo genera `npm run db:generate`.
- `src/data/countries.ts` — lo genera `scripts/gen-countries.mjs`.
- `src/assets/bikes/` — lo baja `npm run bikes:images`.
- `.data/` — la base local de PGlite. Si algo se rompe, borrala y corré
  `npm run db:migrate`. Con PGlite solo un proceso puede tener la base
  abierta: frená el servidor de desarrollo antes de migrar o sembrar.
- `public/fonts/` — copiado de `node_modules/@fontsource*`. Si cambia una
  tipografía, actualizá también el `@font-face` y el `preload` de `Base.astro`.

## Mapa del repositorio

```
src/
├─ assets/bikes/       fotos descargadas (Astro las optimiza en build)
├─ components/         Hero · BikeCard · BikeGrid · LeadForm · SiteHeader · SiteFooter
├─ data/               bikes.json + bikes.ts · countries.ts (generado)
├─ db/                 schema.ts (tabla leads) · index.ts (cliente Neon/PGlite)
├─ layouts/            Base.astro (público) · Admin.astro (panel)
├─ lib/                lead-schema.ts (Zod, servidor) · session.ts · rate-limit.ts
├─ pages/
│  ├─ index.astro      landing — estática
│  ├─ gracias.astro    destino del envío sin JS — estática
│  ├─ api/leads.ts     POST del formulario
│  └─ admin/           index · login · logout · status · export.csv
├─ middleware.ts       guard de /admin
└─ styles/global.css   tokens de DESIGN.md como @theme de Tailwind
scripts/               migrate · fetch-bike-images · gen-countries · smoke-test · inspect-build
```

## Testing

Tres capas, todas locales. Ninguna funcionalidad nueva se da por terminada sin
la prueba que le corresponde.

| Capa | Herramienta | Cuántas | Qué cubre |
|---|---|---|---|
| Unitaria | Vitest | 118 | Funciones puras: validación Zod, firma de sesión, rate limit, escape de CSV, catálogos |
| Integración | Vitest | 55 | Los handlers reales contra un Postgres de verdad en memoria |
| End-to-end | MCP de Playwright | 16 escenarios | Los recorridos completos en el navegador, de la landing al panel |

```bash
npm test               # unitarias + integración
npm run test:unit
npm run test:integration
npm run test:watch     # durante el desarrollo
npm run test:smoke     # humo contra el server de dev (necesita npm run dev)
```

### Integración: base real, no imitación

`tests/integration/` levanta **PGlite en memoria** y le aplica las migraciones
de `drizzle/`, las mismas que corren en producción. Lo que se prueba es el SQL
que genera Drizzle: si una columna cambia de tipo o falta un índice, falla acá.

Los handlers se importan y se invocan con un `Request` real. El contexto de
Astro se arma a mano, solo con lo que cada handler consume.

`setupEnv()` tiene que llamarse **antes** de importar cualquier módulo que lea
`process.env`: `src/db` cachea el cliente en el primer uso.

### End-to-end: escenarios, no improvisación

Los 16 escenarios están en [`tests/e2e/scenarios.md`](tests/e2e/scenarios.md)
con pasos y resultado esperado. Se ejecutan con el MCP de Playwright, ya
configurado en `.mcp.json` contra el Chrome del sistema (no hace falta
descargar navegadores).

Corren sobre el sitio levantado:

```bash
npm run db:seed -- --reset   # con el servidor frenado
npm run dev
```

El escenario E16 (cuánto JavaScript llega de verdad) es la excepción: en
desarrollo Vite sirve cada módulo suelto y Astro inyecta su barra de
herramientas, así que hay que medir sobre el build.

```bash
npm run build && npm run preview:build   # queda en :4331
```

`astro preview` no sirve para esto: el adaptador de Vercel no lo soporta. Por
eso está `scripts/serve-build.mjs`, que sirve `dist/client` como estático.

> El MCP se registra al iniciar la sesión. Si acabás de clonar el repo,
> reiniciá Claude Code para que aparezcan sus herramientas.

Es una capa que ejecuta el agente, no un CI: `npm test` no la incluye. Correrla
igual antes de dar por terminado un cambio de código.

## Ramas

El repositorio está en
[florenciacavaleri2/Webapp-Ducati](https://github.com/florenciacavaleri2/Webapp-Ducati),
privado.

| Rama | Para qué |
|---|---|
| `dev` | Donde se trabaja. Todo commit nuevo va acá. |
| `main` | Rama estable. Solo recibe lo que ya pasó por `dev`. |

```bash
git branch --show-current   # confirmá que dice dev antes de empezar
```

Para llevar lo de `dev` a `main` cuando algo está listo y con los tests en
verde:

```bash
git switch main && git merge --ff-only dev && git push origin main
git switch dev
```

`--ff-only` es a propósito: si falla, es que `main` recibió algo por afuera y
hay que mirarlo en vez de generar un merge sorpresa.

### La protección de main es local

GitHub **no permite proteger ramas en repositorios privados con cuenta
gratuita**: tanto la protección clásica como los rulesets devuelven
`403 Upgrade to GitHub Pro`. Así que la barrera vive en un hook, en
`.githooks/pre-push`.

Se activa una vez por clon:

```bash
git config core.hooksPath .githooks
```

Al empujar a `main` bloquea tres cosas: borrar la rama, reescribir el
historial, y subir commits que no estén en `dev`. El `merge --ff-only` de
arriba pasa sin problema. Los push a `dev` no se tocan.

Salida de emergencia, cuando hace falta de verdad:

```bash
PERMITIR_PUSH_MAIN=1 git push origin main
```

No sustituye a la protección del servidor: frena errores propios en este clon,
no a alguien decidido ni a un clon nuevo sin el hook activado.

## Lo aprendido a los golpes

Trampas reales de este proyecto, cada una costó tiempo una vez. Agregá las
tuyas (regla 10).

**PGlite admite un solo proceso con la base abierta.** Frená el servidor de
desarrollo antes de `db:migrate` o `db:seed`, o falla con `ENOENT ... mkdir`.
Además no crea la carpeta que la contiene: por eso los scripts hacen
`mkdirSync` del directorio padre. Y deja su worker vivo, así que un script que
la use necesita `process.exit(0)` o nunca termina.

**`astro preview` no funciona con el adaptador de Vercel.** Para ver el build
está `npm run preview:build`, que sirve `dist/client` como estático. Solo la
parte estática: la API y el panel necesitan `npm run dev`.

**El rendimiento no se mide en desarrollo.** Vite sirve cada módulo suelto y
Astro inyecta su barra de herramientas, así que en `npm run dev` se ven
decenas de `.js` que no existen en producción. Medir siempre sobre el build.

**Astro rechaza con 403 los POST cuyo `Origin` no coincide** con el host. Es su
protección CSRF y está bien que exista: el navegador manda la cabecera solo,
pero un script que pruebe la API tiene que ponerla a mano.

**`node --env-file` se atraganta con el BOM.** `Set-Content -Encoding utf8` de
PowerShell 5.1 lo agrega y el `.env` deja de parsearse sin decir por qué.
Escribir esos archivos sin BOM.

**Los servidores MCP de un `.mcp.json` de proyecto no se cargan solos.** Hay
que habilitarlos (`/mcp`, o `enabledMcpjsonServers` en `~/.claude.json`) **y**
reiniciar Claude Code: el cambio no toma efecto en caliente. Y el
`--allowed-origins` del servidor tiene que listar todos los puertos que se van
a visitar, o Chrome devuelve `ERR_BLOCKED_BY_CLIENT`.

**Al probar el formulario, esperá al handler antes de leer el DOM.** Una
lectura inmediata después del clic cae entre el `clearErrors()` y el pintado
de los errores, y parece un bug que no existe. Lo mismo vale al encadenar
escenarios: si dejás el formulario sucio de la prueba anterior, el siguiente
falla por tu culpa y no del producto. Ante un rojo sospechoso, reproducilo
desde carga limpia antes de reportarlo.

**Una variable de entorno mal puesta puede tumbar el build entero.** La opción
`site` de Astro exige una URL absoluta válida; si no lo es, el build muere con
un escueto `! Invalid URL` que no dice cuál. Pasó con `PUBLIC_SITE_URL` vacía
—`??` solo cubre `null` y `undefined`, no la cadena vacía— y también sin el
`https://`. Ahora `astro.config.mjs` la valida y cae a
`VERCEL_PROJECT_PRODUCTION_URL` en vez de fallar. Moraleja general: todo valor
que venga del entorno y se use en configuración se valida antes, porque el
error aparece en el despliegue y no en local.

**Vercel bloquea el despliegue si el email del commit no está en la cuenta de
GitHub.** El mensaje es *"El despliegue se bloqueó porque el correo electrónico
de confirmación no coincidía con una cuenta de GitHub"*, y no importa que el
push haya funcionado: lo que Vercel mira es el autor del commit. El email de
este repositorio es `florenciacavaleri2@gmail.com`; comprobalo con
`git config user.email` antes de commitear si algo se ve raro. Cambiarlo solo
afecta a los commits nuevos, así que para destrabar un deploy hace falta un
commit posterior, no basta con corregir la configuración.

**Un `<fieldset>` no achica por debajo de su contenido.** Trae
`min-width: min-content` del navegador. En la barra de filtros eso estiraba la
página a 991px en mobile en vez de scrollear dentro de la barra. Cualquier
`fieldset` en flex necesita `min-width: 0`.

## Antes de dar algo por terminado

**Si tocaste solo documentación, no corras nada.** Leela y listo.

Si tocaste código, correr **todo**, no solo lo que tocaste:

```bash
npm run check    # 0 errores de tipos
npm test         # 173 pruebas: unitarias + integración
npm run build    # sin fallos
npm run inspect  # dentro del presupuesto de rendimiento
```

Y los escenarios de `tests/e2e/scenarios.md` con el MCP de Playwright.

Si algo queda en rojo, mostrá la salida y decilo. Una tarea con tests fallando
no está terminada.
