import type { Category, Order, Product, Promotion, StoreConfig } from '../src/types';

export type StoreOrder = Order & { id: string };

export type StoreCatalog = {
  products: Product[];
  categories: Category[];
  promotions: Promotion[];
  config: StoreConfig | null;
};

export type StoreFile = {
  revision: number;
  updatedAt: string;
  catalog: StoreCatalog;
  orders: StoreOrder[];
};

export const EMPTY_STORE_FILE: StoreFile = {
  revision: 0,
  updatedAt: new Date(0).toISOString(),
  catalog: {
    products: [],
    categories: [],
    promotions: [],
    config: { id: 'global', storeName: 'HOMAIRE' },
  },
  orders: [],
};
