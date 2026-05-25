/**
 * 按快照中已绑定的飞书 URL 批量重同步全部商品分类。
 * 用法：npm run resync:feishu
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getLocalProducts,
  LOCAL_STORAGE_DB_KEY,
  localApplyFeishuCategorySync,
  localUpdateCategory,
  load,
  replaceLocalDbFromSnapshotJson,
} from '../src/lib/localDb';
import { fetchProductsFromFeishuBitableUrl } from './lib/feishuFetchProducts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const memory: Record<string, string> = {};
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => (Object.prototype.hasOwnProperty.call(memory, k) ? memory[k] : null),
  setItem: (k: string, v: string) => {
    memory[k] = v;
  },
  removeItem: (k: string) => {
    delete memory[k];
  },
  clear: () => {
    for (const k of Object.keys(memory)) delete memory[k];
  },
  key: () => null,
  length: 0,
} as Storage;

const snapshotPath = path.join(__dirname, '..', 'public', 'feishu-bitable-db-v1.json');

async function main(): Promise<void> {
  if (!fs.existsSync(snapshotPath)) {
    throw new Error(`Snapshot not found: ${snapshotPath}`);
  }
  replaceLocalDbFromSnapshotJson(fs.readFileSync(snapshotPath, 'utf8'));
  console.log('Loaded snapshot, products:', getLocalProducts().length);

  const jobs = load()
    .categories.filter((c) => (c.feishuBitableUrl || '').trim())
    .map((c) => ({ slug: c.slug, url: c.feishuBitableUrl!.trim(), id: c.id }));

  if (jobs.length === 0) {
    throw new Error('No categories with feishuBitableUrl in snapshot');
  }

  for (const job of jobs) {
    console.log(`\n>>> ${job.slug}`);
    const result = fetchProductsFromFeishuBitableUrl(job.url, { categorySlug: job.slug });
    const { removed, added } = localApplyFeishuCategorySync(job.slug, result.products);
    localUpdateCategory(job.id, {
      feishuLastSyncedAt: new Date().toISOString(),
      feishuLastSyncCount: added,
      feishuLastSyncMessage: `Resync OK: ${added} products`,
    });
    console.log(`  rows ${result.rawRowCount} → added ${added}, removed ${removed}`);
    if (result.products[0]) {
      const s = result.products[0];
      console.log(`  sample: ${s.name.slice(0, 60)} | €${s.price}${s.onSale ? ` (sale €${s.discountPrice})` : ''}`);
    }
  }

  const payload = memory[LOCAL_STORAGE_DB_KEY];
  if (typeof payload === 'string' && payload.length > 0) {
    let out = payload;
    try {
      const state = JSON.parse(payload) as Record<string, unknown>;
      state.config = {
        ...(typeof state.config === 'object' && state.config ? state.config : {}),
        id: 'global',
        catalogSnapshotExportedAt: new Date().toISOString(),
      };
      out = JSON.stringify(state);
      memory[LOCAL_STORAGE_DB_KEY] = out;
    } catch {
      /* keep raw payload */
    }
    fs.writeFileSync(snapshotPath, out, 'utf8');
    console.log(`\nWrote ${snapshotPath} (${(out.length / 1024 / 1024).toFixed(2)} MB)`);
    console.log('Total products:', getLocalProducts().length);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
