import type { StoreCatalog } from '../storeTypes';
import { prisma } from '../db/client';
import {
  mapCategory,
  mapProduct,
  mapPromotion,
  mapStoreConfig,
} from '../mappers/catalogMappers';
import { bumpCatalogRevision, getCatalogRevision } from './catalogMeta';
import type { Category, Product, Promotion, StoreConfig } from '../../src/types';
import { getSubtreeSlugsByRootSlug } from '../../src/lib/categoryTree';
import { parseJsonArray, stringifyJson } from '../mappers/jsonFields';
import { productInputToDb, categoryInputToDb, storeConfigPatchToDb } from '../mappers/catalogMappers';

export async function loadCatalog(): Promise<{ revision: number; catalog: StoreCatalog }> {
  const [products, categories, promotions, settings, revision] = await Promise.all([
    prisma.product.findMany({ orderBy: { updatedAt: 'desc' } }),
    prisma.category.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] }),
    prisma.promotion.findMany({ orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }] }),
    prisma.storeSettings.findUnique({ where: { id: 'global' } }),
    getCatalogRevision(),
  ]);
  return {
    revision,
    catalog: {
      products: products.map(mapProduct),
      categories: categories.map(mapCategory),
      promotions: promotions.map(mapPromotion),
      config: mapStoreConfig(settings),
    },
  };
}

export async function replaceFullCatalog(catalog: StoreCatalog): Promise<number> {
  await prisma.$transaction(async (tx) => {
    await tx.product.deleteMany();
    await tx.category.deleteMany();
    await tx.promotion.deleteMany();

    const slugToId = new Map<string, string>();
    for (const cat of catalog.categories) {
      const created = await tx.category.create({
        data: {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          image: cat.image,
          description: cat.description ?? null,
          parentId: cat.parentId ?? null,
          sortOrder: cat.sortOrder ?? 0,
          featuredProductIds: stringifyJson(cat.featuredProductIds ?? []),
          feishuBitableUrl: cat.feishuBitableUrl ?? null,
          feishuSyncEnabled: cat.feishuSyncEnabled ?? false,
          feishuSyncIntervalMinutes: cat.feishuSyncIntervalMinutes ?? 120,
          feishuLastSyncedAt: cat.feishuLastSyncedAt ? new Date(cat.feishuLastSyncedAt) : null,
          feishuLastSyncCount: cat.feishuLastSyncCount ?? null,
          feishuLastSyncMessage: cat.feishuLastSyncMessage ?? null,
        },
      });
      slugToId.set(cat.slug, created.id);
    }

    let uncategorizedId = slugToId.get('uncategorized');
    if (!uncategorizedId) {
      const unc = await tx.category.create({
        data: {
          name: 'Uncategorized',
          slug: 'uncategorized',
          image: '',
          sortOrder: 9999,
        },
      });
      uncategorizedId = unc.id;
      slugToId.set('uncategorized', unc.id);
    }

    for (const p of catalog.products) {
      const categoryId = slugToId.get(p.category) ?? uncategorizedId!;
      const productData = productInputToDb(p, p.category, categoryId);
      await tx.product.create({
        data: {
          id: p.id,
          name: productData.name as string,
          description: productData.description as string,
          price: productData.price as number,
          onSale: productData.onSale as boolean,
          discountPrice: productData.discountPrice as number | null,
          images: productData.images as string,
          videoUrl: productData.videoUrl as string | null,
          manualUrl: productData.manualUrl as string | null,
          categoryId,
          categorySlug: productData.categorySlug as string,
          subCategory: productData.subCategory as string | null,
          stock: productData.stock as number,
          features: productData.features as string | null,
          featuredOnHome: productData.featuredOnHome as boolean,
          syncSource: productData.syncSource as string | null,
          feishuRecordId: productData.feishuRecordId as string | null,
          shortTitle: productData.shortTitle as string | null,
          detailHtml: productData.detailHtml as string | null,
        },
      });
    }

    for (const promo of catalog.promotions) {
      await tx.promotion.create({
        data: {
          id: promo.id,
          title: promo.title,
          subtitle: promo.subtitle ?? null,
          imageUrl: promo.imageUrl,
          link: promo.link ?? null,
          active: promo.active,
          priority: promo.priority ?? null,
          type: promo.type,
        },
      });
    }

    const config = catalog.config ?? { id: 'global', storeName: 'HOMAIRE' };
    await tx.storeSettings.upsert({
      where: { id: 'global' },
      create: { id: 'global', storeName: config.storeName ?? 'HOMAIRE', ...storeConfigPatchToDb(config) },
      update: storeConfigPatchToDb(config),
    });
  });
  return bumpCatalogRevision();
}

