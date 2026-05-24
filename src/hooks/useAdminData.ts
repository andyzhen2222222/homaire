import { useState, useEffect, useMemo, useCallback } from 'react';
import { Order, OrderStatus, Promotion, Product, StoreConfig, Category } from '../types';
import { isRemoteStoreEnabled } from '../lib/storeConfig';
import { patchOrderOnServer, syncAdminChangeToServer } from '../lib/remoteStore';
import {
  subscribeLocalDb,
  getLocalOrdersSorted,
  getLocalOrderById,
  localUpdateOrderStatus,
  localMarkOrderProcessing,
  localShipOrder,
  localUpdateOrderAdminNote,
  LocalOrder,
  getLocalPromotionsSorted,
  localTogglePromotion,
  localDeletePromotion,
  localAddPromotion,
  localAddProduct,
  localUpdateProduct,
  localDeleteProduct,
  localBulkAddProducts,
  getLocalConfig,
  localUpdateConfig,
  getLocalCategoriesSorted,
  localAddCategory,
  localUpdateCategory,
  localDeleteCategory,
} from '../lib/localDb';
import { handleFirestoreError, OperationType } from '../lib/dataErrors';
import {
  type OrderListQuery,
  queryOrders,
  seedDemoOrderIfEmpty,
} from '../lib/adminOrders';

export function useOrders() {
  const admin = useAdminOrders();
  return {
    orders: admin.allOrders,
    loading: admin.loading,
    updateOrderStatus: admin.updateOrderStatus,
  };
}

export function useAdminOrders(initialQuery: OrderListQuery = { status: 'all' }) {
  const [allOrders, setAllOrders] = useState<LocalOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState<OrderListQuery>(initialQuery);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => {
      setAllOrders(getLocalOrdersSorted());
      setLoading(false);
    };
    sync();
    return subscribeLocalDb(sync);
  }, []);

  const orders = useMemo(() => queryOrders(allOrders, query), [allOrders, query]);

  const selectedOrder = useMemo(() => {
    if (!selectedId) return null;
    return getLocalOrderById(selectedId) ?? null;
  }, [selectedId, allOrders]);

  const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    try {
      if (isRemoteStoreEnabled()) {
        await patchOrderOnServer(orderId, { status });
        return;
      }
      localUpdateOrderStatus(orderId, status);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
      throw error;
    }
  }, []);

  const markProcessing = useCallback(async (orderId: string) => {
    try {
      if (isRemoteStoreEnabled()) {
        await patchOrderOnServer(orderId, { status: 'processing' });
        return;
      }
      localMarkOrderProcessing(orderId);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
      throw error;
    }
  }, []);

  const shipOrder = useCallback(
    async (orderId: string, payload: { carrier: string; trackingNumber: string }) => {
      try {
        if (isRemoteStoreEnabled()) {
          await patchOrderOnServer(orderId, {
            status: 'shipped',
            carrier: payload.carrier.trim(),
            trackingNumber: payload.trackingNumber.trim(),
            shippedAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
          });
          return;
        }
        localShipOrder(orderId, payload);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
        throw error;
      }
    },
    []
  );

  const saveAdminNote = useCallback(async (orderId: string, note: string) => {
    try {
      if (isRemoteStoreEnabled()) {
        await patchOrderOnServer(orderId, { adminNote: note.trim() || undefined });
        return;
      }
      localUpdateOrderAdminNote(orderId, note);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
      throw error;
    }
  }, []);

  const seedDemo = useCallback(() => {
    void seedDemoOrderIfEmpty();
  }, []);

  return {
    allOrders,
    orders,
    loading,
    query,
    setQuery,
    selectedId,
    setSelectedId,
    selectedOrder,
    updateOrderStatus,
    markProcessing,
    shipOrder,
    saveAdminNote,
    seedDemo,
  };
}

export function usePromotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sync = () => {
      setPromotions(getLocalPromotionsSorted());
      setLoading(false);
    };
    sync();
    return subscribeLocalDb(sync);
  }, []);

  const togglePromotion = async (id: string, active: boolean) => {
    try {
      localTogglePromotion(id, active);
      await syncAdminChangeToServer();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `promotions/${id}`);
    }
  };

  const deletePromotion = async (id: string) => {
    try {
      localDeletePromotion(id);
      await syncAdminChangeToServer();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `promotions/${id}`);
    }
  };

  const addPromotion = async (promo: Omit<Promotion, 'id' | 'createdAt'>) => {
    try {
      localAddPromotion(promo);
      await syncAdminChangeToServer();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'promotions');
    }
  };

  return { promotions, loading, togglePromotion, deletePromotion, addPromotion };
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sync = () => {
      setCategories(getLocalCategoriesSorted());
      setLoading(false);
    };
    sync();
    return subscribeLocalDb(sync);
  }, []);

  const addCategory = async (cat: Omit<Category, 'id'>) => {
    try {
      localAddCategory(cat);
      await syncAdminChangeToServer();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'categories');
    }
  };

  const updateCategory = async (id: string, updates: Partial<Omit<Category, 'id'>>) => {
    try {
      localUpdateCategory(id, updates);
      await syncAdminChangeToServer();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `categories/${id}`);
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      localDeleteCategory(id);
      await syncAdminChangeToServer();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `categories/${id}`);
    }
  };

  return { categories, loading, addCategory, updateCategory, deleteCategory };
}

export function useAdminActions() {
  const addProduct = async (product: Omit<Product, 'id' | 'createdAt'>) => {
    try {
      localAddProduct(product);
      await syncAdminChangeToServer();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'products');
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      localUpdateProduct(id, updates);
      await syncAdminChangeToServer();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${id}`);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      localDeleteProduct(id);
      await syncAdminChangeToServer();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
    }
  };

  const bulkAddProducts = async (products: Omit<Product, 'id' | 'createdAt'>[]) => {
    if (isRemoteStoreEnabled()) {
      try {
        localBulkAddProducts(products);
        await syncAdminChangeToServer();
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'products');
      }
      return;
    }
    const BATCH = 35;
    let written = 0;
    for (let i = 0; i < products.length; i += BATCH) {
      const slice = products.slice(i, i + BATCH);
      try {
        localBulkAddProducts(slice);
        written += slice.length;
      } catch (error: unknown) {
        const isQuota =
          (typeof DOMException !== 'undefined' &&
            error instanceof DOMException &&
            error.name === 'QuotaExceededError') ||
          (error instanceof Error && /QuotaExceeded|quota|NS_ERROR_DOM_QUOTA_REACHED/i.test(error.message));
        if (isQuota && written > 0) {
          throw new Error(
            `Imported ${written} items; browser storage is full. Remove some products and import in smaller batches.`
          );
        }
        handleFirestoreError(error, OperationType.WRITE, 'products');
      }
    }
  };

  return { addProduct, bulkAddProducts, updateProduct, deleteProduct };
}

export function useStoreConfig() {
  const [config, setConfig] = useState<StoreConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sync = () => {
      setConfig(getLocalConfig());
      setLoading(false);
    };
    sync();
    return subscribeLocalDb(sync);
  }, []);

  const updateConfig = async (updates: Partial<StoreConfig>) => {
    try {
      localUpdateConfig(updates);
      await syncAdminChangeToServer();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'config/global');
    }
  };

  return { config, loading, updateConfig };
}
