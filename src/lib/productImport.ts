import type { Product } from '../types';
import {
  inferProductCategorySlug,
  tryResolveImportCategoryColumn,
} from './inferProductCategorySlug';
import { abbreviateStoreTitle, isSkuLikeProductCode, STORE_SHORT_TITLE_MAX_CHARS, titleLeadFromLongText } from './storeShortTitle';
import { collectProductImageUrlsFromRow, normalizeProductImageList, PRODUCT_LIST_IMAGE_PLACEHOLDER } from './productImages';
import { readImportCell, normalizeFeishuImportRow } from './feishuBitableSync';
import { normalizeProductPrices, roundStorePrice } from './storePrice';

/** 批量导入未提供图片时的占位图，避免列表/详情报错 */
export const IMPORT_FALLBACK_IMAGE = PRODUCT_LIST_IMAGE_PLACEHOLDER;

/**
 * 详情侧栏约 min(100vw, 1280px) 内 ~360–496px 列宽，标题为 text-4xl ~ text-6xl（约 2.25rem–3.75rem）：
 * 拉丁字母平均字宽约 0.5–0.65em，单行约 14–18 字；控制在约 3 行内可读 → **≤72 字符**（与常见「两行标题」上限一致）。
 * 导入与落库时均截断到此长度；更长请用 `name` 存完整型号。
 */
export const PRODUCT_IMPORT_SHORT_TITLE_MAX = STORE_SHORT_TITLE_MAX_CHARS;

/** 完整型号 / ERP 长名；单独上限避免 localStorage 与列表行被撑爆 */
export const PRODUCT_IMPORT_NAME_MAX = 240;

const PRODUCT_IMPORT_CSV_HEADERS = [
  'name',
  'shortTitle',
  'price',
  'category',
  'stock',
  'description',
  'images',
  'features',
  'subCategory',
  'videoUrl',
  'manualUrl',
  'onSale',
  'discountPrice',
  'detailHtml',
] as const;

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** 可选：大健云仓等导出缺少英文列名时使用 */
export type ProductImportParseOptions = {
  /** category 列为空或未识别时写入的 slug，例如沙发筛选用表传 `sofas` */
  defaultCategory?: string;
  /**
   * 后台已有分类的 slug 列表。传入后：列值为空或无法识别时，推断结果会限制在该集合内；
   * 列值为未收录字符串时也会走推断（避免写入无效 slug）。
   */
  allowedCategorySlugs?: readonly string[];
  /**
   * 是否在 category 为空、或列值无法映射到允许列表时，根据名称/描述/子类/卖点推断类目（默认 true）。
   */
  inferCategoryFromRowData?: boolean;
};

/** CSV/表格里常为字符串，避免 Boolean('false') === true */
function parseImportedBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    if (s === 'false' || s === '0' || s === 'no' || s === 'off' || s === '') return false;
    if (s === 'true' || s === '1' || s === 'yes' || s === 'on') return true;
  }
  return Boolean(v);
}

/** 表头 + 一行示例，与 `processImportedProductRows` 字段一致（XLSX / CSV 共用） */
export function getProductImportTemplateSheetRows(): string[][] {
  return [
    [...PRODUCT_IMPORT_CSV_HEADERS],
    [
      '示例布艺沙发',
      '布艺沙发·四人位',
      '1299',
      'sofas',
      '15',
      '模块化四人位，含脚踏',
      [
        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=1200',
        'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&q=80&w=1200',
      ].join(','),
      '可拆洗外套,实木框架',
      'fabric',
      '',
      '',
      'true',
      '999',
      '',
    ],
  ];
}

/** 与 `processImportedProductRows` 列一致：首行为表头，次行为示例（可删改后导入） */
export function buildProductImportTemplateCsv(): string {
  return getProductImportTemplateSheetRows()
    .map((row) => row.map(escapeCsvCell).join(','))
    .join('\n');
}

