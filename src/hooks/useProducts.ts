import { useState, useEffect } from 'react';
import { Product } from '../types';
import { getLocalProducts, getLocalProductsByCategory, getLocalProductById, subscribeLocalDb } from '../lib/localDb';

/** 仅使用 localStorage 中的商品，不再回退到内置演示目录 */
export function useProducts(categorySlug?: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sync = () => {
      const raw = categorySlug ? getLocalProductsByCategory(categorySlug) : getLocalProducts();
      setProducts(raw.map((p) => ({ ...p })));
      setLoading(false);
    };
    sync();
    return subscribeLocalDb(sync);
  }, [categorySlug]);

  return { products, loading };
}

export function useProduct(id: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sync = () => {
      if (!id) {
        setProduct(null);
        setLoading(false);
        return;
      }
      const found = getLocalProductById(id);
      setProduct(found ? { ...found } : null);
      setLoading(false);
    };
    sync();
    return subscribeLocalDb(sync);
  }, [id]);

  return { product, loading };
}
