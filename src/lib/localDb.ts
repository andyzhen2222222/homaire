import { Product, Order, Promotion, StoreConfig, Category } from '../types';
import { productsData } from '../data/products';
import { getDefaultCategories } from '../data/defaultCategories';
import { normalizeProductImages } from './productImages';
import { normalizeProductPrices } from './storePrice';
import { applyGigab2bCategoryMigration } from './gigab2bCategoryMigration';
import { buildDefaultNavDepartments } from './defaultNavDepartments';
import {
  sanitizeCategoriesParents,
  flattenCategoryTreeSorted,
  getSubtreeSlugsByRootSlug,
  getCategoryLevel,
  maxSubtreeDepthFrom,
  wouldCreatingParentCycle,
} from './categoryTree';

export const LOCAL_STORAGE_DB_KEY = 'homaire_local_db_v1';
const DB_KEY = LOCAL_STORAGE_DB_KEY;

export type FirestoreLikeTimestamp = { seconds: number; nanoseconds: number };

function nowTs(): FirestoreLikeTimestamp {
  const s = Math.floor(Date.now() / 1000);
  return { seconds: s, nanoseconds: 0 };
}

export function generateLocalId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

interface LocalDbState {
  products: Product[];
  orders: Array<Order & { id: string }>;
  promotions: Promotion[];
  categories: Category[];
  config: StoreConfig | null;
}

const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((cb) => cb());
}

/** 内置演示商品 id，加载时从 localStorage 剔除，仅保留导入/后台创建的数据 */
const SEED_PRODUCT_IDS = new Set(productsData.map((p) => p.id));

function withoutSeedProducts(products: Product[]): Product[] {
  return products.filter((p) => !SEED_PRODUCT_IDS.has(p.id));
}

function defaultState(): LocalDbState {
  return {
    products: [],
    orders: [],
    promotions: [],
    categories: getDefaultCategories().map((c) => ({ ...c })),
    config: { id: 'global', storeName: 'HOMAIRE' },
  };
}

export function load(): LocalDbState {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) {
      const initial = defaultState();
      localStorage.setItem(DB_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw) as LocalDbState;
    let dirty = false;
    if (!Array.isArray(parsed.products)) {
      parsed.products = [];
      dirty = true;
    } else {
      const stripped = withoutSeedProducts(parsed.products);
      if (stripped.length !== parsed.products.length) dirty = true;
      const normalized = stripped.map((p) => {
        let next = normalizeProductImages(p);
        const priced = normalizeProductPrices(next);
        if (
          JSON.stringify(next.images) !== JSON.stringify(p.images) ||
          priced.price !== p.price ||
          priced.discountPrice !== p.discountPrice
        ) {
          dirty = true;
        }
        next = priced;
        return next;
      });
      parsed.products = normalized;
    }
    if (!Array.isArray(parsed.orders)) {
      parsed.orders = [];
      dirty = true;
    }
    if (!Array.isArray(parsed.promotions)) {
      parsed.promotions = [];
      dirty = true;
    }
    if (!Array.isArray(parsed.categories) || parsed.categories.length === 0) {
      parsed.categories = getDefaultCategories().map((c) => ({ ...c }));
      dirty = true;
    } else {
      const migrated = applyGigab2bCategoryMigration({
        categories: parsed.categories as Category[],
        products: parsed.products,
      });
      if (migrated.dirty) dirty = true;
      parsed.categories = migrated.categories;
      parsed.products = migrated.products;
    }
    if (parsed.config == null) {
      parsed.config = { id: 'global', storeName: 'HOMAIRE' };
      dirty = true;
    }
    if (!parsed.config.navDepartments?.length && parsed.categories.length > 0) {
      parsed.config = {
        ...parsed.config,
        navDepartments: buildDefaultNavDepartments(parsed.categories),
      };
      dirty = true;
    }
    if (dirty) save(parsed);
    return parsed;
  } catch {
    const initial = defaultState();
    localStorage.setItem(DB_KEY, JSON.stringify(initial));
    return initial;
  }
}

function save(state: LocalDbState): void {
  localStorage.setItem(DB_KEY, JSON.stringify(state));
  notify();
}

