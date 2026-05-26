import type {
  Category,
  Order,
  OrderItem,
  Product,
  Promotion,
  StoreConfig,
  UserProfile,
} from '../../src/types';
import type {
  Category as DbCategory,
  Order as DbOrder,
  OrderItem as DbOrderItem,
  Product as DbProduct,
  Promotion as DbPromotion,
  StoreSettings,
  User,
} from '@prisma/client';
import { parseJsonArray, parseJsonObject, stringifyJson } from './jsonFields';

export function toFirestoreTimestamp(date: Date): { seconds: number; nanoseconds: number } {
  const ms = date.getTime();
  return { seconds: Math.floor(ms / 1000), nanoseconds: (ms % 1000) * 1_000_000 };
}

export function mapProduct(row: DbProduct): Product {
  const discountPrice = row.discountPrice ?? undefined;
  return {
    id: row.id,
    name: row.name,
    shortTitle: row.shortTitle ?? undefined,
    description: row.description,
    detailHtml: row.detailHtml ?? undefined,
    price: row.price,
    onSale: row.onSale,
    discountPrice: discountPrice && discountPrice > 0 ? discountPrice : undefined,
    images: parseJsonArray<string>(row.images),
    videoUrl: row.videoUrl ?? undefined,
    manualUrl: row.manualUrl ?? undefined,
    category: row.categorySlug,
    subCategory: row.subCategory ?? undefined,
    stock: row.stock,
    features: parseJsonArray<string>(row.features),
    featuredOnHome: row.featuredOnHome,
    syncSource: row.syncSource === 'feishu' ? 'feishu' : undefined,
    feishuRecordId: row.feishuRecordId ?? undefined,
    createdAt: toFirestoreTimestamp(row.createdAt),
    updatedAt: toFirestoreTimestamp(row.updatedAt),
  };
}

export function mapCategory(row: DbCategory): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    image: row.image,
    description: row.description ?? undefined,
    parentId: row.parentId,
    sortOrder: row.sortOrder,
    featuredProductIds: parseJsonArray<string>(row.featuredProductIds),
    feishuBitableUrl: row.feishuBitableUrl ?? undefined,
    feishuSyncEnabled: row.feishuSyncEnabled,
    feishuSyncIntervalMinutes: row.feishuSyncIntervalMinutes,
    feishuLastSyncedAt: row.feishuLastSyncedAt?.toISOString(),
    feishuLastSyncCount: row.feishuLastSyncCount ?? undefined,
    feishuLastSyncMessage: row.feishuLastSyncMessage ?? undefined,
  };
}

export function mapPromotion(row: DbPromotion): Promotion {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle ?? undefined,
    imageUrl: row.imageUrl,
    link: row.link ?? undefined,
    active: row.active,
    priority: row.priority ?? undefined,
    type: row.type as Promotion['type'],
    createdAt: toFirestoreTimestamp(row.createdAt),
  };
}

