import { Product, Order, Promotion, StoreConfig } from '../types';
import { productsData } from '../data/products';

const DB_KEY = 'homaire_local_db_v1';

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
  config: StoreConfig | null;
}

const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((cb) => cb());
}

function deepCloneProducts(): Product[] {
  return JSON.parse(JSON.stringify(productsData)) as Product[];
}

function defaultState(): LocalDbState {
  return {
    products: deepCloneProducts(),
    orders: [],
    promotions: [],
    config: { id: 'global', storeName: 'HOMAIRE' },
  };
}

function load(): LocalDbState {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) {
      const initial = defaultState();
      localStorage.setItem(DB_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw) as LocalDbState;
    if (!Array.isArray(parsed.products)) parsed.products = deepCloneProducts();
    if (!Array.isArray(parsed.orders)) parsed.orders = [];
    if (!Array.isArray(parsed.promotions)) parsed.promotions = [];
    if (parsed.config == null) parsed.config = { id: 'global', storeName: 'HOMAIRE' };
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

export function getLocalProducts(): Product[] {
  return load().products;
}

export function getLocalProductsByCategory(categorySlug: string): Product[] {
  return load().products.filter((p) => p.category === categorySlug);
}

export function getLocalProductById(id: string): Product | undefined {
  return load().products.find((p) => p.id === id);
}

export function getLocalOrdersSorted(): Array<Order & { id: string }> {
  const orders = [...load().orders];
  orders.sort((a, b) => {
    const ta = typeof a.createdAt?.seconds === 'number' ? a.createdAt.seconds : 0;
    const tb = typeof b.createdAt?.seconds === 'number' ? b.createdAt.seconds : 0;
    return tb - ta;
  });
  return orders;
}

export function getLocalOrdersForUser(userId: string): Array<Order & { id: string }> {
  return getLocalOrdersSorted().filter((o) => o.userId === userId);
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
  if (idx === -1) return;
  s.orders[idx] = { ...s.orders[idx], status };
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

export function localUpdateConfig(updates: Partial<StoreConfig>): void {
  const s = load();
  s.config = { ...(s.config || { id: 'global' }), ...updates, id: 'global' };
  save(s);
}
