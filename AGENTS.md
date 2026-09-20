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

## Antes de dar algo por terminado

```bash
npm run check    # 0 errores
npm run build    # sin fallos
npm run test     # 23 pruebas en verde (necesita npm run dev en otra terminal)
npm run inspect  # dentro del presupuesto
```
