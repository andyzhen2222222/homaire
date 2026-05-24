import {
  GIGAB2B_HERO_IMAGES,
  GIGAB2B_HERO_SUBTITLES,
  getGigab2bCategoriesFlat,
} from './gigab2bCategoryData';

const FALLBACK_HERO_IMAGE =
  'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&q=80&w=2000';

function rootSlugForCategory(catId: string, byId: Map<string, { id: string; slug: string; parentId?: string | null }>): string {
  let cur = byId.get(catId);
  let guard = 0;
  while (cur?.parentId && guard++ < 32) {
    cur = byId.get(cur.parentId);
  }
  return cur?.slug || '';
}

function buildCategoryHeroes(): Record<string, { title: string; subtitle: string; image: string }> {
  const flat = getGigab2bCategoriesFlat();
  const byId = new Map(flat.map((c) => [c.id, c]));
  const heroes: Record<string, { title: string; subtitle: string; image: string }> = {};

  for (const c of flat) {
    const root = rootSlugForCategory(c.id, byId);
    heroes[c.slug] = {
      title: c.name,
      subtitle:
        GIGAB2B_HERO_SUBTITLES[c.slug] ||
        GIGAB2B_HERO_SUBTITLES[root] ||
        `Explore ${c.name} at Homaire.`,
      image: GIGAB2B_HERO_IMAGES[c.slug] || GIGAB2B_HERO_IMAGES[root] || FALLBACK_HERO_IMAGE,
    };
  }

  heroes.sale = {
    title: 'Sale',
    subtitle: 'Limited-time access to brand favourites.',
    image: FALLBACK_HERO_IMAGE,
  };
  heroes.accessories = {
    title: 'Accessories',
    subtitle: 'Small pieces with outsized personality.',
    image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=2000',
  };

  return heroes;
}

/** Category page hero defaults (overridable via StoreConfig.global.categoryHeroes) */
export const DEFAULT_CATEGORY_HEROES = buildCategoryHeroes();