export function subscribeLocalDb(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** 部署用商品库快照（构建时从 public/ 复制到 dist/，线上首访自动加载） */
export const FEISHU_DB_SNAPSHOT_URL = '/feishu-bitable-db-v1.json';

/** 可通过 .env 覆盖，例如挂到 CDN：VITE_DB_SNAPSHOT_URL=https://cdn.example.com/catalog.json */
export function getCatalogSnapshotUrl(): string {
  const fromEnv = import.meta.env.VITE_DB_SNAPSHOT_URL;
  if (typeof fromEnv === 'string' && fromEnv.trim()) return fromEnv.trim();
  return FEISHU_DB_SNAPSHOT_URL;
}

function normalizeImportedDbState(parsed: Partial<LocalDbState>): LocalDbState {
  const cur = load();
  let products = withoutSeedProducts(Array.isArray(parsed.products) ? parsed.products : []).map(
    (p) => normalizeProductPrices(normalizeProductImages(p))
  );
  let categories =
    Array.isArray(parsed.categories) && parsed.categories.length > 0
      ? sanitizeCategoriesParents(parsed.categories as Category[])
      : cur.categories.length > 0
        ? cur.categories
        : getDefaultCategories().map((c) => ({ ...c }));

  const migrated = applyGigab2bCategoryMigration({ categories, products });
  categories = migrated.categories;
  products = migrated.products;

  return {
    products,
    orders: Array.isArray(parsed.orders) ? (parsed.orders as LocalDbState['orders']) : [],
    promotions: Array.isArray(parsed.promotions) ? parsed.promotions : [],
    categories,
    config: parsed.config ?? cur.config ?? { id: 'global', storeName: 'HOMAIRE' },
  };
}

/** 用 JSON 快照覆盖本地库（剔除内置演示商品 id） */
export function replaceLocalDbFromSnapshotJson(json: string): number {
  const parsed = JSON.parse(json) as Partial<LocalDbState>;
  const next = normalizeImportedDbState(parsed);
  save(next);
  return next.products.length;
}

/** 导出当前浏览器完整库 JSON（用于部署前保存到 public/） */
export function exportLocalDbJson(): string {
  const raw = localStorage.getItem(DB_KEY);
  if (raw) return raw;
  return JSON.stringify(load());
}

/** 触发浏览器下载部署快照（放入 public/feishu-bitable-db-v1.json 后重新 build） */
export function downloadLocalDbSnapshotForDeploy(
  filename = 'feishu-bitable-db-v1.json'
): void {
  const state = load();
  const payload: LocalDbState = {
    ...state,
    config: {
      ...(state.config ?? { id: 'global', storeName: 'HOMAIRE' }),
      id: state.config?.id ?? 'global',
      catalogSnapshotExportedAt: new Date().toISOString(),
    },
  };
  const json = JSON.stringify(payload);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function fetchCatalogSnapshotJson(): Promise<string | null> {
  const url = getCatalogSnapshotUrl();
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

/**
 * 启动时加载部署快照：
 * - 本地无商品 → 从 public/CDN 快照写入 localStorage（线上访客走这条）
 * - 开发环境已有商品 → 不覆盖
 */
export async function tryAutoLoadFeishuSnapshot(): Promise<number> {
  const json = await fetchCatalogSnapshotJson();
  if (!json) return getLocalProducts().length;

  let snapCount = 0;
  try {
    const parsed = JSON.parse(json) as { products?: unknown[] };
    snapCount = Array.isArray(parsed.products) ? parsed.products.length : 0;
  } catch {
    return getLocalProducts().length;
  }

  const existing = getLocalProducts().length;
  // 本地已有旧库、但部署快照更大时（例如新增 tables 飞书同步）自动升级
  if (existing === 0 || snapCount > existing) {
    return replaceLocalDbFromSnapshotJson(json);
  }
  return existing;
}

/** 强制从部署快照重新加载（覆盖当前浏览器中的商品库） */
export async function reloadFeishuSnapshotFromPublic(): Promise<number> {
  const json = await fetchCatalogSnapshotJson();
  if (!json) {
    throw new Error(
      `Catalog snapshot not found at ${getCatalogSnapshotUrl()}. Run npm run sync:feishu or export from Admin first.`
    );
  }
  return replaceLocalDbFromSnapshotJson(json);
}

/** 清空本地商品（不影响分类/配置/订单） */
export function clearLocalProducts(): void {
  const s = load();
  s.products = [];
  save(s);
}

export function getLocalProducts(): Product[] {
  return load().products;
}

export function getLocalProductsByCategory(categorySlug: string): Product[] {
  const s = load();
  const slugs = getSubtreeSlugsByRootSlug(categorySlug, s.categories);
  return s.products.filter((p) => slugs.has(p.category));
}

export function getLocalProductById(id: string): Product | undefined {
  return load().products.find((p) => p.id === id);
}

export type LocalOrder = Order & { id: string };

export function getLocalOrdersSorted(): LocalOrder[] {
  const orders = [...load().orders];
  orders.sort((a, b) => {
    const ta = typeof a.createdAt?.seconds === 'number' ? a.createdAt.seconds : 0;
    const tb = typeof b.createdAt?.seconds === 'number' ? b.createdAt.seconds : 0;
    return tb - ta;
  });
  return orders;
}

export function getLocalOrderById(orderId: string): LocalOrder | undefined {
  return load().orders.find((o) => o.id === orderId);
}

export function getLocalOrdersForUser(userId: string): LocalOrder[] {
  return getLocalOrdersSorted().filter((o) => o.userId === userId);
}

export function localAddOrder(order: Omit<Order, 'id' | 'createdAt'>): string {
  const s = load();
  const id = generateLocalId('order');
  s.orders.push({
    ...order,
    id,
    status: order.status ?? 'pending',
    createdAt: nowTs(),
  });
  save(s);
  return id;
}

export function getLocalCategoriesSorted(): Category[] {
  return flattenCategoryTreeSorted(load().categories);
}

export function localAddCategory(cat: Omit<Category, 'id'>): void {
  const s = load();
  const slug = cat.slug.trim().toLowerCase();
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error('分类 slug 须为小写字母、数字与连字符，且不能以连字符开头或结尾');
  }
  if (s.categories.some((c) => c.slug === slug)) {
    throw new Error('已存在相同 slug 的分类');
  }
  const rawPid = cat.parentId != null && String(cat.parentId).trim() !== '' ? String(cat.parentId).trim() : null;
  const pid = rawPid && s.categories.some((c) => c.id === rawPid) ? rawPid : null;
  if (pid) {
    const parent = s.categories.find((c) => c.id === pid);
    if (!parent) throw new Error('父分类不存在');
    if (getCategoryLevel(parent.id, s.categories) >= 3) {
      throw new Error('分类最多三级，无法在第三级下再添加子分类');
    }
  }
  s.categories.push({
    ...cat,
    id: generateLocalId('category'),
    slug,
    name: cat.name.trim(),
    image: cat.image.trim(),
    parentId: pid,
    sortOrder: typeof cat.sortOrder === 'number' && !Number.isNaN(cat.sortOrder) ? cat.sortOrder : 0,
  });
  save(s);
}

export function localUpdateCategory(id: string, updates: Partial<Omit<Category, 'id'>>): void {
  const s = load();
  const idx = s.categories.findIndex((c) => c.id === id);
  if (idx === -1) return;
  const cur = s.categories[idx];
  const merged: Category = { ...cur, ...updates, id };

  if (updates.parentId !== undefined) {
    const newPid = merged.parentId != null && String(merged.parentId).trim() !== '' ? String(merged.parentId).trim() : null;
    merged.parentId = newPid && s.categories.some((c) => c.id === newPid) ? newPid : null;
    if (merged.parentId && wouldCreatingParentCycle(s.categories, id, merged.parentId)) {
      throw new Error('不能将分类移动到自身或其子级之下');
    }
    const parentLevel = merged.parentId ? getCategoryLevel(merged.parentId, s.categories) : 0;
    if (parentLevel + maxSubtreeDepthFrom(id, s.categories) > 3) {
      throw new Error('调整后分类树将超过三级，请拆分或选择更浅的父级');
    }
  }

  if (typeof merged.slug === 'string') {
    const slug = merged.slug.trim().toLowerCase();
    if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      throw new Error('分类 slug 须为小写字母、数字与连字符，且不能以连字符开头或结尾');
    }
    if (s.categories.some((c, cIdx) => c.slug === slug && cIdx !== idx)) {
      throw new Error('已存在相同 slug 的分类');
    }
    merged.slug = slug;
  }
  if (typeof merged.name === 'string') merged.name = merged.name.trim();
  if (typeof merged.image === 'string') merged.image = merged.image.trim();
  if (merged.sortOrder !== undefined && (typeof merged.sortOrder !== 'number' || Number.isNaN(merged.sortOrder))) {
    merged.sortOrder = 0;
  }
  s.categories[idx] = merged;
  save(s);
}

export function localDeleteCategory(id: string): void {
  const s = load();
  if (s.categories.some((c) => c.parentId === id)) {
    throw new Error('请先删除或移动子分类，再删除本分类');
  }
  s.categories = s.categories.filter((c) => c.id !== id);
  save(s);
}

export function getLocalPromotionsSorted(): Promotion[] {
  const promos = [...load().promotions];
  promos.sort((a, b) => {
    const ta = typeof a.createdAt?.seconds === 'number' ? a.createdAt.seconds : 0;
    const tb = typeof b.createdAt?.seconds === 'number' ? b.createdAt.seconds : 0;
    return tb - ta;
  });
  return promos;
}

export function getLocalConfig(): StoreConfig | null {
  const c = load().config;
  return c ? { ...c, id: 'global' } : null;
}

export function localUpdateOrderStatus(orderId: string, status: Order['status']): void {
  const s = load();
  const idx = s.orders.findIndex((o) => o.id === orderId);
  if (idx === -1) throw new Error('订单不存在');
  s.orders[idx] = { ...s.orders[idx], status };
  save(s);
}

export function localMarkOrderProcessing(orderId: string): void {
  const s = load();
  const idx = s.orders.findIndex((o) => o.id === orderId);
  if (idx === -1) throw new Error('订单不存在');
  const cur = s.orders[idx];
  if (cur.status !== 'pending') {
    throw new Error('仅待处理订单可标记为处理中');
  }
  s.orders[idx] = { ...cur, status: 'processing' };
  save(s);
}

export function localShipOrder(
  orderId: string,
  payload: { carrier: string; trackingNumber: string }
): void {
  const s = load();
  const idx = s.orders.findIndex((o) => o.id === orderId);
  if (idx === -1) throw new Error('订单不存在');
  const cur = s.orders[idx];
  if (!['pending', 'processing'].includes(cur.status)) {
    throw new Error('仅待处理或处理中的订单可发货');
  }
  const carrier = payload.carrier.trim();
  const trackingNumber = payload.trackingNumber.trim();
  if (!carrier) throw new Error('请填写物流公司');
  if (!trackingNumber) throw new Error('请填写运单号');
  s.orders[idx] = {
    ...cur,
    status: 'shipped',
    carrier,
    trackingNumber,
    shippedAt: nowTs(),
  };
  save(s);
}

export function localUpdateOrderAdminNote(orderId: string, adminNote: string): void {
  const s = load();
  const idx = s.orders.findIndex((o) => o.id === orderId);
  if (idx === -1) throw new Error('订单不存在');
  s.orders[idx] = { ...s.orders[idx], adminNote: adminNote.trim() || undefined };
  save(s);
}

export function localTogglePromotion(id: string, active: boolean): void {
  const s = load();
  const idx = s.promotions.findIndex((p) => p.id === id);
  if (idx === -1) return;
  s.promotions[idx] = { ...s.promotions[idx], active };
  save(s);
}

export function localDeletePromotion(id: string): void {
  const s = load();
  s.promotions = s.promotions.filter((p) => p.id !== id);
  save(s);
}

export function localAddPromotion(promo: Omit<Promotion, 'id' | 'createdAt'>): void {
  const s = load();
  const id = generateLocalId('promo');
  s.promotions.push({
    ...promo,
    id,
    createdAt: nowTs(),
  });
  save(s);
}

export function localAddProduct(product: Omit<Product, 'id' | 'createdAt'>): void {
  const s = load();
  const id = generateLocalId('product');
  const ts = nowTs();
  s.products.push({
    ...product,
    id,
    createdAt: ts,
    updatedAt: ts,
  } as Product);
  save(s);
}

export function localUpdateProduct(id: string, updates: Partial<Product>): void {
  const s = load();
  const idx = s.products.findIndex((p) => p.id === id);
  if (idx === -1) return;
  s.products[idx] = {
    ...s.products[idx],
    ...updates,
    id,
    updatedAt: nowTs(),
  };
  save(s);
}

export function localDeleteProduct(id: string): void {
  const s = load();
  s.products = s.products.filter((p) => p.id !== id);
  save(s);
}

export function localBulkAddProducts(products: Omit<Product, 'id' | 'createdAt'>[]): void {
  const s = load();
  const ts = nowTs();
  for (const p of products) {
    s.products.push({
      ...(p as Product),
      id: generateLocalId('product'),
      createdAt: ts,
      updatedAt: ts,
    });
  }
  save(s);
}

/** 将飞书同步结果写入指定分类：移除该分类下此前由飞书同步的商品，再写入新数据 */
export function localApplyFeishuCategorySync(
  categorySlug: string,
  incoming: Omit<Product, 'id' | 'createdAt'>[]
): { removed: number; added: number } {
  const slug = categorySlug.trim().toLowerCase();
  const s = load();
  const before = s.products.length;
  s.products = s.products.filter(
    (p) =>
      !(
        (p.category || '').trim().toLowerCase() === slug &&
        p.syncSource === 'feishu'
      )
  );
  const removed = before - s.products.length;
  const ts = nowTs();
  for (const p of incoming) {
    s.products.push({
      ...(p as Product),
      category: slug,
      syncSource: 'feishu',
      id: generateLocalId('product'),
      createdAt: ts,
      updatedAt: ts,
    });
  }
  save(s);
  return { removed, added: incoming.length };
}

export function localUpdateConfig(updates: Partial<StoreConfig>): void {
  const s = load();
  s.config = { ...(s.config || { id: 'global' }), ...updates, id: 'global' };
  save(s);
}