/** 触发浏览器下载 CSV 模板（带 UTF-8 BOM，便于 Excel 正确打开中文） */
export function downloadProductImportTemplateCsv(filename = 'homaire-product-import-template.csv'): void {
  const csv = buildProductImportTemplateCsv();
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** 去掉表头/字段名上的 BOM 与首尾空格，避免 Papa 解析后键名对不上 */
export function normalizeParsedTableRow(row: unknown): Record<string, unknown> {
  if (row == null || typeof row !== 'object' || Array.isArray(row)) return {};
  const src = row as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(src)) {
    const nk = k.replace(/^\uFEFF+/, '').trim();
    if (nk) out[nk] = v;
  }
  return out;
}

/** 大健云仓 / GIGA 导出：含 SKU 或产品型号，且非纯标题行 */
export function isDjianCloudSourceRow(item: unknown): item is Record<string, unknown> {
  if (item == null || typeof item !== 'object') return false;
  const row = item as Record<string, unknown>;
  if (readImportCell(row, '标题-英语') || readImportCell(row, '标题-法语')) return false;
  if (
    readImportCell(row, '产品标题-英语') ||
    readImportCell(row, '产品标题-法语') ||
    readImportCell(row, '产品简称-法语')
  ) {
    return false;
  }
  return readImportCell(row, '产品型号').length > 0 || readImportCell(row, 'SKU').length > 0;
}

function firstFiniteNumber(...vals: unknown[]): number {
  for (const v of vals) {
    const s = String(v ?? '')
      .trim()
      .replace(/,/g, '');
    if (s === '') continue;
    const n = Number(s);
    if (!Number.isFinite(n) || n < 0) continue;
    return roundStorePrice(n);
  }
  return 0;
}

function collectDjianImageUrls(item: Record<string, unknown>): string[] {
  return collectProductImageUrlsFromRow(item);
}

function escapeHtmlText(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 供应商长文案里若已是 HTML，则直接进详情区（经基础清理） */
function looksLikeHtmlFragment(s: string): boolean {
  return /<[a-zA-Z][\s\S]*?>/.test(s.trim());
}

/** 移除高风险标签/内联事件，保留常见图文详情 HTML */
function sanitizeMerchantDetailHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<\/?(?:iframe|object|embed|base)\b[^>]*>/gi, '')
    .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .trim();
}

/** 纯文本长描述 → 单块 HTML，供 Product Story 直接 dangerouslySetInnerHTML */
function plainTextLongDescToDetailHtml(text: string, maxSourceLen = 12000): string {
  const t = text.trim().slice(0, maxSourceLen);
  if (!t) return '';
  const paras = t.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const body =
    paras.length > 0
      ? paras
          .map(
            (p) =>
              `<p class="detail-body-paragraph leading-relaxed">${escapeHtmlText(p).replace(/\n/g, '<br/>')}</p>`
          )
          .join('')
      : `<p class="detail-body-paragraph leading-relaxed">${escapeHtmlText(t).replace(/\n/g, '<br/>')}</p>`;
  return `<div class="detail-html-body space-y-4">${body}</div>`;
}

/** 大健「长描述」→ detailHtml：HTML 则直通；否则转安全段落 HTML */
function longDescToDetailHtmlSmart(longDesc: string): string {
  const raw = longDesc.trim();
  if (!raw) return '';
  if (looksLikeHtmlFragment(raw)) {
    return sanitizeMerchantDetailHtml(raw).slice(0, 28000);
  }
  return plainTextLongDescToDetailHtml(raw);
}

