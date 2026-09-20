import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  bikes,
  bikeSlugs,
  bikesByFamily,
  formatPrice,
  getBike,
  FAMILIES,
} from '../../src/data/bikes';
import {
  countries,
  countryCodes,
  countriesForSelect,
  getCountry,
  PRIORITY_COUNTRIES,
} from '../../src/data/countries';

const assetsDir = fileURLToPath(new URL('../../src/assets/bikes/', import.meta.url));

describe('catálogo de motos', () => {
  it('tiene los 22 modelos de la gama argentina', () => {
    expect(bikes).toHaveLength(22);
  });

  it('no repite slugs', () => {
    expect(new Set(bikeSlugs).size).toBe(bikes.length);
  });

  it('cada modelo pertenece a una familia declarada', () => {
    for (const bike of bikes) {
      expect(FAMILIES).toContain(bike.family);
    }
  });

  it('cada modelo tiene su imagen descargada', () => {
    // Si esto falla, falta correr: npm run bikes:images
    const faltantes = bikes
      .filter((b) => !existsSync(`${assetsDir}${b.slug}.webp`))
      .map((b) => b.slug);
    expect(faltantes).toEqual([]);
  });

  it('la imagen del hero también está', () => {
    expect(existsSync(`${assetsDir}_hero-panigale-v4.webp`)).toBe(true);
  });

  it('cada modelo apunta a una ficha oficial', () => {
    for (const bike of bikes) {
      expect(bike.url).toMatch(/^https:\/\//);
    }
  });

  it('los precios son positivos cuando existen', () => {
    for (const bike of bikes) {
      if (bike.priceUsd !== null) {
        expect(bike.priceUsd).toBeGreaterThan(0);
      }
    }
  });
});

describe('getBike', () => {
  it('encuentra por slug', () => {
    expect(getBike('monster')?.name).toBe('Monster');
  });

  it('devuelve undefined para un slug inventado', () => {
    expect(getBike('ducati-inventada')).toBeUndefined();
  });
});

describe('bikesByFamily', () => {
  const grupos = bikesByFamily();

  it('no pierde ningún modelo', () => {
    const total = grupos.reduce((suma, g) => suma + g.bikes.length, 0);
    expect(total).toBe(bikes.length);
  });

  it('no devuelve grupos vacíos', () => {
    for (const grupo of grupos) {
      expect(grupo.bikes.length).toBeGreaterThan(0);
    }
  });

  it('respeta el orden de FAMILIES', () => {
    const orden = grupos.map((g) => g.family);
    expect(orden).toEqual(FAMILIES.filter((f) => orden.includes(f)));
  });
});

describe('formatPrice', () => {
  it('formatea con separador de miles', () => {
    const monster = getBike('monster')!;
    expect(formatPrice(monster)).toBe('USD 22.860');
  });

  it('devuelve null cuando Ducati no publica el precio', () => {
    const tricolore = getBike('panigale-v4-tricolore')!;
    expect(formatPrice(tricolore)).toBeNull();
  });
});

describe('catálogo de países', () => {
  it('trae la lista completa', () => {
    expect(countries.length).toBeGreaterThan(240);
  });

  it('no repite códigos', () => {
    expect(new Set(countryCodes).size).toBe(countries.length);
  });

  it('todos los códigos son dos letras mayúsculas', () => {
    for (const c of countries) {
      expect(c.code).toMatch(/^[A-Z]{2}$/);
    }
  });

  it('incluye los países del mercado', () => {
    for (const code of PRIORITY_COUNTRIES) {
      expect(getCountry(code)).toBeDefined();
    }
  });

  it('los nombres están en español', () => {
    expect(getCountry('US')?.name).toBe('Estados Unidos');
    expect(getCountry('BR')?.name).toBe('Brasil');
  });

  it.each(['XA', 'XB', 'EU', 'EZ', 'UN', 'QO', 'IC', 'EA'])(
    'no incluye %s, que no es un país',
    (code) => {
      expect(getCountry(code)).toBeUndefined();
    }
  );

  it('está ordenado alfabéticamente ignorando acentos', () => {
    const collator = new Intl.Collator('es', { sensitivity: 'base' });
    const nombres = countries.map((c) => c.name);
    expect(nombres).toEqual([...nombres].sort(collator.compare));
  });
});

describe('countriesForSelect', () => {
  const { priority, rest } = countriesForSelect();

  it('pone Argentina primero', () => {
    expect(priority[0]?.code).toBe('AR');
  });

  it('no repite los prioritarios en el resto', () => {
    const codigos = new Set(rest.map((c) => c.code));
    for (const c of priority) {
      expect(codigos.has(c.code)).toBe(false);
    }
  });

  it('entre los dos grupos está la lista completa', () => {
    expect(priority.length + rest.length).toBe(countries.length);
  });
});
