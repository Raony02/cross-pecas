import { getDb } from '@/lib/db';

export type Brand = { id: number; name: string; slug: string };
export type Model = { id: number; name: string; slug: string; year_start: number; year_end: number | null };
export type Part = { id: number; name: string; category: string; ref_number: string | null; avg_price: number | null };
export type Compatibility = {
  id: number;
  part_name: string;
  part_category: string;
  part_ref: string | null;
  original_price: number | null;
  compatible_model: string;
  compatible_price: number | null;
  savings_percent: number | null;
  source: string | null;
  slug: string;
};
export type Adaptation = {
  id: number;
  part_name: string;
  title: string;
  description: string;
  donor_model: string;
  donor_brand: string;
  difficulty: string;
  votes: number;
};

export function getBrands(): Brand[] {
  return getDb().prepare('SELECT * FROM brands ORDER BY name').all() as Brand[];
}

export function getModelsByBrand(brandSlug: string): Model[] {
  return getDb().prepare(`
    SELECT m.* FROM models m
    JOIN brands b ON b.id = m.brand_id
    WHERE b.slug = ?
    ORDER BY m.name
  `).all(brandSlug) as Model[];
}

export function getPartsByModel(modelSlug: string): Part[] {
  return getDb().prepare(`
    SELECT p.* FROM parts p
    JOIN models m ON m.id = p.model_id
    WHERE m.slug = ?
    ORDER BY p.category, p.name
  `).all(modelSlug) as Part[];
}

export function getCompatibilities(partId: number): Compatibility[] {
  return getDb().prepare(`
    SELECT
      c.id,
      p.name as part_name,
      p.category as part_category,
      p.ref_number as part_ref,
      p.avg_price as original_price,
      cm.name as compatible_model,
      c.avg_price as compatible_price,
      c.savings_percent,
      c.source,
      cm.slug
    FROM compatibilities c
    JOIN parts p ON p.id = c.part_id
    JOIN models cm ON cm.id = c.compatible_model_id
    WHERE c.part_id = ?
    ORDER BY c.savings_percent DESC
  `).all(partId) as Compatibility[];
}

export function getAdaptations(partId: number): Adaptation[] {
  return getDb().prepare(`
    SELECT
      a.id,
      p.name as part_name,
      a.title,
      a.description,
      a.donor_model,
      a.donor_brand,
      a.difficulty,
      a.votes
    FROM adaptations a
    JOIN parts p ON p.id = a.part_id
    WHERE a.part_id = ?
    ORDER BY a.votes DESC
  `).all(partId) as Adaptation[];
}
