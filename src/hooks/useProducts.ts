import { useState, useEffect } from 'react';
import { Product } from '../types';
import { productsData } from '../data/products';
import { getLocalProducts, getLocalProductsByCategory, getLocalProductById, subscribeLocalDb } from '../lib/localDb';

/**
 * 优先使用 localStorage 商品。
 * 若本地一条都没有（例如刚剔除种子、尚未导入），则临时展示 `productsData` 演示目录，避免全站空白；一旦有写入本地的商品则只显示本地数据。
 */
export function useProducts(categorySlug?: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingDemoFallback, setUsingDemoFallback] = useState(false);

  useEffect(() => {
    const sync = () => {
      const raw = categorySlug ? getLocalProductsByCategory(categorySlug) : getLocalProducts();
      if (raw.length > 0) {
        setProducts(raw.map((p) => ({ ...p })));
        setUsingDemoFallback(false);
      } else {
        const demo = categorySlug ? productsData.filter((p) => p.category === categorySlug) : productsData;
        setProducts(demo.map((p) => ({ ...p })));
        setUsingDemoFallback(true);
      }
      setLoading(false);
    };
    sync();
    return subscribeLocalDb(sync);
  }, [categorySlug]);

  return { products, loading, usingDemoFallback };
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
      if (found) {
        setProduct({ ...found });
      } else {
        const demo = productsData.find((p) => p.id === id);
        setProduct(demo ? { ...demo } : null);
      }
      setLoading(false);
    };
    sync();
    return subscribeLocalDb(sync);
  }, [id]);

  return { product, loading };
}
