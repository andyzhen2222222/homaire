import { useState, useEffect, useCallback } from 'react';
import type { Category, Promotion, StoreConfig } from '../types';
import { isRemoteStoreEnabled } from '../lib/storeConfig';
import {
  fetchCategoriesFromApi,
  fetchPromotionsFromApi,
  fetchStoreConfigFromApi,
} from '../lib/catalogApi';
import {
  getLocalCategoriesSorted,
  getLocalConfig,
  getLocalPromotionsSorted,
  subscribeLocalDb,
} from '../lib/localDb';
import { onCatalogInvalidate } from '../lib/catalogEvents';

function useRemoteRefetch(load: () => void | Promise<void>, remote: boolean) {
  useEffect(() => {
    void load();
    if (!remote) return subscribeLocalDb(() => void load());
    return onCatalogInvalidate(() => void load());
  }, [load, remote]);
}

export function useCategoriesLive() {
  const remote = isRemoteStoreEnabled();
  const [categories, setCategories] = useState<Category[]>([]);
  const [productCountsBySlug, setProductCountsBySlug] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (remote) {
        const data = await fetchCategoriesFromApi();
        setCategories(data.categories);
        setProductCountsBySlug(data.productCountsBySlug);
      } else {
        setCategories(getLocalCategoriesSorted());
        setProductCountsBySlug({});
      }
    } catch {
      setCategories(remote ? [] : getLocalCategoriesSorted());
      setProductCountsBySlug({});
    } finally {
      setLoading(false);
    }
  }, [remote]);

  useRemoteRefetch(load, remote);
  return { categories, productCountsBySlug, loading, refetch: load };
}

export function useStoreConfigLive() {
  const remote = isRemoteStoreEnabled();
  const [config, setConfig] = useState<StoreConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (remote) {
        setConfig(await fetchStoreConfigFromApi());
      } else {
        setConfig(getLocalConfig());
      }
    } catch {
      setConfig(remote ? null : getLocalConfig());
    } finally {
      setLoading(false);
    }
  }, [remote]);

  useRemoteRefetch(load, remote);
  return { config, loading, refetch: load };
}

export function usePromotionsLive(active = true) {
  const remote = isRemoteStoreEnabled();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (remote) {
        setPromotions(await fetchPromotionsFromApi(active));
      } else {
        setPromotions(getLocalPromotionsSorted());
      }
    } catch {
      setPromotions(remote ? [] : getLocalPromotionsSorted());
    } finally {
      setLoading(false);
    }
  }, [remote, active]);

  useRemoteRefetch(load, remote);
  return { promotions, loading, refetch: load };
}