export function mapStoreConfig(row: StoreSettings | null): StoreConfig {
  if (!row) return { id: 'global', storeName: 'HOMAIRE' };
  return {
    id: row.id,
    storeName: row.storeName ?? undefined,
    currency: row.currency ?? undefined,
    contactEmail: row.contactEmail ?? undefined,
    lowStockThreshold: row.lowStockThreshold ?? undefined,
    shippingFreeThreshold: row.shippingFreeThreshold ?? undefined,
    shippingFlatFee: row.shippingFlatFee ?? undefined,
    shippingPolicy: row.shippingPolicy ?? undefined,
    returnPolicy: row.returnPolicy ?? undefined,
    maintenanceMode: row.maintenanceMode,
    catalogSnapshotExportedAt: row.catalogSnapshotExportedAt ?? undefined,
    siteTitle: row.siteTitle ?? undefined,
    siteTagline: row.siteTagline ?? undefined,
    topBarLine1: row.topBarLine1 ?? undefined,
    topBarLine2: row.topBarLine2 ?? undefined,
    topBarLine3: row.topBarLine3 ?? undefined,
    topBarHelpText: row.topBarHelpText ?? undefined,
    topBarLocaleText: row.topBarLocaleText ?? undefined,
    globalServiceStripTitle: row.globalServiceStripTitle ?? undefined,
    globalServiceDeliveryTime: row.globalServiceDeliveryTime ?? undefined,
    globalServiceDeliveryArea: row.globalServiceDeliveryArea ?? undefined,
    globalServiceInstallation: row.globalServiceInstallation ?? undefined,
    globalServiceWarranty: row.globalServiceWarranty ?? undefined,
    productDetailStockLabel: row.productDetailStockLabel ?? undefined,
    productDetailShippingLabel: row.productDetailShippingLabel ?? undefined,
    productDetailShippingFreeLabel: row.productDetailShippingFreeLabel ?? undefined,
    productDetailLowStockHint: row.productDetailLowStockHint ?? undefined,
    productDetailOutOfStockHint: row.productDetailOutOfStockHint ?? undefined,
    productDetailShippingFootnote: row.productDetailShippingFootnote ?? undefined,
    footerIntro: row.footerIntro ?? undefined,
    footerCopyright: row.footerCopyright ?? undefined,
    footerSloganLine: row.footerSloganLine ?? undefined,
    newsletterTitle: row.newsletterTitle ?? undefined,
    newsletterSubcopy: row.newsletterSubcopy ?? undefined,
    newsletterCtaLabel: row.newsletterCtaLabel ?? undefined,
    newsletterPlaceholder: row.newsletterPlaceholder ?? undefined,
    homeReviewsEyebrow: row.homeReviewsEyebrow ?? undefined,
    homeReviewsTitle: row.homeReviewsTitle ?? undefined,
    homeReviewsIntro: row.homeReviewsIntro ?? undefined,
    homeManifestoEyebrow: row.homeManifestoEyebrow ?? undefined,
    homeManifestoTitle: row.homeManifestoTitle ?? undefined,
    homeManifestoBody: row.homeManifestoBody ?? undefined,
    homeManifestoCtaLabel: row.homeManifestoCtaLabel ?? undefined,
    homeManifestoCtaHref: row.homeManifestoCtaHref ?? undefined,
    homeManifestoImageUrl: row.homeManifestoImageUrl ?? undefined,
    homeManifestoCardTitle: row.homeManifestoCardTitle ?? undefined,
    homeManifestoCardSub: row.homeManifestoCardSub ?? undefined,
    homeManifestoCardYear: row.homeManifestoCardYear ?? undefined,
    homeShopEyebrow: row.homeShopEyebrow ?? undefined,
    homeShopTitle: row.homeShopTitle ?? undefined,
    homeShopViewAllLabel: row.homeShopViewAllLabel ?? undefined,
    homeTrendingEyebrow: row.homeTrendingEyebrow ?? undefined,
    homeTrendingTitle: row.homeTrendingTitle ?? undefined,
    homeTrustItems: parseJsonArray(row.homeTrustItems),
    homeReviewsItems: parseJsonArray(row.homeReviewsItems),
    homeHeroSpotlights: parseJsonArray(row.homeHeroSpotlights),
    homeCategoryTiles: parseJsonArray(row.homeCategoryTiles),
    categoryHeroes: parseJsonObject(row.categoryHeroes),
    navDepartments: parseJsonArray(row.navDepartments),
  };
}

export function mapOrder(
  row: DbOrder & { items: (DbOrderItem & { product?: DbProduct | null })[] }
): Order & { id: string } {
  const items: OrderItem[] = row.items.map((i) => ({
    productId: i.productId,
    quantity: i.quantity,
    price: i.price,
    name: i.name,
  }));
  return {
    id: row.id,
    userId: row.userId,
    items,
    total: row.total,
    status: row.status as Order['status'],
    shippingAddress: {
      fullName: row.shippingFullName,
      email: row.shippingEmail ?? undefined,
      phone: row.shippingPhone ?? undefined,
      address: row.shippingAddress,
      city: row.shippingCity,
      state: row.shippingState ?? undefined,
      zip: row.shippingZip ?? undefined,
      country: row.shippingCountry ?? undefined,
    },
    carrier: row.carrier ?? undefined,
    trackingNumber: row.trackingNumber ?? undefined,
    shippedAt: row.shippedAt ? toFirestoreTimestamp(row.shippedAt) : undefined,
    adminNote: row.adminNote ?? undefined,
    createdAt: toFirestoreTimestamp(row.createdAt),
  };
}

export function mapUserProfile(user: User): UserProfile {
  return {
    uid: user.id,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoUrl ?? '',
    isAdmin: user.isAdmin,
  };
}