/** 单条商品体积上限，保证大量导入时 localStorage 可写入 */
function clampProductForLocalDb(p: Omit<Product, 'id' | 'createdAt'>): Omit<Product, 'id' | 'createdAt'> {
  const normalized = normalizeProductImageList(p.images);
  const images = (normalized.length ? normalized : [IMPORT_FALLBACK_IMAGE])
    .slice(0, 5)
    .map((u) => u.slice(0, 1800));
  const features = (p.features ?? []).slice(0, 8).map((f) => f.slice(0, 280));
  const nameNorm = (p.name || '').trim().slice(0, PRODUCT_IMPORT_NAME_MAX);
  const stRaw = ((p.shortTitle || '').trim() || nameNorm).trim();
  const stAbbr = abbreviateStoreTitle(stRaw);
  const shortTitle = stAbbr && stAbbr !== nameNorm ? stAbbr : undefined;
  return normalizeProductPrices({
    ...p,
    shortTitle,
    name: nameNorm,
    description: (p.description || '').slice(0, 900),
    detailHtml: (p.detailHtml || '').slice(0, 28000),
    images,
    features,
    subCategory: (p.subCategory || '').slice(0, 100),
    videoUrl: (p.videoUrl || '').slice(0, 1500),
    manualUrl: (p.manualUrl || '').slice(0, 1500),
  });
}

function pickFirstCellString(item: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const s = readImportCell(item, k);
    if (s) return s;
  }
  return '';
}

/** 飞书 GIGA 表：简短描述 1–8（优先英文 → 法语 → 中文） */
export function collectGigaShortDescriptionLines(item: Record<string, unknown>): string[] {
  const seen = new Set<string>();
  const lines: string[] = [];
  const pushKey = (key: string) => {
    const s = readImportCell(item, key);
    if (!s || seen.has(s)) return;
    seen.add(s);
    lines.push(s);
  };
  for (let i = 1; i <= 8; i += 1) {
    pushKey(`简短描述${i}-英文`);
  }
  for (let i = 1; i <= 8; i += 1) {
    pushKey(`简短描述${i}-法语`);
  }
  for (let i = 1; i <= 8; i += 1) {
    pushKey(`简短描述${i}`);
  }
  pushKey('五点描述-综合');
  pushKey('五点卖点');
  return lines;
}

/** 侧栏卖点：简短描述 3+（1–2 条通常作摘要） */
export function collectImportFeaturesFromRow(item: Record<string, unknown>): string[] {
  const lines = collectGigaShortDescriptionLines(item);
  if (lines.length >= 3) return lines.slice(2, 10);
  if (lines.length === 2) return [lines[1]];

  let features: string[] = [];
  if (typeof item.features === 'string') {
    features = splitImportedFeaturesString(item.features);
  } else if (Array.isArray(item.features)) {
    features = item.features.map(String).filter(Boolean);
  }
  return features.slice(0, 8);
}

/** 首段描述：简短描述 1–2 */
export function collectImportDescriptionFromRow(item: Record<string, unknown>): string {
  const lines = collectGigaShortDescriptionLines(item);
  if (lines.length >= 2) return lines.slice(0, 2).join(' ').trim();
  if (lines.length === 1) return lines[0];
  return String(item.description ?? item.Description ?? '').trim();
}

