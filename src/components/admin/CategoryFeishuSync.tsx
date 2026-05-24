import { useCallback, useEffect, useState } from 'react';
import { Link2, RefreshCw, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { Category } from '../../types';
import {
  DEFAULT_FEISHU_SYNC_INTERVAL_MINUTES,
  formatFeishuLastSync,
  isFeishuShareViewUrl,
  normalizeFeishuSyncIntervalMinutes,
} from '../../lib/feishuCategorySync';
import { fetchFeishuCliStatus, syncCategoryFromFeishu } from '../../lib/feishuSyncClient';
import { displayCategoryName } from '../../lib/categoryLabels';

const ADMIN_FORM_LABEL = 'mb-1.5 block text-sm text-[#606266]';
const ADMIN_FORM_HINT = 'mt-1 text-xs text-[#909399] leading-relaxed';
const ADMIN_FORM_CONTROL =
  'w-full rounded-sm border border-[#dcdfe6] bg-white px-3 py-2 text-sm text-[#606266] outline-none focus:border-[#409eff] focus:ring-1 focus:ring-[#c6e2ff]';
const ADMIN_BTN_PRIMARY =
  'rounded-sm border border-[#409eff] bg-[#409eff] px-3 py-1.5 text-sm text-white hover:bg-[#66b1ff] disabled:cursor-not-allowed disabled:opacity-50';
const ADMIN_BTN_DEFAULT =
  'rounded-sm border border-[#dcdfe6] bg-white px-3 py-1.5 text-sm text-[#606266] hover:border-[#c0c4cc] hover:text-[#409eff] disabled:opacity-50';

export function CategoryFeishuFormFields({
  feishuBitableUrl,
  setFeishuBitableUrl,
  feishuSyncEnabled,
  setFeishuSyncEnabled,
  feishuSyncIntervalMinutes,
  setFeishuSyncIntervalMinutes,
  categorySlug,
}: {
  feishuBitableUrl: string;
  setFeishuBitableUrl: (v: string) => void;
  feishuSyncEnabled: boolean;
  setFeishuSyncEnabled: (v: boolean) => void;
  feishuSyncIntervalMinutes: number;
  setFeishuSyncIntervalMinutes: (v: number) => void;
  categorySlug: string;
}) {
  const shareWarn = feishuBitableUrl.trim() && isFeishuShareViewUrl(feishuBitableUrl);

  return (
    <div className="rounded-sm border border-[#e4e7ed] bg-[#fafafa] p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-[#303133]">
        <Link2 className="h-4 w-4 text-[#409eff]" />
        Feishu Bitable source
      </div>
      <p className={ADMIN_FORM_HINT}>
        Each category can have one Feishu link. Use the editor URL with <code className="text-[11px]">/base/</code>.
        Synced products are written to <span className="font-medium text-[#409eff]">/{categorySlug || '…'}</span> and
        replace previous Feishu-synced items in that category.
      </p>
      <div>
        <label className={ADMIN_FORM_LABEL}>Feishu Bitable URL</label>
        <input
          type="url"
          value={feishuBitableUrl}
          onChange={(e) => setFeishuBitableUrl(e.target.value)}
          placeholder="https://xxx.feishu.cn/base/AppXXX?table=tblYYY"
          className={ADMIN_FORM_CONTROL}
        />
        {shareWarn ? (
          <p className="mt-1 text-xs text-amber-700">
            Share-view links cannot sync. Open the table in Feishu edit mode and copy the address bar URL.
          </p>
        ) : null}
      </div>
      <label className="flex items-center gap-2 text-sm text-[#606266] cursor-pointer">
        <input
          type="checkbox"
          checked={feishuSyncEnabled}
          onChange={(e) => setFeishuSyncEnabled(e.target.checked)}
          className="rounded border-[#dcdfe6]"
        />
        Enable scheduled sync (while admin is open)
      </label>
      <div>
        <label className={ADMIN_FORM_LABEL}>Sync interval (minutes)</label>
        <input
          type="number"
          min={15}
          max={10080}
          value={feishuSyncIntervalMinutes}
          onChange={(e) =>
            setFeishuSyncIntervalMinutes(
              normalizeFeishuSyncIntervalMinutes(parseInt(e.target.value, 10))
            )
          }
          disabled={!feishuSyncEnabled}
          className={`${ADMIN_FORM_CONTROL} max-w-[140px]`}
        />
        <p className={ADMIN_FORM_HINT}>
          Default {DEFAULT_FEISHU_SYNC_INTERVAL_MINUTES} min; minimum 15 min.
        </p>
      </div>
    </div>
  );
}

export function CategoriesFeishuSyncPanel({
  categories,
  allowedCategorySlugs,
  onUpdateCategory,
}: {
  categories: Category[];
  allowedCategorySlugs: string[];
  onUpdateCategory: (
    id: string,
    patch: Partial<Omit<Category, 'id'>>
  ) => void | Promise<void>;
}) {
  const [cliReady, setCliReady] = useState<boolean | null>(null);
  const [cliHint, setCliHint] = useState<string>('');
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);

  const refreshCliStatus = useCallback(async () => {
    const s = await fetchFeishuCliStatus();
    setCliReady(Boolean(s.userReady));
    setCliHint(s.hint || s.error || (s.userReady ? `Connected · ${s.userName || 'user'}` : ''));
  }, []);

  useEffect(() => {
    void refreshCliStatus();
  }, [refreshCliStatus]);

  const configured = categories.filter((c) => (c.feishuBitableUrl || '').trim());
  const autoEnabled = configured.filter((c) => c.feishuSyncEnabled);

  const runSync = async (cat: Category, opts?: { silent?: boolean }) => {
    const url = (cat.feishuBitableUrl || '').trim();
    if (!url) {
      if (!opts?.silent) window.alert('Add a Feishu URL on this category first');
      throw new Error('Feishu URL not configured');
    }
    setSyncingId(cat.id);
    try {
      const { added, removed, rawRowCount } = await syncCategoryFromFeishu(
        url,
        cat.slug,
        allowedCategorySlugs
      );
      await onUpdateCategory(cat.id, {
        feishuLastSyncedAt: new Date().toISOString(),
        feishuLastSyncCount: added,
        feishuLastSyncMessage: `OK: ${rawRowCount} rows → ${added} products (removed ${removed} old Feishu items)`,
      });
      if (!opts?.silent)
        window.alert(`${displayCategoryName(cat)} sync complete: ${added} products`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await onUpdateCategory(cat.id, {
        feishuLastSyncedAt: new Date().toISOString(),
        feishuLastSyncCount: 0,
        feishuLastSyncMessage: `Failed: ${msg}`,
      });
      if (!opts?.silent) window.alert(msg);
      throw e;
    } finally {
      setSyncingId(null);
    }
  };

  const runSyncAll = async () => {
    const list = configured.filter((c) => !isFeishuShareViewUrl(c.feishuBitableUrl || ''));
    if (list.length === 0) {
      window.alert('No categories with a valid Feishu URL');
      return;
    }
    setSyncingAll(true);
    let ok = 0;
    let fail = 0;
    for (const cat of list) {
      try {
        await runSync(cat, { silent: true });
        ok += 1;
      } catch {
        fail += 1;
      }
    }
    setSyncingAll(false);
    window.alert(`Sync all finished: ${ok} succeeded, ${fail} failed`);
  };

  return (
    <div className="border-b border-slate-100 bg-slate-50/80 px-3 py-3 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
          <Link2 className="h-4 w-4 text-[#409eff]" />
          Feishu Bitable sync
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void refreshCliStatus()}
            className={ADMIN_BTN_DEFAULT}
          >
            Check CLI
          </button>
          <button
            type="button"
            disabled={syncingAll || syncingId != null || configured.length === 0}
            onClick={() => void runSyncAll()}
            className={ADMIN_BTN_PRIMARY}
          >
            {syncingAll ? 'Syncing…' : 'Sync all configured'}
          </button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
        {cliReady === true ? (
          <span className="inline-flex items-center gap-1 text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Feishu CLI ready
          </span>
        ) : cliReady === false ? (
          <span className="inline-flex items-center gap-1 text-amber-700">
            <AlertCircle className="h-3.5 w-3.5" />
            CLI not signed in
          </span>
        ) : null}
        {cliHint ? <span className="text-slate-500">{cliHint}</span> : null}
        <span>
          <strong>{configured.length}</strong> linked · <strong>{autoEnabled.length}</strong> scheduled
        </span>
        <span className="inline-flex items-center gap-1 text-slate-500">
          <Clock className="h-3.5 w-3.5" />
          Checks every minute while admin is open
        </span>
      </div>
      <p className="text-[11px] text-slate-500 leading-relaxed">
        Requires dev server API (<code className="text-[10px]">npm run dev</code>) and local{' '}
        <code className="text-[10px]">lark-cli</code>. In production, deploy a sync service or run{' '}
        <code className="text-[10px]">npm run sync:feishu</code>.
      </p>
    </div>
  );
}

