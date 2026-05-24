import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { StoreCatalog, StoreFile, StoreOrder } from './storeTypes';
import { EMPTY_STORE_FILE } from './storeTypes';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const STORE_PATH = path.join(DATA_DIR, 'store-v1.json');
const SNAPSHOT_SEED_PATHS = [
  path.join(__dirname, '..', 'public', 'feishu-bitable-db-v1.json'),
  path.join(__dirname, '..', 'dist', 'feishu-bitable-db-v1.json'),
];

let writeQueue: Promise<void> = Promise.resolve();

function runExclusive<T>(fn: () => T | Promise<T>): Promise<T> {
  const next = writeQueue.then(fn, fn);
  writeQueue = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

function seedFromSnapshot(): StoreFile | null {
  for (const seedPath of SNAPSHOT_SEED_PATHS) {
    if (!fs.existsSync(seedPath)) continue;
    try {
      const raw = JSON.parse(fs.readFileSync(seedPath, 'utf8')) as {
        products?: unknown;
        categories?: unknown;
        promotions?: unknown;
        config?: unknown;
        orders?: unknown;
      };
      const products = Array.isArray(raw.products) ? (raw.products as StoreCatalog['products']) : [];
      if (products.length === 0) continue;
      return {
        revision: 1,
        updatedAt: new Date().toISOString(),
        catalog: {
          products,
          categories: Array.isArray(raw.categories) ? (raw.categories as StoreCatalog['categories']) : [],
          promotions: Array.isArray(raw.promotions) ? (raw.promotions as StoreCatalog['promotions']) : [],
          config: (raw.config as StoreCatalog['config']) ?? { id: 'global', storeName: 'HOMAIRE' },
        },
        orders: Array.isArray(raw.orders) ? (raw.orders as StoreOrder[]) : [],
      };
    } catch {
      continue;
    }
  }
  return null;
}

export function readStoreFile(): StoreFile {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(STORE_PATH)) {
    const seeded = seedFromSnapshot();
    const initial = seeded ?? { ...EMPTY_STORE_FILE, updatedAt: new Date().toISOString() };
    fs.writeFileSync(STORE_PATH, JSON.stringify(initial), 'utf8');
    return initial;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(STORE_PATH, 'utf8')) as StoreFile;
    if (!parsed.catalog) parsed.catalog = EMPTY_STORE_FILE.catalog;
    if (!Array.isArray(parsed.orders)) parsed.orders = [];
    if (typeof parsed.revision !== 'number') parsed.revision = 1;
    return parsed;
  } catch {
    return { ...EMPTY_STORE_FILE, updatedAt: new Date().toISOString() };
  }
}

export function writeStoreFile(next: StoreFile): Promise<void> {
  return runExclusive(() => {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(next), 'utf8');
  });
}

export async function replaceCatalog(catalog: StoreCatalog): Promise<{ revision: number }> {
  return runExclusive(async () => {
    const cur = readStoreFile();
    const revision = cur.revision + 1;
    const next: StoreFile = {
      ...cur,
      revision,
      updatedAt: new Date().toISOString(),
      catalog,
    };
    await writeStoreFile(next);
    return { revision };
  });
}

export async function appendOrder(order: Omit<StoreOrder, 'id' | 'createdAt'>): Promise<StoreOrder> {
  return runExclusive(async () => {
    const cur = readStoreFile();
    const id = `order_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const created = {
      ...order,
      id,
      status: order.status ?? 'pending',
      createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
    } as StoreOrder;
    const next: StoreFile = {
      ...cur,
      revision: cur.revision + 1,
      updatedAt: new Date().toISOString(),
      orders: [created, ...cur.orders],
    };
    await writeStoreFile(next);
    return created;
  });
}

export async function patchOrder(
  orderId: string,
  patch: Partial<StoreOrder>
): Promise<StoreOrder | null> {
  return runExclusive(async () => {
    const cur = readStoreFile();
    const idx = cur.orders.findIndex((o) => o.id === orderId);
    if (idx === -1) return null;
    const updated = { ...cur.orders[idx], ...patch, id: orderId };
    const orders = [...cur.orders];
    orders[idx] = updated;
    const next: StoreFile = {
      ...cur,
      revision: cur.revision + 1,
      updatedAt: new Date().toISOString(),
      orders,
    };
    await writeStoreFile(next);
    return updated;
  });
}

export function getStorePath(): string {
  return STORE_PATH;
}
