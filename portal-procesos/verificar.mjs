/* ============================================================================
   verificar.mjs — las pruebas del portal.

       node verificar.mjs

   Corre en Node pelado: sin instalar nada, sin dependencias, sin navegador.
   Cubre lo que no se ve mirando la pantalla:

   - el registro es coherente (ids, categorías, fechas, empresas, íconos);
   - cada ficha apunta a una carpeta y a un instructivo que existen de verdad;
   - el renderizador de markdown hace lo que dice, y escapa el HTML;
   - no se coló nada de lo que rompe el portal en file:// (fetch, módulos ES,
     CDN, rutas a C:\).

   No reemplaza abrir el portal en el navegador: eso va siempre después.
   ========================================================================= */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const RAIZ = dirname(fileURLToPath(import.meta.url));

let pruebas = 0;
const fallas = [];

function comprobar(descripcion, condicion, detalle) {
  pruebas++;
  if (!condicion) fallas.push(descripcion + (detalle ? ' → ' + detalle : ''));
}

function igual(descripcion, obtenido, esperado) {
  comprobar(
    descripcion,
    obtenido === esperado,
    'esperaba ' + JSON.stringify(esperado) + ', obtuvo ' + JSON.stringify(obtenido)
  );
}

/** Ejecuta un script clásico del portal y devuelve su ámbito global falso. */
function cargarScript(ruta) {
  const codigo = readFileSync(join(RAIZ, ruta), 'utf8');
  const ambito = {};
  const documentoFalso = { readyState: 'loading', addEventListener() {} };
  new Function('window', 'globalThis', 'document', codigo)(
    ambito,
    ambito,
    documentoFalso
  );
  return ambito;
}

function archivos(carpeta) {
  const encontrados = [];
  for (const entrada of readdirSync(carpeta)) {
    const ruta = join(carpeta, entrada);
    if (statSync(ruta).isDirectory()) encontrados.push(...archivos(ruta));
    else encontrados.push(ruta);
  }
  return encontrados;
}

/* --- 1. El registro ------------------------------------------------------- */

const { PORTAL_REGISTRO: registro } = cargarScript('registro.js');
const { PortalIconos } = cargarScript('assets/iconos.js');

comprobar('registro.js define window.PORTAL_REGISTRO', !!registro);
comprobar('el registro tiene procesos', Array.isArray(registro.procesos) && registro.procesos.length > 0);
comprobar('el registro tiene categorías', Array.isArray(registro.categorias) && registro.categorias.length > 0);

const FECHA = /^\d{2}\/\d{2}\/\d{4}$/;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const idsCategorias = registro.categorias.map((categoria) => categoria.id);
const siglas = Object.keys(registro.empresas || {});
const vistos = new Set();

comprobar('la fecha del registro tiene formato DD/MM/AAAA', FECHA.test(registro.actualizado));

