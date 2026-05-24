import type { Product } from '../types';

/** 前台详情页 Highlights：优先 features，否则从长描述段落推断 */
export function resolveProductHighlights(
  product: Pick<Product, 'features' | 'description' | 'detailHtml'>
): string[] {
  const fromDb = (product.features ?? []).map((f) => String(f).trim()).filter(Boolean);
  if (fromDb.length > 0) return fromDb.slice(0, 8);

  const html = (product.detailHtml || '').trim();
  if (html) {
    const plainParas = html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
      .split(/\n{2,}/)
      .map((p) => p.replace(/\s+/g, ' ').trim())
      .filter((p) => p.length >= 40);
    if (plainParas.length >= 2) return plainParas.slice(1, 5);
    if (plainParas.length === 1) {
      const sents = plainParas[0]
        .split(/(?<=[.!?])\s+(?=[A-Z"“])/)
        .map((s) => s.trim())
        .filter((s) => s.length >= 40);
      if (sents.length >= 2) return sents.slice(1, 5);
    }
  }

  const desc = (product.description || '').trim();
  if (desc.length >= 40) return [desc.slice(0, 280)];

  return [];
}
