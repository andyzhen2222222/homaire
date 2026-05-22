import type { Product } from '../types';
import {
  inferProductCategorySlug,
  tryResolveImportCategoryColumn,
} from './inferProductCategorySlug';
import { abbreviateStoreTitle, STORE_SHORT_TITLE_MAX_CHARS } from './storeShortTitle';

/** 批量导入未提供图片时的占位图，避免列表/详情报错 */
export const IMPORT_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800';

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

/** 大健云仓 / GIGA 导出：存在「产品型号」列即按此表映射 */
export function isDjianCloudSourceRow(item: unknown): item is Record<string, unknown> {
  return (
    item != null &&
    typeof item === 'object' &&
    typeof (item as Record<string, unknown>)['产品型号'] === 'string' &&
    String((item as Record<string, unknown>)['产品型号']).trim().length > 0
  );
}

function firstFiniteNumber(...vals: unknown[]): number {
  for (const v of vals) {
    const s = String(v ?? '')
      .trim()
      .replace(/,/g, '');
    if (s === '') continue;
    const n = Number(s);
    if (!Number.isFinite(n) || n < 0) continue;
    return n;
  }
  return 0;
}

function collectDjianImageUrls(item: Record<string, unknown>): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();
  const push = (raw: unknown) => {
    const t = String(raw ?? '').trim();
    if (!t || (!t.startsWith('http://') && !t.startsWith('https://'))) return;
    if (seen.has(t)) return;
    seen.add(t);
    urls.push(t);
  };
  for (let i = 1; i <= 8; i += 1) {
    push(item[`图片${i}`]);
  }
  for (let i = 1; i <= 8; i += 1) {
    push(item[`原图片${i}`]);
  }
  return urls;
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
  const images = (p.images?.length ? p.images : [IMPORT_FALLBACK_IMAGE]).slice(0, 5).map((u) => u.slice(0, 1800));
  const features = (p.features ?? []).slice(0, 8).map((f) => f.slice(0, 280));
  const nameNorm = (p.name || '').trim().slice(0, PRODUCT_IMPORT_NAME_MAX);
  const stRaw = ((p.shortTitle || '').trim() || nameNorm).trim();
  const stAbbr = abbreviateStoreTitle(stRaw);
  const shortTitle = stAbbr && stAbbr !== nameNorm ? stAbbr : undefined;
  return {
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
  };
}

function pickFirstCellString(item: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = item[k];
    const s = typeof v === 'string' ? v.trim() : v != null ? String(v).trim() : '';
    if (s) return s;
  }
  return '';
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

/** 将大健云仓一行转为内部导入字段（与标准 CSV 列语义一致） */
export function mapDjianCloudRowToImportShape(
  item: Record<string, unknown>,
  options?: ProductImportParseOptions
): Record<string, unknown> {
  const name = String(item['产品型号'] ?? '')
    .trim()
    .slice(0, PRODUCT_IMPORT_NAME_MAX);
  const price = firstFiniteNumber(item['德国最新单价'], item['法国最新单价'], item['单价-人民币']);
  const stock = Math.max(0, Math.floor(firstFiniteNumber(item['可售库存'], item['拉取库存'])));
  const defaultCat = (options?.defaultCategory ?? 'sofas').trim().toLowerCase() || 'sofas';

  const shortZh = [1, 2, 3, 4, 5]
    .map((i) => String(item[`简短描述${i}`] ?? '').trim())
    .filter(Boolean);
  const description = shortZh.slice(0, 2).join(' ').trim() || name.slice(0, 280);
  /** 简短描述1–2 已并入 description，卖点只保留 3–5，避免侧栏与首段重复 */
  const featuresJoined = shortZh.slice(2).join('\n');

  const longDesc = String(item['长描述'] ?? '').trim();
  const detailHtml = longDesc ? longDescToDetailHtmlSmart(longDesc) : '';

  const urls = collectDjianImageUrls(item).slice(0, 6);
  const images = urls.join(',');

  const manualUrl = String(item['说明书'] ?? '').trim();
  const subCategory = String(item['沙发类型-中文'] ?? item['沙发类型'] ?? '').trim();

  const hayForCategory = [name, description, featuresJoined, subCategory, longDesc.slice(0, 4000)]
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

  const explicitTitle = pickFirstCellString(item, ['店铺标题', '短标题', '英文标题']).trim();
  let rawShort = explicitTitle;
  if (!rawShort && shortZh[0]) rawShort = shortZh[0].trim();
  if (!rawShort) rawShort = name.trim();
  const shortAbbr = abbreviateStoreTitle(rawShort);
  const shortTitle = shortAbbr && shortAbbr !== name.trim() ? shortAbbr : '';

  return {
    name,
    shortTitle,
    price,
    category,
    stock,
    description,
    detailHtml,
    images,
    features: featuresJoined,
    subCategory,
    manualUrl,
    videoUrl: '',
    onSale: false,
    discountPrice: 0,
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
  const mapped = rows.map((raw: any) => {
    const item = isDjianCloudSourceRow(raw)
      ? { ...raw, ...mapDjianCloudRowToImportShape(raw, options) }
      : raw;

    let images: string[] = [];
    if (typeof item.images === 'string') {
      images = item.images
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);
    } else if (Array.isArray(item.images)) {
      images = item.images.map(String).filter(Boolean);
    }
    if (images.length === 0) {
      images = [IMPORT_FALLBACK_IMAGE];
    }

    let features: string[] = [];
    if (typeof item.features === 'string') {
      features = splitImportedFeaturesString(item.features);
    } else if (Array.isArray(item.features)) {
      features = item.features.map(String).filter(Boolean);
    }

    const category = resolveImportCategory(item, options);

    const shortTitleRaw = String(
      item.shortTitle ?? item.ShortTitle ?? item['短标题'] ?? item['店铺标题'] ?? ''
    ).trim();
    const nameTrimmed = String(item.name ?? item.Name ?? '')
      .trim()
      .slice(0, PRODUCT_IMPORT_NAME_MAX);
    const sourceForShort = (shortTitleRaw || nameTrimmed).trim();
    const shortTitleAbbr = abbreviateStoreTitle(sourceForShort);
    const shortTitle =
      shortTitleAbbr && shortTitleAbbr !== nameTrimmed ? shortTitleAbbr : undefined;

    return {
      name: nameTrimmed,
      ...(shortTitle ? { shortTitle } : {}),
      price: Number(item.price ?? item.Price ?? 0),
      category,
      stock: Number(item.stock ?? item.Stock ?? 0),
      description: String(item.description ?? item.Description ?? '').trim(),
      detailHtml: String(item.detailHtml ?? item.DetailHtml ?? item.html ?? item.HTML ?? '').trim(),
      images,
      features,
      subCategory: String(item.subCategory ?? item.SubCategory ?? '').trim(),
      videoUrl: String(item.videoUrl ?? item.VideoUrl ?? item.video ?? item.Video ?? '').trim(),
      manualUrl: String(item.manualUrl ?? item.ManualUrl ?? item.manual ?? item.Manual ?? '').trim(),
      onSale: parseImportedBool(item.onSale ?? item.OnSale ?? false),
      discountPrice: Number(item.discountPrice ?? item.DiscountPrice ?? 0),
    };
  });

  return mapped.filter((p) => p.name.length > 0).map(clampProductForLocalDb);
}
