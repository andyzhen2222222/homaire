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
function dedupeConsecutiveWords(s: string): string {
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

/** 列表 / 卡片 / 购物车 / 订单行：优先 `shortTitle`，否则对 `name` 做 {@link abbreviateStoreTitle} */
export function displayStoreProductTitle(
  product: Pick<Product, 'name'> & Partial<Pick<Product, 'shortTitle'>>,
  maxChars = STORE_SHORT_TITLE_MAX_CHARS,
): string {
  return abbreviateStoreTitle((product.shortTitle || product.name).trim(), maxChars);
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
