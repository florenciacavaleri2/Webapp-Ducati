# Escenarios end-to-end

Se ejecutan con el **MCP de Playwright**, sobre el sitio levantado en
`http://localhost:4321`. Son pruebas locales: las corre el agente, no un CI.

Cada escenario define pasos y resultado esperado. Si uno falla, se reporta con
la captura y la corrida se da por roja: no se declara terminada una tarea con
un escenario en rojo (regla 9 de `AGENTS.md`).

## Preparación

```bash
npm run db:migrate    # con el servidor frenado
npm run db:seed -- --reset
npm run dev
```

La contraseña del panel es la de `ADMIN_PASSWORD` en `.env`.

---

## E1 · La landing carga y muestra la gama

1. Navegar a `http://localhost:4321/`.
2. Tomar una instantánea de accesibilidad.

**Esperado**
- El título es `Ducati Argentina — Gama 2026, precios y cotización`.
- Se ve el encabezado `Elegí tu Ducati y te contactamos hoy`.
- Hay 22 tarjetas de modelo.
- La consola no tiene errores.

## E2 · El filtro por familia funciona sin JavaScript

1. En `/`, hacer clic en el filtro `Panigale`.
2. Contar las tarjetas visibles.
3. Volver a `Todas`.

**Esperado**
- Con `Panigale` quedan 5 tarjetas, todas de esa familia.
- Con `Todas` vuelven las 22.
- No hay peticiones de red entre un clic y el otro: el filtro es CSS puro.

## E3 · Enviar una consulta desde la landing

1. Ir a `/#contacto`.
2. Completar: nombre `Lucía Fernández`, email `lucia.fernandez@ejemplo.com`,
   país `Argentina`, moto `Panigale V4 S`.
3. Esperar más de 2 segundos desde que cargó la página.
4. Clic en `Pedir cotización`.

**Esperado**
- Aparece el aviso verde `Listo, recibimos tu consulta...`.
- La página **no** recarga (la URL no cambia).
- El formulario queda vacío.

## E4 · La validación avisa antes de enviar

1. Ir a `/#contacto`.
2. Escribir `Lucía` en el nombre y salir del campo (Tab).
3. Escribir `no-es-un-email` en el email y salir del campo.
4. Clic en `Pedir cotización` sin elegir moto.

**Esperado**
- Bajo el nombre: `Ingresá nombre y apellido.`
- Bajo el email: `Revisá el email: falta el @ o el dominio.`
- Bajo la moto: `Elegí un modelo de la lista.`
- Arriba del formulario: `Revisá los campos marcados.`
- No se envió nada: el lead de E4 no aparece en el panel.

## E5 · "Consultar" en una tarjeta preselecciona el modelo

1. En `/#modelos`, clic en `Consultar` de la tarjeta **Desert X**.

**Esperado**
- La página baja al formulario.
- El select de moto ya muestra `Desert X`.

## E6 · El panel exige sesión

1. Navegar directo a `http://localhost:4321/admin`.

**Esperado**
- Redirige a `/admin/login?next=%2Fadmin`.
- No se ve ningún dato de leads.

## E7 · Login con contraseña incorrecta

1. En `/admin/login`, escribir `contrasena-incorrecta`.
2. Enviar.

**Esperado**
- Se queda en el login con el aviso `Contraseña incorrecta.`
- No se emite cookie de sesión.

## E8 · Login correcto y vuelta al destino pedido

1. Navegar a `/admin?status=nuevo` (sin sesión).
2. Completar la contraseña correcta y enviar.

**Esperado**
- Entra al panel **con el filtro `nuevo` ya aplicado**, no a `/admin` pelado.
- Se ve el encabezado `Leads` y la tabla.

## E9 · El lead de E3 llegó al panel

1. Con sesión, ir a `/admin`.
2. Buscar `lucia.fernandez`.

**Esperado**
- Aparece una fila: `Lucía Fernández`, `lucia.fernandez@ejemplo.com`,
  `Argentina`, `Panigale V4 S`, estado `Nuevo`.
- El email está en minúsculas aunque se haya escrito con mayúsculas.

## E10 · Cambiar el estado de un lead

1. En la fila de Lucía, cambiar el estado a `Contactado`.

**Esperado**
- La página se recarga sola y la fila queda en `Contactado`.
- El contador `Nuevo` baja en 1 y `Contactado` sube en 1.

## E11 · Filtros combinados

1. Ir a `/admin`, elegir estado `nuevo` y familia `Panigale`, clic en `Filtrar`.

**Esperado**
- Solo quedan leads de modelos Panigale en estado `Nuevo`.
- La URL refleja los filtros (`?status=nuevo&family=Panigale`), así que el
  enlace se puede compartir.
- Aparece el enlace `Limpiar`.

## E12 · Paginación

1. En `/admin` sin filtros, bajar al final de la tabla.

**Esperado**
- La tabla muestra 25 filas como máximo.
- Con más de 25 leads aparece el paginador `Página 1 de N`.
- `Anterior` está deshabilitado; `Siguiente` lleva a la página 2.

> No fijar un total exacto: cambia según cuántas veces se corrió el seed y
> las pruebas de humo. Lo que se verifica es el tamaño de página y el
> comportamiento del paginador.

## E13 · Exportar CSV

1. En `/admin`, filtrar por familia `Panigale`.
2. Clic en `Exportar CSV`.

**Esperado**
- Se descarga `leads-AAAA-MM-DD.csv`.
- Contiene solo los leads de Panigale (respeta el filtro).
- El encabezado es `fecha,nombre,email,pais,codigo_pais,moto,estado,origen`.

## E14 · Cerrar sesión

1. Clic en `Cerrar sesión`.
2. Volver a `/admin`.

**Esperado**
- Redirige al login.
- El botón atrás del navegador tampoco muestra los datos.

## E15 · Mobile

1. Fijar el viewport en 375x812 y recargar `/`.

**Esperado**
- La marca queda centrada y aparece el botón de menú.
- El menú abre y cierra sin JavaScript (`<details>`).
- El hero apila el contenido y el botón ocupa todo el ancho.
- No hay scroll horizontal.

## E16 · Rendimiento observable

> **Este escenario NO corre contra `npm run dev`.** En desarrollo, Vite sirve
> cada módulo por separado y Astro inyecta su barra de herramientas, así que
> se ven decenas de `.js` que no existen en producción. Hay que levantar el
> build:
>
> ```bash
> npm run build && npm run preview:build
> ```
>
> Queda en `http://localhost:4331`. (`astro preview` no sirve acá: el
> adaptador de Vercel no lo soporta.) Solo se sirve la parte estática; el
> formulario y el panel necesitan `npm run dev`.

1. Cargar `/` con la pestaña de red abierta.

**Esperado**
- Cero archivos `.js` pedidos por red: el único script va inline en el HTML
  (unos 2,2 KB).
- Las dos tipografías se piden a `/fonts/`, nunca a un dominio externo.
- Las imágenes se sirven como AVIF o WebP con `srcset`.
- No hay saltos de layout al terminar de cargar.

Los mismos números se miden sin navegador con `npm run inspect`, que falla si
el JavaScript supera los 20 KB.
