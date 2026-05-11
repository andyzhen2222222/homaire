import { useState, useEffect } from 'react';
import { Product } from '../types';
import { productsData } from '../data/products';
import { getLocalProducts, getLocalProductsByCategory, getLocalProductById, subscribeLocalDb } from '../lib/localDb';

const mergeWithMockProduct = (product: Product): Product => {
  const mock = productsData.find((item) => item.id === product.id);
  return mock ? { ...mock, ...product } : product;
};

export function useProducts(categorySlug?: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sync = () => {
      const raw = categorySlug ? getLocalProductsByCategory(categorySlug) : getLocalProducts();
      let list = raw.map((p) => mergeWithMockProduct({ ...p }));
      if (list.length === 0) {
        list = (categorySlug ? productsData.filter((p) => p.category === categorySlug) : productsData).map(
          mergeWithMockProduct
        );
      }
      setProducts(list);
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
      if (found) {
        setProduct(mergeWithMockProduct({ ...found }));
      } else {
        const mock = productsData.find((p) => p.id === id);
        setProduct(mock ? mergeWithMockProduct(mock) : null);
      }
      setLoading(false);
    };
    sync();
    return subscribeLocalDb(sync);
  }, [id]);

  return { product, loading };
}
