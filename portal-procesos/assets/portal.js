/* ============================================================================
   portal.js — la portada: fichas, buscador, filtros y atajos de teclado.

   Script clásico a propósito (type="module" falla en file://). Lee
   window.PORTAL_REGISTRO, que carga registro.js antes que este archivo.

   El buscador es primero teclado: este equipo no suelta el teclado.
     /        enfoca el buscador
     Esc      limpia y sale
     Enter    abre la primera ficha del resultado
     ↓ ↑      recorre las fichas
   ========================================================================= */

(function () {
  'use strict';

  var registro = window.PORTAL_REGISTRO;
  var lista = document.getElementById('fichas');
  var caja = document.getElementById('buscar');
  var filtros = document.getElementById('filtros');
  var estadoTexto = document.getElementById('estado-portal');
  var resultado = document.getElementById('resultado');

  if (!registro || !Array.isArray(registro.procesos)) {
    lista.innerHTML =
      '<li class="vacio"><h2>No se pudo leer el registro de procesos</h2>' +
      '<p>Falta <code>registro.js</code> o tiene un error de sintaxis. ' +
      'Abrí la consola del navegador (F12) para ver el detalle.</p></li>';
    return;
  }

  var procesos = registro.procesos;
  var empresas = registro.empresas || {};
  var categoriaActiva = 'todos';

  function nombreCategoria(id) {
    var encontrada = (registro.categorias || []).filter(function (categoria) {
      return categoria.id === id;
    })[0];
    return encontrada ? encontrada.nombre : 'Otro';
  }

  /** Sin acentos y en minúsculas: "débito" encuentra "debito". */
  function normalizar(texto) {
    return String(texto == null ? '' : texto)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '');
  }

  /** Todo lo buscable de un proceso, en una sola cadena. */
  function pajar(proceso) {
    return normalizar(
      [
        proceso.nombre,
        proceso.descripcion,
        proceso.autor,
        proceso.frecuencia,
        nombreCategoria(proceso.categoria),
        (proceso.empresas || [])
          .map(function (sigla) {
            return sigla + ' ' + (empresas[sigla] || '');
          })
          .join(' '),
        (proceso.cuentas || []).join(' '),
        (proceso.palabrasClave || []).join(' '),
      ].join(' ')
    );
  }

  procesos.forEach(function (proceso) {
    proceso._pajar = pajar(proceso);
  });

  function escapar(texto) {
    return String(texto == null ? '' : texto)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function icono(proceso) {
    if (window.PortalIconos) return window.PortalIconos.svg(proceso.icono, 'ficha-icono');
    return '';
  }

  function etiquetas(proceso) {
    var partes = (proceso.empresas || []).map(function (sigla) {
      var nombre = empresas[sigla] || sigla;
      return (
        '<li class="empresa" title="' + escapar(nombre) + '">' + escapar(sigla) + '</li>'
      );
    });
    partes = partes.concat(
      (proceso.cuentas || []).map(function (cuenta) {
        return '<li class="cuenta">' + escapar(cuenta) + '</li>';
      })
    );
    if (!partes.length) return '';
    return '<ul class="etiquetas">' + partes.join('') + '</ul>';
  }

  function enlaceHerramienta(proceso) {
    if (proceso.estado === 'listo') {
      return 'procesos/' + encodeURIComponent(proceso.id) + '/tool.html';
    }
    return 'pendiente.html?p=' + encodeURIComponent(proceso.id);
  }

  function ficha(proceso) {
    var sello =
      proceso.estado === 'listo'
        ? ''
        : '<span class="sello">Falta el archivo</span>';

    return (
      '<li class="ficha" data-categoria="' +
      escapar(proceso.categoria) +
      '" data-id="' +
      escapar(proceso.id) +
      '">' +
      '<div class="ficha-cuerpo">' +
      '<h2 class="ficha-titulo">' +
      icono(proceso) +
      '<span>' +
      escapar(proceso.nombre) +
      '</span></h2>' +
      '<p class="ficha-categoria">' +
      '<span>' + escapar(nombreCategoria(proceso.categoria)) + '</span>' +
      sello +
      '</p>' +
      '<p class="ficha-descripcion">' +
      escapar(proceso.descripcion) +
      '</p>' +
      etiquetas(proceso) +
      '</div>' +
      '<dl class="meta">' +
      '<div><dt>Autor</dt><dd>' +
      escapar(proceso.autor) +
      '</dd></div>' +
      '<div><dt>Frecuencia</dt><dd>' +
      escapar(proceso.frecuencia) +
      '</dd></div>' +
      '<div><dt>Actualizado</dt><dd class="dato">' +
      escapar(proceso.actualizado) +
      '</dd></div>' +
      '</dl>' +
      '<div class="ficha-acciones">' +
      '<a class="boton foco-ficha" href="' +
      escapar(enlaceHerramienta(proceso)) +
      '">Abrir</a>' +
      '<a class="boton-linea" href="procesos/' +
      encodeURIComponent(proceso.id) +
      '/instructivo.html">Instructivo</a>' +
      '</div>' +
      '</li>'
    );
  }

  function coinciden() {
    var consulta = normalizar(caja.value).trim();
    var palabras = consulta ? consulta.split(/\s+/) : [];
    return procesos.filter(function (proceso) {
      if (categoriaActiva !== 'todos' && proceso.categoria !== categoriaActiva) {
        return false;
      }
      return palabras.every(function (palabra) {
        return proceso._pajar.indexOf(palabra) !== -1;
      });
    });
  }

  function pintar() {
    var visibles = coinciden();

    if (!visibles.length) {
      lista.innerHTML =
        '<li class="vacio"><h2>Ningún proceso coincide con la búsqueda</h2>' +
        '<p>Probá con el nombre de la cuenta, la empresa o la persona que lo armó. ' +
        'Si el proceso todavía no está en el portal, sumalo vos.</p>' +
        '<p><a class="boton" href="sumar-proceso.html">Sumar un proceso</a></p></li>';
    } else {
      lista.innerHTML = visibles
        .map(function (proceso) {
          return ficha(proceso);
        })
        .join('');
    }

    resultado.textContent =
      visibles.length === procesos.length
        ? procesos.length + ' procesos'
        : visibles.length + ' de ' + procesos.length + ' procesos';
  }

  function pintarFiltros() {
    var botones = [{ id: 'todos', nombre: 'Todos', cantidad: procesos.length }];
    (registro.categorias || []).forEach(function (categoria) {
      var cantidad = procesos.filter(function (proceso) {
        return proceso.categoria === categoria.id;
      }).length;
      if (cantidad) {
        botones.push({ id: categoria.id, nombre: categoria.nombre, cantidad: cantidad });
      }
    });

    filtros.innerHTML = botones
      .map(function (boton) {
        return (
          '<button type="button" class="chip" data-categoria="' +
          escapar(boton.id) +
          '" style="--color-cat: var(--cat-' +
          escapar(boton.id) +
          ', var(--tinta))" aria-pressed="' +
          (boton.id === categoriaActiva) +
          '">' +
          escapar(boton.nombre) +
          '<span class="chip-cuenta">' +
          boton.cantidad +
          '</span></button>'
        );
      })
      .join('');
  }

  function pintarEstado() {
    var pendientes = procesos.filter(function (proceso) {
      return proceso.estado !== 'listo';
    }).length;
    var total = procesos.length;
    var frase =
      total + (total === 1 ? ' proceso relevado' : ' procesos relevados') + '. ';

    if (pendientes === 0) {
      frase += 'Todos tienen su herramienta y su instructivo cargados.';
    } else if (pendientes === total) {
      frase +=
        'Ninguno tiene todavía su archivo HTML en el portal: cada ficha explica dónde ponerlo.';
    } else {
      frase +=
        pendientes +
        (pendientes === 1
          ? ' espera su archivo HTML.'
          : ' esperan su archivo HTML.');
    }

    estadoTexto.textContent = frase;
  }

  /* --- Interacción -------------------------------------------------------- */

  filtros.addEventListener('click', function (evento) {
    var chip = evento.target.closest('.chip');
    if (!chip) return;
    categoriaActiva = chip.dataset.categoria;
    Array.prototype.forEach.call(filtros.querySelectorAll('.chip'), function (otro) {
      otro.setAttribute('aria-pressed', String(otro === chip));
    });
    pintar();
  });

  var pendiente;
  caja.addEventListener('input', function () {
    // Un respiro antes de repintar: escribir rápido no redibuja seis veces.
    clearTimeout(pendiente);
    pendiente = setTimeout(pintar, 80);
  });

  function primerEnlace() {
    return lista.querySelector('.foco-ficha');
  }

  function focos() {
    return Array.prototype.slice.call(lista.querySelectorAll('.foco-ficha'));
  }

  function mover(desde, paso) {
    var todos = focos();
    var indice = todos.indexOf(desde);
    var siguiente = todos[indice + paso];
    if (siguiente) siguiente.focus();
    else if (paso < 0) caja.focus();
  }

  caja.addEventListener('keydown', function (evento) {
    if (evento.key === 'Enter') {
      evento.preventDefault();
      var enlace = primerEnlace();
      if (enlace) enlace.click();
      return;
    }
    if (evento.key === 'ArrowDown') {
      evento.preventDefault();
      var primero = primerEnlace();
      if (primero) primero.focus();
      return;
    }
    if (evento.key === 'Escape') {
      if (caja.value) {
        caja.value = '';
        pintar();
      } else {
        caja.blur();
      }
    }
  });

  lista.addEventListener('keydown', function (evento) {
    if (evento.key !== 'ArrowDown' && evento.key !== 'ArrowUp') return;
    var enlace = evento.target.closest('.foco-ficha');
    if (!enlace) return;
    evento.preventDefault();
    mover(enlace, evento.key === 'ArrowDown' ? 1 : -1);
  });

  document.addEventListener('keydown', function (evento) {
    if (evento.key !== '/' || evento.ctrlKey || evento.metaKey || evento.altKey) return;
    var foco = document.activeElement;
    var etiqueta = foco ? foco.tagName : '';
    if (etiqueta === 'INPUT' || etiqueta === 'TEXTAREA' || etiqueta === 'SELECT') return;
    evento.preventDefault();
    caja.focus();
    caja.select();
  });

  pintarEstado();
  pintarFiltros();
  pintar();
})();
