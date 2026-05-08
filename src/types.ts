export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  onSale?: boolean;
  discountPrice?: number;
  images: string[];
  videoUrl?: string;
  category: string;
  subCategory?: string;
  stock: number;
  features?: string[];
  dimensions?: {
    width: number;
    height: number;
    depth: number;
    unit?: string;
  };
  createdAt?: any;
  updatedAt?: any;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  description?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  isAdmin?: boolean;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id?: string;
  userId: string;
  items: {
    productId: string;
    quantity: number;
    price: number;
    name: string;
  }[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: any;
  createdAt: any;
}

export interface Promotion {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  link?: string;
  active: boolean;
  priority?: number;
  type: 'hero' | 'card' | 'sale';
  createdAt: any;
}

export interface StoreConfig {
  id: string;
  storeName: string;
  currency: string;
  contactEmail: string;
  lowStockThreshold: number;
  shippingPolicy: string;
  returnPolicy: string;
  maintenanceMode: boolean;
}
