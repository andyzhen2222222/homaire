import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { prisma } from './client';
import { seedAdminUser } from '../services/authService';
import { loadCatalog, replaceFullCatalog } from '../services/catalogService';
import { readStoreFile } from '../jsonFileStore';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', '..', 'data');

export async function initDatabase(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'file:./data/homaire.db';
  }
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  execSync('npx prisma db push --skip-generate', {
    stdio: 'pipe',
    cwd: path.join(__dirname, '..', '..'),
    env: process.env,
  });

  await seedAdminUser();

  const productCount = await prisma.product.count();
  if (productCount === 0) {
    await importInitialCatalog();
  }
}

async function importInitialCatalog(): Promise<void> {
  const jsonStore = readStoreFile();
  if (jsonStore.catalog.products.length > 0) {
    console.log(`Seeding SQLite from JSON store (${jsonStore.catalog.products.length} products)...`);
    await replaceFullCatalog(jsonStore.catalog);
    return;
  }
  const snapshotPath = path.join(__dirname, '..', '..', 'public', 'feishu-bitable-db-v1.json');
  if (fs.existsSync(snapshotPath)) {
    const raw = JSON.parse(fs.readFileSync(snapshotPath, 'utf8')) as {
      products?: unknown[];
      categories?: unknown[];
      promotions?: unknown[];
      config?: unknown;
    };
    if (Array.isArray(raw.products) && raw.products.length > 0) {
      console.log(`Seeding SQLite from feishu snapshot (${raw.products.length} products)...`);
      await replaceFullCatalog({
        products: raw.products as import('../storeTypes').StoreCatalog['products'],
        categories: (raw.categories as import('../storeTypes').StoreCatalog['categories']) ?? [],
        promotions: (raw.promotions as import('../storeTypes').StoreCatalog['promotions']) ?? [],
        config: (raw.config as import('../storeTypes').StoreCatalog['config']) ?? {
          id: 'global',
          storeName: 'HOMAIRE',
        },
      });
    }
  }
}

export async function logDatabaseStatus(): Promise<void> {
  const { revision, catalog } = await loadCatalog();
  const orderCount = await prisma.order.count();
  console.log(`SQLite catalog: ${catalog.products.length} products (revision ${revision}), ${orderCount} orders`);
}
