import type { StoreConfig } from '../types';

export const DEFAULT_SHIPPING_FREE_THRESHOLD = 500;
export const DEFAULT_SHIPPING_FLAT_FEE = 49.95;

export const DEFAULT_PRODUCT_DETAIL_STOCK_LABEL = '可用库存';
export const DEFAULT_PRODUCT_DETAIL_SHIPPING_LABEL = '预估运费';
export const DEFAULT_PRODUCT_DETAIL_SHIPPING_FREE_LABEL = '免运费';
export const DEFAULT_PRODUCT_DETAIL_LOW_STOCK_HINT = '库存偏紧，建议尽快下单';
export const DEFAULT_PRODUCT_DETAIL_OUT_OF_STOCK_HINT = '暂时无货';

/** 详情页运费说明；支持占位符 {threshold}、{flat}（已带货币格式） */
export const DEFAULT_PRODUCT_DETAIL_SHIPPING_FOOTNOTE_TEMPLATE =
  '按当前数量 × 单价满 {threshold} 免运费，否则加收 {flat}；以结账页为准。';

export function getShippingFreeThreshold(config?: StoreConfig | null): number {
  const n = config?.shippingFreeThreshold;
  if (typeof n === 'number' && Number.isFinite(n) && n > 0) return n;
  return DEFAULT_SHIPPING_FREE_THRESHOLD;
}

export function getShippingFlatFee(config?: StoreConfig | null): number {
  const n = config?.shippingFlatFee;
  if (typeof n === 'number' && Number.isFinite(n) && n >= 0) return n;
  return DEFAULT_SHIPPING_FLAT_FEE;
}

/** 与站点其余价格展示一致：EUR 用 € 前缀 */
export function formatStoreMoney(amount: number, currency?: string | null): string {
  const cu = (currency || 'EUR').toUpperCase();
  if (cu === 'EUR') return `€ ${amount.toLocaleString()}`;
  return `${cu} ${amount.toLocaleString()}`;
}

export function getProductDetailStockLabel(config?: StoreConfig | null): string {
  const s = config?.productDetailStockLabel?.trim();
  return s || DEFAULT_PRODUCT_DETAIL_STOCK_LABEL;
}

export function getProductDetailShippingLabel(config?: StoreConfig | null): string {
  const s = config?.productDetailShippingLabel?.trim();
  return s || DEFAULT_PRODUCT_DETAIL_SHIPPING_LABEL;
}

export function getProductDetailShippingFreeLabel(config?: StoreConfig | null): string {
  const s = config?.productDetailShippingFreeLabel?.trim();
  return s || DEFAULT_PRODUCT_DETAIL_SHIPPING_FREE_LABEL;
}

export function getProductDetailLowStockHint(config?: StoreConfig | null): string {
  const s = config?.productDetailLowStockHint?.trim();
  return s || DEFAULT_PRODUCT_DETAIL_LOW_STOCK_HINT;
}

export function getProductDetailOutOfStockHint(config?: StoreConfig | null): string {
  const s = config?.productDetailOutOfStockHint?.trim();
  return s || DEFAULT_PRODUCT_DETAIL_OUT_OF_STOCK_HINT;
}

export function getProductDetailShippingFootnote(
  config: StoreConfig | null | undefined,
  ctx: { threshold: number; flatFee: number }
): string {
  const currency = config?.currency;
  const thresholdStr = formatStoreMoney(ctx.threshold, currency);
  const flatStr = formatStoreMoney(ctx.flatFee, currency);
  const raw = config?.productDetailShippingFootnote?.trim();
  const template = raw || DEFAULT_PRODUCT_DETAIL_SHIPPING_FOOTNOTE_TEMPLATE;
  return template.replace(/\{threshold\}/g, thresholdStr).replace(/\{flat\}/g, flatStr);
}
