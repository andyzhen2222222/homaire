import type { Product } from '../types';
import { localApplyFeishuCategorySync } from './localDb';
import { syncAdminChangeToServer } from './remoteStore';
import { isFeishuShareViewUrl } from './feishuCategorySync';

export type FeishuSyncStatusResponse = {
  ok: boolean;
  userReady?: boolean;
  userName?: string;
  hint?: string;
  error?: string;
};

export type FeishuSyncRunResponse = {
  ok: boolean;
  products?: Omit<Product, 'id' | 'createdAt'>[];
  rawRowCount?: number;
  tableId?: string;
  error?: string;
};

export async function fetchFeishuCliStatus(): Promise<FeishuSyncStatusResponse> {
  try {
    const res = await fetch('/api/feishu/status');
    return (await res.json()) as FeishuSyncStatusResponse;
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : '无法连接同步服务（请确认 npm run dev 已启动）',
    };
  }
}

export async function fetchProductsFromFeishuApi(
  url: string,
  categorySlug: string,
  allowedCategorySlugs?: string[]
): Promise<FeishuSyncRunResponse> {
  if (isFeishuShareViewUrl(url)) {
    return {
      ok: false,
      error:
        '当前为分享视图链接，无法同步。请在飞书打开多维表格编辑页，复制地址栏含 /base/ 的完整链接。',
    };
  }
  try {
    const res = await fetch('/api/feishu/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, categorySlug, allowedCategorySlugs }),
    });
    const data = (await res.json()) as FeishuSyncRunResponse;
    if (!res.ok && data.error) return { ok: false, error: data.error };
    return data;
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : '同步请求失败',
    };
  }
}

/** 拉取飞书并写入本地库（替换该分类下原飞书来源商品） */
export async function syncCategoryFromFeishu(
  url: string,
  categorySlug: string,
  allowedCategorySlugs?: string[]
): Promise<{ removed: number; added: number; rawRowCount: number }> {
  const data = await fetchProductsFromFeishuApi(url, categorySlug, allowedCategorySlugs);
  if (!data.ok || !data.products) {
    throw new Error(data.error || '飞书同步失败');
  }
  const products = data.products.map((p) => ({
    ...p,
    category: categorySlug.trim().toLowerCase(),
    syncSource: 'feishu' as const,
  }));
  const { removed, added } = localApplyFeishuCategorySync(categorySlug, products);
  await syncAdminChangeToServer();
  return { removed, added, rawRowCount: data.rawRowCount ?? added };
}
