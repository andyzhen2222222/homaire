export interface Product {
  id: string;
  /** 完整名称（导入/ERP 长标题等） */
  name: string;
  /** 独立站主标题：详情页 H1、面包屑末级；建议不超过 72 字（与批量导入截断一致），缺省使用 name */
  shortTitle?: string;
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
  /** 参与首页「该品类」楼层：与分类 / 首页装修中的主推 id 列表合并，填满剩余位 */
  featuredOnHome?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  description?: string;
  /** 父分类 id；缺省或 null 表示一级分类 */
  parentId?: string | null;
  /** 同级排序，数值越小越靠前 */
  sortOrder?: number;
  /** 首页该 slug 品类楼层主推商品 id（顺序优先）；与首页装修、商品勾选合并 */
  featuredProductIds?: string[];
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

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface ShippingAddress {
  fullName: string;
  email?: string;
  phone?: string;
  address: string;
  city: string;
  state?: string;
  zip?: string;
  country?: string;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
  name: string;
}

export interface Order {
  id?: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  shippingAddress: ShippingAddress;
  /** 物流公司 */
  carrier?: string;
  /** 运单号 */
  trackingNumber?: string;
  shippedAt?: { seconds: number; nanoseconds: number };
  adminNote?: string;
  createdAt: { seconds: number; nanoseconds: number };
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

/** 首页「按功能选购」宫格单项 */
export type HomeCategoryTile = {
  name: string;
  slug: string;
  image: string;
  /** 覆盖分类侧主推：仅本宫格 slug 对应楼层生效，顺序优先于分类 `featuredProductIds` */
  featuredProductIds?: string[];
};

/** 首页 Hero 右侧：与营销活动 `card` 互补的推广位（热销品类 / 活动主题） */
export type HomeHeroSpotlightItem = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  /** 按钮文案，如 Shop sale、Browse sofas */
  ctaLabel?: string;
  /** 站内路径，如 /category/sofas、/sale */
  link: string;
  /** 背景图 URL，缺省用内置图 */
  image?: string;
};

/** 首页客户评价卡片 */
export type HomeReviewItem = {
  quote: string;
  author: string;
  /** 如城市、Verified purchase */
  subtitle?: string;
  /** 1–5，缺省不展示星级 */
  rating?: number;
};

/** Firestore `config/global` — 运营配置 + 前台 CMS（字段均可选，缺省用代码默认值） */
export interface StoreConfig {
  id?: string;
  storeName?: string;
  currency?: string;
  contactEmail?: string;
  lowStockThreshold?: number;
  /** 购物车 / 商品详情：小计超过该金额则免基础运费（与货币单位一致，默认 500） */
  shippingFreeThreshold?: number;
  /** 未达免运门槛时加收的基础运费（默认 49.95） */
  shippingFlatFee?: number;
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

  /** 页脚上方全局服务条（配送、安装、保修等），全站 Layout 展示 */
  globalServiceStripTitle?: string;
  globalServiceDeliveryTime?: string;
  globalServiceDeliveryArea?: string;
  globalServiceInstallation?: string;
  globalServiceWarranty?: string;

  /** 商品详情侧栏：可用库存标题 */
  productDetailStockLabel?: string;
  /** 商品详情侧栏：预估运费标题 */
  productDetailShippingLabel?: string;
  /** 达到免运时展示文案（如「免运费」） */
  productDetailShippingFreeLabel?: string;
  /** 低于 lowStockThreshold 时的提示 */
  productDetailLowStockHint?: string;
  /** 无货时提示 */
  productDetailOutOfStockHint?: string;
  /** 运费说明；可用占位符 {threshold}、{flat}（已格式化为店铺货币） */
  productDetailShippingFootnote?: string;

  footerIntro?: string;
  footerCopyright?: string;
  footerSloganLine?: string;
  newsletterTitle?: string;
  newsletterSubcopy?: string;
  newsletterCtaLabel?: string;
  newsletterPlaceholder?: string;

  homeTrustItems?: HomeTrustItem[];
  /** @deprecated 首页已改为客户评价区，请使用 homeReviews* */
  homeAboutEyebrow?: string;
  homeAboutTitle?: string;
  homeAboutBody?: string;
  homeAboutBrandBoardUrl?: string;
  /** 客户评价区小标题 */
  homeReviewsEyebrow?: string;
  /** 客户评价区主标题 */
  homeReviewsTitle?: string;
  /** 客户评价区导语（一行或两行） */
  homeReviewsIntro?: string;
  /** 评价卡片，建议 4 条 */
  homeReviewsItems?: HomeReviewItem[];
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

  /** 首页 Hero 右侧推广位（最多 3 条；营销活动 card 不足时自动展示） */
  homeHeroSpotlights?: HomeHeroSpotlightItem[];

  /** 首页分类宫格（8 项）；缺省与代码内置图一致 */
  homeCategoryTiles?: HomeCategoryTile[];

  /** 覆盖各分类页横幅：key 为 slug，如 sofas、lighting */
  categoryHeroes?: Record<string, CategoryHeroEntry>;
}
