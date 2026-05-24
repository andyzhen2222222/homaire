import type { Category, HomeCategoryTile, HomeHeroSpotlightItem, HomeReviewItem, StoreConfig } from '../types';
import { GIGAB2B_LEVEL1_IMAGES, getGigab2bCategoriesFlat } from '../data/gigab2bCategoryData';
import { getFeaturedHomeCategories } from './categoryLabels';

function normalizeFeaturedProductIds(v: unknown): string[] | undefined {
  if (v == null) return undefined;
  if (Array.isArray(v)) {
    const arr = v.map((x) => String(x).trim()).filter(Boolean).slice(0, 16);
    return arr.length ? arr : undefined;
  }
  if (typeof v === 'string') {
    const arr = v.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean).slice(0, 16);
    return arr.length ? arr : undefined;
  }
  return undefined;
}

function categoryCoverBySlug(categories: Category[] | undefined | null, slug: string): string {
  if (!categories?.length) return '';
  const key = slug.trim().toLowerCase();
  const hit = categories.find((c) => c.slug.trim().toLowerCase() === key);
  return (hit?.image || '').trim();
}

const HOME_CATEGORY_TILE_ASSET_BASE = '/home-categories';

/** 非默认 slug（如 sale）也可有宫格专用图 */
const EXTRA_HOME_CATEGORY_TILE_IMAGES: Record<string, string> = {
  sale: `${HOME_CATEGORY_TILE_ASSET_BASE}/homaire-cat-sale.png`,
};

type LabelSlugRule = { slug: string; re: RegExp };

/**
 * 按分类 slug / 展示名猜测「标准品类」，用于自动配图（可与后台 AI 绘图导出 URL 互换使用）。
 * 顺序：先匹配更具体的词，避免 deutsch 「Sitz」等过宽误伤。
 */
const HOME_CATEGORY_LABEL_TO_SLUG_RULES: LabelSlugRule[] = [
  { slug: 'sale', re: /\b(sale|rabatt|angebot|aktion|outlet|markdown)\b/i },
  { slug: 'furniture', re: /furniture|sofa|couch|bed|table|chair|office|living room/i },
  { slug: 'garden-outdoor', re: /garden|outdoor|patio|garten|balkon|terrace|terrasse/i },
  { slug: 'lighting', re: /light|lamp|leuchte|pendelleuchte|beleuchtung|chandelier/i },
  { slug: 'kitchen', re: /kitchen|refrigerator|appliance|cooktop|faucet/i },
  { slug: 'bath-faucets', re: /bath|shower|toilet|vanity|faucet|sauna/i },
  { slug: 'pet-supplies', re: /pet|dog|cat|grooming/i },
  { slug: 'fitness-sports', re: /fitness|gym|treadmill|bike|sport/i },
  { slug: 'household-supplies-decor', re: /decor|deko|vase|mirror|rug|teppich|household/i },
];

function buildDefaultHomeCategoryTiles(): HomeCategoryTile[] {
  return getFeaturedHomeCategories(getGigab2bCategoriesFlat()).map((c) => ({
    name: c.name,
    slug: c.slug,
    image: c.image || GIGAB2B_LEVEL1_IMAGES[c.slug] || `${HOME_CATEGORY_TILE_ASSET_BASE}/homaire-cat-sofas.png`,
  }));
}

export const DEFAULT_HOME_CATEGORY_TILES: HomeCategoryTile[] = buildDefaultHomeCategoryTiles();

const IMAGE_BY_CANONICAL_SLUG: Record<string, string> = {
  ...Object.fromEntries(DEFAULT_HOME_CATEGORY_TILES.map((t) => [t.slug.toLowerCase(), t.image])),
  ...GIGAB2B_LEVEL1_IMAGES,
};

function guessCanonicalSlugFromHomeCategoryLabel(slug: string, name: string): string {
  const s = slug.trim().toLowerCase();
  const n = name.trim().toLowerCase();
  if (IMAGE_BY_CANONICAL_SLUG[s] || EXTRA_HOME_CATEGORY_TILE_IMAGES[s]) return s;
  const hay = `${s} ${n}`;
  for (const rule of HOME_CATEGORY_LABEL_TO_SLUG_RULES) {
    if (rule.re.test(hay)) return rule.slug;
  }
  return '';
}

