/**
 * Serialización de CSV para la exportación de leads.
 *
 * Vive aparte del endpoint para poder probarlo sin levantar el servidor:
 * el escape es la parte con más filo del archivo.
 */

/** Excel y Sheets interpretan como fórmula todo lo que empiece con esto. */
const FORMULA_START = /^[=+\-@\t\r]/;

/**
 * Escapa un valor para una celda de CSV.
 *
 * Además de las comillas, antepone una comilla simple cuando el texto arranca
 * con `=`, `+`, `-` o `@`. Sin eso, un lead que se llame `=SUM(A1)` se
 * ejecuta como fórmula al abrir el archivo en Excel, y hay fórmulas que
 * llaman a servicios externos con el contenido de la planilla.
 */
export function csvCell(value: string | null | undefined): string {
  const text = value ?? '';
  const safe = FORMULA_START.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

/** Arma una fila a partir de sus celdas ya escapadas. */
export function csvRow(cells: Array<string | null | undefined>): string {
  return cells.map(csvCell).join(',');
}

/**
 * Arma el archivo completo.
 *
 * Empieza con BOM porque, sin él, Excel abre el CSV en la codificación del
 * sistema y rompe las tildes y las eñes. Las filas se separan con CRLF, que
 * es lo que pide el RFC 4180.
 */
export function csvFile(header: string[], rows: Array<Array<string | null | undefined>>): string {
  return '﻿' + [header.join(','), ...rows.map(csvRow)].join('\r\n');
}
