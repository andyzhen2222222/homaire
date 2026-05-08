import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Order, Promotion, Product, StoreConfig } from '../types';

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setOrders(fetchedOrders);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, { status });
  };

  return { orders, loading, updateOrderStatus };
}

export function usePromotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'promotions'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPromos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Promotion));
      setPromotions(fetchedPromos);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'promotions');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const togglePromotion = async (id: string, active: boolean) => {
    try {
      await updateDoc(doc(db, 'promotions', id), { active });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `promotions/${id}`);
    }
  };

  const deletePromotion = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'promotions', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `promotions/${id}`);
    }
  };

  const addPromotion = async (promo: Omit<Promotion, 'id' | 'createdAt'>) => {
    try {
      await addDoc(collection(db, 'promotions'), {
        ...promo,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'promotions');
    }
  };

  return { promotions, loading, togglePromotion, deletePromotion, addPromotion };
}

export function useAdminActions() {
  const addProduct = async (product: Omit<Product, 'id' | 'createdAt'>) => {
    try {
      await addDoc(collection(db, 'products'), {
        ...product,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'products');
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      await updateDoc(doc(db, 'products', id), {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${id}`);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
    }
  };

  const bulkAddProducts = async (products: Omit<Product, 'id' | 'createdAt'>[]) => {
    try {
      const batch = writeBatch(db);
      products.forEach(product => {
        const newDocRef = doc(collection(db, 'products'));
        batch.set(newDocRef, {
          ...product,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });
      await batch.commit();
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
    const unsubscribe = onSnapshot(doc(db, 'config', 'global'), (doc) => {
      if (doc.exists()) {
        setConfig({ id: doc.id, ...doc.data() } as StoreConfig);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'config/global');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateConfig = async (updates: Partial<StoreConfig>) => {
    try {
      await updateDoc(doc(db, 'config', 'global'), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'config/global');
    }
  };

  return { config, loading, updateConfig };
}