/** 无装修 URL、无分类封面时：按 slug / 名称关键词匹配「标准品类」配图（便于与 AI 绘图 URL 互换）。 */
function resolvedFallbackHomeCategoryImage(slug: string, name: string, slotDefault: HomeCategoryTile): string {
  const k = slug.trim().toLowerCase();
  const direct = EXTRA_HOME_CATEGORY_TILE_IMAGES[k] || IMAGE_BY_CANONICAL_SLUG[k];
  if (direct) return direct;
  const guessed = guessCanonicalSlugFromHomeCategoryLabel(slug, name);
  if (guessed) {
    const g = EXTRA_HOME_CATEGORY_TILE_IMAGES[guessed] || IMAGE_BY_CANONICAL_SLUG[guessed];
    if (g) return g;
  }
  return slotDefault.image;
}

/**
 * 主图加载失败时的回退：按当前格子的 slug/名称解析，避免所有格子都落到同一张占位沙发图。
 */
export function homeCategoryTileImageErrorFallback(slug: string, name: string, index: number): string {
  const slot = DEFAULT_HOME_CATEGORY_TILES[index % DEFAULT_HOME_CATEGORY_TILES.length]!;
  return resolvedFallbackHomeCategoryImage(slug, name, slot);
}

/**
 * 首页「按功能选购」8 宫格：
 * - 若 `config.homeCategoryTiles[i].image` 有值，优先用（首页装修覆盖）；
 * - 否则用 `categories` 里与当前 slug 相同的分类封面 {@link Category.image}（分类管理后台）；
 * - 再否则按 slug / 分类名关键词匹配标准品类配图；
 * - 最后使用该槽位模板上的默认图。
 */
export function mergeHomeCategoryTiles(
  config?: StoreConfig | null,
  categories?: Category[] | null,
): HomeCategoryTile[] {
  const raw = config?.homeCategoryTiles;
  if (!Array.isArray(raw) || raw.length === 0) {
    return DEFAULT_HOME_CATEGORY_TILES.map((d) => {
      const fromCat = categoryCoverBySlug(categories, d.slug);
      const image = fromCat || resolvedFallbackHomeCategoryImage(d.slug, d.name, d);
      return { ...d, image };
    });
  }
  return DEFAULT_HOME_CATEGORY_TILES.map((d, i) => {
    const o = raw[i] as Partial<HomeCategoryTile> | undefined;
    const name = (o?.name && String(o.name).trim()) || d.name;
    const slug = (o?.slug && String(o.slug).trim()) || d.slug;
    const explicit = o?.image != null ? String(o.image).trim() : '';
    const fromCat = categoryCoverBySlug(categories, slug);
    const image = explicit || fromCat || resolvedFallbackHomeCategoryImage(slug, name, d);
    const featuredProductIds = normalizeFeaturedProductIds(o?.featuredProductIds);
    return { name, slug, image, ...(featuredProductIds ? { featuredProductIds } : {}) };
  });
}

/**
 * 首页装修表单中的 8 宫格草稿：仅保留已在配置里保存过的「配图 URL」；
 * `image` 为空字符串表示不覆盖，前台展示时用 {@link mergeHomeCategoryTiles} 回退到分类封面或默认图。
 */
export function buildHomeCategoryTilesDraftSeed(config?: StoreConfig | null): HomeCategoryTile[] {
  const raw = config?.homeCategoryTiles;
  return DEFAULT_HOME_CATEGORY_TILES.map((d, i) => {
    const o = Array.isArray(raw) && raw[i] != null ? (raw[i] as Partial<HomeCategoryTile>) : undefined;
    const name = (o?.name && String(o.name).trim()) || d.name;
    const slug = (o?.slug && String(o.slug).trim()) || d.slug;
    const image = o?.image != null && String(o.image).trim() ? String(o.image).trim() : '';
    const featuredProductIds = normalizeFeaturedProductIds(o?.featuredProductIds);
    return {
      name,
      slug,
      image,
      ...(featuredProductIds ? { featuredProductIds } : {}),
    };
  });
}

