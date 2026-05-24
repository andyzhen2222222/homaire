/**
 * 飞书多维表格 → Homaire 商品导入行 的 URL 解析与字段扁平化
 */

import { extractHttpImageUrl } from './productImages';

export type FeishuBitableTarget = {
  baseToken: string;
  tableId?: string;
  viewId?: string;
  isShareViewLink: boolean;
};

const DEFAULT_SHARE_URL =
  'https://ecnwellv8vhf.feishu.cn/base/MoFsbKDb9afweksIGUXcRG2inHe?table=tbloSN5lLDGcsxGG&view=vew9XNieRe';

/** 从飞书链接解析 base / table / view */
export function parseFeishuBitableUrl(input: string): FeishuBitableTarget {
  const raw = (input || '').trim() || DEFAULT_SHARE_URL;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    // 仅 token
    return { baseToken: raw, isShareViewLink: false };
  }

  const shareMatch = url.pathname.match(/^\/share\/base\/view\/([^/]+)\/?$/i);
  if (shareMatch) {
    return {
      baseToken: decodeURIComponent(shareMatch[1]),
      isShareViewLink: true,
    };
  }

  const baseMatch = url.pathname.match(/^\/base\/([^/]+)\/?$/i);
  if (baseMatch) {
    return {
      baseToken: decodeURIComponent(baseMatch[1]),
      tableId: url.searchParams.get('table') || undefined,
      viewId: url.searchParams.get('view') || undefined,
      isShareViewLink: false,
    };
  }

  throw new Error(
    `无法解析飞书链接：${raw}\n请在飞书中打开多维表格，复制地址栏完整 URL（含 /base/ 与 table= 参数），或仅提供 base_token。`
  );
}

function textFromSegment(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  if (typeof v === 'object' && v !== null) {
    const o = v as Record<string, unknown>;
    if (typeof o.text === 'string') return o.text.trim();
    if (typeof o.name === 'string') return o.name.trim();
    if (typeof o.link === 'string') return o.link.trim();
  }
  return '';
}

/** 将多维表格单元格读值转为导入用的字符串/数字 */
export function flattenBitableCell(value: unknown): string | number | boolean | string[] {
  if (value == null) return '';
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') return value.trim();

  if (Array.isArray(value)) {
    const texts: string[] = [];
    const urls: string[] = [];
    for (const item of value) {
      const t = textFromSegment(item);
      if (t.startsWith('http://') || t.startsWith('https://')) {
        urls.push(t);
      } else if (t) {
        texts.push(t);
      }
      if (item && typeof item === 'object') {
        const o = item as Record<string, unknown>;
        if (typeof o.url === 'string' && o.url.trim()) urls.push(o.url.trim());
        if (typeof o.link === 'string' && o.link.trim()) urls.push(o.link.trim());
      }
    }
    if (urls.length > 0) return urls;
    if (texts.length > 0) return texts.join(', ');
    return '';
  }

  if (typeof value === 'object') {
    const o = value as Record<string, unknown>;
    if (typeof o.link === 'string') return o.link.trim();
    if (typeof o.text === 'string') return o.text.trim();
    if (typeof o.value === 'number') return o.value;
  }

  return String(value).trim();
}

/** 字段名 → Homaire 导入列（支持中英文与 GIGA 列名） */
const FIELD_ALIASES: Record<string, string[]> = {
  name: [
    'name',
    'Name',
    '名称',
    '商品名',
    '标题',
    '产品型号',
    '标题-英语',
    '标题-法语',
    'product',
    'Product',
    'SKU',
    'sku',
  ],
  shortTitle: ['shortTitle', 'ShortTitle', '短标题', '店铺标题', '英文标题', '标题-英语'],
  price: [
    'price',
    'Price',
    '价格',
    '售价',
    '德国最新单价',
    '法国最新单价',
    '法国平台售价',
    '单价',
    '单价-人民币',
  ],
  stock: ['stock', 'Stock', '库存', '可售库存', '拉取库存', '线上库存', '数量'],
  category: ['category', 'Category', '类目', '分类', '品类'],
  description: ['description', 'Description', '描述', '简介', '简短描述1', '简短描述'],
  detailHtml: ['detailHtml', 'DetailHtml', '详情', '长描述', 'html', 'HTML'],
  images: ['images', 'Images', '图片', '主图', '图片1', 'image', 'Image', '附件'],
  features: ['features', 'Features', '卖点', '特点', '简短描述2', '简短描述3', '简短描述4', '简短描述5'],
  subCategory: ['subCategory', 'SubCategory', '子类', '沙发类型', '沙发类型-中文'],
  videoUrl: ['videoUrl', 'VideoUrl', '视频'],
  manualUrl: ['manualUrl', 'ManualUrl', '说明书'],
  onSale: ['onSale', 'OnSale', '促销', '上架'],
  discountPrice: ['discountPrice', 'DiscountPrice', '折扣价', '活动价'],
};

