import type { Product } from '../types';
import { roundStorePrice } from './storePrice';

export function getProductStockQty(stock: unknown): number {
  const n = Number(stock);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

export function isProductOutOfStock(product: Pick<Product, 'stock'>): boolean {
  return getProductStockQty(product.stock) <= 0;
}

export function isProductLowStock(
  product: Pick<Product, 'stock'>,
  lowStockThreshold: number
): boolean {
  const qty = getProductStockQty(product.stock);
  return qty > 0 && qty < Math.max(1, lowStockThreshold);
}

/** 前台实际支付价：促销时用 discountPrice，否则 price */
export function getProductPayPrice(
  product: Pick<Product, 'price' | 'discountPrice' | 'onSale'>
): number {
  const list = roundStorePrice(product.price);
  const deal =
    product.onSale && product.discountPrice != null && product.discountPrice > 0
      ? roundStorePrice(product.discountPrice)
      : 0;
  return deal > 0 && deal < list ? deal : list;
}