export const DEFAULT_HOME_REVIEW_ITEMS: HomeReviewItem[] = [
  {
    quote:
      'Delivery was on time and the corner sofa is exactly what we needed for our living room. Assembly notes were clear and support answered quickly.',
    author: 'Anna K.',
    subtitle: 'Verified purchase · München',
    rating: 5,
  },
  {
    quote:
      'We were unsure about ordering a bed online. The frame feels solid, the fabric looks like the photos, and returns policy gave us peace of mind.',
    author: 'Thomas R.',
    subtitle: 'Verified purchase · Hamburg',
    rating: 5,
  },
  {
    quote:
      'Good value for a compact apartment. The storage ottoman matches the sofa tone and the whole set feels cohesive without feeling bulky.',
    author: 'Lea M.',
    subtitle: 'Verified purchase · Berlin',
    rating: 4,
  },
  {
    quote:
      'Customer service helped us pick the right size for a narrow room. The chairs arrived well packed and look great with our table.',
    author: 'Jonas W.',
    subtitle: 'Verified purchase · Köln',
    rating: 5,
  },
];

function normalizeReviewRating(n: unknown): number | undefined {
  const v = Number(n);
  if (!Number.isFinite(v)) return undefined;
  return Math.min(5, Math.max(1, Math.round(v)));
}

export function mergeHomeReviewItems(config?: StoreConfig | null): HomeReviewItem[] {
  const raw = config?.homeReviewsItems;
  const base = DEFAULT_HOME_REVIEW_ITEMS;
  if (!Array.isArray(raw) || raw.length === 0) {
    return base.map((x) => ({ ...x }));
  }
  return base.map((d, i) => {
    const o = raw[i] as Partial<HomeReviewItem> | undefined;
    const quote = String(o?.quote ?? '').trim() || d.quote;
    const author = String(o?.author ?? '').trim() || d.author;
    const sub = String(o?.subtitle ?? '').trim();
    const subtitlePart = sub || String(d.subtitle ?? '').trim();
    const rating = o?.rating != null ? normalizeReviewRating(o.rating) : d.rating;
    return { quote, author, subtitle: subtitlePart || undefined, rating };
  });
}

export const DEFAULT_HOME_HERO_SPOTLIGHTS: HomeHeroSpotlightItem[] = [
  {
    eyebrow: 'Hot category',
    title: 'Corner & modular sofas',
    subtitle: 'Best sellers for open living layouts',
    ctaLabel: 'Browse sofas',
    link: '/category/sofas',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=900',
  },
  {
    eyebrow: 'Campaign',
    title: 'Privilege sale',
    subtitle: 'Limited-time markdowns across rooms',
    ctaLabel: 'Shop sale',
    link: '/category/sale',
    image: 'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&q=80&w=900',
  },
  {
    eyebrow: 'Season focus',
    title: 'Tables & dining',
    subtitle: 'Gatherings that feel effortless',
    ctaLabel: 'View tables',
    link: '/category/tables',
    image: 'https://images.unsplash.com/photo-1577145745727-42b88d4cfc84?auto=format&fit=crop&q=80&w=900',
  },
];

export function mergeHomeHeroSpotlights(config?: StoreConfig | null): HomeHeroSpotlightItem[] {
  const raw = config?.homeHeroSpotlights;
  const base = DEFAULT_HOME_HERO_SPOTLIGHTS;
  if (!Array.isArray(raw) || raw.length === 0) {
    return base.map((x) => ({ ...x }));
  }
  return base.map((d, i) => {
    const o = raw[i] as Partial<HomeHeroSpotlightItem> | undefined;
    const link = String(o?.link ?? '').trim() || d.link;
    return {
      eyebrow: String(o?.eyebrow ?? '').trim() || d.eyebrow,
      title: String(o?.title ?? '').trim() || d.title,
      subtitle: String(o?.subtitle ?? '').trim() || d.subtitle,
      ctaLabel: String(o?.ctaLabel ?? '').trim() || d.ctaLabel,
      link,
      image: String(o?.image ?? '').trim() || d.image,
    };
  });
}
