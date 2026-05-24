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
import { FeishuFieldMappingPanel } from './FeishuFieldMappingPanel';

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
        飞书多维表格数据源
      </div>
      <p className={ADMIN_FORM_HINT}>
        每个分类可绑定一个飞书链接，请使用含 <code className="text-[11px]">/base/</code> 的编辑页 URL。
        同步后的商品写入 <span className="font-medium text-[#409eff]">/{categorySlug || '…'}</span>，
        并替换该分类下此前由飞书同步的商品。
        列名与系统字段的固定映射见下方「飞书字段映射与使用说明」。
      </p>
      <div>
        <label className={ADMIN_FORM_LABEL}>飞书多维表格 URL</label>
        <input
          type="url"
          value={feishuBitableUrl}
          onChange={(e) => setFeishuBitableUrl(e.target.value)}
          placeholder="https://xxx.feishu.cn/base/AppXXX?table=tblYYY"
          className={ADMIN_FORM_CONTROL}
        />
        {shareWarn ? (
          <p className="mt-1 text-xs text-amber-700">
            分享视图链接无法同步。请在飞书编辑模式下打开表格，复制地址栏 URL。
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
        启用定时同步（后台页面打开时）
      </label>
      <div>
        <label className={ADMIN_FORM_LABEL}>同步间隔（分钟）</label>
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
          默认 {DEFAULT_FEISHU_SYNC_INTERVAL_MINUTES} 分钟；最少 15 分钟。
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
    setCliHint(s.hint || s.error || (s.userReady ? `已连接 · ${s.userName || '用户'}` : ''));
  }, []);

  useEffect(() => {
    void refreshCliStatus();
  }, [refreshCliStatus]);

  const configured = categories.filter((c) => (c.feishuBitableUrl || '').trim());
  const autoEnabled = configured.filter((c) => c.feishuSyncEnabled);

  const runSync = async (cat: Category, opts?: { silent?: boolean }) => {
    const url = (cat.feishuBitableUrl || '').trim();
    if (!url) {
      if (!opts?.silent) window.alert('请先在该分类中填写飞书 URL');
      throw new Error('未配置飞书 URL');
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
        feishuLastSyncMessage: `成功：${rawRowCount} 行 → ${added} 条商品（移除 ${removed} 条旧飞书商品）`,
      });
      if (!opts?.silent)
        window.alert(`${displayCategoryName(cat)} 同步完成：${added} 条商品`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await onUpdateCategory(cat.id, {
        feishuLastSyncedAt: new Date().toISOString(),
        feishuLastSyncCount: 0,
        feishuLastSyncMessage: `失败：${msg}`,
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
      window.alert('没有已配置有效飞书 URL 的分类');
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
    window.alert(`全部同步完成：成功 ${ok} 个，失败 ${fail} 个`);
  };

  return (
    <div className="border-b border-slate-100 bg-slate-50/80 px-3 py-3 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
          <Link2 className="h-4 w-4 text-[#409eff]" />
          飞书多维表格同步
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void refreshCliStatus()}
            className={ADMIN_BTN_DEFAULT}
          >
            检查 CLI
          </button>
          <button
            type="button"
            disabled={syncingAll || syncingId != null || configured.length === 0}
            onClick={() => void runSyncAll()}
            className={ADMIN_BTN_PRIMARY}
          >
            {syncingAll ? '同步中…' : '同步全部已配置'}
          </button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
        {cliReady === true ? (
          <span className="inline-flex items-center gap-1 text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            飞书 CLI 就绪
          </span>
        ) : cliReady === false ? (
          <span className="inline-flex items-center gap-1 text-amber-700">
            <AlertCircle className="h-3.5 w-3.5" />
            CLI 未登录
          </span>
        ) : null}
        {cliHint ? <span className="text-slate-500">{cliHint}</span> : null}
        <span>
          <strong>{configured.length}</strong> 已绑定 · <strong>{autoEnabled.length}</strong> 定时同步
        </span>
        <span className="inline-flex items-center gap-1 text-slate-500">
          <Clock className="h-3.5 w-3.5" />
          后台打开时每分钟检查一次
        </span>
      </div>
      <p className="text-[11px] text-slate-500 leading-relaxed">
        需要开发服务器 API（<code className="text-[10px]">npm run dev</code>）及本地{' '}
        <code className="text-[10px]">lark-cli</code>。生产环境请部署同步服务或运行{' '}
        <code className="text-[10px]">npm run sync:feishu</code>。
      </p>
      <FeishuFieldMappingPanel />
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
          {badUrl ? '需 /base/ URL' : '已配置'}
        </span>
      ) : (
        <span className="text-[10px] text-slate-400">未设置</span>
      )}
      <p className={`text-[10px] leading-snug ${failed ? 'text-red-600' : 'text-slate-500'}`}>
        {formatFeishuLastSync(cat)}
      </p>
      {cat.feishuSyncEnabled ? (
        <span className="text-[10px] text-[#409eff]">
          自动 · {cat.feishuSyncIntervalMinutes ?? 120} 分钟
        </span>
      ) : null}
      <button
        type="button"
        disabled={!hasUrl || badUrl || syncing}
        onClick={onSync}
        className="inline-flex items-center gap-1 rounded border border-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-[#1677ff] hover:bg-slate-50 disabled:opacity-40"
      >
        <RefreshCw className={`h-3 w-3 ${syncing ? 'animate-spin' : ''}`} />
        同步
      </button>
    </div>
  );
}
