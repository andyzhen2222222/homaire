import type { Category, HomeCategoryTile, Product } from '../types';

/** 首页单个品类楼层最多展示商品数 */
export const HOME_CATEGORY_FLOOR_LIMIT = 6;

function inCategorySlug(p: Product, slug: string): boolean {
  return (p.category || '').trim().toLowerCase() === slug.trim().toLowerCase();
}

function promoScore(p: Product): number {
  const c = (p.category || '').trim().toLowerCase();
  if (c === 'sale' || p.onSale) return 1;
  const d = p.discountPrice;
  if (typeof d === 'number' && d > 0 && d < p.price) return 1;
  return 0;
}

function sortAutoRemaining(products: Product[]): Product[] {
  return [...products].sort((a, b) => {
    const pb = promoScore(b) - promoScore(a);
    if (pb !== 0) return pb;
    return b.price - a.price;
  });
}

/**
 * 首页品类楼层商品顺序：
 * 1. 首页装修该 slug 宫格上的 `featuredProductIds`
 * 2. 分类管理里该 slug 的 `featuredProductIds`
 * 3. 商品上勾选 `featuredOnHome` 且 `category` 与本 slug 一致
 * 4. 其余同分类商品按促销优先、价高优先填满 {@link HOME_CATEGORY_FLOOR_LIMIT}
 */
export function resolveHomeCategoryFloorProducts(
  slug: string,
  products: Product[],
  categories: Category[] | undefined | null,
  tiles: HomeCategoryTile[],
  limit: number = HOME_CATEGORY_FLOOR_LIMIT,
): Product[] {
  const key = slug.trim().toLowerCase();
  const byId = new Map(products.map((p) => [p.id, p]));
  const used = new Set<string>();
  const ordered: Product[] = [];

  const takeId = (id: string) => {
    const tid = id.trim();
    if (!tid || used.has(tid)) return;
    const p = byId.get(tid);
    if (!p || !inCategorySlug(p, key)) return;
    used.add(tid);
    ordered.push(p);
  };

  const tile = tiles.find((t) => t.slug.trim().toLowerCase() === key);
  for (const id of tile?.featuredProductIds ?? []) {
    takeId(id);
    if (ordered.length >= limit) return ordered;
  }

  const cat = categories?.find((c) => c.slug.trim().toLowerCase() === key);
  for (const id of cat?.featuredProductIds ?? []) {
    takeId(id);
    if (ordered.length >= limit) return ordered;
  }

  for (const p of products) {
    if (ordered.length >= limit) break;
    if (!p.featuredOnHome || !inCategorySlug(p, key) || used.has(p.id)) continue;
    used.add(p.id);
    ordered.push(p);
  }

  const restCandidates = products.filter((p) => inCategorySlug(p, key) && !used.has(p.id));
  for (const p of sortAutoRemaining(restCandidates)) {
    if (ordered.length >= limit) break;
    ordered.push(p);
  }

  return ordered;
}