function pickAliasKey(fieldName: string): string | null {
  const n = fieldName.trim();
  if (!n) return null;
  for (const [target, aliases] of Object.entries(FIELD_ALIASES)) {
    if (aliases.some((a) => a === n || a.toLowerCase() === n.toLowerCase())) return target;
  }
  return null;
}

/** 将一条多维表格 record 转为 processImportedProductRows 可识别的行 */
export function mapBitableRecordToImportRow(
  fields: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...fields };

  for (const [fieldName, raw] of Object.entries(fields)) {
    const flat = flattenBitableCell(raw);
    const key = pickAliasKey(fieldName);
    if (key) {
      if (key === 'images' && Array.isArray(flat)) {
        out.images = flat.join(',');
      } else if (key === 'images' && typeof flat === 'string' && flat) {
        out.images = out.images ? `${out.images},${flat}` : flat;
      } else if (!(key in out) || out[key] === '' || out[key] == null) {
        out[key] = flat;
      }
      continue;
    }
    // 图片1…图片8、原图片1…
    if (/^图片\d+$/.test(fieldName) || /^原图片\d+$/.test(fieldName)) {
      const u = extractHttpImageUrl(flat);
      if (u) {
        out.images = out.images ? `${out.images},${u}` : u;
      }
    }
  }

  // 保留 GIGA 原始列，供 isDjianCloudSourceRow 识别
  if (fields['产品型号'] != null) {
    out['产品型号'] = flattenBitableCell(fields['产品型号']);
  }

  return out;
}

function extractRecordsFromObjectRows(
  v: unknown
): Array<{ fields: Record<string, unknown>; record_id?: string }> | null {
  if (!Array.isArray(v)) return null;
  return v
    .filter((r) => r && typeof r === 'object')
    .map((r) => {
      const row = r as Record<string, unknown>;
      const fields =
        row.fields && typeof row.fields === 'object'
          ? (row.fields as Record<string, unknown>)
          : row;
      const record_id =
        typeof row.record_id === 'string'
          ? row.record_id
          : typeof row.id === 'string'
            ? row.id
            : undefined;
      return { fields, record_id };
    });
}

/** lark-cli --format json 常返回 fields[] + data[][] + record_id_list[] */
function extractRecordsFromTabularPayload(
  payload: Record<string, unknown>
): Array<{ fields: Record<string, unknown>; record_id?: string }> | null {
  const fieldNames = Array.isArray(payload.fields)
    ? (payload.fields as unknown[]).map((f) => String(f ?? '').trim()).filter(Boolean)
    : [];
  const matrix = Array.isArray(payload.data) ? (payload.data as unknown[]) : [];
  const recordIds = Array.isArray(payload.record_id_list)
    ? (payload.record_id_list as unknown[]).map((id) => String(id ?? '').trim())
    : [];

  if (!fieldNames.length || !matrix.length || !Array.isArray(matrix[0])) return null;

  return matrix.map((row, rowIdx) => {
    const cells = row as unknown[];
    const fields: Record<string, unknown> = {};
    fieldNames.forEach((name, colIdx) => {
      if (!name || name === '_record_id') return;
      if (colIdx < cells.length) fields[name] = cells[colIdx];
    });
    return { fields, record_id: recordIds[rowIdx] };
  });
}

function resolveTabularPayload(root: Record<string, unknown>): Record<string, unknown> {
  if (Array.isArray(root.fields) && Array.isArray(root.data)) return root;
  const nested = root.data;
  if (
    nested &&
    typeof nested === 'object' &&
    !Array.isArray(nested) &&
    Array.isArray((nested as Record<string, unknown>).fields) &&
    Array.isArray((nested as Record<string, unknown>).data)
  ) {
    return nested as Record<string, unknown>;
  }
  return root;
}

/** 从 lark-cli record-list JSON 中提取 records */
export function extractRecordsFromLarkPayload(
  data: unknown
): Array<{ fields: Record<string, unknown>; record_id?: string }> {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return [];
  const root = data as Record<string, unknown>;
  const payload = resolveTabularPayload(root);

  const tabular = extractRecordsFromTabularPayload(payload);
  if (tabular?.length) return tabular;

  return (
    extractRecordsFromObjectRows(payload.items) ||
    extractRecordsFromObjectRows(payload.records) ||
    extractRecordsFromObjectRows(root.items) ||
    extractRecordsFromObjectRows(root.records) ||
    []
  );
}

export function larkPayloadHasMore(data: unknown): boolean {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  const payload = resolveTabularPayload(data as Record<string, unknown>);
  return payload.has_more === true;
}

export function hasMoreRecords(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  if (d.has_more === true) return true;
  const page = d.page_token ?? (d as { page?: { page_token?: string } }).page?.page_token;
  return typeof page === 'string' && page.length > 0;
}

export function nextPageToken(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const d = data as Record<string, unknown>;
  const t = d.page_token ?? (d as { page?: { page_token?: string } }).page?.page_token;
  return typeof t === 'string' && t ? t : undefined;
}
