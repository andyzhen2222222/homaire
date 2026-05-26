/**
 * Import catalog + orders from JSON store or feishu snapshot into SQLite.
 * Usage: npx tsx scripts/migrate-json-to-sqlite.ts [path-to-json]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from '../server/db/client';
import { replaceFullCatalog } from '../server/services/catalogService';
import { seedAdminUser } from '../server/services/authService';
import { createOrder } from '../server/services/orderService';
import type { StoreCatalog, StoreFile } from '../server/storeTypes';
import { readStoreFile } from '../server/jsonFileStore';
import { ensureEnv } from './ensure-env';
import { isSkuLikeProductCode } from '../src/lib/storeShortTitle';
import type { Product } from '../src/types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const FEISHU_SNAPSHOT = path.join(root, 'public', 'feishu-bitable-db-v1.json');

function loadFeishuSnapshotStore(): StoreFile | null {
  if (!fs.existsSync(FEISHU_SNAPSHOT)) return null;
  const raw = JSON.parse(fs.readFileSync(FEISHU_SNAPSHOT, 'utf8')) as StoreCatalog & { orders?: unknown };
  return {
    revision: 1,
    updatedAt: new Date().toISOString(),
    catalog: {
      products: (raw.products as StoreCatalog['products']) ?? [],
      categories: (raw.categories as StoreCatalog['categories']) ?? [],
      promotions: (raw.promotions as StoreCatalog['promotions']) ?? [],
      config: (raw.config as StoreCatalog['config']) ?? { id: 'global', storeName: 'HOMAIRE' },
    },
    orders: [],
  };
}

/** store-v1.json 常被飞书同步写成 SKU 作 name，不宜覆盖快照里的可读标题 */
function catalogLooksSkuHeavy(products: Product[]): boolean {
  const sample = products.slice(0, Math.min(80, products.length));
  if (!sample.length) return false;
  const skuLike = sample.filter((p) => isSkuLikeProductCode((p.name || '').trim())).length;
  return skuLike / sample.length >= 0.55;
}

async function main(): Promise<void> {
  ensureEnv();

  if (process.argv.includes('--if-empty')) {
    const existing = await prisma.product.count();
    if (existing > 0) {
      console.log(`Skip import: database already has ${existing} products`);
      return;
    }
  }

  const argPath = process.argv.slice(2).find((a) => !a.startsWith('--'));
  let store: StoreFile | null = null;

  if (argPath && fs.existsSync(argPath)) {
    store = JSON.parse(fs.readFileSync(argPath, 'utf8')) as StoreFile;
  } else {
    store = readStoreFile();
  }

  const forceSnapshot = process.argv.includes('--from-snapshot');
  const snapshotStore = loadFeishuSnapshotStore();

  if (forceSnapshot && snapshotStore) {
    console.log('Using feishu-bitable-db-v1.json (--from-snapshot)');
    store = snapshotStore;
  } else if (!store.catalog.products.length && snapshotStore) {
    store = snapshotStore;
  } else if (store.catalog.products.length && catalogLooksSkuHeavy(store.catalog.products) && snapshotStore) {
    console.warn(
      '[migrate] store-v1.json names look SKU-heavy; importing from feishu-bitable-db-v1.json instead',
    );
    store = snapshotStore;
  }

  console.log(`Importing ${store.catalog.products.length} products...`);
  const revision = await replaceFullCatalog(store.catalog);
  console.log(`Catalog revision: ${revision}`);

  await seedAdminUser();

  for (const order of store.orders) {
    try {
      await createOrder({
        userId: order.userId,
        items: order.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        shippingAddress: order.shippingAddress,
      });
    } catch (e) {
      console.warn(`Skip order ${order.id}:`, e instanceof Error ? e.message : e);
    }
  }

  const counts = {
    products: await prisma.product.count(),
    categories: await prisma.category.count(),
    orders: await prisma.order.count(),
  };
  console.log('Done:', counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