for (const proceso of registro.procesos) {
  const donde = 'proceso "' + (proceso.id || '(sin id)') + '"';

  comprobar(donde + ': el id es un slug', SLUG.test(proceso.id || ''), proceso.id);
  comprobar(donde + ': el id no está repetido', !vistos.has(proceso.id));
  vistos.add(proceso.id);

  for (const campo of ['nombre', 'descripcion', 'autor', 'frecuencia']) {
    comprobar(
      donde + ': ' + campo + ' no está vacío',
      typeof proceso[campo] === 'string' && proceso[campo].trim().length > 0
    );
  }

  comprobar(
    donde + ': la categoría existe en el registro',
    idsCategorias.includes(proceso.categoria),
    proceso.categoria
  );
  comprobar(
    donde + ': la fecha tiene formato DD/MM/AAAA',
    FECHA.test(proceso.actualizado || ''),
    proceso.actualizado
  );
  comprobar(
    donde + ": el estado es 'listo' o 'pendiente'",
    proceso.estado === 'listo' || proceso.estado === 'pendiente',
    proceso.estado
  );
  comprobar(
    donde + ': el ícono existe en iconos.js',
    PortalIconos.ids.includes(proceso.icono),
    proceso.icono
  );
  comprobar(
    donde + ': la descripción entra en una línea (140 caracteres)',
    (proceso.descripcion || '').length <= 140,
    (proceso.descripcion || '').length + ' caracteres'
  );

  for (const sigla of proceso.empresas || []) {
    comprobar(donde + ': la empresa ' + sigla + ' está en el registro', siglas.includes(sigla));
  }
  for (const campo of ['empresas', 'cuentas', 'palabrasClave']) {
    comprobar(donde + ': ' + campo + ' es una lista', Array.isArray(proceso[campo]));
  }

  /* --- 2. Los archivos que la ficha promete ------------------------------ */

  const carpeta = join(RAIZ, 'procesos', proceso.id || '');
  comprobar(donde + ': la carpeta existe', existsSync(carpeta), 'procesos/' + proceso.id + '/');

  const instructivo = join(carpeta, 'instructivo.html');
  comprobar(donde + ': tiene instructivo.html', existsSync(instructivo));

  if (existsSync(instructivo)) {
    const html = readFileSync(instructivo, 'utf8');
    comprobar(
      donde + ': el instructivo lleva su markdown adentro',
      html.includes('type="text/markdown"')
    );
    for (const script of ['../../registro.js', '../../assets/markdown.js', '../../assets/instructivo.js']) {
      comprobar(donde + ': el instructivo carga ' + script, html.includes(script));
    }
    const titulo = /^\s{0,3}#\s+(.+)$/m.exec(html);
    comprobar(
      donde + ': el título del instructivo coincide con el nombre de la ficha',
      !!titulo && titulo[1].trim() === proceso.nombre,
      titulo ? titulo[1].trim() : '(sin título)'
    );
  }

  if (proceso.estado === 'listo') {
    comprobar(
      donde + ": está 'listo', así que tool.html tiene que existir",
      existsSync(join(carpeta, 'tool.html'))
    );
  }
}

// Y al revés: ninguna carpeta huérfana.
for (const entrada of readdirSync(join(RAIZ, 'procesos'))) {
  comprobar(
    'la carpeta procesos/' + entrada + ' está en el registro',
    vistos.has(entrada)
  );
}

/* --- 3. El renderizador de markdown --------------------------------------- */

const { PortalMarkdown: md } = cargarScript('assets/markdown.js');

igual('markdown: título', md.render('# Hola'), '<h1>Hola</h1>');
igual('markdown: subtítulo', md.render('## Pasos'), '<h2>Pasos</h2>');
igual('markdown: párrafo', md.render('Una línea.'), '<p>Una línea.</p>');
igual(
  'markdown: un salto de línea suelto corta la línea dentro del párrafo',
  md.render('Una\nlínea.'),
  '<p>Una<br>línea.</p>'
);
igual(
  'markdown: una línea en blanco abre un párrafo nuevo',
  md.render('Una.\n\nOtra.'),
  '<p>Una.</p>\n<p>Otra.</p>'
);
comprobar(
  'markdown: el <br> que separa líneas no queda escapado',
  md.render('**Autor:** Flor\n**Categoría:** Gastos').includes('Flor<br><strong>')
);
igual('markdown: negrita', md.render('**fuerte**'), '<p><strong>fuerte</strong></p>');
igual('markdown: cursiva', md.render('*suave*'), '<p><em>suave</em></p>');
igual('markdown: código', md.render('`115201`'), '<p><code>115201</code></p>');
igual(
  'markdown: lista con viñetas',
  md.render('- uno\n- dos'),
  '<ul><li>uno</li><li>dos</li></ul>'
);
igual(
  'markdown: lista numerada',
  md.render('1. uno\n2. dos'),
  '<ol><li>uno</li><li>dos</li></ol>'
);
igual(
  'markdown: lista anidada',
  md.render('1. uno\n   - a\n   - b'),
  '<ol><li>uno<ul><li>a</li><li>b</li></ul></li></ol>'
);
igual(
  'markdown: tabla',
  md.render('| a | b |\n|---|---|\n| 1 | 2 |'),
  '<table><thead><tr><th>a</th><th>b</th></tr></thead>' +
    '<tbody><tr><td>1</td><td>2</td></tr></tbody></table>'
);
igual('markdown: línea divisoria', md.render('---'), '<hr>');
igual(
  'markdown: cita común',
  md.render('> ojo con esto'),
  '<blockquote><p>ojo con esto</p></blockquote>'
);
comprobar(
  'markdown: "Por relevar" se pinta como aviso',
  md.render('> Por relevar: falta el dato').includes('class="por-relevar"')
);
comprobar(
  'markdown: "Por relevar" en negrita también se pinta como aviso',
  md.render('> **Por relevar:** falta el dato').includes('class="por-relevar"')
);
comprobar(
  'markdown: casilla sin marcar',
  md.render('- [ ] pendiente').includes('<input type="checkbox" disabled>')
);
comprobar(
  'markdown: casilla marcada',
  md.render('- [x] hecho').includes('disabled checked')
);
igual(
  'markdown: bloque de código',
  md.render('```\nx = 1\n```'),
  '<pre><code>x = 1</code></pre>'
);

