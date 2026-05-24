import type { Category } from '../types';

export const DEFAULT_FEISHU_SYNC_INTERVAL_MINUTES = 120;
export const MIN_FEISHU_SYNC_INTERVAL_MINUTES = 15;
export const MAX_FEISHU_SYNC_INTERVAL_MINUTES = 10080;

export function isFeishuShareViewUrl(url: string): boolean {
  try {
    const u = new URL(url.trim());
    return /\/share\/base\/view\//i.test(u.pathname);
  } catch {
    return /share\/base\/view\//i.test(url);
  }
}

export function normalizeFeishuSyncIntervalMinutes(v: unknown): number {
  const n = typeof v === 'number' ? v : parseInt(String(v ?? ''), 10);
  if (!Number.isFinite(n) || n < MIN_FEISHU_SYNC_INTERVAL_MINUTES) {
    return DEFAULT_FEISHU_SYNC_INTERVAL_MINUTES;
  }
  return Math.min(MAX_FEISHU_SYNC_INTERVAL_MINUTES, Math.floor(n));
}

export function categoryNeedsFeishuSync(cat: Category, nowMs = Date.now()): boolean {
  if (!cat.feishuSyncEnabled) return false;
  const url = (cat.feishuBitableUrl || '').trim();
  if (!url || isFeishuShareViewUrl(url)) return false;
  const intervalMs = normalizeFeishuSyncIntervalMinutes(cat.feishuSyncIntervalMinutes) * 60_000;
  if (!cat.feishuLastSyncedAt) return true;
  const last = Date.parse(cat.feishuLastSyncedAt);
  if (!Number.isFinite(last)) return true;
  return nowMs - last >= intervalMs;
}

export function formatFeishuLastSync(cat: Category): string {
  if (!cat.feishuLastSyncedAt) return 'Never synced';
  const d = new Date(cat.feishuLastSyncedAt);
  if (Number.isNaN(d.getTime())) return 'Never synced';
  const count =
    typeof cat.feishuLastSyncCount === 'number' ? ` · ${cat.feishuLastSyncCount} items` : '';
  return `${d.toLocaleString('en-US')}${count}`;
}
