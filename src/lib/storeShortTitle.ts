/**
 * 独立站商品主标题（H1 / 面包屑）：统一缩写规则 + 可选「AI」远程重写。
 *
 * 环境变量（均为可选）：
 * - `VITE_PRODUCT_SHORT_TITLE_AI_URL`：POST JSON `{ "text": string, "maxChars"?: number }`，
 *   返回 JSON `{ "shortTitle": string }` 或纯文本；由你方代理转发到 OpenAI 等，**勿**把 API Key 写进前端。
 */

import type { Product } from '../types';

export const STORE_SHORT_TITLE_MAX_CHARS = 72;

const AI_TIMEOUT_MS = 14_000;

/** 去掉连续重复词（不区分大小写），常见于 ERP 标题 */
export function dedupeConsecutiveWords(s: string): string {
  const parts = s.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return s.trim();
  const out: string[] = [];
  for (const w of parts) {
    const prev = out[out.length - 1];
    if (prev != null && prev.toLowerCase() === w.toLowerCase()) continue;
    out.push(w);
  }
  return out.join(' ');
}

/**
 * 规则型「缩写」：优先逗号首段、去重词、按词数与字宽截断（上限 {@link STORE_SHORT_TITLE_MAX_CHARS}）。
 * 与「AI 重写」配合：AI 失败或未配置时始终可回退到本函数。
 */
export function abbreviateStoreTitle(raw: string, max = STORE_SHORT_TITLE_MAX_CHARS): string {
  let t = (raw ?? '').replace(/\s+/g, ' ').trim();
  if (!t) return '';
  t = dedupeConsecutiveWords(t);
  if (t.length <= max) return t;

  const comma = t.split(',')[0]?.trim();
  if (comma.length >= 12 && comma.length <= max && comma.length < t.length) {
    t = dedupeConsecutiveWords(comma);
  }

  if (t.length <= max) return t;

  const words = t.split(/\s+/).filter(Boolean);
  let acc = '';
  const hardWordCap = 11;
  let used = 0;
  for (const w of words) {
    if (used >= hardWordCap) break;
    const next = acc ? `${acc} ${w}` : w;
    if (next.length > max - 1) break;
    acc = next;
    used += 1;
  }
  if (acc.length >= 12) {
    return acc.length <= max ? acc : `${acc.slice(0, max - 1).trimEnd()}…`;
  }

  const head = t.slice(0, max - 1);
  const sp = head.lastIndexOf(' ');
  const slice = sp > Math.floor(max * 0.35) ? head.slice(0, sp) : head;
  return `${slice.trimEnd()}…`;
}

/** 是否像 ERP / 飞书 SKU、产品型号（非可读标题） */
export function isSkuLikeProductCode(s: string): boolean {
  const t = (s ?? '').trim();
  if (!t || t.length > 40) return false;
  if (/\s/.test(t)) return false;
  if (/^T\d+[A-Z0-9]+$/i.test(t)) return true;
  if (/^[A-Z]{1,3}\d+[A-Z0-9_-]*$/i.test(t) && t.length <= 24) return true;
  return /^[A-Z0-9_-]{5,22}$/i.test(t) && !/[aeiou]{2,}/i.test(t);
}

/** 从长描述 / 详情 HTML 提取首句作标题 */
export function titleLeadFromLongText(text: string, maxLen = STORE_SHORT_TITLE_MAX_CHARS): string {
  const plain = (text ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!plain) return '';
  const sent = plain.match(/^[\s\S]{12,240}?[.!?](?:\s|$)/);
  const block = sent ? sent[0].trim() : plain;
  if (block.length <= maxLen) return block;
  const cut = block.slice(0, maxLen);
  const sp = cut.lastIndexOf(' ');
  return `${(sp > Math.floor(maxLen * 0.4) ? cut.slice(0, sp) : cut).trimEnd()}…`;
}

/** 前台展示用主标题：短标题 → 可读 name → 描述/详情首句 → 卖点 → 系列回退（不用 SKU） */
export function resolveStoreProductDisplayTitle(
  product: Pick<Product, 'name' | 'category'> &
    Partial<Pick<Product, 'shortTitle' | 'description' | 'detailHtml' | 'features' | 'subCategory'>>,
  maxChars = STORE_SHORT_TITLE_MAX_CHARS,
): string {
  const name = (product.name || '').trim();
  const short = (product.shortTitle || '').trim();

  if (short && !isSkuLikeProductCode(short)) return abbreviateStoreTitle(short, maxChars);
  if (name && !isSkuLikeProductCode(name)) return abbreviateStoreTitle(name, maxChars);

  const desc = (product.description || '').trim();
  if (desc && !isSkuLikeProductCode(desc)) {
    const lead = titleLeadFromLongText(desc, maxChars);
    if (lead) return abbreviateStoreTitle(lead, maxChars);
  }

  const detail = (product.detailHtml || '').trim();
  if (detail) {
    const lead = titleLeadFromLongText(detail, maxChars);
    if (lead && !isSkuLikeProductCode(lead)) return abbreviateStoreTitle(lead, maxChars);
  }

  const feat = product.features?.map((f) => String(f).trim()).find((f) => f && !isSkuLikeProductCode(f));
  if (feat) return abbreviateStoreTitle(feat, maxChars);

  const fallback = fallbackStoreProductTitleFromMeta(
    { category: product.category ?? '', subCategory: product.subCategory },
    undefined,
  );
  if (fallback) return abbreviateStoreTitle(fallback, maxChars);

  return abbreviateStoreTitle('Product', maxChars);
}

