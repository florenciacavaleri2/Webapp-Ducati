/* ============================================================================
   registro.js — el listado de procesos del portal. Editable a mano.

   ¿Por qué .js y no .json? Porque el portal se abre con doble clic
   (file://) y en ese contexto el navegador bloquea leer archivos vecinos con
   fetch, que es lo que haría falta para un .json. Un <script src> sí carga.
   El contenido de abajo es JSON común: se edita igual de fácil.

   PARA SUMAR UN PROCESO: copiá un bloque, pegalo al final de la lista y
   cambiá los datos. O usá sumar-proceso.html, que te lo genera.
   Detalle de cada campo en COMO-SUMAR-UN-PROCESO.md.
   ========================================================================= */

window.PORTAL_REGISTRO = {
  actualizado: '22/09/2026',

  // Los chips de la portada salen de acá, en este orden.
  categorias: [
    { id: 'gastos', nombre: 'Gastos' },
    { id: 'stock', nombre: 'Stock' },
    { id: 'reportes', nombre: 'Reportes' },
    { id: 'otro', nombre: 'Otro' },
  ],

  // Las tres empresas del grupo, para las etiquetas de cada ficha.
  empresas: {
    FOR: 'Fortecar',
    GRA: 'Granville',
    PAM: 'Automotores Pampeanos (Pampawagen)',
  },

  procesos: [
    {
      id: 'gastos-bancarios',
      nombre: 'Gastos bancarios',
      categoria: 'gastos',
      descripcion:
        'Procesa y muestra los gastos de todas las cuentas bancarias de las tres empresas.',
      autor: 'Florencia Cavaleri',
      actualizado: '22/09/2026',
      frecuencia: 'Mensual',
      empresas: ['FOR', 'GRA', 'PAM'],
      cuentas: [],
      palabrasClave: ['bancos', 'comisiones', 'extractos', 'impuestos al débito'],
      icono: 'banco',
      estado: 'pendiente',
    },
    {
      id: 'gastos-indirectos',
      nombre: 'Gastos indirectos',
      categoria: 'gastos',
      descripcion:
        'Compara mes a mes los gastos indirectos de las tres empresas contra el plan de cuentas definido.',
      autor: 'Florencia Cavaleri',
      actualizado: '22/09/2026',
      frecuencia: 'Mensual',
      empresas: ['FOR', 'GRA', 'PAM'],
      cuentas: [],
      palabrasClave: ['plan de cuentas', 'desvíos', 'comparativo mensual'],
      icono: 'planilla',
      estado: 'pendiente',
    },
    {
      id: 'gastos-mercado-libre-mp-propio',
      nombre: 'Gastos Mercado Libre / MP Propio',
      categoria: 'gastos',
      descripcion:
        'Concilia la cuenta MP Propio de Fortecar y prepara los asientos contables del mes.',
      autor: 'Florencia Cavaleri',
      actualizado: '22/09/2026',
      frecuencia: 'Mensual',
      empresas: ['FOR'],
      cuentas: [],
      palabrasClave: [
        'mercado pago',
        'mercado libre',
        'conciliación',
        'asientos',
        'MP Propio',
      ],
      icono: 'carrito',
      estado: 'pendiente',
    },
    {
      id: 'stock-vo',
      nombre: 'Stock VO',
      categoria: 'stock',
      descripcion:
        'Concilia el stock de usados cruzando Debe y Haber por patente.',
      autor: 'Florencia Cavaleri',
      actualizado: '22/09/2026',
      frecuencia: 'Mensual',
      empresas: ['FOR', 'GRA', 'PAM'],
      cuentas: ['115201'],
      palabrasClave: ['usados', 'patente', 'vehículos de ocasión', 'conciliación'],
      icono: 'auto',
      estado: 'pendiente',
    },
    {
      id: 'rentabilidad-vs-contabilidad',
      nombre: 'Rentabilidad vs. Contabilidad',
      categoria: 'reportes',
      descripcion:
        'Concilia el reporte de rentabilidad contra los libros contables del mes.',
      autor: 'Florencia Cavaleri',
      actualizado: '22/09/2026',
      frecuencia: 'Mensual',
      empresas: [],
      cuentas: [],
      palabrasClave: ['rentabilidad', 'libros', 'diferencias', 'conciliación'],
      icono: 'reporte',
      estado: 'pendiente',
    },
    {
      id: 'descuento-cheques-propios',
      nombre: 'Descuento de cheques propios',
      categoria: 'otro',
      descripcion:
        'Contabilización del descuento de cheques propios. Proceso de otro integrante del equipo, sin relevar.',
      autor: 'Por relevar',
      actualizado: '22/09/2026',
      frecuencia: 'Por relevar',
      empresas: [],
      cuentas: [],
      palabrasClave: ['cheques', 'descuento', 'intereses', 'financiación'],
      icono: 'cheque',
      estado: 'pendiente',
    },
  ],
};
