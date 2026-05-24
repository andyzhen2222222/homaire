import type { Category } from '../types';

export function getCategoryEnglishName(_slug?: string | null, categories?: Category[]): string {
  if (!_slug) return '';
  const slug = _slug.trim().toLowerCase();
  const hit = categories?.find((c) => c.slug.trim().toLowerCase() === slug);
  return hit?.name?.trim() || '';
}

export function displayCategoryName(cat: Pick<Category, 'slug' | 'name'> | string | null | undefined): string {
  if (!cat) return '';
  if (typeof cat === 'string') return cat.trim();
  return (cat.name || '').trim() || cat.slug;
}

export function displaySubCategoryLabel(raw?: string | null): string {
  const s = (raw || '').trim();
  if (!s) return 'Classic';
  return s;
}

/** Sync category display names from slug map built from DB rows */
export function migrateCategoriesToEnglish(categories: Category[]): {
  categories: Category[];
  dirty: boolean;
} {
  const bySlug = new Map(categories.map((c) => [c.slug.trim().toLowerCase(), c.name]));
  let dirty = false;
  const next = categories.map((c) => {
    const canonical = bySlug.get(c.slug.trim().toLowerCase());
    if (canonical && c.name !== canonical) {
      dirty = true;
      return { ...c, name: canonical };
    }
    return c;
  });
  return { categories: next, dirty };
}

/** Featured level-1 slugs for homepage category grid (overridable in home decor) */
export const FEATURED_HOME_LEVEL1_SLUGS = [
  'furniture',
  'garden-outdoor',
  'lighting',
  'kitchen',
  'bath-faucets',
  'pet-supplies',
  'fitness-sports',
  'household-supplies-decor',
] as const;

export function getFeaturedHomeCategories(categories: Category[]): Category[] {
  const roots = categories.filter((c) => !c.parentId);
  const bySlug = new Map(roots.map((c) => [c.slug, c]));
  return FEATURED_HOME_LEVEL1_SLUGS.map((slug) => bySlug.get(slug)).filter(Boolean) as Category[];
}
