import { processImportedProductRows } from '../../src/lib/productImport';
import type { Product } from '../../src/types';
import {
  extractRecordsFromLarkPayload,
  larkPayloadHasMore,
  mapBitableRecordToImportRow,
  parseFeishuBitableUrl,
} from '../../src/lib/feishuBitableSync';
import { assertLarkOk, runLarkCli } from './larkCli';

export type FeishuFetchOptions = {
  categorySlug: string;
  as?: 'user' | 'bot';
  allowedCategorySlugs?: readonly string[];
};

export type FeishuFetchResult = {
  products: Array<Omit<Product, 'id' | 'createdAt'>>;
  rawRowCount: number;
  tableId: string;
  baseToken: string;
};

function listTables(baseToken: string, as: 'user' | 'bot'): Array<{ table_id?: string; name?: string }> {
  const res = runLarkCli(['base', '+table-list', '--base-token', baseToken], { as });
  if (res.ok === false && res.error) {
    const code = (res.error as { code?: number }).code;
    if (code === 91402 || /NOTEXIST/i.test(String(res.error.message))) {
      throw new Error(
        '无法识别飞书链接（分享视图 token 不能作为 base_token）。请在飞书多维表格编辑页复制完整 /base/ 链接。'
      );
    }
  }
  const data = assertLarkOk(res, '列出数据表失败') as Record<string, unknown>;
  const items =
    (Array.isArray(data.items) && data.items) ||
    (Array.isArray((data as { tables?: unknown }).tables) &&
      (data as { tables: unknown[] }).tables) ||
    [];
  return items as Array<{ table_id?: string; name?: string }>;
}

function fetchAllRecords(
  baseToken: string,
  tableId: string,
  viewId: string | undefined,
  as: 'user' | 'bot'
): Array<{ fields: Record<string, unknown>; recordId?: string }> {
  const rows: Array<{ fields: Record<string, unknown>; recordId?: string }> = [];
  let offset = 0;
  const limit = 200;
  const maxPages = 500;

  for (let page = 0; page < maxPages; page += 1) {
    const args = [
      'base',
      '+record-list',
      '--base-token',
      baseToken,
      '--table-id',
      tableId,
      '--limit',
      String(limit),
      '--offset',
      String(offset),
    ];
    if (viewId) args.push('--view-id', viewId);
    const res = runLarkCli(args, { as });
    const data = assertLarkOk(res, `读取记录失败 (offset ${offset})`);
    const chunk = extractRecordsFromLarkPayload(data);
    for (const rec of chunk) {
      rows.push({
        fields: mapBitableRecordToImportRow(rec.fields),
        recordId: rec.record_id,
      });
    }
    const hasMore = larkPayloadHasMore(data);
    if (!hasMore || chunk.length < limit) break;
    offset += chunk.length;
  }
  return rows;
}

/** 从飞书多维表格 URL 拉取并转为 Homaire 商品（指定分类 slug） */
export function fetchProductsFromFeishuBitableUrl(
  url: string,
  options: FeishuFetchOptions
): FeishuFetchResult {
  const as = options.as ?? 'user';
  const target = parseFeishuBitableUrl(url);

  if (as === 'user') {
    const status = runLarkCli(['auth', 'status'], { json: false }) as {
      identities?: Record<string, { available?: boolean }>;
    };
    if (!status.identities?.user?.available) {
      throw new Error('飞书用户未登录。请在终端执行：lark-cli auth login --domain base');
    }
  }

  let tableId = target.tableId;
  if (!tableId) {
    const tables = listTables(target.baseToken, as);
    if (tables.length === 0) throw new Error('多维表格下没有数据表，或无读取权限');
    tableId = tables[0].table_id || tables[0].name || '';
  }
  if (!tableId) throw new Error('无法确定数据表 table_id');

  const records = fetchAllRecords(target.baseToken, tableId, target.viewId, as);
  const importRows = records.map((r) => ({
    ...r.fields,
    category: options.categorySlug,
    __feishuRecordId: r.recordId,
  }));

  const parsed = processImportedProductRows(importRows, {
    defaultCategory: options.categorySlug,
    allowedCategorySlugs: options.allowedCategorySlugs,
    inferCategoryFromRowData: false,
  });

  const products = parsed.map((p, i) => {
    const rid = records[i]?.recordId;
    return {
      ...p,
      category: options.categorySlug,
      ...(rid ? { syncSource: 'feishu' as const, feishuRecordId: rid } : { syncSource: 'feishu' as const }),
    };
  });

  return {
    products,
    rawRowCount: records.length,
    tableId,
    baseToken: target.baseToken,
  };
}
