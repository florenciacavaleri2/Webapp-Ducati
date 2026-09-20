import { describe, expect, it } from 'vitest';
import { csvCell, csvRow, csvFile } from '../../src/lib/csv';

describe('csvCell', () => {
  it('encierra el valor entre comillas', () => {
    expect(csvCell('Ana')).toBe('"Ana"');
  });

  it('duplica las comillas internas', () => {
    expect(csvCell('Ana "La Moto" Pérez')).toBe('"Ana ""La Moto"" Pérez"');
  });

  it('deja pasar comas y saltos de línea dentro de las comillas', () => {
    expect(csvCell('Pérez, Ana')).toBe('"Pérez, Ana"');
    expect(csvCell('linea1\nlinea2')).toBe('"linea1\nlinea2"');
  });

  it.each([
    [null],
    [undefined],
    [''],
  ])('convierte %s en celda vacía', (valor) => {
    expect(csvCell(valor)).toBe('""');
  });

  describe('inyección de fórmulas', () => {
    // Sin el prefijo, Excel ejecuta la celda al abrir el archivo. Hay
    // fórmulas que llaman a URLs externas con el contenido de la planilla.
    it.each([
      ['=', '=SUM(A1)', `"'=SUM(A1)"`],
      ['+', '+1+1', `"'+1+1"`],
      ['-', '-2+3', `"'-2+3"`],
      ['@', '@SUM(A1)', `"'@SUM(A1)"`],
      ['tabulación', '\tcmd', `"'\tcmd"`],
    ])('neutraliza un valor que empieza con %s', (_caso, entrada, esperado) => {
      expect(csvCell(entrada)).toBe(esperado);
    });

    it('neutraliza el caso clásico de ejecución remota', () => {
      const ataque = '=cmd|\' /C calc\'!A0';
      expect(csvCell(ataque).startsWith(`"'=`)).toBe(true);
    });

    it('no toca un texto que apenas contiene esos signos', () => {
      expect(csvCell('Ana=Pérez')).toBe('"Ana=Pérez"');
      expect(csvCell('ana+ducati@mail.com')).toBe('"ana+ducati@mail.com"');
    });
  });
});

describe('csvRow', () => {
  it('separa las celdas con comas', () => {
    expect(csvRow(['a', 'b', 'c'])).toBe('"a","b","c"');
  });

  it('escapa cada celda', () => {
    expect(csvRow(['=1', null])).toBe(`"'=1",""`);
  });
});

describe('csvFile', () => {
  const archivo = csvFile(['nombre', 'email'], [['Ana', 'ana@ejemplo.com']]);

  it('arranca con BOM', () => {
    // Sin BOM, Excel abre el archivo en la codificación del sistema y
    // rompe las tildes y las eñes.
    expect(archivo.charCodeAt(0)).toBe(0xfeff);
  });

  it('pone el encabezado sin comillas', () => {
    expect(archivo).toContain('nombre,email');
  });

  it('separa las filas con CRLF, como pide el RFC 4180', () => {
    expect(archivo).toContain('\r\n');
    expect(archivo.split('\r\n')).toHaveLength(2);
  });

  it('funciona sin filas', () => {
    const vacio = csvFile(['a', 'b'], []);
    expect(vacio).toBe('﻿a,b');
  });
});
