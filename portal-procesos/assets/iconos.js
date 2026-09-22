/* ============================================================================
   iconos.js — el juego de íconos del portal, como sprite SVG inyectado.

   Va por JavaScript y no como archivo .svg aparte porque `<use href="x.svg#id">`
   necesita leer el archivo, y en file:// el navegador lo bloquea. Un script
   clásico sí carga, así que el sprite se inyecta en el documento y todas las
   páginas comparten una sola fuente.

   Trazo, no relleno: heredan el color de la categoría con currentColor.
   ========================================================================= */

(function (global) {
  'use strict';

  var TRAZOS = {
    banco:
      '<path d="M3 9.5 12 4l9 5.5"/><path d="M5.5 10v8.5M10 10v8.5M14 10v8.5M18.5 10v8.5"/><path d="M3 19h18"/>',
    planilla:
      '<path d="M3.5 4.5h17v15h-17z"/><path d="M3.5 9.5h17M9 9.5V19.5M14.5 9.5V19.5"/>',
    carrito:
      '<path d="M3 5h2.6l2.3 9h9.3l2.3-7H7.2"/><circle cx="9.5" cy="18.5" r="1.6"/><circle cx="17" cy="18.5" r="1.6"/>',
    auto:
      '<path d="M3.5 16v-1.2l1.7-4.4A2 2 0 0 1 7.1 9h9.8a2 2 0 0 1 1.9 1.4l1.7 4.4V16"/><path d="M3.5 16h17"/><circle cx="7.5" cy="17.6" r="1.6"/><circle cx="16.5" cy="17.6" r="1.6"/>',
    reporte:
      '<path d="M6 3.5h8.5L19 8v12.5H6z"/><path d="M14.5 3.5V8H19"/><path d="M9 17.5v-3M12 17.5v-6M15 17.5v-4"/>',
    cheque:
      '<path d="M3 7h18v10H3z"/><path d="M3 10.5h18"/><path d="M6.5 14c1.2-1.6 2.4-1.6 3.6 0s2.4 1.6 3.6 0"/><path d="M17.5 14h1.5"/>',
    conciliacion:
      '<path d="M4 8.5h13l-3.2-3.2"/><path d="M20 15.5H7l3.2 3.2"/>',
    proceso:
      '<path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20.2 4.5V8h-3.5"/>',
  };

  var ids = Object.keys(TRAZOS);

  function inyectar() {
    if (document.getElementById('portal-iconos')) return;
    var sprite = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    sprite.setAttribute('id', 'portal-iconos');
    sprite.setAttribute('aria-hidden', 'true');
    sprite.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden');
    sprite.innerHTML = ids
      .map(function (id) {
        return (
          '<symbol id="ic-' +
          id +
          '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
          'stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
          TRAZOS[id] +
          '</symbol>'
        );
      })
      .join('');
    document.body.insertBefore(sprite, document.body.firstChild);
  }

  /** Marca lista para incrustar en el HTML de una ficha. */
  function svg(id, clase) {
    var elegido = TRAZOS[id] ? id : 'proceso';
    return (
      '<svg class="' +
      (clase || '') +
      '" aria-hidden="true" focusable="false"><use href="#ic-' +
      elegido +
      '"/></svg>'
    );
  }

  global.PortalIconos = { ids: ids, inyectar: inyectar, svg: svg };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inyectar);
  } else {
    inyectar();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