// Lo importante: nadie inyecta HTML desde un instructivo.
comprobar(
  'markdown: escapa las etiquetas del texto',
  md.render('<img src=x onerror=alert(1)>').indexOf('<img') === -1
);
comprobar(
  'markdown: escapa dentro de una tabla',
  md.render('| a |\n|---|\n| <b>x</b> |').includes('&lt;b&gt;')
);
comprobar(
  'markdown: un enlace javascript: queda como texto',
  md.render('[clic](javascript:alert(1))').indexOf('href') === -1
);
comprobar(
  'markdown: un enlace relativo se respeta',
  md.render('[tool](tool.html)').includes('href="tool.html"')
);
comprobar(
  'markdown: un enlace externo abre en otra pestaña',
  md.render('[web](https://afip.gob.ar)').includes('rel="noopener"')
);
igual('markdown: título de un documento', md.titulo('# Stock VO\n\ntexto'), 'Stock VO');
igual('markdown: sin título devuelve vacío', md.titulo('sin titulo'), '');

/* --- 4. Lo que rompe el portal en file:// --------------------------------- */

const PROHIBIDO = [
  [/<script[^>]+type=["']module["']/i, 'módulos ES: no cargan con file://'],
  [/\bfetch\s*\(/, 'fetch(): el navegador lo bloquea con file://'],
  [/new\s+XMLHttpRequest/, 'XMLHttpRequest: bloqueado igual que fetch'],
  [/(src|href)=["']https?:\/\//i, 'recurso remoto: el portal tiene que abrir sin internet'],
  // Solo en atributos: el texto que explica "no uses C:\Users\..." es legítimo.
  [/(src|href)\s*=\s*["'](file:\/\/|[A-Za-z]:[\\/])/i, 'ruta absoluta del disco: en la máquina del resto del equipo no existe'],
];

for (const ruta of archivos(RAIZ)) {
  const nombre = relative(RAIZ, ruta);
  if (nombre === 'verificar.mjs' || !/\.(html|js|css|mjs)$/.test(nombre)) continue;
  const contenido = readFileSync(ruta, 'utf8');
  for (const [patron, motivo] of PROHIBIDO) {
    // Los comentarios que explican la prohibición no cuentan.
    const lineas = contenido.split('\n').filter((linea) => {
      const limpia = linea.trim();
      if (limpia.startsWith('*') || limpia.startsWith('//') || limpia.startsWith('<!--')) {
        return false;
      }
      return patron.test(linea);
    });
    comprobar(nombre + ': sin ' + motivo, lineas.length === 0, lineas[0] && lineas[0].trim());
  }
}

/* --- 5. Las plantillas siguen siendo usables ------------------------------ */

for (const plantilla of ['plantillas/proceso-ejemplo/tool.html', 'plantillas/proceso-ejemplo/instructivo.html']) {
  comprobar('existe ' + plantilla, existsSync(join(RAIZ, plantilla)));
}
const plantillaTool = readFileSync(join(RAIZ, 'plantillas/proceso-ejemplo/tool.html'), 'utf8');
comprobar(
  'la plantilla de herramienta es autocontenida (no depende de assets/)',
  !plantillaTool.includes('../../assets/')
);

/* --- Resultado ------------------------------------------------------------ */

if (fallas.length) {
  console.error('\n' + fallas.length + ' de ' + pruebas + ' comprobaciones fallaron:\n');
  for (const falla of fallas) console.error('  ✗ ' + falla);
  console.error('');
  process.exit(1);
}

console.log('✓ ' + pruebas + ' comprobaciones, todas en verde.');
