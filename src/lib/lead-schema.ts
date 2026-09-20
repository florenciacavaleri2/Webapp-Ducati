import { z } from 'zod';
import { bikeSlugs } from '../data/bikes';
import { countryCodes } from '../data/countries';

/**
 * Esquema único del formulario de contacto.
 *
 * Lo usan la island de React (validación en vivo) y el endpoint
 * /api/leads (validación real). Compartirlo es lo que garantiza que el
 * cliente y el servidor no puedan discrepar sobre qué es un lead válido.
 *
 * El servidor NUNCA confía en el cliente: vuelve a validar todo, incluido
 * que el país y la moto existan de verdad en nuestros catálogos.
 */

const bikeSlugSet = new Set(bikeSlugs);
const countryCodeSet = new Set(countryCodes);

export const leadSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Ingresá tu nombre completo.')
    .max(100, 'El nombre no puede superar los 100 caracteres.')
    .refine((v) => v.split(/\s+/).filter(Boolean).length >= 2, {
      message: 'Ingresá nombre y apellido.',
    }),

  // Normalizamos antes de validar el formato: así " Juan@Mail.COM " entra bien.
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254, 'El email es demasiado largo.')
    .pipe(z.email({ error: 'Revisá el email: falta el @ o el dominio.' })),

  country: z
    .string()
    .trim()
    .toUpperCase()
    .refine((v) => countryCodeSet.has(v), { message: 'Elegí un país de la lista.' }),

  bikeSlug: z
    .string()
    .trim()
    .refine((v) => bikeSlugSet.has(v), { message: 'Elegí un modelo de la lista.' }),
});

export type LeadInput = z.infer<typeof leadSchema>;

/**
 * Campos que solo mira el servidor: anti-spam y atribución.
 *
 * El honeypot se acepta con cualquier valor a propósito. Si lo rechazáramos
 * acá, el bot recibiría un error y sabría que lo detectamos; lo que queremos
 * es leerlo y responderle un éxito falso. Quien decide es /api/leads.
 */
export const leadMetaSchema = z.object({
  /** Honeypot. Un humano no lo ve, así que debería llegar vacío. */
  company: z.string().optional().default(''),
  /** Momento en que se renderizó el formulario, para descartar bots instantáneos. */
  renderedAt: z.coerce.number().int().nonnegative().optional(),
  utmSource: z.string().trim().max(120).optional(),
});

export const FIELD_NAMES = ['fullName', 'email', 'country', 'bikeSlug'] as const;
export type FieldName = (typeof FIELD_NAMES)[number];

export type FieldErrors = Partial<Record<FieldName, string>>;

/** Aplana los errores de Zod a { campo: primer mensaje }. */
export function toFieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && FIELD_NAMES.includes(key as FieldName)) {
      out[key as FieldName] ??= issue.message;
    }
  }
  return out;
}