export function resolveImportedProductName(item: Record<string, unknown>): string {
  const frenchTitle = pickFirstCellString(item, [
    '标题-法语',
    '产品标题-法语',
    '产品简称-法语',
  ]);
  if (frenchTitle && !isSkuLikeProductCode(frenchTitle)) {
    return frenchTitle.slice(0, PRODUCT_IMPORT_NAME_MAX);
  }

  const titleFirst = pickFirstCellString(item, [
    '产品标题-英语',
    '产品简称',
    '标题-英语',
    '标题',
    'name',
    'Name',
    '商品名',
    '英文标题',
    '店铺标题',
    '短标题',
    'shortTitle',
    'ShortTitle',
  ]);
  if (titleFirst && !isSkuLikeProductCode(titleFirst)) {
    return titleFirst.slice(0, PRODUCT_IMPORT_NAME_MAX);
  }

  const erpTitle = pickFirstCellString(item, ['产品型号']);
  if (erpTitle && !isSkuLikeProductCode(erpTitle)) {
    return erpTitle.slice(0, PRODUCT_IMPORT_NAME_MAX);
  }

  const model = pickFirstCellString(item, ['SKU', 'SKU-RBL', 'sku']);
  if (model && !isSkuLikeProductCode(model)) {
    return model.slice(0, PRODUCT_IMPORT_NAME_MAX);
  }

  const shortLines = collectGigaShortDescriptionLines(item).filter(
    (line) => line.length >= 16 && !isSkuLikeProductCode(line)
  );
  for (const line of shortLines.slice(0, 3)) {
    return line.slice(0, PRODUCT_IMPORT_NAME_MAX);
  }

  const desc = String(item.description ?? item.Description ?? item['产品描述-法语'] ?? '').trim();
  if (desc && !isSkuLikeProductCode(desc)) {
    const lead = titleLeadFromLongText(desc, PRODUCT_IMPORT_NAME_MAX);
    if (lead) return lead.slice(0, PRODUCT_IMPORT_NAME_MAX);
  }

  const detail = resolveImportedDetailSourceText(item);
  if (detail) {
    const lead = titleLeadFromLongText(detail, PRODUCT_IMPORT_NAME_MAX);
    if (lead && !isSkuLikeProductCode(lead)) return lead.slice(0, PRODUCT_IMPORT_NAME_MAX);
  }

  if (titleFirst && !isSkuLikeProductCode(titleFirst)) {
    return titleFirst.slice(0, PRODUCT_IMPORT_NAME_MAX);
  }
  const skuCode = pickFirstCellString(item, ['SKU', 'SKU-RBL', 'sku']);
  if (skuCode && !isSkuLikeProductCode(skuCode)) {
    return skuCode.slice(0, PRODUCT_IMPORT_NAME_MAX);
  }

  return pickFirstCellString(item, ['name', 'Name']).slice(0, PRODUCT_IMPORT_NAME_MAX);
}

/** 前台售价：法国平台售价为主价；若有更低调价最低价则作促销价 */
export function resolveImportedListingPricing(item: Record<string, unknown>): {
  price: number;
  discountPrice: number;
  onSale: boolean;
} {
  const floorRaw = firstFiniteNumber(readImportCell(item, '法国平台调价最低价'));
  const listRaw = firstFiniteNumber(
    readImportCell(item, '法国平台售价'),
    readImportCell(item, '售价'),
    readImportCell(item, '价格'),
    readImportCell(item, 'price'),
    readImportCell(item, 'Price'),
    readImportCell(item, '法国平台划线价格')
  );
  let price =
    listRaw > 0
      ? listRaw
      : firstFiniteNumber(readImportCell(item, '法国最新单价'));

  price = roundStorePrice(price);
  const floor = roundStorePrice(floorRaw);
  if (price <= 0 && floor > 0) {
    return { price: floor, discountPrice: 0, onSale: false };
  }
  if (price > 0 && floor > 0 && floor < price) {
    return { price, discountPrice: floor, onSale: true };
  }
  return { price, discountPrice: 0, onSale: false };
}

/** @deprecated 使用 resolveImportedListingPricing */
export function resolveImportedProductPrice(item: Record<string, unknown>): number {
  return resolveImportedListingPricing(item).price;
}

export function resolveImportedStock(item: Record<string, unknown>): number {
  return parseStockCell(
    item['可售库存'] ?? item['线上库存'] ?? item['拉取库存'] ?? item.stock ?? item.Stock
  );
}

export function resolveImportedSubCategory(item: Record<string, unknown>): string {
  return pickFirstCellString(item, [
    'subCategory',
    'SubCategory',
    '材质',
    '材质-法语',
    '沙发类型-中文',
    '沙发类型',
    '颜色-法语',
    '颜色',
  ]);
}

