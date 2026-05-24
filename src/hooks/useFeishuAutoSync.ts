import { useEffect, useRef } from 'react';
import type { Category } from '../types';
import { categoryNeedsFeishuSync } from '../lib/feishuCategorySync';
import { syncCategoryFromFeishu } from '../lib/feishuSyncClient';

const TICK_MS = 60_000;

/**
 * 在管理员后台页定时检查各分类的飞书同步配置并执行同步。
 * 依赖 Vite 开发服务器的 /api/feishu/*（本机 lark-cli）。
 */
export function useFeishuAutoSync(
  categories: Category[],
  enabled: boolean,
  onCategorySynced: (
    categoryId: string,
    patch: Pick<
      Category,
      'feishuLastSyncedAt' | 'feishuLastSyncCount' | 'feishuLastSyncMessage'
    >
  ) => void | Promise<void>
) {
  const syncingRef = useRef<Set<string>>(new Set());
  const categoriesRef = useRef(categories);
  const onSyncedRef = useRef(onCategorySynced);
  categoriesRef.current = categories;
  onSyncedRef.current = onCategorySynced;

  useEffect(() => {
    if (!enabled) return;

    const runDue = async () => {
      const now = Date.now();
      for (const cat of categoriesRef.current) {
        if (!categoryNeedsFeishuSync(cat, now)) continue;
        if (syncingRef.current.has(cat.id)) continue;
        const url = (cat.feishuBitableUrl || '').trim();
        if (!url) continue;

        syncingRef.current.add(cat.id);
        try {
          const slugs = categoriesRef.current.map((c) => c.slug);
          const { added, removed, rawRowCount } = await syncCategoryFromFeishu(
            url,
            cat.slug,
            slugs
          );
          await onSyncedRef.current(cat.id, {
            feishuLastSyncedAt: new Date().toISOString(),
            feishuLastSyncCount: added,
            feishuLastSyncMessage: `成功：拉取 ${rawRowCount} 行，写入 ${added} 条（移除旧飞书商品 ${removed} 条）`,
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          await onSyncedRef.current(cat.id, {
            feishuLastSyncedAt: new Date().toISOString(),
            feishuLastSyncCount: 0,
            feishuLastSyncMessage: `失败：${msg}`,
          });
        } finally {
          syncingRef.current.delete(cat.id);
        }
      }
    };

    void runDue();
    const id = window.setInterval(() => void runDue(), TICK_MS);
    return () => window.clearInterval(id);
  }, [enabled]);
}
