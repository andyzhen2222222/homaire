import type { Category, Product, Promotion, StoreConfig } from '../types';
import { getSubtreeSlugsByRootSlug } from './categoryTree';

export type FetchProductsParams = {
  category?: string;
  subCategory?: string;
  onSale?: boolean;
  minPrice?: number;
  maxPrice?: number;
  q?: string;
  sort?: 'featured' | 'price-asc' | 'price-desc' | 'newest';
  page?: number;
  limit?: number;
};

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === '') continue;
    sp.set(k, String(v));
  }
  const q = sp.toString();
  return q ? `?${q}` : '';
}

async function fetchProductsLegacyCatalog(category?: string): Promise<{ items: Product[]; total: number }> {
  const res = await fetch('/api/store/catalog', { cache: 'no-store' });
  const body = (await res.json()) as {
    ok?: boolean;
    catalog?: { products?: Product[] };
  };
  if (!res.ok || !body.ok || !body.catalog?.products) {
    throw new Error('Legacy catalog unavailable');
  }
  let items = body.catalog.products;
  if (category) {
    try {
      const catRes = await fetch('/api/v1/categories', { cache: 'no-store' });
      const catBody = (await catRes.json()) as { categories?: Category[] };
      const slugs = getSubtreeSlugsByRootSlug(category.trim(), catBody.categories ?? []);
      items = items.filter((p) => slugs.has((p.category || '').trim()));
    } catch {
      const slug = category.trim().toLowerCase();
      items = items.filter((p) => (p.category || '').trim().toLowerCase() === slug);
    }
  }
  return { items, total: items.length };
}

export async function fetchProductsFromApi(
  params: FetchProductsParams = {}
): Promise<{ items: Product[]; total: number }> {
  const qs = buildQuery({
    category: params.category,
    subCategory: params.subCategory,
    onSale: params.onSale ? 'true' : undefined,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    q: params.q,
    sort: params.sort === 'featured' ? undefined : params.sort,
    page: params.page ?? 1,
    limit: params.limit ?? 100,
  });
  try {
    const res = await fetch(`/api/v1/products${qs}`, { cache: 'no-store' });
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error(
        '商品接口未接通（返回了网页而非 JSON）。请关闭占用 3000 端口的旧进程后重新执行 npm run dev。'
      );
    }
    const body = (await res.json()) as {
      ok?: boolean;
      items?: Product[];
      total?: number;
      error?: string;
    };
    if (!res.ok || !body.ok) {
      throw new Error(body.error || `Failed to load products (${res.status})`);
    }
    return { items: body.items ?? [], total: body.total ?? 0 };
  } catch (primaryErr) {
    try {
      return await fetchProductsLegacyCatalog(params.category);
    } catch {
      throw primaryErr;
    }
  }
}

export async function fetchProductByIdFromApi(id: string): Promise<Product | null> {
  const res = await fetch(`/api/v1/products/${encodeURIComponent(id)}`, { cache: 'no-store' });
  if (res.status === 404) return null;
  const body = (await res.json()) as { ok?: boolean; product?: Product; error?: string };
  if (!res.ok || !body.ok || !body.product) {
    throw new Error(body.error || `Failed to load product (${res.status})`);
  }
  return body.product;
}

export async function fetchCategoriesFromApi(): Promise<{
  categories: Category[];
  productCountsBySlug: Record<string, number>;
}> {
  const res = await fetch('/api/v1/categories', { cache: 'no-store' });
  const body = (await res.json()) as {
    ok?: boolean;
    categories?: Category[];
    productCountsBySlug?: Record<string, number>;
    error?: string;
  };
  if (!res.ok || !body.ok) {
    throw new Error(body.error || `Failed to load categories (${res.status})`);
  }
  return {
    categories: body.categories ?? [],
    productCountsBySlug: body.productCountsBySlug ?? {},
  };
}

export async function fetchStoreConfigFromApi(): Promise<StoreConfig> {
  const res = await fetch('/api/v1/store-config', { cache: 'no-store' });
  const body = (await res.json()) as { ok?: boolean; config?: StoreConfig; error?: string };
  if (!res.ok || !body.ok || !body.config) {
    throw new Error(body.error || `Failed to load store config (${res.status})`);
  }
  return body.config;
}

export async function fetchPromotionsFromApi(active = true): Promise<Promotion[]> {
  const res = await fetch(`/api/v1/promotions${active ? '?active=true' : ''}`, { cache: 'no-store' });
  const body = (await res.json()) as { ok?: boolean; promotions?: Promotion[]; error?: string };
  if (!res.ok || !body.ok) {
    throw new Error(body.error || `Failed to load promotions (${res.status})`);
  }
  return body.promotions ?? [];
}
