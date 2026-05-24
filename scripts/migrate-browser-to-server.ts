/**
 * One-time: upload exported browser JSON to server store file.
 *
 *   npm run migrate:server -- ./feishu-bitable-db-v1.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { replaceCatalog } from '../server/jsonFileStore';
import type { StoreCatalog } from '../server/storeTypes';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const input = process.argv[2] || path.join(__dirname, '..', 'public', 'feishu-bitable-db-v1.json');

if (!fs.existsSync(input)) {
  console.error('File not found:', input);
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(input, 'utf8')) as Record<string, unknown>;
const catalog: StoreCatalog = {
  products: Array.isArray(raw.products) ? (raw.products as StoreCatalog['products']) : [],
  categories: Array.isArray(raw.categories) ? (raw.categories as StoreCatalog['categories']) : [],
  promotions: Array.isArray(raw.promotions) ? (raw.promotions as StoreCatalog['promotions']) : [],
  config: (raw.config as StoreCatalog['config']) ?? { id: 'global', storeName: 'HOMAIRE' },
};

async function main(): Promise<void> {
  const { revision } = await replaceCatalog(catalog);
  console.log('Server catalog updated. revision =', revision);
  console.log('Products:', catalog.products.length);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
