/**
 * 当 /api/* 被静态站点吞掉（返回 HTML）时，从构建产物中的 feishu-bitable-db-v1.json 读取目录。
 * 正式环境应把 /api 反代到 Node（见 deploy/nginx-homaire.conf）；此为兜底。
 */
import type { Category, Product, Promotion, StoreConfig } from '../types';
import { getSubtreeSlugsByRootSlug } from './categoryTree';
import type { FetchProductsParams } from './catalogApi';

const SNAPSHOT_URL = '/feishu-bitable-db-v1.json';

type SnapshotCatalog = {
  products?: Product[];
  categories?: Category[];
  promotions?: Promotion[];
  config?: StoreConfig;
};

let cache: Promise<SnapshotCatalog | null> | null = null;

export function resetCatalogSnapshotCache(): void {
  cache = null;
}

async function loadSnapshot(): Promise<SnapshotCatalog | null> {
  if (!cache) {
    cache = (async () => {
      try {
        const res = await fetch(SNAPSHOT_URL, { cache: 'default' });
        if (!res.ok) return null;
        const raw = (await res.json()) as SnapshotCatalog;
        if (!Array.isArray(raw.products) || raw.products.length === 0) return null;
        return raw;
      } catch {
        return null;
      }
    })();
  }
  return cache;
}

function filterProducts(products: Product[], params: FetchProductsParams, categories: Category[]): Product[] {
  let items = [...products];

  if (params.category?.trim()) {
    const slugs = getSubtreeSlugsByRootSlug(params.category.trim(), categories);
    items = items.filter((p) => slugs.has((p.category || '').trim()));
  }

  if (params.subCategory?.trim()) {
    const sub = params.subCategory.trim().toLowerCase();
    items = items.filter((p) => (p.subCategory || '').trim().toLowerCase() === sub);
  }

  if (params.onSale) {
    items = items.filter((p) => p.onSale && (p.discountPrice ?? 0) > 0);
  }

  if (params.minPrice != null && Number.isFinite(params.minPrice)) {
    items = items.filter((p) => (p.onSale && p.discountPrice ? p.discountPrice : p.price) >= params.minPrice!);
  }
  if (params.maxPrice != null && Number.isFinite(params.maxPrice)) {
    items = items.filter((p) => (p.onSale && p.discountPrice ? p.discountPrice : p.price) <= params.maxPrice!);
  }

  if (params.q?.trim()) {
    const q = params.q.trim().toLowerCase();
    items = items.filter((p) => {
      const hay = [p.name, p.shortTitle, p.description, p.subCategory].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  }

  switch (params.sort) {
    case 'price-asc':
      items.sort(
        (a, b) =>
          (a.onSale && a.discountPrice ? a.discountPrice : a.price) -
          (b.onSale && b.discountPrice ? b.discountPrice : b.price)
      );
      break;
    case 'price-desc':
      items.sort(
        (a, b) =>
          (b.onSale && b.discountPrice ? b.discountPrice : b.price) -
          (a.onSale && a.discountPrice ? a.discountPrice : a.price)
      );
      break;
    case 'newest':
      items.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
      break;
    default:
      break;
  }

  return items;
}

export async function fetchProductsFromSnapshot(
  params: FetchProductsParams = {}
): Promise<{ items: Product[]; total: number } | null> {
  const snap = await loadSnapshot();
  if (!snap?.products) return null;

  const categories = snap.categories ?? [];
  const filtered = filterProducts(snap.products, params, categories);
  const total = filtered.length;
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(5000, Math.max(1, params.limit ?? 100));
  const start = (page - 1) * limit;
  return { items: filtered.slice(start, start + limit), total };
}

export async function fetchProductByIdFromSnapshot(id: string): Promise<Product | null> {
  const snap = await loadSnapshot();
  return snap?.products?.find((p) => p.id === id) ?? null;
}

export async function fetchCategoriesFromSnapshot(): Promise<{
  categories: Category[];
  productCountsBySlug: Record<string, number>;
} | null> {
  const snap = await loadSnapshot();
  if (!snap?.categories) return null;

  const productCountsBySlug: Record<string, number> = {};
  for (const p of snap.products ?? []) {
    const slug = (p.category || '').trim();
    if (slug) productCountsBySlug[slug] = (productCountsBySlug[slug] ?? 0) + 1;
  }
  return { categories: snap.categories, productCountsBySlug };
}

export async function fetchStoreConfigFromSnapshot(): Promise<StoreConfig | null> {
  const snap = await loadSnapshot();
  return snap?.config ?? null;
}

export async function fetchPromotionsFromSnapshot(active: boolean): Promise<Promotion[] | null> {
  const snap = await loadSnapshot();
  const list = snap?.promotions ?? [];
  return active ? list.filter((p) => p.active) : list;
}

/** 响应是否为 SPA/HTML 而非 JSON API */
export function responseLooksLikeHtml(res: Response, bodyPeek?: string): boolean {
  const ct = (res.headers.get('content-type') || '').toLowerCase();
  if (ct.includes('application/json')) return false;
  if (ct.includes('text/html')) return true;
  const peek = (bodyPeek ?? '').trimStart();
  return peek.startsWith('<!') || peek.startsWith('<html');
}
