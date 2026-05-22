/**
 * 根据商品文案（名称、描述、子类、卖点等）推断标准品类 slug，
 * 用于批量导入时 category 列为空或需从大健等无类目列的导出中自动归类。
 */

/** 与前台默认分类、首页宫格一致的标准 slug */
export const DEFAULT_PRODUCT_CATEGORY_SLUGS = [
  'sofas',
  'beds',
  'tables',
  'chairs',
  'garden',
  'lighting',
  'storage',
  'decor',
] as const;

export const DEFAULT_PRODUCT_CATEGORY_SLUG_SET = new Set<string>(DEFAULT_PRODUCT_CATEGORY_SLUGS);

/** 规则顺序：先匹配更具体的词，避免「桌」「椅」等过宽误伤 */
const INFERENCE_RULES: { slug: (typeof DEFAULT_PRODUCT_CATEGORY_SLUGS)[number]; re: RegExp }[] = [
  {
    slug: 'garden',
    re: /户外家具|庭院|阳台桌椅|露台|花园家具|藤编沙发|凉亭|garden|outdoor|patio|garten|balkon|terrace|terrasse/i,
  },
  {
    slug: 'lighting',
    re: /吊灯|台灯|壁灯|落地灯|吸顶灯|灯带|灯条|光源|照明灯具|led灯|light|lamp|leuchte|pendelleuchte|beleuchtung|chandelier/i,
  },
  {
    slug: 'storage',
    re: /衣柜|书柜|鞋柜|收纳柜|储物柜|置物架|展示柜|斗柜|餐边柜|橱柜|电视柜|storage|shelf|schrank|regal|cabinet|kommode|wardrobe|kleiderschrank/i,
  },
  {
    slug: 'beds',
    re: /双人床|单人床|床架|床垫|软床|皮床|布床|子母床|高低床|床\b|bett|matratze|kopfteil|schlafzimmer|schlafcouch|bed\b/i,
  },
  {
    slug: 'tables',
    re: /餐桌|茶几|书桌|写字台|边几|边桌|咖啡桌|会议桌|table|tisch|esstisch|schreibtisch|dining|desk|sideboard/i,
  },
  {
    slug: 'chairs',
    re: /餐椅|办公椅|吧台椅|电竞椅|休闲椅|扶手椅|吧凳|凳子|chair|stuhl|hocker|stool|esszimmerstuhl|dining chair|armchair/i,
  },
  {
    slug: 'decor',
    re: /花瓶|挂画|装饰画|墙饰|窗帘|抱枕|地毯|装饰摆件|软装|镜框|decor|deko|vase|mirror|spiegel|rug|teppich|cushion|textile|wall art/i,
  },
  {
    slug: 'sofas',
    re: /沙发|sofa|couch|polster|ecksofa|wohnlandschaft|转角沙发|脚踏|三人位|双人位|模块沙发|布艺组合|皮沙发/i,
  },
];

/** 表头 category 常见中文 / 英文写法 → slug（整段 trim 后大小写不敏感） */
const COLUMN_ALIAS_TO_SLUG: { pattern: RegExp; slug: string }[] = [
  { pattern: /^(沙发|沙发类|客厅沙发|组合沙发)$/i, slug: 'sofas' },
  { pattern: /^(sofa|sofas|couch)$/i, slug: 'sofas' },
  { pattern: /^(床|床具|床垫|卧室床)$/i, slug: 'beds' },
  { pattern: /^(bed|beds)$/i, slug: 'beds' },
  { pattern: /^(桌|桌子|餐桌|茶几|书桌)$/i, slug: 'tables' },
  { pattern: /^(table|tables|desk)$/i, slug: 'tables' },
  { pattern: /^(椅|椅子|餐椅|办公椅)$/i, slug: 'chairs' },
  { pattern: /^(chair|chairs|stool)$/i, slug: 'chairs' },
  { pattern: /^(户外|花园|庭院|阳台)$/i, slug: 'garden' },
  { pattern: /^(garden|outdoor|patio)$/i, slug: 'garden' },
  { pattern: /^(灯|灯具|照明)$/i, slug: 'lighting' },
  { pattern: /^(light|lights|lighting|lamp|lamps)$/i, slug: 'lighting' },
  { pattern: /^(收纳|储物|柜子)$/i, slug: 'storage' },
  { pattern: /^(storage|shelf|cabinet)$/i, slug: 'storage' },
  { pattern: /^(装饰|软装|家居饰品)$/i, slug: 'decor' },
  { pattern: /^(decor|decoration|home decor)$/i, slug: 'decor' },
];

export function inferProductCategorySlug(
  haystack: string,
  options?: { allowedSlugs?: ReadonlySet<string> | readonly string[]; fallback?: string }
): string {
  const fb = (options?.fallback ?? 'sofas').trim().toLowerCase() || 'sofas';
  const text = (haystack || '').trim();
  if (!text) return fb;

  let allow: Set<string> | undefined;
  if (options?.allowedSlugs) {
    const a = options.allowedSlugs;
    if (Array.isArray(a)) {
      allow = new Set(a.map((s) => s.trim().toLowerCase()).filter(Boolean));
    } else {
      allow = new Set([...a].map((s) => s.trim().toLowerCase()).filter(Boolean));
    }
  }

  for (const { slug, re } of INFERENCE_RULES) {
    if (!re.test(text)) continue;
    if (!allow || allow.has(slug)) return slug;
  }

  if (!allow || allow.has(fb)) return fb;
  for (const s of allow) {
    if (DEFAULT_PRODUCT_CATEGORY_SLUG_SET.has(s)) return s;
  }
  const first = [...allow][0];
  return first || fb;
}

/** 将导入列中的类目文本解析为 slug；无法识别且需推断时返回 null */
export function tryResolveImportCategoryColumn(
  raw: string,
  options?: { allowedCategorySlugs?: readonly string[] }
): string | null {
  const t = raw.trim();
  if (!t) return null;

  const lower = t.toLowerCase();
  const allowed = options?.allowedCategorySlugs?.map((s) => s.trim().toLowerCase()).filter(Boolean);

  if (allowed?.includes(lower)) return lower;
  if (DEFAULT_PRODUCT_CATEGORY_SLUG_SET.has(lower)) return lower;

  for (const { pattern, slug } of COLUMN_ALIAS_TO_SLUG) {
    if (pattern.test(t)) {
      if (!allowed?.length || allowed.includes(slug)) return slug;
      return null;
    }
  }

  if (allowed?.length) return null;
  return lower;
}
