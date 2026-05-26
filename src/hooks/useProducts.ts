import { useState, useEffect, useCallback, useMemo } from 'react';
import { Product } from '../types';
import {
  getLocalProducts,
  getLocalProductsByCategory,
  getLocalProductById,
  subscribeLocalDb,
} from '../lib/localDb';
import { isRemoteStoreEnabled } from '../lib/storeConfig';
import { fetchProductsFromApi, fetchProductByIdFromApi, type FetchProductsParams } from '../lib/catalogApi';
import { onCatalogInvalidate } from '../lib/catalogEvents';

export type UseProductsOptions = FetchProductsParams & {
  /** 为 false 时不请求（用于条件渲染） */
  enabled?: boolean;
};

function normalizeOptions(input?: string | UseProductsOptions): UseProductsOptions {
  if (typeof input === 'string') return { category: input };
  return input ?? {};
}

/** 店铺前台：远程模式下每页实时 GET /api/v1/products；离线时读 localStorage */
export function useProducts(options?: string | UseProductsOptions) {
  const normalized = normalizeOptions(options);
  const remote = isRemoteStoreEnabled();
  const enabled = normalized.enabled !== false;

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryKey = useMemo(
    () =>
      JSON.stringify({
        category: normalized.category,
        subCategory: normalized.subCategory,
        onSale: normalized.onSale,
        minPrice: normalized.minPrice,
        maxPrice: normalized.maxPrice,
        q: normalized.q,
        sort: normalized.sort,
        page: normalized.page,
        limit: normalized.limit,
      }),
    [
      normalized.category,
      normalized.subCategory,
      normalized.onSale,
      normalized.minPrice,
      normalized.maxPrice,
      normalized.q,
      normalized.sort,
      normalized.page,
      normalized.limit,
    ]
  );

  const load = useCallback(async () => {
    if (!enabled) {
      setProducts([]);
      setTotal(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (remote) {
        const result = await fetchProductsFromApi(normalized);
        setProducts(result.items);
        setTotal(result.total);
      } else {
        const raw = normalized.category
          ? getLocalProductsByCategory(normalized.category)
          : getLocalProducts();
        setProducts(raw.map((p) => ({ ...p })));
        setTotal(raw.length);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setProducts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [enabled, remote, queryKey]);

  useEffect(() => {
    void load();
    if (!remote) {
      return subscribeLocalDb(() => {
        void load();
      });
    }
    return onCatalogInvalidate(() => {
      void load();
    });
  }, [load, remote]);

  return { products, total, loading, error, refetch: load };
}

export function useProduct(id: string) {
  const remote = isRemoteStoreEnabled();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setProduct(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (remote) {
        const found = await fetchProductByIdFromApi(id);
        setProduct(found);
      } else {
        const found = getLocalProductById(id);
        setProduct(found ? { ...found } : null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, [id, remote]);

  useEffect(() => {
    void load();
    if (!remote) {
      return subscribeLocalDb(() => {
        void load();
      });
    }
    return onCatalogInvalidate(() => {
      void load();
    });
  }, [load, remote]);

  return { product, loading, error, refetch: load };
}
