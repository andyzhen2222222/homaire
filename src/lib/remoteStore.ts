import type { Order, Product } from '../types';
import {
  getLocalOrdersForUser,
  getLocalOrdersSorted,
  getLocalProducts,
  load,
  replaceLocalDbFromSnapshotJson,
  subscribeLocalDb,
  type LocalOrder,
} from './localDb';
import { getStoreAdminHeaders, getStorePollIntervalMs, isRemoteStoreEnabled } from './storeConfig';

let catalogRevision = 0;
let ordersRevision = 0;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let initDone = false;

type CatalogResponse = {
  ok: boolean;
  revision: number;
  catalog: {
    products: Product[];
    categories: unknown[];
    promotions: unknown[];
    config: unknown;
  };
};

type OrdersResponse = {
  ok: boolean;
  revision: number;
  orders: LocalOrder[];
};

async function fetchCatalog(): Promise<CatalogResponse | null> {
  try {
    const res = await fetch('/api/store/catalog', { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as CatalogResponse;
  } catch {
    return null;
  }
}

function applyCatalogToLocal(catalog: CatalogResponse['catalog']): void {
  const cur = load();
  const json = JSON.stringify({
    products: catalog.products,
    categories: catalog.categories,
    promotions: catalog.promotions,
    config: catalog.config ?? cur.config,
    orders: cur.orders,
  });
  replaceLocalDbFromSnapshotJson(json);
}

/** Pull server catalog into browser localStorage (for existing hooks) */
export async function pullCatalogFromServer(): Promise<number> {
  const data = await fetchCatalog();
  if (!data?.ok) return getLocalProducts().length;
  const localCount = getLocalProducts().length;
  const serverCount = data.catalog.products?.length ?? 0;
  const shouldApply =
    data.revision > catalogRevision ||
    localCount === 0 ||
    (serverCount > localCount && serverCount > 0);
  if (shouldApply) {
    catalogRevision = data.revision;
    applyCatalogToLocal(data.catalog);
  }
  return getLocalProducts().length;
}

/** Push current local catalog to server (after admin edits) */
export async function pushCatalogToServer(): Promise<{ revision: number }> {
  const s = load();
  const res = await fetch('/api/store/catalog', {
    method: 'PUT',
    headers: {
      ...getStoreAdminHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      products: s.products,
      categories: s.categories,
      promotions: s.promotions,
      config: s.config,
    }),
  });
  const body = (await res.json()) as { ok?: boolean; revision?: number; error?: string };
  if (!res.ok || !body.ok) {
    throw new Error(body.error || `Push failed (${res.status})`);
  }
  catalogRevision = body.revision ?? catalogRevision + 1;
  return { revision: catalogRevision };
}

export async function pullOrdersFromServer(): Promise<void> {
  try {
    const res = await fetch('/api/store/orders', {
      cache: 'no-store',
      headers: getStoreAdminHeaders(),
    });
    if (!res.ok) return;
    const data = (await res.json()) as OrdersResponse;
    if (!data.ok) return;
    if (data.revision <= ordersRevision && getLocalOrdersSorted().length > 0) return;
    ordersRevision = data.revision;
    const cur = load();
    const json = JSON.stringify({
      products: cur.products,
      categories: cur.categories,
      promotions: cur.promotions,
      config: cur.config,
      orders: data.orders,
    });
    replaceLocalDbFromSnapshotJson(json);
  } catch {
    /* ignore */
  }
}

export async function createOrderOnServer(order: Omit<Order, 'id' | 'createdAt'>): Promise<string> {
  const res = await fetch('/api/store/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order),
  });
  const body = (await res.json()) as { ok?: boolean; order?: LocalOrder; error?: string };
  if (!res.ok || !body.ok || !body.order) {
    throw new Error(body.error || `Order failed (${res.status})`);
  }
  return body.order.id;
}

export async function patchOrderOnServer(
  orderId: string,
  patch: Partial<LocalOrder>
): Promise<void> {
  const res = await fetch(`/api/store/orders/${encodeURIComponent(orderId)}`, {
    method: 'PATCH',
    headers: {
      ...getStoreAdminHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(patch),
  });
  const body = (await res.json()) as { ok?: boolean; error?: string };
  if (!res.ok || !body.ok) {
    throw new Error(body.error || `Update failed (${res.status})`);
  }
  await pullOrdersFromServer();
}

export async function fetchUserOrdersFromServer(userId: string): Promise<LocalOrder[]> {
  const res = await fetch(`/api/store/orders?userId=${encodeURIComponent(userId)}`, {
    cache: 'no-store',
  });
  const body = (await res.json()) as OrdersResponse;
  if (!res.ok || !body.ok) return getLocalOrdersForUser(userId);
  return body.orders;
}

async function pollTick(): Promise<void> {
  await pullCatalogFromServer();
  await pullOrdersFromServer();
}

/** Start polling server → local cache; call once at app boot */
export function initRemoteStoreSync(): void {
  if (!isRemoteStoreEnabled() || initDone) return;
  initDone = true;

  void pollTick();

  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(() => {
    void pollTick();
  }, getStorePollIntervalMs());
}

/** After admin mutates localDb, push to server */
export async function syncAdminChangeToServer(): Promise<void> {
  if (!isRemoteStoreEnabled()) return;
  await pushCatalogToServer();
}

export { isRemoteStoreEnabled, subscribeLocalDb };
