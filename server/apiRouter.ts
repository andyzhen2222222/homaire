import type { IncomingMessage, ServerResponse } from 'node:http';
import { parseUrl, readJsonBody, sendJson } from './http/apiUtils';
import { resolveAuthContext, requireAdmin, requireAuth } from './middleware/authContext';
import {
  registerUser,
  loginUser,
  updateUserProfile,
} from './services/authService';
import {
  loadCatalog,
  replaceFullCatalog,
  listProductsQuery,
  upsertProductFromInput,
  deleteProductById,
  upsertCategoryFromInput,
  deleteCategoryById,
  patchStoreSettings,
  upsertPromotion,
  deletePromotionById,
  getAdminStats,
} from './services/catalogService';
import { mapCategory, mapProduct, mapPromotion, mapStoreConfig } from './mappers/catalogMappers';
import { prisma } from './db/client';
import {
  createOrder,
  listOrdersForUser,
  getOrderById,
  listAllOrders,
  patchOrder,
  shipOrder,
} from './services/orderService';
import {
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  listWishlist,
  addWishlistItem,
  removeWishlistItem,
  getCart,
  replaceCart,
  addCartItem,
} from './services/userExtrasService';
import type { StoreCatalog } from './storeTypes';
import type { OrderStatus, Product, Promotion, StoreConfig } from '../src/types';

