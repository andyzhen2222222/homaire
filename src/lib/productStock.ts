import type { Product } from '../types';

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
