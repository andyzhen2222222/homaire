/** 店铺价格统一为整数（欧元等展示货币） */
const INTEGER_MONEY: Intl.NumberFormatOptions = {
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
};

export function roundStorePrice(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n);
}

export function formatStorePriceAmount(amount: number, locale?: string): string {
  return roundStorePrice(amount).toLocaleString(locale, INTEGER_MONEY);
}

/** 前台/后台 EUR 展示：`€ 1,234` */
export function formatEurPrice(amount: number): string {
  return `€ ${formatStorePriceAmount(amount)}`;
}

/** 紧凑 EUR：`€1,234`（部分卡片沿用无空格样式） */
export function formatEurPriceCompact(amount: number): string {
  return `€${formatStorePriceAmount(amount)}`;
}

export function normalizeProductPrices<T extends { price: number; discountPrice?: number }>(product: T): T {
  const price = roundStorePrice(product.price);
  let discountPrice = product.discountPrice;
  if (discountPrice != null && discountPrice > 0) {
    discountPrice = roundStorePrice(discountPrice);
    if (discountPrice >= price) discountPrice = 0;
  } else {
    discountPrice = 0;
  }
  return { ...product, price, discountPrice };
}
