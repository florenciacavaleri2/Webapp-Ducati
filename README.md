# Ducati Leads

Webapp de captación de leads para la gama Ducati Argentina, con un panel
interno donde el equipo comercial ve las consultas que van entrando.

La landing es **HTML estático** con 2 KB de JavaScript, porque el objetivo del
proyecto es el posicionamiento en Google y las Core Web Vitals.

> **Proyecto académico.** No se publica oficialmente. Ducati es una marca
> registrada de Ducati Motor Holding S.p.A.; las fotografías, los nombres de
> los modelos y los precios se relevaron de ducati.com/ar/es el 19/09/2026 y
> se usan solo con fines educativos. Este proyecto no está afiliado ni
> autorizado por Ducati Motor Holding S.p.A.

---

## Qué hace

- **Landing pública** con los 22 modelos de la gama argentina: potencia,
  torque, peso y precio de referencia, filtrables por familia.
- **Formulario de contacto** con nombre completo, email, país y el modelo que
  busca la persona. Funciona con y sin JavaScript.
- **Panel `/admin`** con la lista de leads, búsqueda, filtros por estado y por
  familia, cambio de estado y exportación a CSV.

## Requisitos

- **Node 22.12 o superior** (probado en 24 LTS) — https://nodejs.org
- Nada más para desarrollo. La base de datos local viene incluida.

## Puesta en marcha

```bash
npm install
```

```bash
cp .env.example .env
```

En Windows (PowerShell):

```bash
Copy-Item .env.example .env
```

Abrí `.env` y poné una contraseña para el panel y una clave de sesión. La
configuración por defecto usa **PGlite**, un Postgres embebido que guarda todo
en `.data/` — no hace falta crear ninguna cuenta.

Para generar la clave de sesión:

```bash
node -e "console.log(crypto.randomUUID().replace(/-/g,'')+crypto.randomUUID().replace(/-/g,''))"
```

Creá las tablas y descargá las fotos de los modelos:

```bash
npm run db:migrate
```

```bash
npm run bikes:images
```

Si querés ver el panel con datos en vez de vacío, cargá los leads de ejemplo:

```bash
npm run db:seed
```

Y arrancá:

```bash
npm run dev
```

> Con PGlite solo un proceso puede abrir la base a la vez. Frená el servidor
> de desarrollo antes de correr `db:migrate` o `db:seed`.

- Landing: http://localhost:4321
- Panel: http://localhost:4321/admin (entrá con el `ADMIN_PASSWORD` de tu `.env`)

## Variables de entorno

| Variable | Para qué | Ejemplo |
|---|---|---|
| `DATABASE_URL` | Base de datos. `pglite://...` usa la base local; `postgresql://...` usa Neon | `pglite://.data/dev` |
| `ADMIN_PASSWORD` | Contraseña única del panel | una cadena larga y aleatoria |
| `SESSION_SECRET` | Clave con la que se firma la cookie de sesión | 64 caracteres aleatorios |
| `PUBLIC_SITE_URL` | URL pública, para canonical y sitemap | `http://localhost:4321` |

`.env` está en `.gitignore`. No subas credenciales al repositorio.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run preview` | Sirve el build localmente |
| `npm run check` | Errores de tipos |
| `npm test` | 173 pruebas: unitarias e integración |
| `npm run test:unit` | Solo las unitarias |
| `npm run test:integration` | Solo las de integración |
| `npm run test:watch` | Modo watch, para desarrollar |
| `npm run test:smoke` | Humo contra el server de dev (necesita `npm run dev`) |
| `npm run inspect` | Peso del build, imágenes y SEO |
| `npm run db:generate` | Genera una migración tras cambiar el schema |
| `npm run db:migrate` | Aplica las migraciones |
| `npm run db:seed` | Carga 28 leads de ejemplo para ver el panel con datos |
| `npm run db:studio` | Explorador visual de la base |
| `npm run bikes:images` | Descarga las fotos de los modelos |

## Cómo usar el panel

Entrá a `/admin` con la contraseña de `ADMIN_PASSWORD`. La sesión dura 8 horas.

- Las pastillas de arriba filtran por estado con un clic.
- La búsqueda mira nombre y email.
- El estado de cada lead se cambia desde el desplegable de su fila: `nuevo`,
  `contactado` o `descartado`.
- **Exportar CSV** baja lo que estés viendo, con los filtros aplicados. El
  archivo abre bien en Excel, con acentos incluidos.

## Poner en producción

1. Creá una base en [Neon](https://console.neon.tech) (plan gratuito) y copiá
   la cadena de conexión.
2. Importá el repositorio en [Vercel](https://vercel.com). Detecta Astro solo.
3. Cargá las cuatro variables de entorno en Vercel, con el `DATABASE_URL` de
   Neon y el `PUBLIC_SITE_URL` real.
4. Aplicá las migraciones contra Neon:

```bash
npm run db:migrate
```

5. Desplegá.

La landing y `/gracias` salen del CDN como archivos estáticos. Solo `/api/leads`
y `/admin/*` corren como funciones.

## Decisiones de arquitectura

**Por qué Astro y no Next.** El sitio es una landing de conversión: casi todo
es contenido que no cambia entre visitas. Astro la prerenderiza como HTML plano
y no envía JavaScript salvo donde se lo pidas explícitamente. Las dos rutas que
sí necesitan servidor —el endpoint del formulario y el panel— se marcan una por
una con `export const prerender = false` y conviven en el mismo proyecto.

**Por qué no hay React.** El plan original tenía una island de React para el
formulario. React más react-dom pesan unos 45 KB comprimidos, más que todo el
resto de la página junta, y el proyecto existe por la velocidad de carga. El
formulario terminó siendo un `<form>` HTML normal con 2 KB de JavaScript encima
que agrega validación en vivo y envío sin recargar. Sin ese JavaScript el
formulario sigue funcionando: el navegador hace el POST y el servidor redirige
a `/gracias`. Se gana en robustez y se pierde nada.

**Por qué las imágenes se descargan.** Enlazar al CDN de Ducati metería un
dominio externo en el camino crítico y dejaría el sitio a merced de URLs
ajenas. El script `bikes:images` las baja una vez y Astro genera las variantes
responsive en el build, con `width` y `height` explícitos para que no haya
saltos de layout.

**Por qué dos bases de datos.** Neon en producción porque habla HTTP y eso es
lo que funciona en un entorno serverless. PGlite en desarrollo para que quien
clone el repositorio pueda levantarlo y probar el flujo completo sin crear
cuentas. Es el mismo SQL y el mismo ORM: el código de la aplicación no sabe
cuál de las dos está usando.

## Testing

Tres capas:

| Capa | Herramienta | Cuántas | Comando |
|---|---|---|---|
| Unitaria | Vitest | 118 | `npm run test:unit` |
| Integración | Vitest | 55 | `npm run test:integration` |
| End-to-end | MCP de Playwright | 16 escenarios | manual, ver abajo |

Las de integración corren contra un Postgres real: **PGlite en memoria**, con
las mismas migraciones que producción. No hace falta levantar nada.

```bash
npm test
```

Los escenarios end-to-end están en
[`tests/e2e/scenarios.md`](tests/e2e/scenarios.md) y los ejecuta el agente con
el MCP de Playwright, que ya viene configurado en `.mcp.json` contra el Chrome
del sistema. Necesitan el sitio levantado:

```bash
npm run dev
```

## Documentación relacionada

- [`DESIGN.md`](DESIGN.md) — sistema visual: colores, tipografías, componentes.
- [`AGENTS.md`](AGENTS.md) — reglas para agentes de IA que trabajen en el repo.
