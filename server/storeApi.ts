import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  appendOrder,
  patchOrder,
  readStoreFile,
  replaceCatalog,
} from './jsonFileStore';
import type { StoreCatalog } from './storeTypes';

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function getAdminSecret(): string {
  return (
    process.env.STORE_ADMIN_PASSWORD ||
    process.env.VITE_LOCAL_ADMIN_PASSWORD ||
    process.env.ADMIN_API_SECRET ||
    'admin'
  ).trim();
}

function isAdminRequest(req: IncomingMessage): boolean {
  const secret = getAdminSecret();
  const header =
    (req.headers['x-admin-password'] as string | undefined) ||
    (req.headers['x-admin-key'] as string | undefined) ||
    '';
  const auth = req.headers.authorization || '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  return Boolean(secret && (header === secret || bearer === secret));
}

function parseUrl(req: IncomingMessage): { pathname: string; searchParams: URLSearchParams } {
  const host = req.headers.host || 'localhost';
  const u = new URL(req.url || '/', `http://${host}`);
  return { pathname: u.pathname, searchParams: u.searchParams };
}

/** GET /api/store/catalog */
export async function handleGetCatalog(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== 'GET') {
    sendJson(res, 405, { ok: false, error: 'Method not allowed' });
    return;
  }
  const store = readStoreFile();
  sendJson(res, 200, {
    ok: true,
    revision: store.revision,
    updatedAt: store.updatedAt,
    catalog: store.catalog,
  });
}

/** PUT /api/store/catalog — admin replaces full catalog */
export async function handlePutCatalog(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== 'PUT') {
    sendJson(res, 405, { ok: false, error: 'Method not allowed' });
    return;
  }
  if (!isAdminRequest(req)) {
    sendJson(res, 401, { ok: false, error: 'Unauthorized' });
    return;
  }
  try {
    const body = (await readJsonBody(req)) as Partial<StoreCatalog>;
    const catalog: StoreCatalog = {
      products: Array.isArray(body.products) ? body.products : [],
      categories: Array.isArray(body.categories) ? body.categories : [],
      promotions: Array.isArray(body.promotions) ? body.promotions : [],
      config: body.config ?? { id: 'global', storeName: 'HOMAIRE' },
    };
    const { revision } = await replaceCatalog(catalog);
    sendJson(res, 200, { ok: true, revision });
  } catch (err) {
    sendJson(res, 500, { ok: false, error: err instanceof Error ? err.message : String(err) });
  }
}

/** GET /api/store/orders — admin list; ?userId= for customer */
export async function handleGetOrders(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== 'GET') {
    sendJson(res, 405, { ok: false, error: 'Method not allowed' });
    return;
  }
  const { searchParams } = parseUrl(req);
  const userId = searchParams.get('userId');
  const store = readStoreFile();

  if (userId) {
    const orders = store.orders.filter((o) => o.userId === userId);
    sendJson(res, 200, { ok: true, revision: store.revision, orders });
    return;
  }

  if (!isAdminRequest(req)) {
    sendJson(res, 401, { ok: false, error: 'Unauthorized' });
    return;
  }
  sendJson(res, 200, { ok: true, revision: store.revision, orders: store.orders });
}

/** POST /api/store/orders — public checkout */
export async function handlePostOrder(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== 'POST') {
    sendJson(res, 405, { ok: false, error: 'Method not allowed' });
    return;
  }
  try {
    const body = (await readJsonBody(req)) as Record<string, unknown>;
    if (!body.userId || !Array.isArray(body.items) || typeof body.total !== 'number') {
      sendJson(res, 400, { ok: false, error: 'Invalid order payload' });
      return;
    }
    const order = await appendOrder(body as Parameters<typeof appendOrder>[0]);
    sendJson(res, 201, { ok: true, order });
  } catch (err) {
    sendJson(res, 500, { ok: false, error: err instanceof Error ? err.message : String(err) });
  }
}

/** PATCH /api/store/orders/:id — admin */
export async function handlePatchOrder(
  req: IncomingMessage,
  res: ServerResponse,
  orderId: string
): Promise<void> {
  if (req.method !== 'PATCH') {
    sendJson(res, 405, { ok: false, error: 'Method not allowed' });
    return;
  }
  if (!isAdminRequest(req)) {
    sendJson(res, 401, { ok: false, error: 'Unauthorized' });
    return;
  }
  try {
    const body = (await readJsonBody(req)) as Record<string, unknown>;
    const updated = await patchOrder(orderId, body);
    if (!updated) {
      sendJson(res, 404, { ok: false, error: 'Order not found' });
      return;
    }
    sendJson(res, 200, { ok: true, order: updated });
  } catch (err) {
    sendJson(res, 500, { ok: false, error: err instanceof Error ? err.message : String(err) });
  }
}

/** GET /api/store/status */
export function handleStoreStatus(req: IncomingMessage, res: ServerResponse): void {
  if (req.method !== 'GET') {
    sendJson(res, 405, { ok: false, error: 'Method not allowed' });
    return;
  }
  const store = readStoreFile();
  sendJson(res, 200, {
    ok: true,
    revision: store.revision,
    productCount: store.catalog.products.length,
    orderCount: store.orders.length,
    storePath: process.env.STORE_FILE_PATH || 'data/store-v1.json',
  });
}

export function handleStoreApiRequest(req: IncomingMessage, res: ServerResponse): boolean {
  const { pathname } = parseUrl(req);
  if (pathname === '/api/store/catalog' && req.method === 'GET') {
    void handleGetCatalog(req, res);
    return true;
  }
  if (pathname === '/api/store/catalog' && req.method === 'PUT') {
    void handlePutCatalog(req, res);
    return true;
  }
  if (pathname === '/api/store/orders' && req.method === 'GET') {
    void handleGetOrders(req, res);
    return true;
  }
  if (pathname === '/api/store/orders' && req.method === 'POST') {
    void handlePostOrder(req, res);
    return true;
  }
  if (pathname.startsWith('/api/store/orders/') && req.method === 'PATCH') {
    const orderId = decodeURIComponent(pathname.slice('/api/store/orders/'.length));
    void handlePatchOrder(req, res, orderId);
    return true;
  }
  if (pathname === '/api/store/status' && req.method === 'GET') {
    handleStoreStatus(req, res);
    return true;
  }
  return false;
}
