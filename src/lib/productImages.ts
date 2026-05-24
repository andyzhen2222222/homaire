import type { Product } from '../types';
import { IMPORT_FALLBACK_IMAGE } from './productImport';

/** 列表/栅格主图比例：1:1，与详情轮播区分 */
export const PRODUCT_LIST_IMAGE_ASPECT_CLASS = 'aspect-square';

export const PRODUCT_LIST_IMAGE_PLACEHOLDER = IMPORT_FALLBACK_IMAGE;

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|bmp|avif)(\?|$)/i;

/** 从单元格文本中提取可加载的图片 URL（支持 Markdown 链接） */
export function extractHttpImageUrl(raw: unknown): string {
  const t = String(raw ?? '').trim();
  if (!t) return '';
  const paren = t.match(/\((https?:\/\/[^)\s]+)\)/i);
  if (paren?.[1]) return paren[1].trim();
  const plain = t.match(/https?:\/\/[^\s)\]"']+/i);
  if (plain?.[0]) return plain[0].trim();
  if (t.startsWith('http://') || t.startsWith('https://')) return t.split(/\s/)[0];
  return '';
}

function isUsableProductPhotoUrl(url: string): boolean {
  const u = url.trim();
  if (!u.startsWith('http')) return false;
  if (/\.pdf(\?|$)/i.test(u)) return false;
  if (/logo/i.test(u) && !IMAGE_EXT.test(u)) return false;
  return IMAGE_EXT.test(u) || u.includes('/open/') || u.includes('oss') || u.includes('ribuluo');
}

/** 飞书/大健：优先 图片1–8，再 原图片1–8；跳过 logo */
export function collectProductImageUrlsFromRow(item: Record<string, unknown>): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();
  const push = (raw: unknown) => {
    const u = extractHttpImageUrl(raw);
    if (!u || !isUsableProductPhotoUrl(u)) return;
    if (seen.has(u)) return;
    seen.add(u);
    urls.push(u);
  };
  for (let i = 1; i <= 8; i += 1) push(item[`图片${i}`]);
  for (let i = 1; i <= 8; i += 1) push(item[`原图片${i}`]);
  // logo 仅作最后兜底
  push(item['logo图1']);
  return urls;
}

/** 清洗并去重商品图库 */
export function normalizeProductImageList(images: unknown): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const add = (raw: unknown) => {
    const u = extractHttpImageUrl(raw);
    if (!u || !isUsableProductPhotoUrl(u) || seen.has(u)) return;
    seen.add(u);
    out.push(u);
  };
  if (typeof images === 'string') {
    images.split(/[,;\n]/).forEach(add);
  } else if (Array.isArray(images)) {
    images.forEach(add);
  }
  return out.slice(0, 8);
}

/** 列表页主图：取第一张可用图，否则占位 */
export function getProductListImageUrl(product: Pick<Product, 'images'>): string {
  const list = normalizeProductImageList(product.images);
  return list[0] || PRODUCT_LIST_IMAGE_PLACEHOLDER;
}

/** 导入后规范化整条商品的 images */
export function normalizeProductImages<T extends Pick<Product, 'images'>>(product: T): T {
  const list = normalizeProductImageList(product.images);
  return {
    ...product,
    images: list.length > 0 ? list : [PRODUCT_LIST_IMAGE_PLACEHOLDER],
  };
}
