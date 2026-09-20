import { describe, expect, it } from 'vitest';
import {
  leadSchema,
  leadMetaSchema,
  toFieldErrors,
} from '../../src/lib/lead-schema';

const valido = {
  fullName: 'Ana Pérez',
  email: 'ana@ejemplo.com',
  country: 'AR',
  bikeSlug: 'monster',
};

describe('leadSchema', () => {
  it('acepta un lead completo', () => {
    const r = leadSchema.safeParse(valido);
    expect(r.success).toBe(true);
  });

  describe('normalización', () => {
    it('recorta espacios del nombre', () => {
      const r = leadSchema.parse({ ...valido, fullName: '  Ana Pérez  ' });
      expect(r.fullName).toBe('Ana Pérez');
    });

    it('pasa el email a minúsculas y lo recorta', () => {
      const r = leadSchema.parse({ ...valido, email: '  Ana.Perez@Ejemplo.COM ' });
      expect(r.email).toBe('ana.perez@ejemplo.com');
    });

    it('pasa el país a mayúsculas', () => {
      const r = leadSchema.parse({ ...valido, country: 'ar' });
      expect(r.country).toBe('AR');
    });
  });

  describe('nombre completo', () => {
    it('rechaza un nombre sin apellido', () => {
      const r = leadSchema.safeParse({ ...valido, fullName: 'Ana' });
      expect(r.success).toBe(false);
      expect(toFieldErrors(r.error!).fullName).toBe('Ingresá nombre y apellido.');
    });

    it('rechaza el vacío', () => {
      expect(leadSchema.safeParse({ ...valido, fullName: '   ' }).success).toBe(false);
    });

    it('no cuenta los espacios de más como palabras', () => {
      const r = leadSchema.safeParse({ ...valido, fullName: 'Ana    ' });
      expect(r.success).toBe(false);
    });

    it('acepta nombres de tres partes', () => {
      expect(leadSchema.safeParse({ ...valido, fullName: 'Ana María Pérez' }).success).toBe(true);
    });

    it('rechaza más de 100 caracteres', () => {
      const largo = 'Ana ' + 'x'.repeat(100);
      expect(leadSchema.safeParse({ ...valido, fullName: largo }).success).toBe(false);
    });
  });

  describe('email', () => {
    it.each([
      ['sin arroba', 'anaejemplo.com'],
      ['sin dominio', 'ana@'],
      ['vacío', ''],
      ['solo espacios', '   '],
      ['con espacio en el medio', 'an a@ejemplo.com'],
    ])('rechaza un email %s', (_caso, email) => {
      expect(leadSchema.safeParse({ ...valido, email }).success).toBe(false);
    });

    it('acepta subdominios y signo +', () => {
      const r = leadSchema.safeParse({ ...valido, email: 'ana+ducati@mail.empresa.com.ar' });
      expect(r.success).toBe(true);
    });
  });

  describe('país', () => {
    it('acepta un código ISO real', () => {
      expect(leadSchema.safeParse({ ...valido, country: 'UY' }).success).toBe(true);
    });

    it.each(['XX', 'ARG', 'A', ''])('rechaza el código %s', (country) => {
      expect(leadSchema.safeParse({ ...valido, country }).success).toBe(false);
    });

    it('rechaza códigos que ICU conoce pero no son países', () => {
      // XA y XB son locales de prueba; EU y UN son agrupaciones.
      for (const code of ['XA', 'XB', 'EU', 'UN']) {
        expect(leadSchema.safeParse({ ...valido, country: code }).success).toBe(false);
      }
    });
  });

  describe('moto', () => {
    it('acepta un slug del catálogo', () => {
      expect(leadSchema.safeParse({ ...valido, bikeSlug: 'panigale-v4-r' }).success).toBe(true);
    });

    it.each(['ducati-inventada', 'MONSTER', ''])('rechaza el slug "%s"', (bikeSlug) => {
      expect(leadSchema.safeParse({ ...valido, bikeSlug }).success).toBe(false);
    });

    it('recorta los espacios antes de buscar en el catálogo', () => {
      const r = leadSchema.parse({ ...valido, bikeSlug: '  monster  ' });
      expect(r.bikeSlug).toBe('monster');
    });
  });

  it('acumula un error por cada campo inválido', () => {
    const r = leadSchema.safeParse({
      fullName: 'Ana',
      email: 'roto',
      country: 'XX',
      bikeSlug: 'no-existe',
    });
    expect(r.success).toBe(false);
    const errores = toFieldErrors(r.error!);
    expect(Object.keys(errores).sort()).toEqual([
      'bikeSlug',
      'country',
      'email',
      'fullName',
    ]);
  });
});

describe('toFieldErrors', () => {
  it('se queda con el primer mensaje de cada campo', () => {
    const r = leadSchema.safeParse({ ...valido, fullName: '' });
    const errores = toFieldErrors(r.error!);
    expect(typeof errores.fullName).toBe('string');
    expect(errores.email).toBeUndefined();
  });
});

describe('leadMetaSchema', () => {
  it('acepta el honeypot con contenido', () => {
    // A propósito: si el esquema lo rechazara, el endpoint devolvería un
    // error y el bot sabría que lo detectamos. La decisión es de /api/leads.
    const r = leadMetaSchema.safeParse({ company: 'Bot S.A.' });
    expect(r.success).toBe(true);
    expect(r.data!.company).toBe('Bot S.A.');
  });

  it('deja el honeypot vacío cuando no viene', () => {
    expect(leadMetaSchema.parse({}).company).toBe('');
  });

  it('convierte renderedAt a número', () => {
    expect(leadMetaSchema.parse({ renderedAt: '1700000000000' }).renderedAt).toBe(
      1700000000000
    );
  });

  it('rechaza un renderedAt negativo', () => {
    expect(leadMetaSchema.safeParse({ renderedAt: '-5' }).success).toBe(false);
  });

  it('rechaza un utmSource largo', () => {
    expect(leadMetaSchema.safeParse({ utmSource: 'x'.repeat(200) }).success).toBe(false);
  });
});