export function CategoryFeishuSyncCell({
  cat,
  syncing,
  onSync,
}: {
  cat: Category;
  syncing: boolean;
  onSync: () => void;
}) {
  const url = (cat.feishuBitableUrl || '').trim();
  const hasUrl = url.length > 0;
  const badUrl = hasUrl && isFeishuShareViewUrl(url);
  const msg = cat.feishuLastSyncMessage || '';
  const failed = msg.startsWith('Failed') || msg.startsWith('失败');

  return (
    <div className="min-w-[140px] space-y-1">
      {hasUrl ? (
        <span
          className={`inline-block max-w-[160px] truncate text-[10px] ${badUrl ? 'text-amber-700' : 'text-emerald-700'}`}
          title={url}
        >
          {badUrl ? 'Need /base/ URL' : 'Configured'}
        </span>
      ) : (
        <span className="text-[10px] text-slate-400">Not set</span>
      )}
      <p className={`text-[10px] leading-snug ${failed ? 'text-red-600' : 'text-slate-500'}`}>
        {formatFeishuLastSync(cat)}
      </p>
      {cat.feishuSyncEnabled ? (
        <span className="text-[10px] text-[#409eff]">
          Auto · {cat.feishuSyncIntervalMinutes ?? 120} min
        </span>
      ) : null}
      <button
        type="button"
        disabled={!hasUrl || badUrl || syncing}
        onClick={onSync}
        className="inline-flex items-center gap-1 rounded border border-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-[#1677ff] hover:bg-slate-50 disabled:opacity-40"
      >
        <RefreshCw className={`h-3 w-3 ${syncing ? 'animate-spin' : ''}`} />
        Sync
      </button>
    </div>
  );
}