async function handleV1(
  req: IncomingMessage,
  res: ServerResponse,
  pathname: string,
  method: string
): Promise<boolean> {
  const ctx = await resolveAuthContext(req);

  // --- Auth ---
  if (pathname === '/api/v1/auth/register' && method === 'POST') {
    try {
      const body = (await readJsonBody(req)) as Record<string, string>;
      const result = await registerUser(body.email, body.password, body.displayName || '');
      sendJson(res, 201, { ok: true, ...result });
    } catch (e) {
      sendJson(res, 400, { ok: false, error: e instanceof Error ? e.message : String(e) });
    }
    return true;
  }
  if (pathname === '/api/v1/auth/login' && method === 'POST') {
    try {
      const body = (await readJsonBody(req)) as Record<string, string>;
      const result = await loginUser(body.email, body.password);
      sendJson(res, 200, { ok: true, ...result });
    } catch (e) {
      sendJson(res, 401, { ok: false, error: e instanceof Error ? e.message : String(e) });
    }
    return true;
  }
  if (pathname === '/api/v1/auth/me' && method === 'GET') {
    if (!ctx.profile) {
      sendJson(res, 401, { ok: false, error: 'Unauthorized' });
      return true;
    }
    sendJson(res, 200, { ok: true, user: ctx.profile });
    return true;
  }
  if (pathname === '/api/v1/auth/me' && method === 'PATCH') {
    try {
      const userId = requireAuth(ctx);
      const body = (await readJsonBody(req)) as Record<string, string>;
      const user = await updateUserProfile(userId, {
        displayName: body.displayName,
        photoUrl: body.photoUrl,
        password: body.password,
      });
      sendJson(res, 200, { ok: true, user });
    } catch (e) {
      sendJson(res, 401, { ok: false, error: e instanceof Error ? e.message : String(e) });
    }
    return true;
  }

  // --- Public catalog ---
  if (pathname === '/api/v1/catalog' && method === 'GET') {
    const { revision, catalog } = await loadCatalog();
    sendJson(res, 200, { ok: true, revision, catalog, updatedAt: new Date().toISOString() });
    return true;
  }
  if (pathname === '/api/v1/health' && method === 'GET') {
    const { revision, catalog } = await loadCatalog();
    const orderCount = await prisma.order.count();
    sendJson(res, 200, {
      ok: true,
      revision,
      productCount: catalog.products.length,
      orderCount,
      database: 'sqlite',
    });
    return true;
  }
  if (pathname === '/api/v1/products' && method === 'GET') {
    const { searchParams } = parseUrl(req);
    const result = await listProductsQuery({
      category: searchParams.get('category') ?? undefined,
      subCategory: searchParams.get('subCategory') ?? undefined,
      onSale: searchParams.get('onSale') === 'true',
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      q: searchParams.get('q') ?? undefined,
      sort: searchParams.get('sort') ?? undefined,
      page: searchParams.get('page') ? Number(searchParams.get('page')) : undefined,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
    });
    sendJson(res, 200, { ok: true, ...result });
    return true;
  }
  if (pathname.startsWith('/api/v1/products/') && method === 'GET') {
    const id = decodeURIComponent(pathname.slice('/api/v1/products/'.length));
    const row = await prisma.product.findUnique({ where: { id } });
    if (!row) {
      sendJson(res, 404, { ok: false, error: 'Not found' });
      return true;
    }
    sendJson(res, 200, { ok: true, product: mapProduct(row) });
    return true;
  }
  if (pathname === '/api/v1/store-config' && method === 'GET') {
    const settings = await prisma.storeSettings.findUnique({ where: { id: 'global' } });
    sendJson(res, 200, { ok: true, config: mapStoreConfig(settings) });
    return true;
  }
  if (pathname === '/api/v1/categories' && method === 'GET') {
    const { searchParams } = parseUrl(req);
    const parentId = searchParams.get('parentId');
    const rows = await prisma.category.findMany({
      where: parentId === null || parentId === undefined ? {} : { parentId: parentId || null },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    const countRows = await prisma.product.groupBy({
      by: ['categorySlug'],
      _count: { id: true },
    });
    const productCountsBySlug: Record<string, number> = {};
    for (const row of countRows) {
      productCountsBySlug[row.categorySlug] = row._count.id;
    }
    sendJson(res, 200, {
      ok: true,
      categories: rows.map(mapCategory),
      productCountsBySlug,
    });
    return true;
  }
  if (pathname.startsWith('/api/v1/categories/') && method === 'GET') {
    const slug = decodeURIComponent(pathname.slice('/api/v1/categories/'.length));
    const cat = await prisma.category.findUnique({ where: { slug } });
    if (!cat) {
      sendJson(res, 404, { ok: false, error: 'Not found' });
      return true;
    }
    const children = await prisma.category.findMany({ where: { parentId: cat.id } });
    const productCount = await prisma.product.count({ where: { categorySlug: slug } });
    sendJson(res, 200, {
      ok: true,
      category: mapCategory(cat),
      children: children.map(mapCategory),
      productCount,
    });
    return true;
  }
  if (pathname === '/api/v1/promotions' && method === 'GET') {
    const { searchParams } = parseUrl(req);
    const activeOnly = searchParams.get('active') !== 'false';
    const type = searchParams.get('type');
    const rows = await prisma.promotion.findMany({
      where: {
        ...(activeOnly ? { active: true } : {}),
        ...(type ? { type: type as 'hero' | 'card' | 'sale' } : {}),
      },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    });
    sendJson(res, 200, { ok: true, promotions: rows.map(mapPromotion) });
    return true;
  }

  // --- User orders / checkout ---
  if (pathname === '/api/v1/orders' && method === 'POST') {
    try {
      const userId = requireAuth(ctx);
      const body = (await readJsonBody(req)) as {
        items: { productId: string; quantity: number }[];
        shippingAddress: Record<string, string>;
      };
      const order = await createOrder({
        userId,
        items: body.items,
        shippingAddress: body.shippingAddress as unknown as Parameters<typeof createOrder>[0]['shippingAddress'],
      });
      sendJson(res, 201, { ok: true, order });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const status = msg.includes('maintenance') ? 503 : msg === 'Unauthorized' ? 401 : 400;
      sendJson(res, status, { ok: false, error: msg });
    }
    return true;
  }
  if (pathname === '/api/v1/me/orders' && method === 'GET') {
    try {
      const userId = requireAuth(ctx);
      const { searchParams } = parseUrl(req);
      const status = searchParams.get('status') as OrderStatus | null;
      const orders = await listOrdersForUser(userId, status ?? undefined);
      sendJson(res, 200, { ok: true, orders });
    } catch (e) {
      sendJson(res, 401, { ok: false, error: e instanceof Error ? e.message : String(e) });
    }
    return true;
  }
  if (pathname.startsWith('/api/v1/me/orders/') && method === 'GET') {
    try {
      const userId = requireAuth(ctx);
      const id = decodeURIComponent(pathname.slice('/api/v1/me/orders/'.length));
      const order = await getOrderById(id, userId);
      if (!order) {
        sendJson(res, 404, { ok: false, error: 'Not found' });
        return true;
      }
      sendJson(res, 200, { ok: true, order });
    } catch (e) {
      sendJson(res, 401, { ok: false, error: e instanceof Error ? e.message : String(e) });
    }
    return true;
  }

  // --- Cart ---
  if (pathname === '/api/v1/me/cart' && method === 'GET') {
    try {
      const userId = requireAuth(ctx);
      const items = await getCart(userId);
      sendJson(res, 200, { ok: true, items });
    } catch (e) {
      sendJson(res, 401, { ok: false, error: e instanceof Error ? e.message : String(e) });
    }
    return true;
  }
  if (pathname === '/api/v1/me/cart' && method === 'PUT') {
    try {
      const userId = requireAuth(ctx);
      const body = (await readJsonBody(req)) as { items: { productId: string; quantity: number }[] };
      await replaceCart(userId, body.items ?? []);
      sendJson(res, 200, { ok: true });
    } catch (e) {
      sendJson(res, 401, { ok: false, error: e instanceof Error ? e.message : String(e) });
    }
    return true;
  }
  if (pathname === '/api/v1/me/cart/items' && method === 'POST') {
    try {
      const userId = requireAuth(ctx);
      const body = (await readJsonBody(req)) as { productId: string; quantity: number };
      await addCartItem(userId, body.productId, body.quantity ?? 1);
      sendJson(res, 200, { ok: true });
    } catch (e) {
      sendJson(res, 401, { ok: false, error: e instanceof Error ? e.message : String(e) });
    }
    return true;
  }

  // --- Addresses ---
  if (pathname === '/api/v1/me/addresses' && method === 'GET') {
    try {
      const userId = requireAuth(ctx);
      sendJson(res, 200, { ok: true, addresses: await listAddresses(userId) });
    } catch (e) {
      sendJson(res, 401, { ok: false, error: e instanceof Error ? e.message : String(e) });
    }
    return true;
  }
  if (pathname === '/api/v1/me/addresses' && method === 'POST') {
    try {
      const userId = requireAuth(ctx);
      const body = (await readJsonBody(req)) as Record<string, unknown>;
      const addr = await createAddress(userId, body as unknown as Parameters<typeof createAddress>[1]);
      sendJson(res, 201, { ok: true, address: addr });
    } catch (e) {
      sendJson(res, 401, { ok: false, error: e instanceof Error ? e.message : String(e) });
    }
    return true;
  }
  if (pathname.startsWith('/api/v1/me/addresses/') && method === 'PATCH') {
    try {
      const userId = requireAuth(ctx);
      const id = decodeURIComponent(pathname.slice('/api/v1/me/addresses/'.length));
      const body = (await readJsonBody(req)) as Record<string, unknown>;
      const addr = await updateAddress(userId, id, body as Parameters<typeof updateAddress>[2]);
      if (!addr) {
        sendJson(res, 404, { ok: false, error: 'Not found' });
        return true;
      }
      sendJson(res, 200, { ok: true, address: addr });
    } catch (e) {
      sendJson(res, 401, { ok: false, error: e instanceof Error ? e.message : String(e) });
    }
    return true;
  }
  if (pathname.startsWith('/api/v1/me/addresses/') && method === 'DELETE') {
    try {
      const userId = requireAuth(ctx);
      const id = decodeURIComponent(pathname.slice('/api/v1/me/addresses/'.length));
      await deleteAddress(userId, id);
      sendJson(res, 200, { ok: true });
    } catch (e) {
      sendJson(res, 401, { ok: false, error: e instanceof Error ? e.message : String(e) });
    }
    return true;
  }

  // --- Wishlist ---
  if (pathname === '/api/v1/me/wishlist' && method === 'GET') {
    try {
      const userId = requireAuth(ctx);
      sendJson(res, 200, { ok: true, products: await listWishlist(userId) });
    } catch (e) {
      sendJson(res, 401, { ok: false, error: e instanceof Error ? e.message : String(e) });
    }
    return true;
  }
  if (pathname === '/api/v1/me/wishlist' && method === 'POST') {
    try {
      const userId = requireAuth(ctx);
      const body = (await readJsonBody(req)) as { productId: string };
      await addWishlistItem(userId, body.productId);
      sendJson(res, 200, { ok: true });
    } catch (e) {
      sendJson(res, 401, { ok: false, error: e instanceof Error ? e.message : String(e) });
    }
    return true;
  }
  if (pathname.startsWith('/api/v1/me/wishlist/') && method === 'DELETE') {
    try {
      const userId = requireAuth(ctx);
      const productId = decodeURIComponent(pathname.slice('/api/v1/me/wishlist/'.length));
      await removeWishlistItem(userId, productId);
      sendJson(res, 200, { ok: true });
    } catch (e) {
      sendJson(res, 401, { ok: false, error: e instanceof Error ? e.message : String(e) });
    }
    return true;
  }

  // --- Admin ---
  if (pathname === '/api/v1/admin/stats' && method === 'GET') {
    try {
      requireAdmin(ctx);
      sendJson(res, 200, { ok: true, ...(await getAdminStats()) });
    } catch (e) {
      sendJson(res, 403, { ok: false, error: e instanceof Error ? e.message : String(e) });
    }
    return true;
  }

  if (pathname === '/api/v1/admin/products' && method === 'GET') {
    try {
      requireAdmin(ctx);
      const { searchParams } = parseUrl(req);
      const result = await listProductsQuery({
        category: searchParams.get('category') ?? undefined,
        q: searchParams.get('q') ?? undefined,
        page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
        limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 100,
      });
      sendJson(res, 200, { ok: true, products: result.items, total: result.total });
    } catch (e) {
      sendJson(res, 403, { ok: false, error: e instanceof Error ? e.message : String(e) });
    }
    return true;
  }
  if (pathname === '/api/v1/admin/products' && method === 'POST') {
    try {
      requireAdmin(ctx);
      const body = (await readJsonBody(req)) as Partial<Product>;
      const product = await upsertProductFromInput(undefined, body);
      sendJson(res, 201, { ok: true, product });
    } catch (e) {
      sendJson(res, 400, { ok: false, error: e instanceof Error ? e.message : String(e) });
    }
    return true;
  }
  if (pathname.startsWith('/api/v1/admin/products/') && method === 'GET') {
    try {
      requireAdmin(ctx);
      const id = decodeURIComponent(pathname.slice('/api/v1/admin/products/'.length));
      const row = await prisma.product.findUnique({ where: { id } });
      if (!row) {
        sendJson(res, 404, { ok: false, error: 'Not found' });
        return true;
      }
      sendJson(res, 200, { ok: true, product: mapProduct(row) });
    } catch (e) {
      sendJson(res, 403, { ok: false, error: e instanceof Error ? e.message : String(e) });
    }
    return true;
  }
  if (pathname.startsWith('/api/v1/admin/products/') && method === 'PATCH') {
    try {
      requireAdmin(ctx);
      const id = decodeURIComponent(pathname.slice('/api/v1/admin/products/'.length));
      const body = (await readJsonBody(req)) as Partial<Product>;
      const product = await upsertProductFromInput(id, body);
      sendJson(res, 200, { ok: true, product });
    } catch (e) {
      sendJson(res, 400, { ok: false, error: e instanceof Error ? e.message : String(e) });
    }
    return true;
  }
  if (pathname.startsWith('/api/v1/admin/products/') && method === 'DELETE') {
    try {
      requireAdmin(ctx);
      const id = decodeURIComponent(pathname.slice('/api/v1/admin/products/'.length));
      const ok = await deleteProductById(id);
      sendJson(res, ok ? 200 : 404, { ok });
    } catch (e) {
      sendJson(res, 403, { ok: false, error: e instanceof Error ? e.message : String(e) });
    }
    return true;
  }

  if (pathname === '/api/v1/admin/categories' && method === 'GET') {
    try {
      requireAdmin(ctx);
      const rows = await prisma.category.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] });
      sendJson(res, 200, { ok: true, categories: rows.map(mapCategory) });
    } catch (e) {
      sendJson(res, 403, { ok: false, error: e instanceof Error ? e.message : String(e) });
    }
    return true;
  }
  if (pathname === '/api/v1/admin/categories' && method === 'POST') {
    try {
      requireAdmin(ctx);
      const body = (await readJsonBody(req)) as Record<string, unknown>;
      const category = await upsertCategoryFromInput(undefined, body as Parameters<typeof upsertCategoryFromInput>[1]);
      sendJson(res, 201, { ok: true, category });
    } catch (e) {
      sendJson(res, 400, { ok: false, error: e instanceof Error ? e.message : String(e) });
    }
    return true;
  }
  if (pathname.startsWith('/api/v1/admin/categories/') && method === 'PATCH') {
    try {
      requireAdmin(ctx);
      const id = decodeURIComponent(pathname.slice('/api/v1/admin/categories/'.length));
      const body = (await readJsonBody(req)) as Record<string, unknown>;
      const category = await upsertCategoryFromInput(id, body as Parameters<typeof upsertCategoryFromInput>[1]);
      sendJson(res, 200, { ok: true, category });
    } catch (e) {
      sendJson(res, 400, { ok: false, error: e instanceof Error ? e.message : String(e) });
    }
    return true;
  }
  if (pathname.startsWith('/api/v1/admin/categories/') && method === 'DELETE') {
    try {
      requireAdmin(ctx);
      const id = decodeURIComponent(pathname.slice('/api/v1/admin/categories/'.length));
      const result = await deleteCategoryById(id);
      sendJson(res, result.ok ? 200 : 400, result);
    } catch (e) {
      sendJson(res, 403, { ok: false, error: e instanceof Error ? e.message : String(e) });
    }
    return true;
  }

  if (pathname === '/api/v1/admin/orders' && method === 'GET') {
    try {
      requireAdmin(ctx);
      const { searchParams } = parseUrl(req);
      const orders = await listAllOrders({
        status: (searchParams.get('status') as OrderStatus) || undefined,
        keyword: searchParams.get('keyword') ?? undefined,
        page: searchParams.get('page') ? Number(searchParams.get('page')) : undefined,
      });
      const revision = (await loadCatalog()).revision;
      sendJson(res, 200, { ok: true, revision, orders });
    } catch (e) {
      sendJson(res, 403, { ok: false, error: e instanceof Error ? e.message : String(e) });
    }
    return true;
  }
  if (pathname.startsWith('/api/v1/admin/orders/') && pathname.endsWith('/ship') && method === 'POST') {
    try {
      requireAdmin(ctx);
      const id = decodeURIComponent(
        pathname.slice('/api/v1/admin/orders/'.length, -'/ship'.length)
      );
      const body = (await readJsonBody(req)) as { carrier: string; trackingNumber: string };
      const order = await shipOrder(id, body.carrier, body.trackingNumber);
      sendJson(res, order ? 200 : 404, { ok: Boolean(order), order });
    } catch (e) {
      sendJson(res, 403, { ok: false, error: e instanceof Error ? e.message : String(e) });
    }
    return true;
  }
  if (pathname.startsWith('/api/v1/admin/orders/') && method === 'GET') {
    try {
      requireAdmin(ctx);
      const id = decodeURIComponent(pathname.slice('/api/v1/admin/orders/'.length));
      const order = await getOrderById(id);
      sendJson(res, order ? 200 : 404, { ok: Boolean(order), order });
    } catch (e) {
      sendJson(res, 403, { ok: false, error: e instanceof Error ? e.message : String(e) });
    }
    return true;
  }
  if (pathname.startsWith('/api/v1/admin/orders/') && method === 'PATCH') {
    try {
      requireAdmin(ctx);
      const id = decodeURIComponent(pathname.slice('/api/v1/admin/orders/'.length));
      const body = (await readJsonBody(req)) as Record<string, unknown>;
      const order = await patchOrder(id, body as Parameters<typeof patchOrder>[1]);
      sendJson(res, order ? 200 : 404, { ok: Boolean(order), order });
    } catch (e) {
      sendJson(res, 403, { ok: false, error: e instanceof Error ? e.message : String(e) });
    }
    return true;
  }

  if (pathname === '/api/v1/admin/promotions' && method === 'GET') {
    try {
      requireAdmin(ctx);
      const rows = await prisma.promotion.findMany({ orderBy: { createdAt: 'desc' } });
      sendJson(res, 200, { ok: true, promotions: rows.map(mapPromotion) });
    } catch (e) {
      sendJson(res, 403, { ok: false, error: e instanceof Error ? e.message : String(e) });
    }
    return true;
  }
  if (pathname === '/api/v1/admin/promotions' && method === 'POST') {
    try {
      requireAdmin(ctx);
      const body = (await readJsonBody(req)) as Partial<Promotion>;
      const promotion = await upsertPromotion(undefined, body);
      sendJson(res, 201, { ok: true, promotion });
    } catch (e) {
      sendJson(res, 400, { ok: false, error: e instanceof Error ? e.message : String(e) });
    }
    return true;
  }
  if (pathname.startsWith('/api/v1/admin/promotions/') && pathname.endsWith('/toggle') && method === 'PATCH') {
    try {
      requireAdmin(ctx);
      const id = decodeURIComponent(
        pathname.slice('/api/v1/admin/promotions/'.length, -'/toggle'.length)
      );
      const cur = await prisma.promotion.findUnique({ where: { id } });
      if (!cur) {
        sendJson(res, 404, { ok: false, error: 'Not found' });
        return true;
      }
      const promotion = await upsertPromotion(id, { ...mapPromotion(cur), active: !cur.active });
      sendJson(res, 200, { ok: true, promotion });
    } catch (e) {
      sendJson(res, 403, { ok: false, error: e instanceof Error ? e.message : String(e) });
    }
    return true;
  }
  if (pathname.startsWith('/api/v1/admin/promotions/') && method === 'PATCH') {
    try {
      requireAdmin(ctx);
      const id = decodeURIComponent(pathname.slice('/api/v1/admin/promotions/'.length));
      const body = (await readJsonBody(req)) as Partial<Promotion>;
      const promotion = await upsertPromotion(id, body);
      sendJson(res, 200, { ok: true, promotion });
    } catch (e) {
      sendJson(res, 400, { ok: false, error: e instanceof Error ? e.message : String(e) });
    }
    return true;
  }
  if (pathname.startsWith('/api/v1/admin/promotions/') && method === 'DELETE') {
    try {
      requireAdmin(ctx);
      const id = decodeURIComponent(pathname.slice('/api/v1/admin/promotions/'.length));
      await deletePromotionById(id);
      sendJson(res, 200, { ok: true });
    } catch (e) {
      sendJson(res, 403, { ok: false, error: e instanceof Error ? e.message : String(e) });
    }
    return true;
  }

  if (pathname === '/api/v1/admin/settings' && method === 'GET') {
    try {
      requireAdmin(ctx);
      const { catalog } = await loadCatalog();
      sendJson(res, 200, { ok: true, config: catalog.config });
    } catch (e) {
      sendJson(res, 403, { ok: false, error: e instanceof Error ? e.message : String(e) });
    }
    return true;
  }
  if (pathname === '/api/v1/admin/settings' && method === 'PATCH') {
    try {
      requireAdmin(ctx);
      const body = (await readJsonBody(req)) as Partial<StoreConfig>;
      const config = await patchStoreSettings(body);
      sendJson(res, 200, { ok: true, config });
    } catch (e) {
      sendJson(res, 400, { ok: false, error: e instanceof Error ? e.message : String(e) });
    }
    return true;
  }

  return false;
}