function resolveImportedDetailSourceText(item: Record<string, unknown>): string {
  return pickFirstCellString(item, [
    'detailHtml',
    'DetailHtml',
    '长描述',
    '长描述-法语',
    'html-法语',
    '产品描述-法语',
    'html',
    'HTML',
  ]);
}

export function resolveImportedDetailHtml(item: Record<string, unknown>): string {
  const raw = resolveImportedDetailSourceText(item);
  if (!raw) return '';
  if (looksLikeHtmlFragment(raw)) {
    return sanitizeMerchantDetailHtml(raw).slice(0, 28000);
  }
  return plainTextLongDescToDetailHtml(raw);
}

export function resolveImportedShortTitle(
  item: Record<string, unknown>,
  name: string
): string | undefined {
  const explicit = pickFirstCellString(item, [
    'shortTitle',
    'ShortTitle',
    '短标题',
    '店铺标题',
    '产品简称-法语',
    '产品简称',
  ]).trim();
  const source = (explicit || name).trim();
  if (!source || isSkuLikeProductCode(source)) return undefined;
  const abbr = abbreviateStoreTitle(source);
  if (!abbr || abbr === name) return undefined;
  if (name.length > 40 || abbr.length < name.length) return abbr;
  return undefined;
}

/** 拼成一段文本供类目推断（不包含 category 列本身，避免错误列名干扰） */
function buildImportRowHaystack(item: Record<string, unknown>): string {
  const parts: string[] = [];
  const push = (v: unknown) => {
    if (v == null) return;
    if (typeof v === 'string') {
      const t = v.trim();
      if (t) parts.push(t);
    } else if (typeof v === 'number' && Number.isFinite(v)) {
      parts.push(String(v));
    }
  };
  push(item.name);
  push(item.Name);
  push(item.shortTitle ?? item.ShortTitle ?? item['短标题'] ?? item['店铺标题']);
  push(item.description ?? item.Description);
  push(item.subCategory ?? item.SubCategory ?? item['沙发类型-中文'] ?? item['沙发类型']);
  push(item.detailHtml ?? item.DetailHtml);
  const feat = item.features;
  if (typeof feat === 'string') push(feat);
  else if (Array.isArray(feat)) parts.push(feat.map(String).join(' '));
  return parts.join('\n');
}

function resolveImportCategory(item: Record<string, unknown>, options?: ProductImportParseOptions): string {
  const defaultCat = (options?.defaultCategory ?? 'sofas').trim().toLowerCase() || 'sofas';
  const inferOn = options?.inferCategoryFromRowData !== false;
  const rawCol = String(item.category ?? item.Category ?? '').trim();

  const fromColumn = tryResolveImportCategoryColumn(rawCol, {
    allowedCategorySlugs: options?.allowedCategorySlugs,
  });
  if (fromColumn !== null) return fromColumn;

  if (!inferOn) return rawCol ? rawCol.toLowerCase() : defaultCat;

  const allow = options?.allowedCategorySlugs?.map((s) => s.trim().toLowerCase()).filter(Boolean);
  return inferProductCategorySlug(buildImportRowHaystack(item), {
    allowedSlugs: allow?.length ? new Set(allow) : undefined,
    fallback: defaultCat,
  });
}

/** 从 ERP 超长标题生成独立站可用的短标题（上限 {@link PRODUCT_IMPORT_SHORT_TITLE_MAX}） */
export function deriveShortTitleFromLongName(name: string): string {
  return abbreviateStoreTitle(name);
}