/** Map partial StoreConfig patch to Prisma update data */
export function storeConfigPatchToDb(patch: Partial<StoreConfig>): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  const scalarMap: Record<string, string> = {
    storeName: 'storeName',
    currency: 'currency',
    contactEmail: 'contactEmail',
    lowStockThreshold: 'lowStockThreshold',
    shippingFreeThreshold: 'shippingFreeThreshold',
    shippingFlatFee: 'shippingFlatFee',
    shippingPolicy: 'shippingPolicy',
    returnPolicy: 'returnPolicy',
    maintenanceMode: 'maintenanceMode',
    catalogSnapshotExportedAt: 'catalogSnapshotExportedAt',
    siteTitle: 'siteTitle',
    siteTagline: 'siteTagline',
    topBarLine1: 'topBarLine1',
    topBarLine2: 'topBarLine2',
    topBarLine3: 'topBarLine3',
    topBarHelpText: 'topBarHelpText',
    topBarLocaleText: 'topBarLocaleText',
    globalServiceStripTitle: 'globalServiceStripTitle',
    globalServiceDeliveryTime: 'globalServiceDeliveryTime',
    globalServiceDeliveryArea: 'globalServiceDeliveryArea',
    globalServiceInstallation: 'globalServiceInstallation',
    globalServiceWarranty: 'globalServiceWarranty',
    productDetailStockLabel: 'productDetailStockLabel',
    productDetailShippingLabel: 'productDetailShippingLabel',
    productDetailShippingFreeLabel: 'productDetailShippingFreeLabel',
    productDetailLowStockHint: 'productDetailLowStockHint',
    productDetailOutOfStockHint: 'productDetailOutOfStockHint',
    productDetailShippingFootnote: 'productDetailShippingFootnote',
    footerIntro: 'footerIntro',
    footerCopyright: 'footerCopyright',
    footerSloganLine: 'footerSloganLine',
    newsletterTitle: 'newsletterTitle',
    newsletterSubcopy: 'newsletterSubcopy',
    newsletterCtaLabel: 'newsletterCtaLabel',
    newsletterPlaceholder: 'newsletterPlaceholder',
    homeReviewsEyebrow: 'homeReviewsEyebrow',
    homeReviewsTitle: 'homeReviewsTitle',
    homeReviewsIntro: 'homeReviewsIntro',
    homeManifestoEyebrow: 'homeManifestoEyebrow',
    homeManifestoTitle: 'homeManifestoTitle',
    homeManifestoBody: 'homeManifestoBody',
    homeManifestoCtaLabel: 'homeManifestoCtaLabel',
    homeManifestoCtaHref: 'homeManifestoCtaHref',
    homeManifestoImageUrl: 'homeManifestoImageUrl',
    homeManifestoCardTitle: 'homeManifestoCardTitle',
    homeManifestoCardSub: 'homeManifestoCardSub',
    homeManifestoCardYear: 'homeManifestoCardYear',
    homeShopEyebrow: 'homeShopEyebrow',
    homeShopTitle: 'homeShopTitle',
    homeShopViewAllLabel: 'homeShopViewAllLabel',
    homeTrendingEyebrow: 'homeTrendingEyebrow',
    homeTrendingTitle: 'homeTrendingTitle',
  };
  for (const [k, dbKey] of Object.entries(scalarMap)) {
    if (k in patch) data[dbKey] = (patch as Record<string, unknown>)[k];
  }
  if ('homeTrustItems' in patch) data.homeTrustItems = stringifyJson(patch.homeTrustItems);
  if ('homeReviewsItems' in patch) data.homeReviewsItems = stringifyJson(patch.homeReviewsItems);
  if ('homeHeroSpotlights' in patch) data.homeHeroSpotlights = stringifyJson(patch.homeHeroSpotlights);
  if ('homeCategoryTiles' in patch) data.homeCategoryTiles = stringifyJson(patch.homeCategoryTiles);
  if ('categoryHeroes' in patch) data.categoryHeroes = stringifyJson(patch.categoryHeroes);
  if ('navDepartments' in patch) data.navDepartments = stringifyJson(patch.navDepartments);
  return data;
}

export function productInputToDb(
  input: Partial<Product> & { categoryId?: string },
  categorySlug: string,
  categoryId: string
): Record<string, unknown> {
  return {
    name: input.name,
    shortTitle: input.shortTitle ?? null,
    description: input.description ?? '',
    detailHtml: input.detailHtml ?? null,
    price: input.price ?? 0,
    onSale: input.onSale ?? false,
    discountPrice: input.discountPrice ?? null,
    images: stringifyJson(input.images ?? []),
    videoUrl: input.videoUrl ?? null,
    manualUrl: input.manualUrl ?? null,
    categoryId,
    categorySlug,
    subCategory: input.subCategory ?? null,
    stock: input.stock ?? 0,
    features: input.features ? stringifyJson(input.features) : null,
    featuredOnHome: input.featuredOnHome ?? false,
    syncSource: input.syncSource ?? null,
    feishuRecordId: input.feishuRecordId ?? null,
  };
}

export function categoryInputToDb(input: Partial<Category>): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.image !== undefined) data.image = input.image;
  if (input.description !== undefined) data.description = input.description;
  if (input.parentId !== undefined) data.parentId = input.parentId;
  if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;
  if (input.featuredProductIds !== undefined)
    data.featuredProductIds = stringifyJson(input.featuredProductIds);
  if (input.feishuBitableUrl !== undefined) data.feishuBitableUrl = input.feishuBitableUrl;
  if (input.feishuSyncEnabled !== undefined) data.feishuSyncEnabled = input.feishuSyncEnabled;
  if (input.feishuSyncIntervalMinutes !== undefined)
    data.feishuSyncIntervalMinutes = input.feishuSyncIntervalMinutes;
  return data;
}
