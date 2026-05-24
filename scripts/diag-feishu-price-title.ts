/**
 * 诊断飞书行 → 标题/售价解析（npm run diag:feishu）
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { runLarkCli, assertLarkOk } from './lib/larkCli';
import { mapBitableRecordToImportRow } from '../src/lib/feishuBitableSync';
import { processImportedProductRows, resolveImportedProductName, resolveImportedProductPrice } from '../src/lib/productImport';

const BASE = 'MoFsbKDb9afweksIGUXcRG2inHe';

const TABLES: { label: string; tableId: string; sku?: string }[] = [
  { label: 'tables', tableId: 'tbl8MIGTZTuNECx1', sku: 'T3789S00003' },
  { label: 'cabinets', tableId: 'tblLGttrW7fpdl6G' },
  { label: 'bedroom', tableId: 'tblC90ZwmJ1wXAHC' },
];

function rowFromPayload(data: Record<string, unknown>, sku?: string) {
  const fields = (data.fields as string[]) || [];
  const matrix = (data.data as unknown[][]) || [];
  if (!fields.length || !matrix.length) return null;
  let idx = 0;
  if (sku) {
    const skuCol = fields.indexOf('SKU');
    const found = matrix.findIndex((r) => String(r[skuCol] ?? '') === sku);
    if (found >= 0) idx = found;
  }
  const cells = matrix[idx];
  const raw: Record<string, unknown> = {};
  fields.forEach((name, i) => {
    if (name && name !== '_record_id') raw[name] = cells[i];
  });
  return raw;
}

function pickKeys(obj: Record<string, unknown>, re: RegExp) {
  return Object.keys(obj).filter((k) => re.test(k));
}

function cellPreview(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v).slice(0, 120);
  return JSON.stringify(v).slice(0, 200);
}

const report: string[] = [];

for (const t of TABLES) {
  const res = runLarkCli(
    ['base', '+record-list', '--base-token', BASE, '--table-id', t.tableId, '--limit', '80'],
    { as: 'user' }
  );
  const data = assertLarkOk(res, t.label) as Record<string, unknown>;
  const raw = rowFromPayload(data, t.sku);
  if (!raw) {
    report.push(`\n## ${t.label}: no rows`);
    continue;
  }

  const mapped = mapBitableRecordToImportRow(raw);
  const parsed = processImportedProductRows([mapped], {
    defaultCategory: t.label,
    inferCategoryFromRowData: false,
  })[0];

  report.push(`\n## ${t.label} SKU=${String(raw.SKU ?? '').slice(0, 40)}`);
  report.push('\n### Title columns (raw → mapped)');
  for (const k of pickKeys(raw, /标题|简称|型号|SKU|name/i)) {
    report.push(`- ${k}: raw=${cellPreview(raw[k])}`);
    report.push(`  mapped=${cellPreview(mapped[k])}`);
  }
  report.push('\n### Price columns (raw → mapped)');
  for (const k of pickKeys(raw, /价|price|Price|售价|单价|cost|Cost/i)) {
    report.push(`- ${k}: raw=${cellPreview(raw[k])}`);
    report.push(`  mapped=${cellPreview(mapped[k])}`);
  }
  report.push('\n### Resolved');
  report.push(`- resolveImportedProductName: ${resolveImportedProductName(mapped).slice(0, 120)}`);
  report.push(`- resolveImportedProductPrice: ${resolveImportedProductPrice(mapped)}`);
  report.push(`- processImportedProductRows.name: ${parsed.name.slice(0, 120)}`);
  report.push(`- processImportedProductRows.price: ${parsed.price}`);
  report.push(`- processImportedProductRows.onSale: ${parsed.onSale}`);
  report.push(`- processImportedProductRows.discountPrice: ${parsed.discountPrice ?? 0}`);
  report.push(`- processImportedProductRows.shortTitle: ${parsed.shortTitle ?? ''}`);
}

const outPath = join(process.cwd(), 'scripts', 'diag-feishu-price-title.out.txt');
writeFileSync(outPath, report.join('\n'), 'utf8');
console.log('Wrote', outPath);
console.log(report.join('\n'));
