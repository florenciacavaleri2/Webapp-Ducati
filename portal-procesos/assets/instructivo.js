/* ============================================================================
   instructivo.js — convierte un instructivo en página legible.

   Cada instructivo es un .html que lleva su texto en markdown dentro de
   <script type="text/markdown">. Este archivo lo toma, lo renderiza y le arma
   la barra de navegación (volver al portal, abrir la herramienta).

   Así el instructivo es un solo archivo: se edita como markdown y se ve
   renderizado al abrirlo, sin servidor y sin paso de compilación.
   ========================================================================= */

(function () {
  'use strict';

  var fuente = document.querySelector('script[type="text/markdown"]');
  var markdown = fuente ? fuente.textContent : '';
  var registro = window.PORTAL_REGISTRO || {};
  var procesos = registro.procesos || [];

  /** El id del proceso es el nombre de la carpeta que contiene el archivo. */
  function idDeLaCarpeta() {
    var partes = decodeURIComponent(location.pathname).split('/');
    return partes[partes.length - 2] || '';
  }

  var id = idDeLaCarpeta();
  var proceso = procesos.filter(function (candidato) {
    return candidato.id === id;
  })[0];

  var titulo = window.PortalMarkdown.titulo(markdown) || (proceso && proceso.nombre) || 'Instructivo';
  document.title = titulo + ' — Portal de procesos';

  function accionHerramienta() {
    if (!proceso) return '';
    if (proceso.estado === 'listo') {
      return '<a class="boton" href="tool.html">Abrir herramienta</a>';
    }
    return (
      '<a class="boton-linea" href="../../pendiente.html?p=' +
      encodeURIComponent(proceso.id) +
      '">Falta el archivo</a>'
    );
  }

  var barra = document.createElement('header');
  barra.className = 'barra-doc';
  barra.innerHTML =
    '<div class="hoja">' +
    '<a class="volver" href="../../index.html">Volver al portal</a>' +
    '<div class="barra-acciones">' +
    accionHerramienta() +
    '</div>' +
    '</div>';

  var documento = document.createElement('article');
  documento.className = 'documento';
  documento.innerHTML = window.PortalMarkdown.render(markdown);

  var contenido = document.createElement('main');
  contenido.appendChild(documento);

  document.body.appendChild(barra);
  document.body.appendChild(contenido);
})();