/** 卖点字符串：含换行时只按行拆（避免德文/长句里逗号被误拆成多条）。否则按英文逗号拆。 */
export function splitImportedFeaturesString(s: string): string[] {
  const t = (s || '').trim();
  if (!t) return [];
  if (/\r?\n/.test(t)) {
    return t
      .split(/\r?\n/)
      .map((x) => x.trim())
      .filter(Boolean);
  }
  return t
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

function parseStockCell(v: unknown): number {
  const s = String(v ?? '')
    .trim()
    .replace(/\s/g, '');
  if (!s) return 0;
  if (/^\d+,\d+$/.test(s)) {
    const n = Number(s.replace(',', '.'));
    if (Number.isFinite(n)) return Math.max(0, Math.floor(n));
  }
  return Math.max(0, Math.floor(firstFiniteNumber(v)));
}

/** 飞书多维表（英/法标题列或法国平台售价） */
export function isFeishuExportRow(item: unknown): item is Record<string, unknown> {
  if (item == null || typeof item !== 'object') return false;
  const row = item as Record<string, unknown>;
  return (
    Boolean(
      readImportCell(row, '标题-英语') ||
        readImportCell(row, '标题-法语') ||
        readImportCell(row, '产品标题-英语') ||
        readImportCell(row, '产品标题-法语') ||
        readImportCell(row, '产品简称') ||
        readImportCell(row, '产品简称-法语')
    ) || resolveImportedListingPricing(row).price > 0
  );
}

export function mapFeishuExportRowToImportShape(
  item: Record<string, unknown>,
  options?: ProductImportParseOptions
): Record<string, unknown> {
  const name = resolveImportedProductName(item);
  const pricing = resolveImportedListingPricing(item);
  const stock = resolveImportedStock(item);
  const shortEn = collectGigaShortDescriptionLines(item);
  const description = shortEn.slice(0, 2).join(' ').trim() || name.slice(0, 280);
  const featuresJoined = shortEn.slice(2).join('\n');
  const detailHtml = resolveImportedDetailHtml(item);
  const urls = collectDjianImageUrls(item).slice(0, 6);
  const images = urls.join(',');
  const manualRaw = String(item['说明书'] ?? item['说明书压缩'] ?? '').trim();
  const manualMatch = manualRaw.match(/https?:\/\/[^\s)\]]+/);
  const manualUrl = manualMatch ? manualMatch[0] : manualRaw;
  const defaultCat = (options?.defaultCategory ?? 'sofas').trim().toLowerCase() || 'sofas';
  const category =
    options?.inferCategoryFromRowData === false
      ? defaultCat
      : (options?.defaultCategory ?? defaultCat);
  const shortTitle = resolveImportedShortTitle(item, name) ?? '';

  return {
    name,
    shortTitle,
    price: pricing.price,
    category,
    stock,
    description,
    detailHtml,
    images,
    features: featuresJoined,
    subCategory: resolveImportedSubCategory(item),
    manualUrl,
    videoUrl: '',
    onSale: pricing.onSale,
    discountPrice: pricing.discountPrice,
  };
}

/** 将大健云仓一行转为内部导入字段（与标准 CSV 列语义一致） */
export function mapDjianCloudRowToImportShape(
  item: Record<string, unknown>,
  options?: ProductImportParseOptions
): Record<string, unknown> {
  const name = resolveImportedProductName(item);
  const pricing = resolveImportedListingPricing(item);
  const stock = resolveImportedStock(item);
  const defaultCat = (options?.defaultCategory ?? 'sofas').trim().toLowerCase() || 'sofas';
  const shortLines = collectGigaShortDescriptionLines(item);
  const description = shortLines.slice(0, 2).join(' ').trim() || name.slice(0, 280);
  const featuresJoined = shortLines.slice(2).join('\n');
  const detailHtml = resolveImportedDetailHtml(item);
  const urls = collectDjianImageUrls(item).slice(0, 6);
  const images = urls.join(',');
  const manualUrl = String(item['说明书'] ?? item['说明书压缩'] ?? '').trim();
  const subCategory = resolveImportedSubCategory(item);
  const hayForCategory = [name, description, featuresJoined, subCategory, resolveImportedDetailSourceText(item).slice(0, 4000)]
    .filter(Boolean)
    .join('\n');
  const allow = options?.allowedCategorySlugs?.map((s) => s.trim().toLowerCase()).filter(Boolean);
  const category =
    options?.inferCategoryFromRowData === false
      ? defaultCat
      : inferProductCategorySlug(hayForCategory, {
          allowedSlugs: allow?.length ? new Set(allow) : undefined,
          fallback: defaultCat,
        });
  const shortTitle = resolveImportedShortTitle(item, name) ?? '';

  return {
    name,
    shortTitle,
    price: pricing.price,
    category,
    stock,
    description,
    detailHtml,
    images,
    features: featuresJoined,
    subCategory,
    manualUrl,
    videoUrl: '',
    onSale: pricing.onSale,
    discountPrice: pricing.discountPrice,
  };
}

