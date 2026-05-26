/**
 * Backfill readable name / shortTitle / description from public/feishu-bitable-db-v1.json
 * when SQLite rows only have SKU-like names (common after migrate from store-v1.json).
 *
 * Usage: npx tsx scripts/backfill-product-titles-from-snapshot.ts [--dry-run]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from '../server/db/client';
import { isSkuLikeProductCode, abbreviateStoreTitle } from '../src/lib/storeShortTitle';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const SNAPSHOT = path.join(root, 'public', 'feishu-bitable-db-v1.json');
const dryRun = process.argv.includes('--dry-run');

type SnapshotProduct = {
  feishuRecordId?: string;
  name?: string;
  shortTitle?: string;
  description?: string;
};

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'file:./data/homaire.db';
  }
  if (!fs.existsSync(SNAPSHOT)) {
    console.error(`Missing snapshot: ${SNAPSHOT}`);
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8')) as { products?: SnapshotProduct[] };
  const byRecord = new Map<string, SnapshotProduct>();
  for (const p of raw.products ?? []) {
    const id = (p.feishuRecordId ?? '').trim();
    if (id) byRecord.set(id, p);
  }
  console.log(`Snapshot products with feishuRecordId: ${byRecord.size}`);

  const rows = await prisma.product.findMany({
    where: { feishuRecordId: { not: null } },
    select: {
      id: true,
      name: true,
      shortTitle: true,
      description: true,
      feishuRecordId: true,
    },
  });

  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const snap = byRecord.get(row.feishuRecordId!);
    if (!snap) {
      skipped += 1;
      continue;
    }

    const data: { name?: string; shortTitle?: string; description?: string } = {};
    const snapShort = (snap.shortTitle ?? '').trim();
    const snapName = (snap.name ?? '').trim();
    const snapDesc = (snap.description ?? '').trim();

    if (!row.shortTitle?.trim() && snapShort && !isSkuLikeProductCode(snapShort)) {
      data.shortTitle = abbreviateStoreTitle(snapShort, 120);
    }
    if (isSkuLikeProductCode(row.name) && snapName && !isSkuLikeProductCode(snapName)) {
      data.name = snapName.slice(0, 512);
    }
    if (!row.description?.trim() && snapDesc) {
      data.description = snapDesc.slice(0, 8000);
    }

    if (!Object.keys(data).length) continue;

    if (dryRun) {
      console.log(`[dry-run] ${row.id}`, data);
    } else {
      await prisma.product.update({ where: { id: row.id }, data });
    }
    updated += 1;
  }

  const withShort = await prisma.product.count({ where: { shortTitle: { not: null } } });
  console.log(
    dryRun ? `[dry-run] would update ${updated}, no match ${skipped}` : `Updated ${updated}, no snapshot match ${skipped}`,
  );
  console.log(`Products with shortTitle: ${withShort}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
