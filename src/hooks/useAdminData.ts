import { useState, useEffect } from 'react';
import { Order, Promotion, Product, StoreConfig } from '../types';
import {
  subscribeLocalDb,
  getLocalOrdersSorted,
  localUpdateOrderStatus,
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
} from '../lib/localDb';
import { handleFirestoreError, OperationType } from '../lib/dataErrors';

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sync = () => {
      setOrders(getLocalOrdersSorted());
      setLoading(false);
    };
    sync();
    return subscribeLocalDb(sync);
  }, []);

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      localUpdateOrderStatus(orderId, status);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  return { orders, loading, updateOrderStatus };
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
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `promotions/${id}`);
    }
  };

  const deletePromotion = async (id: string) => {
    try {
      localDeletePromotion(id);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `promotions/${id}`);
    }
  };

  const addPromotion = async (promo: Omit<Promotion, 'id' | 'createdAt'>) => {
    try {
      localAddPromotion(promo);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'promotions');
    }
  };

  return { promotions, loading, togglePromotion, deletePromotion, addPromotion };
}

export function useAdminActions() {
  const addProduct = async (product: Omit<Product, 'id' | 'createdAt'>) => {
    try {
      localAddProduct(product);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'products');
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      localUpdateProduct(id, updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${id}`);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      localDeleteProduct(id);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
    }
  };

  const bulkAddProducts = async (products: Omit<Product, 'id' | 'createdAt'>[]) => {
    try {
      localBulkAddProducts(products);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'products');
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
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'config/global');
    }
  };

  return { config, loading, updateConfig };
}
