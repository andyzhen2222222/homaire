export interface Product {
  id: string;
  name: string;
  description: string;
  detailHtml?: string;
  price: number;
  onSale?: boolean;
  discountPrice?: number;
  images: string[];
  videoUrl?: string;
  manualUrl?: string;
  category: string;
  subCategory?: string;
  stock: number;
  features?: string[];
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

export type HomeTrustItem = {
  title: string;
  sub: string;
  /** SVG path `d` for lucide-style stroke icon */
  iconPath?: string;
};

export type CategoryHeroEntry = {
  title?: string;
  subtitle?: string;
  image?: string;
};

/** Firestore `config/global` — 运营配置 + 前台 CMS（字段均可选，缺省用代码默认值） */
export interface StoreConfig {
  id?: string;
  storeName?: string;
  currency?: string;
  contactEmail?: string;
  lowStockThreshold?: number;
  shippingPolicy?: string;
  returnPolicy?: string;
  maintenanceMode?: boolean;

  /** 浏览器标签标题（不含后缀时可与 storeName 相同） */
  siteTitle?: string;
  siteTagline?: string;

  topBarLine1?: string;
  topBarLine2?: string;
  topBarLine3?: string;
  topBarHelpText?: string;
  topBarLocaleText?: string;

  footerIntro?: string;
  footerCopyright?: string;
  footerSloganLine?: string;
  newsletterTitle?: string;
  newsletterSubcopy?: string;
  newsletterCtaLabel?: string;
  newsletterPlaceholder?: string;

  homeTrustItems?: HomeTrustItem[];
  homeAboutEyebrow?: string;
  homeAboutTitle?: string;
  homeAboutBody?: string;
  homeAboutBrandBoardUrl?: string;
  homeManifestoEyebrow?: string;
  /** 可用换行符拆成多行展示，例如 `For every corner\\nof home.` */
  homeManifestoTitle?: string;
  homeManifestoBody?: string;
  homeManifestoCtaLabel?: string;
  homeManifestoCtaHref?: string;
  homeManifestoImageUrl?: string;
  homeManifestoCardTitle?: string;
  homeManifestoCardSub?: string;
  homeManifestoCardYear?: string;
  homeShopEyebrow?: string;
  homeShopTitle?: string;
  homeShopViewAllLabel?: string;
  homeTrendingEyebrow?: string;
  homeTrendingTitle?: string;

  /** 覆盖各分类页横幅：key 为 slug，如 sofas、lighting */
  categoryHeroes?: Record<string, CategoryHeroEntry>;
}
