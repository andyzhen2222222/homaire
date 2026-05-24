/**
 * Migrate public/feishu-bitable-db-v1.json to GIGAB2B categories.
 * Run: npm run migrate:catalog-categories
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const snapshotPath = path.join(root, 'public', 'feishu-bitable-db-v1.json');

const { getGigab2bCategoriesFlat, migrateLegacyProductCategory } = await import(
  '../src/data/gigab2bCategoryData.ts'
);
const { buildDefaultNavDepartments } = await import('../src/lib/defaultNavDepartments.ts');

if (!fs.existsSync(snapshotPath)) {
  console.error('Snapshot not found:', snapshotPath);
  process.exit(1);
}

const db = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
db.categories = getGigab2bCategoriesFlat();
db.config = db.config || { id: 'global', storeName: 'HOMAIRE' };
db.config.navDepartments = buildDefaultNavDepartments(db.categories);

let remapped = 0;
for (const p of db.products || []) {
  const before = (p.category || '').trim().toLowerCase();
  const after = migrateLegacyProductCategory(before);
  if (after !== before) {
    p.category = after;
    remapped++;
  }
}

fs.writeFileSync(snapshotPath, JSON.stringify(db), 'utf8');
console.log(`Updated ${snapshotPath}`);
console.log(`Categories: ${db.categories.length}, products: ${db.products?.length ?? 0}, remapped: ${remapped}`);
