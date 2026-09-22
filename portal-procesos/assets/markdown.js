/* ============================================================================
   markdown.js — renderizador mínimo de markdown para los instructivos.

   ¿Por qué propio y no una librería? El portal se abre desde una carpeta
   sincronizada, sin internet y sin build: no hay CDN del que bajar nada ni
   npm que instalar. Los instructivos usan una plantilla acotada (títulos,
   listas, tablas, citas, código), así que alcanza con esto.

   Regla de oro: **todo el texto se escapa antes de armar HTML.** Un
   instructivo lo escribe cualquiera del equipo; nadie inyecta etiquetas.

   Se carga como script clásico (nada de type="module": falla en file://) y
   expone globalThis.PortalMarkdown.
   ========================================================================= */

(function (global) {
  'use strict';

  function escapar(texto) {
    return String(texto)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * Solo http, https, mailto y rutas relativas. Sin esto, un `javascript:` en
   * un instructivo sería un agujero.
   */
  function urlSegura(url) {
    if (/^[a-z0-9+.-]*:/i.test(url)) return /^(https?|mailto):/i.test(url);
    return true;
  }

  function enLinea(texto) {
    // Los tramos entre backticks salen del juego: dentro no se interpreta nada.
    return escapar(texto)
      .split(/(`[^`]+`)/)
      .map(function (tramo) {
        if (tramo.length > 1 && tramo.charAt(0) === '`') {
          return '<code>' + tramo.slice(1, -1) + '</code>';
        }
        return tramo
          .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
          .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
          .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (todo, rotulo, url) {
            if (!urlSegura(url)) return rotulo;
            var externo = /^https?:/i.test(url)
              ? ' target="_blank" rel="noopener"'
              : '';
            return '<a href="' + url + '"' + externo + '>' + rotulo + '</a>';
          });
      })
      .join('');
  }

  function celdas(linea) {
    return linea
      .replace(/^\s*\|/, '')
      .replace(/\|\s*$/, '')
      .split('|')
      .map(function (celda) {
        return celda.trim();
      });
  }

  function esSeparadorDeTabla(linea) {
    return /^\s*\|?[\s:-]*-[\s|:-]*$/.test(linea) && linea.indexOf('-') !== -1;
  }

  function itemDeLista(linea) {
    var vinieta = /^(\s*)[-*+]\s+(.*)$/.exec(linea);
    if (vinieta) return { sangria: vinieta[1].length, texto: vinieta[2], ordenada: false };
    var numerada = /^(\s*)\d+[.)]\s+(.*)$/.exec(linea);
    if (numerada) return { sangria: numerada[1].length, texto: numerada[2], ordenada: true };
    return null;
  }

  function pintarItem(texto) {
    var tarea = /^\[([ xX])\]\s+(.*)$/.exec(texto);
    if (!tarea) return { html: enLinea(texto), tarea: false };
    var marcada = tarea[1].toLowerCase() === 'x' ? ' checked' : '';
    return {
      html:
        '<input type="checkbox" disabled' + marcada + '> ' + enLinea(tarea[2]),
      tarea: true,
    };
  }

  /**
   * Una lista, con un nivel de sangría. Devuelve el HTML y en qué línea sigue
   * el documento.
   */
  function pintarLista(lineas, desde) {
    var primero = itemDeLista(lineas[desde]);
    var etiqueta = primero.ordenada ? 'ol' : 'ul';
    var base = primero.sangria;
    var items = [];
    var hayTareas = false;
    var i = desde;

    while (i < lineas.length) {
      var item = itemDeLista(lineas[i]);
      if (!item) {
        // Una línea suelta continúa el item anterior (párrafo envuelto).
        if (lineas[i].trim() && items.length && /^\s{2,}\S/.test(lineas[i])) {
          items[items.length - 1].html += ' ' + enLinea(lineas[i].trim());
          i++;
          continue;
        }
        break;
      }
      if (item.sangria > base) {
        var anidada = pintarLista(lineas, i);
        if (items.length) items[items.length - 1].html += anidada.html;
        i = anidada.hasta;
        continue;
      }
      if (item.sangria < base) break;
      var pintado = pintarItem(item.texto);
      if (pintado.tarea) hayTareas = true;
      items.push({ html: pintado.html });
      i++;
    }

    var clase = hayTareas ? ' class="lista-tareas"' : '';
    var html =
      '<' +
      etiqueta +
      clase +
      '>' +
      items
        .map(function (item) {
          return '<li>' + item.html + '</li>';
        })
        .join('') +
      '</' +
      etiqueta +
      '>';

    return { html: html, hasta: i };
  }

  function render(markdown) {
    var lineas = String(markdown == null ? '' : markdown)
      .replace(/\r\n?/g, '\n')
      .split('\n');
    var salida = [];
    var i = 0;

    while (i < lineas.length) {
      var linea = lineas[i];

      if (!linea.trim()) {
        i++;
        continue;
      }

      // Bloque de código cercado.
      var cerca = /^\s*```(.*)$/.exec(linea);
      if (cerca) {
        var codigo = [];
        i++;
        while (i < lineas.length && !/^\s*```/.test(lineas[i])) {
          codigo.push(lineas[i]);
          i++;
        }
        i++; // la cerca de cierre
        salida.push('<pre><code>' + escapar(codigo.join('\n')) + '</code></pre>');
        continue;
      }

      var titulo = /^\s{0,3}(#{1,4})\s+(.*)$/.exec(linea);
      if (titulo) {
        var nivel = titulo[1].length;
        salida.push('<h' + nivel + '>' + enLinea(titulo[2]) + '</h' + nivel + '>');
        i++;
        continue;
      }

      if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(linea)) {
        salida.push('<hr>');
        i++;
        continue;
      }

      // Tabla: una fila con pipes seguida del separador.
      if (
        linea.indexOf('|') !== -1 &&
        i + 1 < lineas.length &&
        esSeparadorDeTabla(lineas[i + 1])
      ) {
        var encabezado = celdas(linea);
        i += 2;
        var filas = [];
        while (i < lineas.length && lineas[i].indexOf('|') !== -1 && lineas[i].trim()) {
          filas.push(celdas(lineas[i]));
          i++;
        }
        salida.push(
          '<table><thead><tr>' +
            encabezado
              .map(function (celda) {
                return '<th>' + enLinea(celda) + '</th>';
              })
              .join('') +
            '</tr></thead><tbody>' +
            filas
              .map(function (fila) {
                return (
                  '<tr>' +
                  fila
                    .map(function (celda) {
                      return '<td>' + enLinea(celda) + '</td>';
                    })
                    .join('') +
                  '</tr>'
                );
              })
              .join('') +
            '</tbody></table>'
        );
        continue;
      }

      // Cita. Si arranca con "Por relevar" se pinta como aviso ámbar: es el
      // hueco del relevamiento, y tiene que verse.
      if (/^\s*>/.test(linea)) {
        var cita = [];
        while (i < lineas.length && /^\s*>/.test(lineas[i])) {
          cita.push(lineas[i].replace(/^\s*>\s?/, ''));
          i++;
        }
        var texto = cita.join('\n');
        var clase = /^\s*(\*\*)?por relevar/i.test(texto) ? ' class="por-relevar"' : '';
        salida.push('<blockquote' + clase + '>' + render(texto) + '</blockquote>');
        continue;
      }

      if (itemDeLista(linea)) {
        var lista = pintarLista(lineas, i);
        salida.push(lista.html);
        i = lista.hasta;
        continue;
      }

      // Párrafo: líneas seguidas hasta un blanco o el arranque de otro bloque.
      var parrafo = [];
      while (
        i < lineas.length &&
        lineas[i].trim() &&
        !/^\s*(#{1,4}\s|>|```|-{3,}\s*$)/.test(lineas[i]) &&
        !itemDeLista(lineas[i])
      ) {
        parrafo.push(lineas[i].trim());
        i++;
      }
      // Un salto de línea suelto corta la línea (no se traga el salto, como
      // haría el markdown clásico). Es lo que espera quien escribe el
      // instructivo: el bloque de "Autor / Fecha / Categoría" sale en líneas.
      salida.push(
        '<p>' +
          parrafo
            .map(function (linea) {
              return enLinea(linea);
            })
            .join('<br>') +
          '</p>'
      );
    }

    return salida.join('\n');
  }

  /** Primer título de nivel 1, para usarlo como <title> de la página. */
  function titulo(markdown) {
    var encontrado = /^\s{0,3}#\s+(.+)$/m.exec(String(markdown || ''));
    return encontrado ? encontrado[1].trim() : '';
  }

  global.PortalMarkdown = {
    render: render,
    titulo: titulo,
    escapar: escapar,
    urlSegura: urlSegura,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
