/**
 * Infer product category slug from text (import / Feishu sync).
 * Maps to GIGAB2B leaf slugs where possible.
 */

import {
  GIGAB2B_LEAF_SLUGS,
  LEGACY_PRODUCT_CATEGORY_MAP,
  migrateLegacyProductCategory,
} from '../data/gigab2bCategoryData';

export const DEFAULT_PRODUCT_CATEGORY_SLUGS = GIGAB2B_LEAF_SLUGS;

export const DEFAULT_PRODUCT_CATEGORY_SLUG_SET = new Set<string>(DEFAULT_PRODUCT_CATEGORY_SLUGS);

const INFERENCE_RULES: { slug: string; re: RegExp }[] = [
  {
    slug: 'patio-furniture-sets',
    re: /户外家具|庭院|阳台桌椅|露台|花园家具|藤编沙发|patio set|patio furniture|garden|outdoor|patio|garten|balkon|terrace|terrasse/i,
  },
  {
    slug: 'lighting-and-lamps',
    re: /吊灯|台灯|壁灯|落地灯|吸顶灯|灯带|灯条|光源|照明灯具|led灯|light|lamp|leuchte|pendelleuchte|beleuchtung|chandelier/i,
  },
  {
    slug: 'display-shelving-etageres',
    re: /衣柜|书柜|鞋柜|收纳柜|储物柜|置物架|展示柜|斗柜|餐边柜|橱柜|电视柜|storage|shelf|schrank|regal|cabinet|kommode|wardrobe|kleiderschrank/i,
  },
  {
    slug: 'beds-frames-bases',
    re: /双人床|单人床|床架|床垫|软床|皮床|布床|子母床|高低床|床\b|bett|matratze|kopfteil|schlafzimmer|schlafcouch|bed\b/i,
  },
  {
    slug: 'dining-tables',
    re: /餐桌|dining table|esstisch/i,
  },
  {
    slug: 'tables',
    re: /茶几|书桌|写字台|边几|边桌|咖啡桌|会议桌|table|tisch|schreibtisch|desk|sideboard/i,
  },
  {
    slug: 'seating-for-dining',
    re: /餐椅|dining chair|esszimmerstuhl/i,
  },
  {
    slug: 'office-chairs',
    re: /办公椅|电竞椅|office chair/i,
  },
  {
    slug: 'chairs-and-accent-seating',
    re: /休闲椅|扶手椅|吧凳|chair|stuhl|hocker|stool|armchair|lounge chair/i,
  },
  {
    slug: 'household-supplies-and-decor',
    re: /花瓶|挂画|装饰画|墙饰|窗帘|抱枕|地毯|装饰摆件|软装|镜框|decor|deko|vase|mirror|spiegel|rug|teppich|cushion|textile|wall art/i,
  },
  {
    slug: 'sofas',
    re: /沙发|sofa|couch|polster|ecksofa|wohnlandschaft|转角沙发|脚踏|三人位|双人位|模块沙发|布艺组合|皮沙发|sectional|loveseat/i,
  },
  {
    slug: 'refrigerators',
    re: /冰箱|refrigerator|fridge/i,
  },
  {
    slug: 'bathtubs',
    re: /浴缸|bathtub|tub/i,
  },
  {
    slug: 'treadmills',
    re: /跑步机|treadmill/i,
  },
  {
    slug: 'pet-beds-and-furniture',
    re: /宠物|pet bed|cat tree|dog bed/i,
  },
];

const COLUMN_ALIAS_TO_SLUG: { pattern: RegExp; slug: string }[] = [
  { pattern: /^(沙发|沙发类|客厅沙发|组合沙发|sofa|sofas|couch|sectional)$/i, slug: 'sofas' },
  { pattern: /^(床|床具|床垫|卧室床|bed|beds)$/i, slug: 'beds-frames-bases' },
  { pattern: /^(餐桌|dining table)$/i, slug: 'dining-tables' },
  { pattern: /^(桌|桌子|茶几|书桌|table|tables|desk)$/i, slug: 'tables' },
  { pattern: /^(椅|椅子|餐椅|chair|chairs|stool)$/i, slug: 'chairs-and-accent-seating' },
  { pattern: /^(户外|花园|庭院|阳台|garden|outdoor|patio)$/i, slug: 'garden-outdoor' },
  { pattern: /^(灯|灯具|照明|light|lights|lighting|lamp|lamps)$/i, slug: 'lighting' },
  { pattern: /^(收纳|储物|柜子|storage|shelf|cabinet)$/i, slug: 'display-shelving-etageres' },
  { pattern: /^(装饰|软装|家居饰品|decor|decoration|home decor)$/i, slug: 'household-supplies-decor' },
  { pattern: /^(家具|furniture)$/i, slug: 'furniture' },
  { pattern: /^(厨房|kitchen)$/i, slug: 'kitchen' },
];

function resolveSlug(slug: string, allow?: Set<string>): string {
  const mapped = migrateLegacyProductCategory(slug);
  if (!allow || allow.has(mapped)) return mapped;
  if (allow.has(slug)) return slug;
  return mapped;
}

export function inferProductCategorySlug(
  haystack: string,
  options?: { allowedSlugs?: ReadonlySet<string> | readonly string[]; fallback?: string }
): string {
  const fb = resolveSlug((options?.fallback ?? 'sofas').trim().toLowerCase() || 'sofas');
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
    const resolved = resolveSlug(slug, allow);
    if (!allow || allow.has(resolved)) return resolved;
  }

  if (!allow || allow.has(fb)) return fb;
  for (const s of allow) {
    if (DEFAULT_PRODUCT_CATEGORY_SLUG_SET.has(s)) return s;
  }
  const first = [...allow][0];
  return first || fb;
}

/** Parse import column category text → slug; null when unknown and strict allow-list */
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

  const legacy = LEGACY_PRODUCT_CATEGORY_MAP[lower];
  if (legacy && (!allowed?.length || allowed.includes(legacy))) return legacy;

  for (const { pattern, slug } of COLUMN_ALIAS_TO_SLUG) {
    if (pattern.test(t)) {
      const resolved = migrateLegacyProductCategory(slug);
      if (!allowed?.length || allowed.includes(resolved)) return resolved;
      return null;
    }
  }

  if (allowed?.length) return null;
  return migrateLegacyProductCategory(lower);
}
