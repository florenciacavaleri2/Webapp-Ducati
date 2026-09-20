import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

/**
 * Genera src/data/countries.ts a partir del ICU de Node.
 *
 * Se corre a mano cuando hace falta refrescar la lista:
 *   node scripts/gen-countries.mjs
 */

const here = dirname(fileURLToPath(import.meta.url));
const target = process.argv[2] ?? resolve(here, '..', 'src', 'data', 'countries.ts');

// Todos los pares de letras; ICU descarta los que no son códigos asignados.
const codes = [];
for (let a = 65; a <= 90; a++) {
  for (let b = 65; b <= 90; b++) {
    codes.push(String.fromCharCode(a) + String.fromCharCode(b));
  }
}

// ICU devuelve, además de los países, agrupaciones (UE, ONU), subdivisiones
// reservadas (Canarias, Ceuta y Melilla…) y dos locales de prueba
// ("Pseudoacentos", "Pseudobidi"). Nada de eso va en un select de país.
const EXCLUDED = new Set([
  'XA', 'XB', // locales de prueba de ICU
  'EU', 'EZ', 'UN', 'QO', // agrupaciones, no países
  'IC', 'EA', 'DG', 'AC', 'TA', // reservas excepcionales / subdivisiones
]);

const dn = new Intl.DisplayNames(['es'], { type: 'region' });
const list = [];
for (const code of codes) {
  if (EXCLUDED.has(code)) continue;
  let name;
  try {
    name = dn.of(code);
  } catch {
    continue;
  }
  // Si ICU no conoce el código, devuelve el código tal cual.
  if (!name || name === code) continue;
  list.push({ code, name });
}

const collator = new Intl.Collator('es', { sensitivity: 'base' });
list.sort((x, y) => collator.compare(x.name, y.name));

const body = list
  .map((c) => `  { code: '${c.code}', name: ${JSON.stringify(c.name)} },`)
  .join('\n');

const out = `// GENERADO AUTOMÁTICAMENTE — no editar a mano.
// Regenerar con: node scripts/gen-countries.mjs
//
// Lista ISO 3166-1 alpha-2 con nombres en español (Intl.DisplayNames, ICU de Node).

export interface Country {
  code: string;
  name: string;
}

/** Países mostrados primero en el select, por ser el mercado principal. */
export const PRIORITY_COUNTRIES = ['AR', 'UY', 'CL', 'BR', 'PY', 'BO'] as const;

export const countries: Country[] = [
${body}
];

export const countryCodes: string[] = countries.map((c) => c.code);

export function getCountry(code: string): Country | undefined {
  return countries.find((c) => c.code === code);
}

/** Países prioritarios primero, luego el resto en orden alfabético. */
export function countriesForSelect(): { priority: Country[]; rest: Country[] } {
  const priority = PRIORITY_COUNTRIES.map((code) =>
    countries.find((c) => c.code === code)
  ).filter((c): c is Country => Boolean(c));
  const codes = new Set<string>(PRIORITY_COUNTRIES);
  return { priority, rest: countries.filter((c) => !codes.has(c.code)) };
}
`;

writeFileSync(target, out, 'utf8');
console.log(`Escritos ${list.length} países en ${target}`);
