import { useEffect, useState } from 'react';
import {
  getProductListImageUrl,
  PRODUCT_LIST_IMAGE_PLACEHOLDER,
} from '../lib/productImages';
import type { Product } from '../types';

type Props = {
  product: Pick<Product, 'images'>;
  alt: string;
  className?: string;
};

/** 列表/首页栅格主图：1:1 裁切、懒加载、失败回退占位图 */
export function ProductListImage({ product, alt, className = '' }: Props) {
  const primary = getProductListImageUrl(product);
  const [src, setSrc] = useState(primary);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    setSrc(primary);
    setUseFallback(false);
  }, [primary]);

  return (
    <img
      src={useFallback ? PRODUCT_LIST_IMAGE_PLACEHOLDER : src}
      alt={alt}
      className={`h-full w-full object-cover object-center ${className}`.trim()}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => {
        if (useFallback) return;
        const list = (product.images || [])
          .map((u) => String(u).trim())
          .filter((u) => u.startsWith('http') && u !== src);
        const next = list.find((u) => u !== src);
        if (next) {
          setSrc(next);
          return;
        }
        setUseFallback(true);
      }}
    />
  );
}