export async function resolveCategoryId(slug: string): Promise<string> {
  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) return existing.id;
  const created = await prisma.category.create({
    data: { name: slug, slug, image: '', sortOrder: 0 },
  });
  await bumpCatalogRevision();
  return created.id;
}

export async function listProductsQuery(params: {
  category?: string;
  subCategory?: string;
  onSale?: boolean;
  minPrice?: number;
  maxPrice?: number;
  q?: string;
  sort?: string;
  page?: number;
  limit?: number;
}): Promise<{ items: Product[]; total: number }> {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(5000, Math.max(1, params.limit ?? 100));

  const where: Record<string, unknown> = {};
  const andClauses: Record<string, unknown>[] = [];

  if (params.category) {
    const catRows = await prisma.category.findMany();
    const categories = catRows.map(mapCategory);
    const slugSet = getSubtreeSlugsByRootSlug(params.category.trim(), categories);
    where.categorySlug = { in: [...slugSet] };
  }

  if (params.subCategory) where.subCategory = params.subCategory;

  if (params.onSale) {
    andClauses.push({ OR: [{ onSale: true }, { categorySlug: 'sale' }] });
  }
  if (params.q) {
    andClauses.push({
      OR: [
        { name: { contains: params.q } },
        { shortTitle: { contains: params.q } },
        { description: { contains: params.q } },
      ],
    });
  }
  if (andClauses.length > 0) where.AND = andClauses;

  if (params.minPrice != null || params.maxPrice != null) {
    where.price = {};
    if (params.minPrice != null) (where.price as Record<string, number>).gte = params.minPrice;
    if (params.maxPrice != null) (where.price as Record<string, number>).lte = params.maxPrice;
  }

  let orderBy: Record<string, string> = { updatedAt: 'desc' };
  if (params.sort === 'price-asc') orderBy = { price: 'asc' };
  else if (params.sort === 'price-desc') orderBy = { price: 'desc' };
  else if (params.sort === 'newest') orderBy = { createdAt: 'desc' };

  const [rows, total] = await Promise.all([
    prisma.product.findMany({ where, orderBy, skip: (page - 1) * limit, take: limit }),
    prisma.product.count({ where }),
  ]);
  return { items: rows.map(mapProduct), total };
}

export async function upsertProductFromInput(
  id: string | undefined,
  input: Partial<Product>
): Promise<Product> {
  if (id) {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) throw new Error('Product not found');
    const slug = input.category ?? existing.categorySlug;
    const categoryId = input.category ? await resolveCategoryId(slug) : existing.categoryId;
    const merged: Partial<Product> = {
      name: input.name ?? existing.name,
      shortTitle: input.shortTitle ?? existing.shortTitle ?? undefined,
      description: input.description ?? existing.description,
      detailHtml: input.detailHtml ?? existing.detailHtml ?? undefined,
      price: input.price ?? existing.price,
      onSale: input.onSale ?? existing.onSale,
      discountPrice: input.discountPrice ?? existing.discountPrice ?? undefined,
      images: input.images ?? parseJsonArray<string>(existing.images),
      videoUrl: input.videoUrl ?? existing.videoUrl ?? undefined,
      manualUrl: input.manualUrl ?? existing.manualUrl ?? undefined,
      category: slug,
      subCategory: input.subCategory ?? existing.subCategory ?? undefined,
      stock: input.stock ?? existing.stock,
      features: input.features ?? parseJsonArray<string>(existing.features),
      featuredOnHome: input.featuredOnHome ?? existing.featuredOnHome,
      syncSource: input.syncSource ?? (existing.syncSource as Product['syncSource']),
      feishuRecordId: input.feishuRecordId ?? existing.feishuRecordId ?? undefined,
    };
    const data = productInputToDb(merged, slug, categoryId);
    const row = await prisma.product.update({
      where: { id },
      data: {
        name: data.name as string,
        shortTitle: data.shortTitle as string | null,
        description: data.description as string,
        detailHtml: data.detailHtml as string | null,
        price: data.price as number,
        onSale: data.onSale as boolean,
        discountPrice: data.discountPrice as number | null,
        images: data.images as string,
        videoUrl: data.videoUrl as string | null,
        manualUrl: data.manualUrl as string | null,
        categoryId,
        categorySlug: data.categorySlug as string,
        subCategory: data.subCategory as string | null,
        stock: data.stock as number,
        features: data.features as string | null,
        featuredOnHome: data.featuredOnHome as boolean,
        syncSource: data.syncSource as string | null,
        feishuRecordId: data.feishuRecordId as string | null,
      },
    });
    await bumpCatalogRevision();
    return mapProduct(row);
  }
  const slug = input.category ?? 'uncategorized';
  const categoryId = await resolveCategoryId(slug);
  const data = productInputToDb(input, slug, categoryId);
  const row = await prisma.product.create({
    data: {
      name: data.name as string,
      description: data.description as string,
      price: data.price as number,
      onSale: data.onSale as boolean,
      discountPrice: data.discountPrice as number | null,
      images: data.images as string,
      videoUrl: data.videoUrl as string | null,
      manualUrl: data.manualUrl as string | null,
      categoryId: data.categoryId as string,
      categorySlug: data.categorySlug as string,
      subCategory: data.subCategory as string | null,
      stock: data.stock as number,
      features: data.features as string | null,
      featuredOnHome: data.featuredOnHome as boolean,
      syncSource: data.syncSource as string | null,
      feishuRecordId: data.feishuRecordId as string | null,
      shortTitle: data.shortTitle as string | null,
      detailHtml: data.detailHtml as string | null,
    },
  });
  await bumpCatalogRevision();
  return mapProduct(row);
}