/** Legacy /api/store/* backed by SQLite */
async function handleLegacyStore(
  req: IncomingMessage,
  res: ServerResponse,
  pathname: string,
  method: string
): Promise<boolean> {
  const ctx = await resolveAuthContext(req);

  if (pathname === '/api/store/catalog' && method === 'GET') {
    const { revision, catalog } = await loadCatalog();
    sendJson(res, 200, {
      ok: true,
      revision,
      updatedAt: new Date().toISOString(),
      catalog,
    });
    return true;
  }
  if (pathname === '/api/store/catalog' && method === 'PUT') {
    if (!ctx.isAdmin) {
      sendJson(res, 401, { ok: false, error: 'Unauthorized' });
      return true;
    }
    try {
      const body = (await readJsonBody(req)) as Partial<StoreCatalog>;
      const catalog: StoreCatalog = {
        products: Array.isArray(body.products) ? body.products : [],
        categories: Array.isArray(body.categories) ? body.categories : [],
        promotions: Array.isArray(body.promotions) ? body.promotions : [],
        config: body.config ?? { id: 'global', storeName: 'HOMAIRE' },
      };
      const revision = await replaceFullCatalog(catalog);
      sendJson(res, 200, { ok: true, revision });
    } catch (err) {
      sendJson(res, 500, { ok: false, error: err instanceof Error ? err.message : String(err) });
    }
    return true;
  }
  if (pathname === '/api/store/orders' && method === 'GET') {
    const { searchParams } = parseUrl(req);
    const userId = searchParams.get('userId');
    if (userId) {
      const orders = await listOrdersForUser(userId);
      const revision = (await loadCatalog()).revision;
      sendJson(res, 200, { ok: true, revision, orders });
      return true;
    }
    if (!ctx.isAdmin) {
      sendJson(res, 401, { ok: false, error: 'Unauthorized' });
      return true;
    }
    const orders = await listAllOrders({});
    const revision = (await loadCatalog()).revision;
    sendJson(res, 200, { ok: true, revision, orders });
    return true;
  }
  if (pathname === '/api/store/orders' && method === 'POST') {
    try {
      const body = (await readJsonBody(req)) as {
        userId: string;
        items: { productId: string; quantity: number; price?: number; name?: string }[];
        total?: number;
        shippingAddress: Record<string, string>;
        status?: OrderStatus;
      };
      const order = await createOrder({
        userId: body.userId,
        items: body.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        shippingAddress: body.shippingAddress as unknown as Parameters<typeof createOrder>[0]['shippingAddress'],
      });
      sendJson(res, 201, { ok: true, order });
    } catch (err) {
      sendJson(res, 400, { ok: false, error: err instanceof Error ? err.message : String(err) });
    }
    return true;
  }
  if (pathname.startsWith('/api/store/orders/') && method === 'PATCH') {
    if (!ctx.isAdmin) {
      sendJson(res, 401, { ok: false, error: 'Unauthorized' });
      return true;
    }
    const orderId = decodeURIComponent(pathname.slice('/api/store/orders/'.length));
    try {
      const body = (await readJsonBody(req)) as Record<string, unknown>;
      const order = await patchOrder(orderId, body as Parameters<typeof patchOrder>[1]);
      if (!order) {
        sendJson(res, 404, { ok: false, error: 'Order not found' });
        return true;
      }
      sendJson(res, 200, { ok: true, order });
    } catch (err) {
      sendJson(res, 500, { ok: false, error: err instanceof Error ? err.message : String(err) });
    }
    return true;
  }
  if (pathname === '/api/store/status' && method === 'GET') {
    const { revision, catalog } = await loadCatalog();
    const orderCount = await prisma.order.count();
    sendJson(res, 200, {
      ok: true,
      revision,
      productCount: catalog.products.length,
      orderCount,
      storePath: process.env.DATABASE_URL || 'sqlite',
      database: 'sqlite',
    });
    return true;
  }
  return false;
}

export async function handleApiRequest(
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  const { pathname } = parseUrl(req);
  const method = req.method || 'GET';

  if (pathname.startsWith('/api/v1/')) {
    return handleV1(req, res, pathname, method);
  }
  if (pathname.startsWith('/api/store/')) {
    return handleLegacyStore(req, res, pathname, method);
  }
  return false;
}
