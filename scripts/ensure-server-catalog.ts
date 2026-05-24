/**
 * 启动前检查：若服务端 catalog 为空，从 public/dist 快照导入。
 * 由 npm run prestart 自动执行。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readStoreFile, replaceCatalog } from '../server/jsonFileStore';
import type { StoreCatalog } from '../server/storeTypes';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SNAPSHOT_CANDIDATES = [
  path.join(__dirname, '..', 'public', 'feishu-bitable-db-v1.json'),
  path.join(__dirname, '..', 'dist', 'feishu-bitable-db-v1.json'),
];

function findSnapshotPath(): string | null {
  for (const candidate of SNAPSHOT_CANDIDATES) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function loadCatalogFromSnapshot(filePath: string): StoreCatalog | null {
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Record<string, unknown>;
    const products = Array.isArray(raw.products) ? (raw.products as StoreCatalog['products']) : [];
    if (products.length === 0) return null;
    return {
      products,
      categories: Array.isArray(raw.categories) ? (raw.categories as StoreCatalog['categories']) : [],
      promotions: Array.isArray(raw.promotions) ? (raw.promotions as StoreCatalog['promotions']) : [],
      config: (raw.config as StoreCatalog['config']) ?? { id: 'global', storeName: 'HOMAIRE' },
    };
  } catch {
    return null;
  }
}

async function main(): Promise<void> {
  const store = readStoreFile();
  const count = store.catalog.products?.length ?? 0;
  if (count > 0) {
    console.log(`[catalog] 服务端已有 ${count} 条商品 (revision ${store.revision})`);
    return;
  }

  const snapshotPath = findSnapshotPath();
  if (!snapshotPath) {
    console.warn('[catalog] 商品库为空，且未找到 feishu-bitable-db-v1.json 快照');
    console.warn('[catalog] 请先运行: npm run sync:feishu 或 npm run migrate:server');
    return;
  }

  const catalog = loadCatalogFromSnapshot(snapshotPath);
  if (!catalog) {
    console.warn('[catalog] 快照无效或商品数为 0:', snapshotPath);
    return;
  }

  const { revision } = await replaceCatalog(catalog);
  console.log(`[catalog] 已从快照导入 ${catalog.products.length} 条商品 → data/store-v1.json (revision ${revision})`);
  console.log(`[catalog] 来源: ${snapshotPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