export async function deleteProductById(id: string): Promise<boolean> {
  try {
    await prisma.product.delete({ where: { id } });
    await bumpCatalogRevision();
    return true;
  } catch {
    return false;
  }
}

export async function upsertCategoryFromInput(
  id: string | undefined,
  input: Partial<Category> & { slug?: string; name?: string }
): Promise<Category> {
  if (id) {
    const row = await prisma.category.update({
      where: { id },
      data: categoryInputToDb(input) as object,
    });
    await bumpCatalogRevision();
    return mapCategory(row);
  }
  const row = await prisma.category.create({
    data: {
      name: input.name!,
      slug: input.slug!,
      image: input.image ?? '',
      description: input.description ?? null,
      parentId: input.parentId ?? null,
      sortOrder: input.sortOrder ?? 0,
      featuredProductIds: stringifyJson(input.featuredProductIds ?? []),
    },
  });
  await bumpCatalogRevision();
  return mapCategory(row);
}

export async function deleteCategoryById(id: string): Promise<{ ok: boolean; error?: string }> {
  const children = await prisma.category.count({ where: { parentId: id } });
  if (children > 0) return { ok: false, error: 'Category has children' };
  const products = await prisma.product.count({ where: { categoryId: id } });
  if (products > 0) return { ok: false, error: 'Category has products' };
  await prisma.category.delete({ where: { id } });
  await bumpCatalogRevision();
  return { ok: true };
}

export async function patchStoreSettings(patch: Partial<StoreConfig>): Promise<StoreConfig> {
  const row = await prisma.storeSettings.upsert({
    where: { id: 'global' },
    create: { id: 'global', storeName: 'HOMAIRE', ...storeConfigPatchToDb(patch) },
    update: storeConfigPatchToDb(patch),
  });
  await bumpCatalogRevision();
  return mapStoreConfig(row);
}

export async function upsertPromotion(
  id: string | undefined,
  input: Partial<Promotion>
): Promise<Promotion> {
  const data = {
    title: input.title!,
    subtitle: input.subtitle ?? null,
    imageUrl: input.imageUrl!,
    link: input.link ?? null,
    active: input.active ?? true,
    priority: input.priority ?? null,
    type: input.type!,
  };
  const row = id
    ? await prisma.promotion.update({ where: { id }, data })
    : await prisma.promotion.create({ data });
  await bumpCatalogRevision();
  return mapPromotion(row);
}

export async function deletePromotionById(id: string): Promise<void> {
  await prisma.promotion.delete({ where: { id } });
  await bumpCatalogRevision();
}

export async function getAdminStats() {
  const [productCount, orderCount, pendingOrders, settings] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.order.count({ where: { status: 'pending' } }),
    prisma.storeSettings.findUnique({ where: { id: 'global' } }),
  ]);
  const lowStockThreshold = settings?.lowStockThreshold ?? 5;
  const lowStockCount = await prisma.product.count({
    where: { AND: [{ stock: { lte: lowStockThreshold } }, { stock: { gt: 0 } }] },
  });
  const revenueAgg = await prisma.order.aggregate({
    _sum: { total: true },
    where: { status: { not: 'cancelled' } },
  });
  return {
    productCount,
    orderCount,
    pendingOrders,
    lowStockCount,
    revenueSum: revenueAgg._sum.total ?? 0,
  };
}