/** 列表 / 卡片标题：不用长描述 detailHtml，避免栅格出现整段 Product Story 首句；绝不展示 SKU 型号 */
export function displayStoreProductListTitle(
  product: Pick<Product, 'name' | 'category'> &
    Partial<Pick<Product, 'shortTitle' | 'description' | 'detailHtml' | 'features' | 'subCategory'>>,
  maxChars = STORE_SHORT_TITLE_MAX_CHARS,
  options?: { categorySlug?: string },
): string {
  const name = (product.name || '').trim();
  const short = (product.shortTitle || '').trim();

  if (short && !isSkuLikeProductCode(short)) return abbreviateStoreTitle(short, maxChars);
  if (name && !isSkuLikeProductCode(name)) return abbreviateStoreTitle(name, maxChars);

  const desc = (product.description || '').trim();
  if (desc && !isSkuLikeProductCode(desc)) {
    const lead = titleLeadFromLongText(desc, maxChars);
    if (lead) return abbreviateStoreTitle(lead, maxChars);
  }

  const feat = product.features?.map((f) => String(f).trim()).find((f) => f && !isSkuLikeProductCode(f));
  if (feat) return abbreviateStoreTitle(feat, maxChars);

  const fallback = fallbackStoreProductTitleFromMeta(product, options?.categorySlug);
  if (fallback) return abbreviateStoreTitle(fallback, maxChars);

  return abbreviateStoreTitle('Product', maxChars);
}

const CATEGORY_SINGULAR: Record<string, string> = {
  tables: 'Table',
  cabinets: 'Cabinet',
  sofas: 'Sofa',
  chairs: 'Chair',
  bedroom: 'Bedroom Piece',
  patio: 'Outdoor Piece',
  decor: 'Decor',
};

function titleCaseWords(s: string): string {
  return s
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/** name/shortTitle 仅为 SKU 时，用子系列 + 品类生成可读列表标题 */
export function fallbackStoreProductTitleFromMeta(
  product: Pick<Product, 'category'> & Partial<Pick<Product, 'subCategory'>>,
  categorySlug?: string,
): string {
  const slug = (categorySlug || product.category || '').trim().toLowerCase();
  const kind = CATEGORY_SINGULAR[slug] || titleCaseWords(slug.replace(/-/g, ' ')) || 'Product';
  const subRaw = (product.subCategory || '').trim();
  if (subRaw) {
    const series = titleCaseWords(subRaw.replace(/^series\s*:\s*/i, ''));
    return series ? `${series} ${kind}` : kind;
  }
  return kind;
}

/** 详情 H1 / 购物车等：允许从 detailHtml 推断标题 */
export function displayStoreProductTitle(
  product: Pick<Product, 'name'> &
    Partial<Pick<Product, 'shortTitle' | 'description' | 'detailHtml' | 'features' | 'category' | 'subCategory'>>,
  maxChars = STORE_SHORT_TITLE_MAX_CHARS,
): string {
  return resolveStoreProductDisplayTitle(
    {
      name: product.name,
      category: product.category ?? '',
      shortTitle: product.shortTitle,
      description: product.description,
      detailHtml: product.detailHtml,
      features: product.features,
      subCategory: product.subCategory,
    },
    maxChars,
  );
}

/**
 * 调用你部署的缩写服务（例如 Cloudflare Worker → OpenAI）。
 * 未配置 URL 或请求失败时返回 `null`，由调用方使用 {@link abbreviateStoreTitle}。
 */
export async function rewriteStoreTitleViaAiEndpoint(
  raw: string,
  signal?: AbortSignal,
): Promise<string | null> {
  const url = (import.meta.env.VITE_PRODUCT_SHORT_TITLE_AI_URL as string | undefined)?.trim();
  if (!url) return null;
  const text = (raw ?? '').trim();
  if (!text) return null;

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), AI_TIMEOUT_MS);
  const onParentAbort = () => ctrl.abort();
  if (signal) {
    if (signal.aborted) ctrl.abort();
    else signal.addEventListener('abort', onParentAbort, { once: true });
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/plain;q=0.9' },
      body: JSON.stringify({ text, maxChars: STORE_SHORT_TITLE_MAX_CHARS }),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (signal) signal.removeEventListener('abort', onParentAbort);

    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const j = (await res.json()) as { shortTitle?: string; title?: string };
      const s = String(j.shortTitle ?? j.title ?? '').trim();
      return s || null;
    }
    const plain = (await res.text()).trim();
    return plain || null;
  } catch {
    clearTimeout(t);
    if (signal) signal.removeEventListener('abort', onParentAbort);
    return null;
  }
}

/**
 * 导入完成后：若配置了 `VITE_PRODUCT_SHORT_TITLE_AI_URL`，逐条尝试 AI 短标题；
 * 否则直接返回（`processImportedProductRows` 内已做规则缩写）。
 */
export async function enrichImportedProductsWithShortTitles(
  products: Omit<Product, 'id' | 'createdAt'>[],
  options?: { signal?: AbortSignal },
): Promise<Omit<Product, 'id' | 'createdAt'>[]> {
  const url = (import.meta.env.VITE_PRODUCT_SHORT_TITLE_AI_URL as string | undefined)?.trim();
  if (!url) return products;

  const out: typeof products = [];
  for (const p of products) {
    const raw = ((p.shortTitle || p.name) as string).trim();
    if (!raw) {
      out.push(p);
      continue;
    }
    let ai: string | null = null;
    try {
      ai = await rewriteStoreTitleViaAiEndpoint(raw, options?.signal);
    } catch {
      ai = null;
    }
    const next =
      ai != null && ai.length > 0
        ? abbreviateStoreTitle(ai)
        : abbreviateStoreTitle(raw);
    const nameTrim = (p.name as string).trim();
    out.push({
      ...p,
      shortTitle: next && next !== nameTrim ? next : undefined,
    });
  }
  return out;
}
