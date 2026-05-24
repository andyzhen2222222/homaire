import type { StoreConfig } from '../types';
import { formatStorePriceAmount, roundStorePrice } from './storePrice';

export const DEFAULT_SHIPPING_FREE_THRESHOLD = 500;
export const DEFAULT_SHIPPING_FLAT_FEE = 49.95;

export const DEFAULT_PRODUCT_DETAIL_STOCK_LABEL = 'Available stock';
export const DEFAULT_PRODUCT_DETAIL_SHIPPING_LABEL = 'Estimated shipping';
export const DEFAULT_PRODUCT_DETAIL_SHIPPING_FREE_LABEL = 'Complimentary shipping';
export const DEFAULT_PRODUCT_DETAIL_LOW_STOCK_HINT = 'Low stock — order soon';
export const DEFAULT_PRODUCT_DETAIL_OUT_OF_STOCK_HINT = 'Out of stock';

/** Product detail shipping footnote; placeholders {threshold}, {flat} (formatted) */
export const DEFAULT_PRODUCT_DETAIL_SHIPPING_FOOTNOTE_TEMPLATE =
  'Free shipping when line subtotal exceeds {threshold}; otherwise {flat} applies. Final rates at checkout.';

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
  const n = roundStorePrice(amount);
  const cu = (currency || 'EUR').toUpperCase();
  if (cu === 'EUR') return `€ ${formatStorePriceAmount(n)}`;
  return `${cu} ${formatStorePriceAmount(n)}`;
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
