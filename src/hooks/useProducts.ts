import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Product } from '../types';
import { productsData } from '../data/products';

const mergeWithMockProduct = (product: Product): Product => {
  const mock = productsData.find((item) => item.id === product.id);
  return mock ? { ...mock, ...product } : product;
};

export function useProducts(categorySlug?: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      const collectionPath = 'products';
      try {
        let q = query(collection(db, collectionPath));
        if (categorySlug) {
          q = query(collection(db, collectionPath), where('category', '==', categorySlug));
        }
        
        const querySnapshot = await getDocs(q);
        const fetchedProducts = querySnapshot.docs.map(doc => mergeWithMockProduct({ id: doc.id, ...doc.data() } as Product));
        
        // If DB is empty, use mock data as fallback for the visual demo
        if (fetchedProducts.length === 0) {
          if (categorySlug) {
            setProducts(productsData.filter(p => p.category === categorySlug));
          } else {
            setProducts(productsData);
          }
        } else {
          setProducts(fetchedProducts);
        }
      } catch (error: any) {
        if (error?.code === 'permission-denied') {
          handleFirestoreError(error, OperationType.LIST, collectionPath);
        }
        // Fallback to mock data for better UX during setup
        console.warn("Firestore access issues, using mock data", error);
        if (categorySlug) {
          setProducts(productsData.filter(p => p.category === categorySlug));
        } else {
          setProducts(productsData);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [categorySlug]);

  return { products, loading };
}

export function useProduct(id: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProduct() {
      if (!id) return;
      try {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setProduct(mergeWithMockProduct({ id: docSnap.id, ...docSnap.data() } as Product));
        } else {
          // Fallback to mock
          const mock = productsData.find(p => p.id === id);
          if (mock) setProduct(mock);
        }
      } catch (error: any) {
        if (error?.code === 'permission-denied') {
          handleFirestoreError(error, OperationType.GET, `products/${id}`);
        }
        console.warn("Firestore error, using mock fallback", error);
        const mock = productsData.find(p => p.id === id);
        if (mock) setProduct(mock);
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [id]);

  return { product, loading };
}
