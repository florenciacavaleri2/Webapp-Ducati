import raw from './bikes.json';

/**
 * Catálogo de la gama Ducati Argentina.
 *
 * Fuente: ducati.com/ar/es (relevado 2026-09-19). Es la ÚNICA fuente de verdad
 * del proyecto: alimenta tanto la grilla de modelos de la landing como el
 * <select> del formulario, así no se pueden desincronizar.
 *
 * Las imágenes se descargan desde el CDN con `npm run bikes:images` y quedan
 * en src/assets/bikes/<slug>.webp.
 */

export const FAMILIES = [
  'Panigale',
  'Streetfighter',
  'Monster',
  'Multistrada',
  'Diavel',
  'Hypermotard',
  'Desert X',
  'Scrambler',
] as const;

export type Family = (typeof FAMILIES)[number];

export interface Bike {
  slug: string;
  name: string;
  family: Family;
  segment: string;
  power: string | null;
  torque: string | null;
  weight: string | null;
  /** PVP recomendado en USD. `null` cuando Ducati no lo publica. */
  priceUsd: number | null;
  /** Aclaración cuando el modelo agrupa variantes con precios distintos. */
  priceNote?: string;
  /** Ficha oficial en ducati.com */
  url: string;
  /** URL original en el CDN de Contentful, usada por el script de descarga. */
  imageSource: string;
}

export const bikes = raw as Bike[];

/** Slugs válidos, para validar el formulario contra el catálogo real. */
export const bikeSlugs = bikes.map((b) => b.slug);

export function getBike(slug: string): Bike | undefined {
  return bikes.find((b) => b.slug === slug);
}

/** Modelos agrupados por familia, en el orden de FAMILIES. Para <optgroup>. */
export function bikesByFamily(): Array<{ family: Family; bikes: Bike[] }> {
  return FAMILIES.map((family) => ({
    family,
    bikes: bikes.filter((b) => b.family === family),
  })).filter((g) => g.bikes.length > 0);
}

export function formatPrice(bike: Bike): string | null {
  if (bike.priceUsd === null) return null;
  return `USD ${bike.priceUsd.toLocaleString('es-AR')}`;
}