/**
 * 将 CSV / XLSX / JSON 行规范为可写入数据库的商品字段（不含 id、createdAt）。
 * 自动识别大健云仓导出（含「产品型号」列），`options.defaultCategory` 默认 `sofas`。
 */
export function processImportedProductRows(
  rawData: unknown[],
  options?: ProductImportParseOptions
): Omit<Product, 'id' | 'createdAt'>[] {
  const rows = rawData
    .filter((row) => row != null && typeof row === 'object')
    .map((row) => normalizeParsedTableRow(row))
    .filter((row) => Object.keys(row).length > 0);
  const mapped = rows.map((raw: Record<string, unknown>) => {
    const normalized = normalizeFeishuImportRow(raw);
    const shaped = isFeishuExportRow(normalized)
      ? mapFeishuExportRowToImportShape(normalized, options)
      : isDjianCloudSourceRow(normalized)
        ? mapDjianCloudRowToImportShape(normalized, options)
        : {};
    const item: Record<string, unknown> = { ...normalized, ...shaped };

    let images: string[] = collectProductImageUrlsFromRow(item);
    if (images.length === 0) {
      if (typeof item.images === 'string') {
        images = item.images
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean);
      } else if (Array.isArray(item.images)) {
        images = item.images.map(String).filter(Boolean);
      }
    }
    images = normalizeProductImageList(images);
    if (images.length === 0) {
      images = [IMPORT_FALLBACK_IMAGE];
    }

    let features = collectImportFeaturesFromRow(item);
    if (features.length === 0 && typeof item.features === 'string' && item.features.trim()) {
      features = splitImportedFeaturesString(item.features);
    } else if (features.length === 0 && Array.isArray(item.features)) {
      features = item.features.map(String).filter(Boolean);
    }

    const category = resolveImportCategory(item, options);

    const nameTrimmed = resolveImportedProductName(item);
    const shortTitle = resolveImportedShortTitle(item, nameTrimmed);

    let description = String(item.description ?? item.Description ?? '').trim();
    if (!description) {
      description = collectImportDescriptionFromRow(item);
    }
    if (!description) {
      const fromDetail = titleLeadFromLongText(resolveImportedDetailSourceText(item), 900);
      if (fromDetail) description = fromDetail;
    }

    const detailHtml = resolveImportedDetailHtml(item);
    const pricing = resolveImportedListingPricing(item);

    return {
      name: nameTrimmed,
      ...(shortTitle ? { shortTitle } : {}),
      price: pricing.price,
      category,
      stock: resolveImportedStock(item),
      description,
      detailHtml,
      images,
      features,
      subCategory: resolveImportedSubCategory(item),
      videoUrl: String(item.videoUrl ?? item.VideoUrl ?? item.video ?? item.Video ?? '').trim(),
      manualUrl: String(item.manualUrl ?? item.ManualUrl ?? item.manual ?? item.Manual ?? '').trim(),
      onSale: pricing.onSale,
      discountPrice: pricing.discountPrice,
    };
  });

  return mapped.filter((p) => p.name.length > 0).map(clampProductForLocalDb);
}
