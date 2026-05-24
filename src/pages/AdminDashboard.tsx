import React, { useState, useEffect, useMemo, FormEvent, useRef, Fragment } from 'react';
import { useProducts } from '../hooks/useProducts';
import { useOrders, usePromotions, useAdminActions, useCategories } from '../hooks/useAdminData';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { 
  Plus, Trash2, Edit, Package, DollarSign, ShoppingBag, 
  Users, LayoutDashboard, Search, X, Check, ArrowRight,
  TrendingUp, Clock, AlertCircle, Eye, Tag, Image as ImageIcon,
  ChevronRight, Filter, Download, MoreHorizontal, Settings, Layers, LayoutTemplate
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { Product, Order, Promotion, StoreConfig, Category } from '../types';
import { useStoreConfig } from '../hooks/useAdminData';
import { SiteSettingsForm } from '../components/admin/SiteSettingsForm';
import { HomeDecorEditor } from '../components/admin/HomeDecorEditor';
import { OrderManagement } from '../components/admin/OrderManagement';
import {
  CategoriesFeishuSyncPanel,
  CategoryFeishuFormFields,
} from '../components/admin/CategoryFeishuSync';
import { NavDepartmentsEditor } from '../components/admin/NavDepartmentsEditor';
import { CategoryCoverEditor } from '../components/admin/CategoryCoverEditor';
import { CategoryTreePanel } from '../components/admin/CategoryTreePanel';
import { useFeishuAutoSync } from '../hooks/useFeishuAutoSync';
import {
  DEFAULT_FEISHU_SYNC_INTERVAL_MINUTES,
  normalizeFeishuSyncIntervalMinutes,
} from '../lib/feishuCategorySync';
import { fileToDataUrl } from '../lib/fileToDataUrl';
import {
  processImportedProductRows,
  downloadProductImportTemplateCsv,
  getProductImportTemplateSheetRows,
  PRODUCT_IMPORT_SHORT_TITLE_MAX,
  PRODUCT_IMPORT_NAME_MAX,
} from '../lib/productImport';
import { enrichImportedProductsWithShortTitles } from '../lib/storeShortTitle';
import { formatEurPrice, formatEurPriceCompact, roundStorePrice } from '../lib/storePrice';
import { displayCategoryName } from '../lib/categoryLabels';
import {
  buildCategorySelectOptions,
  getCategoryLevel,
  countProductsInCategorySubtree,
  getDescendantIds,
  flattenCategoryTreeSorted,
  getCategoryPathLabel,
} from '../lib/categoryTree';

/** 传统 Element / Vue 后台风格弹窗：无缩放动效、纯色遮罩、细边框与轻阴影 */
const ADMIN_MODAL_MASK = 'absolute inset-0 bg-black/45';
const ADMIN_MODAL_DIALOG =
  'relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded border border-[#dcdfe6] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.12)]';
const ADMIN_MODAL_HEADER =
  'flex shrink-0 items-center justify-between border-b border-[#e4e7ed] bg-[#f5f7fa] px-4 py-3';
const ADMIN_MODAL_TITLE = 'text-base font-medium text-[#303133]';
const ADMIN_MODAL_SUBTITLE = 'mt-0.5 text-xs text-[#909399]';
const ADMIN_MODAL_CLOSE =
  'rounded-sm border border-[#dcdfe6] bg-white p-2 text-[#909399] hover:bg-[#ecf5ff] hover:text-[#409eff]';

/** 简易 Element / Vue 后台表单控件 */
const ADMIN_FORM_LABEL = 'mb-1.5 block text-sm text-[#606266]';
const ADMIN_FORM_HINT = 'mt-1 text-xs text-[#909399] leading-relaxed';
const ADMIN_FORM_CONTROL =
  'w-full rounded-sm border border-[#dcdfe6] bg-white px-3 py-2 text-sm text-[#606266] outline-none focus:border-[#409eff] focus:ring-1 focus:ring-[#c6e2ff]';
const ADMIN_FORM_TEXTAREA = `${ADMIN_FORM_CONTROL} min-h-[88px] resize-y align-top`;
const ADMIN_FORM_SECTION = 'mb-2 text-sm font-medium text-[#303133]';
const ADMIN_BTN_PRIMARY =
  'rounded-sm border border-[#409eff] bg-[#409eff] px-4 py-2 text-sm text-white hover:bg-[#66b1ff] disabled:cursor-not-allowed disabled:opacity-50';
const ADMIN_BTN_DEFAULT =
  'rounded-sm border border-[#dcdfe6] bg-white px-4 py-2 text-sm text-[#606266] hover:border-[#c0c4cc] hover:text-[#409eff]';

function productListSortKey(p: Product): number {
  const u = p.updatedAt as { seconds?: number } | undefined;
  const c = p.createdAt as { seconds?: number } | undefined;
  const tu = typeof u?.seconds === 'number' ? u.seconds : 0;
  const tc = typeof c?.seconds === 'number' ? c.seconds : 0;
  return Math.max(tu, tc);
}

export default function AdminDashboard() {
  const { products } = useProducts();
  /** 后台列表：最新创建/更新的商品在前，导入数据会出现在表格上方 */
  const inventoryProducts = useMemo(
    () => [...products].sort((a, b) => productListSortKey(b) - productListSortKey(a)),
    [products]
  );
  const { orders } = useOrders();
  const { promotions, togglePromotion, deletePromotion, addPromotion } = usePromotions();
  const { addProduct, bulkAddProducts, updateProduct, deleteProduct } = useAdminActions();
  const { config, updateConfig, loading: configLoading } = useStoreConfig();
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories();

  const { user, profile, loading: authLoading, loginWithCredentials, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'orders' | 'promotions' | 'homeDecor' | 'settings'>('products');
  const [adminEmail, setAdminEmail] = useState('demo@local.test');
  const [adminDisplayName, setAdminDisplayName] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);
  const [adminLoginSubmitting, setAdminLoginSubmitting] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingPromo, setIsAddingPromo] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryModalParentId, setCategoryModalParentId] = useState<string | null>(null);
  const [feishuRowSyncId, setFeishuRowSyncId] = useState<string | null>(null);

  const runCategoryFeishuSync = (cat: Category) => {
    const url = (cat.feishuBitableUrl || '').trim();
    if (!url) {
      window.alert('请先编辑该分类并填写飞书多维表格 URL。');
      return;
    }
    setFeishuRowSyncId(cat.id);
    void (async () => {
      try {
        const { syncCategoryFromFeishu } = await import('../lib/feishuSyncClient');
        const { added, removed, rawRowCount } = await syncCategoryFromFeishu(
          url,
          cat.slug,
          categories.map((c) => c.slug),
        );
        await updateCategory(cat.id, {
          feishuLastSyncedAt: new Date().toISOString(),
          feishuLastSyncCount: added,
          feishuLastSyncMessage: `成功：${rawRowCount} 行，${added} 条商品（移除 ${removed} 条）`,
        });
        window.alert(`「${cat.name}」同步完成：${added} 条商品`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        await updateCategory(cat.id, {
          feishuLastSyncedAt: new Date().toISOString(),
          feishuLastSyncCount: 0,
          feishuLastSyncMessage: `失败：${msg}`,
        });
        window.alert(msg);
      } finally {
        setFeishuRowSyncId(null);
      }
    })();
  };

  useFeishuAutoSync(
    categories,
    Boolean(profile?.isAdmin && user),
    async (categoryId, patch) => {
      await updateCategory(categoryId, patch);
    }
  );

  const closeCategoryModal = () => {
    setIsAddingCategory(false);
    setEditingCategory(null);
    setCategoryModalParentId(null);
  };

  // Stats calculation
  const totalRevenue = orders.reduce((acc, order) => order.status !== 'cancelled' ? acc + order.total : acc, 0);
  const activeOrdersCount = orders.filter(o => ['pending', 'processing', 'shipped'].includes(o.status)).length;
  const lowStockThreshold = config?.lowStockThreshold || 10;
  const lowStockProducts = products.filter(p => p.stock < lowStockThreshold);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f2f5] text-[#606266]">
        <p className="text-sm font-medium">正在加载会话…</p>
      </div>
    );
  }

  if (!user) {
    const onAdminLogin = async (e: FormEvent) => {
      e.preventDefault();
      setAdminLoginError(null);
      setAdminLoginSubmitting(true);
      try {
        const displayName =
          adminDisplayName.trim() || adminEmail.split('@')[0] || 'Admin';
        const result = await loginWithCredentials({
          email: adminEmail,
          displayName,
          adminPassword,
          requireMatchingAdminPassword: true,
        });
        if (!result.ok) {
          setAdminLoginError(result.error);
        }
      } finally {
        setAdminLoginSubmitting(false);
      }
    };

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-[#f0f2f5] px-6 py-16">
        <div className="max-w-md text-center">
          <h1 className="mb-2 text-xl font-medium text-[#303133]">管理员登录</h1>
          <p className="text-sm text-[#909399]">
            本地模式：数据保存在本浏览器。默认密码{' '}
            <code className="rounded border border-[#ebeef5] bg-white px-1 py-0.5 text-xs">admin</code>
            ；可在{' '}
            <code className="rounded border border-[#ebeef5] bg-white px-1 py-0.5 text-xs">.env</code>{' '}
            中通过{' '}
            <code className="rounded border border-[#ebeef5] bg-white px-1 py-0.5 text-xs">VITE_LOCAL_ADMIN_PASSWORD</code>{' '}
            覆盖。
          </p>
        </div>

        <form
          onSubmit={onAdminLogin}
          className="w-full max-w-sm space-y-4 rounded-sm border border-[#dcdfe6] bg-white p-6 text-left shadow-[0_2px_12px_rgba(0,0,0,0.08)]"
        >
          <div>
            <label htmlFor="admin-login-email" className={ADMIN_FORM_LABEL}>
              邮箱
            </label>
            <input
              id="admin-login-email"
              type="email"
              autoComplete="username"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              className={ADMIN_FORM_CONTROL}
              required
            />
          </div>
          <div>
            <label htmlFor="admin-login-name" className={ADMIN_FORM_LABEL}>
              显示名称（可选）
            </label>
            <input
              id="admin-login-name"
              type="text"
              autoComplete="name"
              value={adminDisplayName}
              onChange={(e) => setAdminDisplayName(e.target.value)}
              placeholder={adminEmail.includes('@') ? adminEmail.split('@')[0] : 'Admin'}
              className={ADMIN_FORM_CONTROL}
            />
          </div>
          <div>
            <label htmlFor="admin-login-password" className={ADMIN_FORM_LABEL}>
              管理员密码
            </label>
            <input
              id="admin-login-password"
              type="password"
              autoComplete="current-password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className={ADMIN_FORM_CONTROL}
              required
            />
          </div>
          {adminLoginError && (
            <p className="rounded-sm border border-[#fde2e2] bg-[#fef0f0] px-3 py-2 text-xs text-[#f56c6c]" role="alert">
              {adminLoginError}
            </p>
          )}
          <button
            type="submit"
            disabled={adminLoginSubmitting}
            className={`${ADMIN_BTN_PRIMARY} w-full`}
          >
            {adminLoginSubmitting ? '登录中…' : '登录'}
          </button>
        </form>

        <Link to="/" className="text-sm text-[#909399] hover:text-[#409eff]">
          返回店铺
        </Link>
      </div>
    );
  }

  if (!profile?.isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#f0f2f5] px-6 text-center">
        <div>
          <h1 className="mb-2 text-xl font-medium text-[#303133]">无权访问</h1>
          <p className="max-w-md text-sm text-[#909399]">
            账号 <span className="font-medium text-[#606266]">{user.email}</span> 不是管理员会话。请退出后重新进入，并输入正确的管理员密码（默认{' '}
            <code className="rounded border border-[#ebeef5] bg-white px-1 py-0.5 text-xs">admin</code>）。
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <button
            type="button"
            onClick={() => void logout()}
            className={`${ADMIN_BTN_DEFAULT} text-sm`}
          >
            退出登录
          </button>
          <Link to="/" className="text-sm text-[#409eff] hover:underline">
            返回店铺
          </Link>
        </div>
      </div>
    );
  }

  const adminTabMeta: Record<
    'products' | 'categories' | 'orders' | 'promotions' | 'homeDecor' | 'settings',
    { title: string; subtitle: string }
  > = {
    products: { title: '商品', subtitle: '库存 · 导入/新建 · 按更新时间排序' },
    categories: { title: '分类', subtitle: '导航部门 · 三级分类树 · 服务端 catalog' },
    orders: { title: '订单', subtitle: '搜索、详情、发货 · 本地数据' },
    promotions: { title: '营销活动', subtitle: '活动卡片 · 启用状态' },
    homeDecor: { title: '首页', subtitle: '首页区块与分类磁贴' },
    settings: { title: '站点设置', subtitle: '店名、库存阈值、分类 Hero' },
  };

  const stats = [
    { label: '营收', value: formatEurPrice(totalRevenue), icon: <TrendingUp className="w-4 h-4" />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: '进行中订单', value: activeOrdersCount.toString(), icon: <ShoppingBag className="w-4 h-4" />, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: '库存商品', value: products.length.toString(), icon: <Package className="w-4 h-4" />, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: '顾客', value: '1.2k', icon: <Users className="w-4 h-4" />, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="flex min-h-screen bg-[#f0f2f5] text-slate-800 antialiased">
      <aside className="fixed left-0 top-0 z-40 flex h-full w-52 flex-col border-r border-slate-800 bg-[#001529] text-slate-200 shadow-sm">
        <div className="flex h-12 shrink-0 items-center border-b border-white/10 px-4">
          <Link to="/" className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-semibold tracking-tight text-white">HOMAIRE</span>
            <span className="text-[10px] text-slate-400">管理后台</span>
          </Link>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
          {[
            { id: 'products' as const, label: '商品', sub: '库存', icon: <Package className="h-4 w-4 shrink-0 opacity-80" /> },
            { id: 'categories' as const, label: '分类', sub: '分类树', icon: <Layers className="h-4 w-4 shrink-0 opacity-80" /> },
            { id: 'orders' as const, label: '订单', sub: '订单', icon: <ShoppingBag className="h-4 w-4 shrink-0 opacity-80" /> },
            { id: 'promotions' as const, label: '营销', sub: '活动', icon: <Tag className="h-4 w-4 shrink-0 opacity-80" /> },
            { id: 'homeDecor' as const, label: '首页', sub: '装修', icon: <LayoutTemplate className="h-4 w-4 shrink-0 opacity-80" /> },
            { id: 'settings' as const, label: '设置', sub: '站点', icon: <Settings className="h-4 w-4 shrink-0 opacity-80" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex w-full items-center gap-2.5 rounded px-3 py-2 text-left text-sm transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#1677ff] text-white shadow-sm'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              {tab.icon}
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{tab.label}</span>
                <span className="block truncate text-[10px] text-slate-500">{tab.sub}</span>
              </span>
            </button>
          ))}
        </nav>

        <div className="shrink-0 border-t border-white/10 p-2">
          <div className="flex items-center gap-2 rounded bg-black/20 px-2 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-[#1677ff] text-xs font-semibold text-white">
              {(user?.displayName?.[0] || user?.email?.[0] || 'A').toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-white">{user?.displayName || '管理员'}</p>
              <p className="truncate text-[10px] text-slate-500">{user?.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            className="mt-2 w-full rounded border border-white/10 px-2 py-1.5 text-center text-[11px] text-slate-400 transition-colors hover:border-white/20 hover:text-white"
          >
            退出登录
          </button>
        </div>
      </aside>

      <main className="ml-52 flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-12 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 shadow-sm">
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold text-slate-900">{adminTabMeta[activeTab].title}</h1>
            <p className="truncate text-[11px] text-slate-500">{adminTabMeta[activeTab].subtitle}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {activeTab === 'products' && (
              <button
                type="button"
                onClick={() => setIsImporting(true)}
                className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:border-[#1677ff] hover:text-[#1677ff]"
              >
                <Download className="h-3.5 w-3.5" />
                批量导入
              </button>
            )}
            {(activeTab === 'products' || activeTab === 'promotions' || activeTab === 'categories') && (
              <button
                type="button"
                onClick={() => {
                  if (activeTab === 'products') setIsAddingProduct(true);
                  if (activeTab === 'promotions') setIsAddingPromo(true);
                  if (activeTab === 'categories') {
                    setCategoryModalParentId(null);
                    setIsAddingCategory(true);
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded bg-[#1677ff] px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-[#4096ff]"
              >
                <Plus className="h-3.5 w-3.5" />
                新建
              </button>
            )}
            <Link
              to="/"
              className="hidden text-xs text-slate-500 hover:text-[#1677ff] sm:inline"
            >
              查看前台
            </Link>
          </div>
        </header>

        {activeTab !== 'homeDecor' && (
          <div className="grid shrink-0 grid-cols-2 gap-2 border-b border-slate-200/80 bg-white px-4 py-2 sm:grid-cols-4">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-2 rounded border border-slate-100 bg-slate-50 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-normal text-slate-600">{stat.label}</p>
                  <p className="truncate text-lg font-semibold tabular-nums text-slate-900">{stat.value}</p>
                </div>
                <div className={`shrink-0 rounded p-1.5 ${stat.bg} ${stat.color}`}>{stat.icon}</div>
              </div>
            ))}
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col p-3">
          <div
            className={`flex min-h-0 flex-1 flex-col overflow-hidden rounded border border-slate-200 bg-white shadow-sm ${
              activeTab === 'homeDecor' ? '' : ''
            }`}
          >
            <div className="min-h-0 flex-1 overflow-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}
                >
                {activeTab === 'products' && (
                  <div className="overflow-x-auto">
                    <div className="mx-3 mt-3 mb-1 flex flex-wrap items-center justify-between gap-2 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                      <span>
                        <strong className="text-slate-900">{products.length}</strong> 件本地商品
                        {products.length === 0
                          ? ' · 执行 sync:feishu 后，可点击右侧「加载快照」'
                          : ''}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="rounded border border-[#dcdfe6] bg-white px-2 py-1 text-[11px] font-medium text-[#409eff] hover:bg-[#ecf5ff]"
                          onClick={() => {
                            void (async () => {
                              try {
                                const { reloadFeishuSnapshotFromPublic } = await import(
                                  '../lib/localDb'
                                );
                                const n = await reloadFeishuSnapshotFromPublic();
                                window.alert(`已从部署快照加载 ${n} 条商品`);
                              } catch (e) {
                                window.alert(e instanceof Error ? e.message : String(e));
                              }
                            })();
                          }}
                        >
                          加载快照
                        </button>
                        <button
                          type="button"
                          className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-800 hover:bg-emerald-100"
                          onClick={() => {
                            void import('../lib/remoteStore').then(async ({ pushCatalogToServer }) => {
                              try {
                                const { revision } = await pushCatalogToServer();
                                window.alert(`已推送到服务端 catalog（revision ${revision}）。访客约 15 秒内可见更新。`);
                              } catch (e) {
                                window.alert(e instanceof Error ? e.message : String(e));
                              }
                            });
                          }}
                        >
                          推送到服务端
                        </button>
                        <button
                          type="button"
                          className="rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                          onClick={() => {
                            void import('../lib/localDb').then(({ downloadLocalDbSnapshotForDeploy }) => {
                              downloadLocalDbSnapshotForDeploy();
                            });
                          }}
                        >
                          导出 JSON
                        </button>
                      </div>
                    </div>
                    <p className="border-b border-slate-100 px-3 py-2 text-xs text-slate-500">
                      按更新时间排序 · 最新导入与新建在前
                    </p>
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">商品</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">分类</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">库存</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">价格</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {inventoryProducts.map((product) => (
                          <tr key={product.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-3 py-2">
                              <div className="flex min-w-0 max-w-md items-center gap-2">
                                <img src={product.images[0]} alt="" className="h-9 w-9 shrink-0 rounded border border-slate-200 bg-slate-100 object-cover" />
                                <span className="line-clamp-2 font-medium leading-snug text-slate-800">{product.name}</span>
                              </div>
                            </td>
                            <td className="px-3 py-2 text-xs text-slate-600">{displayCategoryName(product.category)}</td>
                            <td className="px-3 py-2">
                              <span className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium tabular-nums ${product.stock < lowStockThreshold ? 'border border-red-200 bg-red-50 text-red-700' : 'border border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
                                {product.stock}
                              </span>
                            </td>
                            <td className="px-3 py-2 font-medium tabular-nums text-slate-900">{formatEurPriceCompact(product.price)}</td>
                            <td className="px-3 py-2 text-right">
                              <div className="flex justify-end gap-1">
                                <button type="button" title="编辑" onClick={() => setEditingProduct(product)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800"><Edit className="h-4 w-4" /></button>
                                <button type="button" title="删除" onClick={() => { if(confirm('确定删除此商品？')) deleteProduct(product.id); }} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === 'categories' && (
                  <div>
                    <CategoryCoverEditor
                      categories={categories}
                      onUpdateCategory={updateCategory}
                    />
                    <NavDepartmentsEditor
                      categories={categories}
                      config={config}
                      onSave={async (navDepartments) => {
                        await updateConfig({ navDepartments });
                      }}
                    />
                    <CategoriesFeishuSyncPanel
                      categories={categories}
                      allowedCategorySlugs={categories.map((c) => c.slug)}
                      onUpdateCategory={updateCategory}
                    />
                    <p className="border-b border-slate-100 px-3 py-2 text-xs text-slate-500 mb-3">
                      最多三级。商品 category slug 对应叶子节点；父级分类页包含所有子分类商品。
                    </p>
                    <CategoryTreePanel
                      categories={categories}
                      products={inventoryProducts}
                      feishuRowSyncId={feishuRowSyncId}
                      onFeishuSync={runCategoryFeishuSync}
                      onEdit={(cat) => setEditingCategory(cat)}
                      onAddChild={(parentId) => {
                        setEditingCategory(null);
                        setCategoryModalParentId(parentId);
                        setIsAddingCategory(true);
                      }}
                      onDelete={(id) => void deleteCategory(id)}
                    />
                  </div>
                )}

                {activeTab === 'orders' && <OrderManagement />}

              {activeTab === 'promotions' && (
                <div className="grid grid-cols-1 gap-3 p-3 md:grid-cols-2 lg:grid-cols-3">
                  {promotions.map((promo) => (
                    <div key={promo.id} className="flex overflow-hidden rounded border border-slate-200 bg-white hover:border-[#1677ff]/40">
                      <div className="h-auto w-28 shrink-0 bg-slate-100">
                        <img src={promo.imageUrl} alt="" className="h-full min-h-[88px] w-full object-cover" />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col justify-between p-3">
                        <div>
                          <div className="mb-1 flex items-start justify-between gap-2">
                            <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">{promo.title}</h3>
                            <span className="shrink-0 rounded border border-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                              {promo.type === 'hero' ? '大图' : promo.type === 'card' ? '卡片' : '公告'}
                            </span>
                          </div>
                          <p className="line-clamp-2 text-xs text-slate-500">{promo.subtitle}</p>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <button 
                            type="button"
                            onClick={() => togglePromotion(promo.id, !promo.active)}
                            className={`rounded px-2 py-1 text-[11px] font-medium ${promo.active ? 'border border-emerald-200 bg-emerald-50 text-emerald-800' : 'border border-slate-200 bg-slate-50 text-slate-500'}`}
                          >
                            {promo.active ? '已启用' : '已停用'}
                          </button>
                          <button type="button" onClick={() => deletePromotion(promo.id)} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'homeDecor' && (
                <div className="p-5">
                  <HomeDecorEditor config={config} configLoading={configLoading} onSave={updateConfig} />
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="p-5">
                  <Fragment key={config ? 'site-cfg' : 'site-cfg-pending'}>
                    <SiteSettingsForm config={config} onSave={updateConfig} />
                  </Fragment>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      {/* Product Management Modal */}
      {(isAddingProduct || editingProduct) && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div
              className={ADMIN_MODAL_MASK}
              onClick={() => { setIsAddingProduct(false); setEditingProduct(null); }}
              role="presentation"
            />
            <div className={`${ADMIN_MODAL_DIALOG} max-w-4xl`}>
               <div className={ADMIN_MODAL_HEADER}>
                  <div>
                    <h2 className={ADMIN_MODAL_TITLE}>
                       {editingProduct ? '编辑商品' : '新建商品'}
                    </h2>
                    <p className={ADMIN_MODAL_SUBTITLE}>保存后写入本地库</p>
                  </div>
                  <button 
                     type="button"
                     onClick={() => { setIsAddingProduct(false); setEditingProduct(null); }}
                     className={ADMIN_MODAL_CLOSE}
                  >
                     <X className="h-5 w-5" />
                  </button>
               </div>
               
               <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar">
                  <ProductForm 
                    initialData={editingProduct || undefined}
                    categoryOptions={buildCategorySelectOptions(categories)}
                    onSave={async (data) => {
                      if (editingProduct) await updateProduct(editingProduct.id, data);
                      else await addProduct(data as any);
                      setIsAddingProduct(false);
                      setEditingProduct(null);
                    }} 
                  />
               </div>
            </div>
         </div>
      )}

      {(isAddingCategory || editingCategory) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className={ADMIN_MODAL_MASK} onClick={closeCategoryModal} role="presentation" />
          <div className={`${ADMIN_MODAL_DIALOG} max-w-lg`}>
            <div className={ADMIN_MODAL_HEADER}>
              <div>
                <h2 className={ADMIN_MODAL_TITLE}>
                  {editingCategory ? '编辑分类' : '新建分类'}
                </h2>
                <p className={ADMIN_MODAL_SUBTITLE}>Slug 创建后勿改，以免影响商品与前台链接</p>
              </div>
              <button
                type="button"
                onClick={closeCategoryModal}
                className={ADMIN_MODAL_CLOSE}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar">
              <Fragment key={editingCategory?.id ?? `new-${categoryModalParentId ?? 'root'}`}>
                <CategoryForm
                  initial={editingCategory}
                  allCategories={categories}
                  allProducts={inventoryProducts}
                  defaultParentId={editingCategory ? undefined : categoryModalParentId}
                  onSave={async (payload) => {
                  try {
                    if (editingCategory) {
                      await updateCategory(editingCategory.id, payload);
                    } else {
                      await addCategory(payload);
                    }
                    closeCategoryModal();
                  } catch (e) {
                    const raw = e instanceof Error ? e.message : String(e);
                    let msg = raw;
                    try {
                      const parsed = JSON.parse(raw) as { error?: string };
                      if (parsed?.error) msg = parsed.error;
                    } catch {
                      /* use raw */
                    }
                    window.alert(msg);
                  }
                }}
              />
              </Fragment>
            </div>
          </div>
        </div>
      )}

      {/* Promo Modal */}
      {isAddingPromo && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div
              className={ADMIN_MODAL_MASK}
              onClick={() => setIsAddingPromo(false)}
              role="presentation"
            />
            <div className={`${ADMIN_MODAL_DIALOG} max-w-lg`}>
               <div className={ADMIN_MODAL_HEADER}>
                  <h2 className={ADMIN_MODAL_TITLE}>新建营销活动</h2>
                  <button type="button" onClick={() => setIsAddingPromo(false)} className={ADMIN_MODAL_CLOSE}><X className="h-5 w-5" /></button>
               </div>
               <div className="min-h-0 max-h-[calc(90vh-52px)] flex-1 overflow-y-auto p-4 sm:p-5">
                  <PromoForm onSave={async (data) => {
                     await addPromotion(data as any);
                     setIsAddingPromo(false);
                  }} />
               </div>
            </div>
         </div>
      )}

      {/* Import Modal */}
      {isImporting && (
        <ImportModal
          allowedCategorySlugs={categories.map((c) => c.slug)}
          onImport={async (data) => {
            await bulkAddProducts(data);
          }}
          onClose={() => setIsImporting(false)}
        />
      )}
    </div>
  );
}

function formatImportError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  if (/QuotaExceeded|NS_ERROR_DOM_QUOTA_REACHED|quota/i.test(raw)) {
    return '浏览器 localStorage 已满或单次数据过大。已自动压缩每条商品的描述/详情/图片数量；若仍失败请分批导入，或在浏览器中清除本站本地数据后重试。';
  }
  try {
    const j = JSON.parse(raw) as { error?: string };
    if (j?.error && /QuotaExceeded|quota/i.test(j.error)) {
      return '浏览器 localStorage 已满。请减少单次导入条数，或清除本站本地数据后重试。';
    }
    if (j?.error) return j.error;
  } catch {
    /* 非 JSON */
  }
  return raw;
}

function ImportModal({
  onImport,
  onClose,
  allowedCategorySlugs,
}: {
  onImport: (data: any[]) => Promise<void>;
  onClose: () => void;
  /** 后台已有分类 slug；导入时推断结果只使用该集合（空数组则不限） */
  allowedCategorySlugs?: string[];
}) {
  const importParseOpts = useMemo(
    () =>
      ({
        defaultCategory: 'sofas',
        ...(allowedCategorySlugs && allowedCategorySlugs.length > 0
          ? { allowedCategorySlugs }
          : {}),
      }) satisfies Parameters<typeof processImportedProductRows>[1],
    [allowedCategorySlugs]
  );
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    const reader = new FileReader();

    const lower = file.name.toLowerCase();
    if (lower.endsWith('.csv')) {
      const resetFileInput = () => {
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      const readerCsv = new FileReader();
      readerCsv.onload = () => {
        void (async () => {
          try {
            let text = String(readerCsv.result ?? '');
            text = text.replace(/^\uFEFF/, '');
            const results = Papa.parse<Record<string, unknown>>(text, {
              header: true,
              skipEmptyLines: true,
            });
            const products = processImportedProductRows((results.data ?? []) as unknown[], importParseOpts);
            const toSave = await enrichImportedProductsWithShortTitles(products);
            if (toSave.length === 0) {
              const sample = (results.data as unknown[])[0];
              const keys =
                sample && typeof sample === 'object' && !Array.isArray(sample)
                  ? Object.keys(sample as object)
                      .slice(0, 12)
                      .join(', ')
                  : '（无首行）';
              throw new Error(
                `没有解析到有效商品（0 条）。首行字段示例：${keys}。若为中文表头，请确认文件为 UTF-8 编码 CSV；扩展名需为 .csv`
              );
            }
            await onImport(toSave);
            setImportSuccessCount(toSave.length);
            setError(null);
          } catch (err: unknown) {
            setError(formatImportError(err));
          } finally {
            setLoading(false);
            resetFileInput();
          }
        })();
      };
      readerCsv.onerror = () => {
        setError('读取 CSV 文件失败，请重试或检查文件是否被占用。');
        setLoading(false);
        resetFileInput();
      };
      readerCsv.readAsText(file, 'UTF-8');
    } else if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
      reader.onload = async (evt) => {
        try {
          const buf = evt.target?.result;
          if (!(buf instanceof ArrayBuffer)) throw new Error('无法读取表格文件');
          const wb = XLSX.read(new Uint8Array(buf), { type: 'array' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);
          const products = processImportedProductRows(data as unknown[], importParseOpts);
          const toSave = await enrichImportedProductsWithShortTitles(products);
          if (toSave.length === 0) {
            throw new Error('没有有效数据行：请检查首行表头含 name，且至少一行有商品名称');
          }
          await onImport(toSave);
          setImportSuccessCount(toSave.length);
          setError(null);
        } catch (err: unknown) {
          setError(formatImportError(err));
        } finally {
          setLoading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      setError('不支持的文件格式，请使用 CSV 或 XLSX。');
      setLoading(false);
    }
  };

  const handleJsonImport = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = JSON.parse(input);
      if (!Array.isArray(data)) throw new Error('JSON 须为商品对象组成的数组');
      const products = processImportedProductRows(data, importParseOpts);
      const toSave = await enrichImportedProductsWithShortTitles(products);
      if (toSave.length === 0) {
        throw new Error('没有有效商品：每项至少包含非空的 name 字段');
      }
      await onImport(toSave);
      setImportSuccessCount(toSave.length);
      setError(null);
    } catch (e: unknown) {
      setError(formatImportError(e));
    } finally {
      setLoading(false);
    }
  };

  const downloadXlsxTemplate = () => {
    const rows = getProductImportTemplateSheetRows();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'products');
    XLSX.writeFile(wb, 'homaire-product-import-template.xlsx');
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
      <div className={ADMIN_MODAL_MASK} onClick={onClose} role="presentation" />
      <div
        className={`${ADMIN_MODAL_DIALOG} max-w-2xl`}
        onClick={(ev) => ev.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <header className={ADMIN_MODAL_HEADER}>
          <h2 className={ADMIN_MODAL_TITLE}>批量导入商品</h2>
          <button
            type="button"
            onClick={onClose}
            className={ADMIN_MODAL_CLOSE}
            aria-label="关闭"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {importSuccessCount != null ? (
          <div className="space-y-4 py-8 text-center">
            <p className="text-base font-semibold text-emerald-700">已成功导入 {importSuccessCount} 条商品</p>
            <p className="mx-auto max-w-md text-sm text-slate-600">
              数据已写入本机浏览器。请在「商品」列表查看；长文案已自动截断以适配存储。
            </p>
            <button
              type="button"
              onClick={() => {
                setImportSuccessCount(null);
                onClose();
              }}
              className="rounded bg-[#1677ff] px-6 py-2 text-sm font-medium text-white hover:bg-[#4096ff]"
            >
              完成
            </button>
          </div>
        ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-sm border border-dashed border-[#dcdfe6] bg-[#fafafa] px-4 py-6 text-sm text-[#606266] hover:border-[#409eff] hover:text-[#409eff]"
            >
              <Download className="h-8 w-8 text-[#c0c4cc]" />
              <span>点击选择 CSV / XLSX 文件</span>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".csv,.xlsx,.xls"
              />
            </button>
            <div className="rounded-sm border border-[#ebeef5] bg-[#fafafa] p-4 text-sm text-[#606266]">
              <h3 className="mb-2 text-sm font-medium text-[#303133]">表头说明</h3>
              <p className="mb-2 text-xs leading-relaxed text-[#909399]">
                必填列：
                <code className="mx-0.5 rounded bg-white px-1 py-0.5 text-[#606266]">name</code>
                <code className="mx-0.5 rounded bg-white px-1 py-0.5 text-[#606266]">price</code>
                <code className="mx-0.5 rounded bg-white px-1 py-0.5 text-[#606266]">category</code>
                <code className="mx-0.5 rounded bg-white px-1 py-0.5 text-[#606266]">stock</code>
              </p>
              <p className="text-xs leading-relaxed text-[#909399]">
                可选：shortTitle、description、images、features、subCategory、videoUrl、manualUrl、onSale、discountPrice、detailHtml 等。
                大健 / GIGA 飞书表请按「分类 → 飞书字段映射与使用说明」中的固定列名；CSV 手动导入可使用下列标准列名。
                <span className="mt-1 block text-[#606266]">
                  category 留空时根据名称/描述/子类/卖点自动归入已有分类；也可显式填写 slug（如 tables、sofas）。
                </span>
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => downloadProductImportTemplateCsv()}
                  className={ADMIN_BTN_DEFAULT}
                >
                  下载 CSV 模板
                </button>
                <button type="button" onClick={downloadXlsxTemplate} className={ADMIN_BTN_DEFAULT}>
                  下载 XLSX 模板
                </button>
              </div>
            </div>
          </div>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-[#ebeef5]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-[#909399]">或粘贴 JSON 数组导入</span>
            </div>
          </div>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='[{"name": "北欧沙发", "price": 1200, "category": "sofas", "stock": 5}]'
            className={`${ADMIN_FORM_TEXTAREA} min-h-[120px] font-mono text-xs`}
          />

          {error && (
            <div className="rounded-sm border border-[#fde2e2] bg-[#fef0f0] px-3 py-2 text-sm text-[#f56c6c]">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className={ADMIN_BTN_DEFAULT}>
              取消
            </button>
            <button
              type="button"
              onClick={handleJsonImport}
              disabled={loading || !input.trim()}
              className={ADMIN_BTN_PRIMARY}
            >
              {loading ? '导入中…' : '执行 JSON 导入'}
            </button>
          </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

function parseCategoryFeaturedIdsInput(raw: string): string[] | undefined {
  const ids = raw
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 16);
  return ids.length ? ids : undefined;
}

function CategoryForm({
  initial,
  allCategories,
  allProducts,
  defaultParentId,
  onSave,
}: {
  initial?: Category | null;
  allCategories: Category[];
  allProducts: Product[];
  defaultParentId?: string | null;
  onSave: (data: Omit<Category, 'id'>) => void;
}) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState(initial?.name ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [image, setImage] = useState(initial?.image ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [parentId, setParentId] = useState<string | null>(
    initial?.parentId ?? defaultParentId ?? null,
  );
  const [sortOrder, setSortOrder] = useState<number>(initial?.sortOrder ?? 0);
  const [featuredIdsRaw, setFeaturedIdsRaw] = useState(() => (initial?.featuredProductIds ?? []).join(', '));
  const [feishuBitableUrl, setFeishuBitableUrl] = useState(initial?.feishuBitableUrl ?? '');
  const [feishuSyncEnabled, setFeishuSyncEnabled] = useState(Boolean(initial?.feishuSyncEnabled));
  const [feishuSyncIntervalMinutes, setFeishuSyncIntervalMinutes] = useState(
    normalizeFeishuSyncIntervalMinutes(
      initial?.feishuSyncIntervalMinutes ?? DEFAULT_FEISHU_SYNC_INTERVAL_MINUTES
    )
  );

  const forbiddenParentIds = useMemo(() => {
    if (!initial?.id) return new Set<string>();
    const d = getDescendantIds(initial.id, allCategories);
    d.add(initial.id);
    return d;
  }, [initial?.id, allCategories]);

  const parentOptions = useMemo(() => {
    return flattenCategoryTreeSorted(allCategories).filter((c) => {
      if (forbiddenParentIds.has(c.id)) return false;
      return getCategoryLevel(c.id, allCategories) < 3;
    });
  }, [allCategories, forbiddenParentIds]);

  const previewLevel = useMemo(() => {
    if (!parentId) return 1;
    const p = allCategories.find((c) => c.id === parentId);
    if (!p) return 1;
    return getCategoryLevel(p.id, allCategories) + 1;
  }, [parentId, allCategories]);

  useEffect(() => {
    setName(initial?.name ?? '');
    setSlug(initial?.slug ?? '');
    setImage(initial?.image ?? '');
    setDescription(initial?.description ?? '');
    setParentId(initial?.parentId ?? defaultParentId ?? null);
    setSortOrder(typeof initial?.sortOrder === 'number' ? initial.sortOrder : 0);
    setFeaturedIdsRaw((initial?.featuredProductIds ?? []).join(', '));
    setFeishuBitableUrl(initial?.feishuBitableUrl ?? '');
    setFeishuSyncEnabled(Boolean(initial?.feishuSyncEnabled));
    setFeishuSyncIntervalMinutes(
      normalizeFeishuSyncIntervalMinutes(
        initial?.feishuSyncIntervalMinutes ?? DEFAULT_FEISHU_SYNC_INTERVAL_MINUTES
      )
    );
  }, [initial, defaultParentId]);

  const productsInSlug = useMemo(() => {
    const k = slug.trim().toLowerCase();
    if (!k) return [];
    return allProducts.filter((p) => (p.category || '').trim().toLowerCase() === k);
  }, [allProducts, slug]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          name: name.trim(),
          slug: slug.trim().toLowerCase(),
          image: image.trim(),
          description: description.trim() || undefined,
          parentId: parentId || null,
          sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
          featuredProductIds: parseCategoryFeaturedIdsInput(featuredIdsRaw) ?? [],
          feishuBitableUrl: feishuBitableUrl.trim() || undefined,
          feishuSyncEnabled: feishuBitableUrl.trim() ? feishuSyncEnabled : false,
          feishuSyncIntervalMinutes: normalizeFeishuSyncIntervalMinutes(feishuSyncIntervalMinutes),
        });
      }}
      className="space-y-4"
    >
      <div>
        <label className={ADMIN_FORM_LABEL}>显示名称</label>
        <input
          required
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={ADMIN_FORM_CONTROL}
        />
      </div>
      <div>
        <label className={ADMIN_FORM_LABEL}>父级分类（可选）</label>
        <select
          value={parentId ?? ''}
          onChange={(e) => setParentId(e.target.value === '' ? null : e.target.value)}
          className={`${ADMIN_FORM_CONTROL} cursor-pointer`}
          aria-label="父级分类"
        >
          <option value="">（一级分类 · 无父级）</option>
          {parentOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {getCategoryPathLabel(c.id, allCategories)}
            </option>
          ))}
        </select>
        <p className={ADMIN_FORM_HINT}>
          最多三级；当前将位于 <span className="text-[#409eff]">{previewLevel}</span> 级。仅可选择未满三级的节点作为父级。
        </p>
      </div>
      <div>
        <label className={ADMIN_FORM_LABEL}>同级排序（可选）</label>
        <input
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
          className={ADMIN_FORM_CONTROL}
          aria-label="同级排序"
        />
        <p className={ADMIN_FORM_HINT}>数字越小，在后台与部分列表中越靠前。</p>
      </div>
      <div>
        <label className={ADMIN_FORM_LABEL}>URL 别名（slug）</label>
        <input
          required
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
          disabled={!!initial}
          title={initial ? 'Slug 创建后不可修改，以免破坏已有商品与前台链接' : undefined}
          className={`${ADMIN_FORM_CONTROL} disabled:cursor-not-allowed disabled:opacity-50`}
        />
        <p className={ADMIN_FORM_HINT}>
          前台地址 /category/&lt;slug&gt;，仅小写字母、数字与连字符。
        </p>
      </div>
      <div>
        <label className={ADMIN_FORM_LABEL}>封面图</label>
        <p className={`${ADMIN_FORM_HINT} mb-2`}>
          与首页「按功能选购」宫格 slug 一致时，此图会用作该格封面（除非在「首页装修」里单独上传/填写了配图 URL）。
        </p>
        <div className="flex flex-wrap items-center gap-4">
          {image ? (
            <img src={image} alt="" className="h-24 w-24 rounded-sm border border-[#dcdfe6] bg-[#f5f7fa] object-cover" />
          ) : null}
          <div className="flex min-w-[200px] flex-grow flex-col gap-2">
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={uploading}
              className={`${ADMIN_BTN_DEFAULT} inline-flex items-center gap-2 disabled:opacity-50`}
            >
              <ImageIcon className="h-4 w-4" />
              {uploading ? '上传中…' : '本地上传'}
            </button>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (ev) => {
                const file = ev.target.files?.[0];
                if (!file) return;
                setUploading(true);
                try {
                  setImage(await fileToDataUrl(file));
                } finally {
                  setUploading(false);
                  ev.target.value = '';
                }
              }}
            />
            <input
              type="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="或粘贴图片 URL"
              className={`${ADMIN_FORM_CONTROL} font-mono text-xs`}
            />
          </div>
        </div>
      </div>
      <div>
        <label className={ADMIN_FORM_LABEL}>描述（可选）</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className={ADMIN_FORM_TEXTAREA}
        />
      </div>
      <div>
        <label className={ADMIN_FORM_LABEL}>
          首页品类楼层 · 主推商品 id（可选）
        </label>
        <p className={`${ADMIN_FORM_HINT} mb-2`}>
          逗号 / 空格 / 分号分隔，最多 16 个。顺序即首页展示顺序；与「首页装修」同 slug 配置合并时，装修项优先。当前 slug 下共有{' '}
          <span className="text-[#409eff]">{productsInSlug.length}</span> 个商品。
        </p>
        <input
          type="text"
          value={featuredIdsRaw}
          onChange={(e) => setFeaturedIdsRaw(e.target.value)}
          placeholder="例如 prod_abc, prod_def"
          className={`${ADMIN_FORM_CONTROL} font-mono text-xs`}
        />
        {productsInSlug.length > 0 ? (
          <div className="mt-2 max-h-28 space-y-1 overflow-y-auto rounded-sm border border-[#ebeef5] bg-[#fafafa] p-2">
            <p className="px-1 text-xs text-[#909399]">快速追加 id（点击）</p>
            {productsInSlug.slice(0, 24).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setFeaturedIdsRaw((prev) => {
                    const parts = prev.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean);
                    if (parts.includes(p.id)) return prev;
                    if (parts.length >= 16) return prev;
                    return prev.trim() ? `${prev.trim()}, ${p.id}` : p.id;
                  });
                }}
                className="flex w-full min-w-0 items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-xs font-mono text-[#606266] hover:bg-[#ecf5ff]"
              >
                <span className="truncate text-[#606266]">{p.shortTitle || p.name}</span>
                <span className="shrink-0 text-[#909399]">{p.id}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <CategoryFeishuFormFields
        feishuBitableUrl={feishuBitableUrl}
        setFeishuBitableUrl={setFeishuBitableUrl}
        feishuSyncEnabled={feishuSyncEnabled}
        setFeishuSyncEnabled={setFeishuSyncEnabled}
        feishuSyncIntervalMinutes={feishuSyncIntervalMinutes}
        setFeishuSyncIntervalMinutes={setFeishuSyncIntervalMinutes}
        categorySlug={slug.trim().toLowerCase()}
      />
      <button type="submit" className={`${ADMIN_BTN_PRIMARY} w-full`}>
        保存
      </button>
    </form>
  );
}

// Sub-components for forms
function ProductForm({
  initialData,
  onSave,
  categoryOptions,
}: {
  initialData?: Product;
  onSave: (data: Partial<Product>) => void;
  categoryOptions?: { slug: string; name: string }[];
}) {
  const imagesFileInputRef = useRef<HTMLInputElement>(null);
  const manualFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingManual, setUploadingManual] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [newImageUrl, setNewImageUrl] = useState('');

  const staticCategoryOptions = [
    { slug: 'sofas', name: 'Sofas' },
    { slug: 'beds', name: 'Beds' },
    { slug: 'tables', name: 'Tables' },
    { slug: 'chairs', name: 'Chairs' },
    { slug: 'garden', name: 'Garden' },
    { slug: 'lighting', name: 'Lighting' },
    { slug: 'storage', name: 'Storage' },
    { slug: 'decor', name: 'Decor' },
  ];
  const selectCategoryOptions =
    categoryOptions && categoryOptions.length > 0 ? categoryOptions : staticCategoryOptions;
  const defaultCategorySlug = selectCategoryOptions[0]?.slug ?? 'sofas';

  const [formData, setFormData] = useState<Partial<Product>>(() =>
    initialData
      ? { ...initialData, featuredOnHome: initialData.featuredOnHome ?? false }
      : {
          name: '',
          shortTitle: undefined,
          price: 0,
          description: '',
          detailHtml: '',
          category: defaultCategorySlug,
          subCategory: '',
          images: [],
          features: [],
          videoUrl: '',
          manualUrl: '',
          stock: 0,
          onSale: false,
          discountPrice: 0,
          featuredOnHome: false,
        }
  );

  const uploadImagesToStorage = async (files: FileList) => {
    setUploadingImages(true);
    setUploadError(null);
    try {
      const uploadedUrls: string[] = [];
      for (const file of Array.from(files)) {
        uploadedUrls.push(await fileToDataUrl(file));
      }
      setFormData((prev) => ({
        ...prev,
        images: [...(prev.images || []), ...uploadedUrls],
      }));
    } catch (e: any) {
      setUploadError(e?.message || '图片上传失败');
    } finally {
      setUploadingImages(false);
      if (imagesFileInputRef.current) imagesFileInputRef.current.value = '';
    }
  };

  const uploadManualToStorage = async (file: File) => {
    setUploadingManual(true);
    setUploadError(null);
    try {
      const url = await fileToDataUrl(file);
      setFormData((prev) => ({ ...prev, manualUrl: url }));
    } catch (e: any) {
      setUploadError(e?.message || '说明书上传失败');
    } finally {
      setUploadingManual(false);
      if (manualFileInputRef.current) manualFileInputRef.current.value = '';
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-4">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label className={ADMIN_FORM_SECTION}>基础信息</label>
            <div className="mt-2 space-y-3">
              <div>
                <label className={ADMIN_FORM_LABEL}>商品名称（完整型号）</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="完整型号 / 供应链名称"
                  maxLength={PRODUCT_IMPORT_NAME_MAX}
                  className={ADMIN_FORM_CONTROL}
                />
              </div>
              <div>
                <label className={ADMIN_FORM_LABEL}>独立站主标题（可选）</label>
                <input
                  type="text"
                  value={formData.shortTitle ?? ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    setFormData({
                      ...formData,
                      shortTitle: v.trim() === '' ? undefined : v,
                    });
                  }}
                  placeholder="留空则前台使用商品名称；建议与 CSV shortTitle 一致"
                  maxLength={PRODUCT_IMPORT_SHORT_TITLE_MAX}
                  className={ADMIN_FORM_CONTROL}
                />
              </div>
              <div>
                <label className={ADMIN_FORM_LABEL}>商品描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="卖点与场景描述"
                  rows={4}
                  className={ADMIN_FORM_TEXTAREA}
                />
              </div>
              <div>
                <label className={ADMIN_FORM_LABEL}>所属分类</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className={`${ADMIN_FORM_CONTROL} cursor-pointer`}
                >
                  {formData.category && !selectCategoryOptions.some((o) => o.slug === formData.category) ? (
                    <option value={formData.category}>{formData.category}（未在分类管理中）</option>
                  ) : null}
                  {selectCategoryOptions.map((o) => (
                    <option key={o.slug} value={o.slug}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={ADMIN_FORM_LABEL}>子系列 / 子类（可选）</label>
                <input
                  type="text"
                  value={formData.subCategory || ''}
                  onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                  placeholder="如系列名、子品类"
                  className={ADMIN_FORM_CONTROL}
                />
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-[#606266]">
                <input
                  type="checkbox"
                  checked={!!formData.featuredOnHome}
                  onChange={(e) => setFormData({ ...formData, featuredOnHome: e.target.checked })}
                  className="h-4 w-4 rounded border-[#dcdfe6] text-[#409eff] focus:ring-[#c6e2ff]"
                />
                <span>首页品类楼层主推（与同分类装修/分类 id 合并）</span>
              </label>
            </div>
          </div>

          <div>
            <label className={ADMIN_FORM_SECTION}>核心卖点</label>
            <p className={`${ADMIN_FORM_HINT} mb-2`}>每行一条，展示在详情页首屏。</p>
            <textarea
              value={(formData.features || []).join('\n')}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  features: e.target.value.split('\n').map((line) => line.trim()).filter(Boolean),
                })
              }
              placeholder={'模块化省空间\n日常易打理'}
              rows={5}
              className={ADMIN_FORM_TEXTAREA}
            />
          </div>

          <div>
            <label className={ADMIN_FORM_SECTION}>详情 HTML（可选）</label>
            <p className={`${ADMIN_FORM_HINT} mb-2`}>
              留空时前台会根据描述与卖点自动生成图文模块。
            </p>
            <textarea
              value={formData.detailHtml || ''}
              onChange={(e) => setFormData({ ...formData, detailHtml: e.target.value })}
              placeholder='<section class="detail-block">…</section>'
              rows={8}
              className={`${ADMIN_FORM_TEXTAREA} font-mono text-xs`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className={ADMIN_FORM_SECTION}>价格与库存</label>
              <div>
                <label className={ADMIN_FORM_LABEL}>售价（€）</label>
                <input
                  required
                  type="number"
                  value={formData.price}
                  step={1}
                  min={0}
                  onChange={(e) => setFormData({ ...formData, price: roundStorePrice(parseFloat(e.target.value) || 0) })}
                  className={ADMIN_FORM_CONTROL}
                />
              </div>
              <div>
                <label className={ADMIN_FORM_LABEL}>库存</label>
                <input
                  required
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value, 10) })}
                  className={ADMIN_FORM_CONTROL}
                />
              </div>
            </div>
            <div className="space-y-3">
              <label className={ADMIN_FORM_SECTION}>促销</label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-[#606266]">
                <input
                  type="checkbox"
                  checked={!!formData.onSale}
                  onChange={(e) => setFormData({ ...formData, onSale: e.target.checked })}
                  className="h-4 w-4 rounded border-[#dcdfe6] text-[#409eff] focus:ring-[#c6e2ff]"
                />
                <span>促销中</span>
              </label>
              {formData.onSale && (
                <div>
                  <label className={ADMIN_FORM_LABEL}>促销价（€）</label>
                  <input
                    type="number"
                    value={formData.discountPrice}
                    step={1}
                    min={0}
                    onChange={(e) =>
                      setFormData({ ...formData, discountPrice: roundStorePrice(parseFloat(e.target.value) || 0) })
                    }
                    className={ADMIN_FORM_CONTROL}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="rounded-sm border border-[#ebeef5] bg-[#fafafa] p-3 text-xs leading-relaxed text-[#909399]">
            本表单仅包含影响前台的字段：文案、分类、卖点、价格库存、促销、图库、视频与可选安装 PDF。
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className={ADMIN_FORM_SECTION}>商品图片</label>
            <div className="mt-2 space-y-3">
              <div className="rounded-sm border border-[#ebeef5] bg-[#fafafa] p-3 text-xs text-[#909399]">
                建议 1:1 方图，至少约 1600×1600；非方图前台会居中裁切。
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => imagesFileInputRef.current?.click()}
                  className={`${ADMIN_BTN_DEFAULT} inline-flex items-center gap-2 disabled:opacity-50`}
                  disabled={uploadingImages}
                >
                  <ImageIcon className="h-4 w-4" />
                  {uploadingImages ? '上传中…' : '本地上传'}
                </button>
                <input
                  ref={imagesFileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (!e.target.files || e.target.files.length === 0) return;
                    void uploadImagesToStorage(e.target.files);
                  }}
                />
                <span className="text-xs text-[#909399]">
                  {initialData?.id ? '已关联当前商品' : '新建草稿'}
                </span>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="粘贴图片 URL（可选）"
                  className={`${ADMIN_FORM_CONTROL} min-w-0 flex-1`}
                />
                <button
                  type="button"
                  onClick={() => {
                    const url = newImageUrl.trim();
                    if (!url) return;
                    setFormData((prev) => ({ ...prev, images: [...(prev.images || []), url] }));
                    setNewImageUrl('');
                  }}
                  className={ADMIN_BTN_PRIMARY}
                >
                  添加
                </button>
              </div>

              {uploadError && (
                <div className="rounded-sm border border-[#fde2e2] bg-[#fef0f0] px-3 py-2 text-sm text-[#f56c6c]">
                  {uploadError}
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                {(formData.images || []).slice(0, 9).map((url, idx) => (
                  <div key={`${url}-${idx}`} className="group relative">
                    <img
                      src={url}
                      alt=""
                      className="aspect-square w-full rounded-sm border border-[#dcdfe6] bg-[#f5f7fa] object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          images: (prev.images || []).filter((_, i) => i !== idx),
                        }));
                      }}
                      className="absolute top-1 right-1 flex h-8 w-8 items-center justify-center rounded-sm border border-[#dcdfe6] bg-white/95 text-[#909399] opacity-0 transition-opacity hover:border-[#f56c6c] hover:text-[#f56c6c] group-hover:opacity-100"
                      aria-label="移除图片"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <p className={ADMIN_FORM_HINT}>上传 6～10 张方图，详情页图文区展示更完整。</p>
            </div>
          </div>

          <div>
            <label className={ADMIN_FORM_SECTION}>商品视频</label>
            <input
              type="url"
              value={formData.videoUrl || ''}
              onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
              placeholder="视频地址（可选）"
              className={ADMIN_FORM_CONTROL}
            />
            <p className={ADMIN_FORM_HINT}>填写后作为详情页首个可切换媒体。</p>
          </div>

          <div>
            <label className={ADMIN_FORM_SECTION}>安装说明 PDF</label>
            <div className="mt-2 space-y-3">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={formData.manualUrl || ''}
                  onChange={(e) => setFormData({ ...formData, manualUrl: e.target.value })}
                  placeholder="PDF 下载地址（可选）"
                  className={`${ADMIN_FORM_CONTROL} min-w-0 flex-1`}
                />
                <button
                  type="button"
                  onClick={() => manualFileInputRef.current?.click()}
                  disabled={uploadingManual}
                  className={`${ADMIN_BTN_DEFAULT} inline-flex shrink-0 items-center gap-2 disabled:opacity-50`}
                >
                  <Download className="h-4 w-4" />
                  {uploadingManual ? '上传中…' : '上传 PDF'}
                </button>
              </div>
              <input
                ref={manualFileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  void uploadManualToStorage(file);
                }}
              />
              {formData.manualUrl && (
                <div className="flex items-center justify-between gap-2 rounded-sm border border-[#ebeef5] bg-[#fafafa] px-3 py-2">
                  <a
                    href={formData.manualUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="min-w-0 truncate text-xs text-[#409eff] hover:underline"
                  >
                    {formData.manualUrl}
                  </a>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, manualUrl: '' }))}
                    className="shrink-0 text-[#909399] hover:text-[#f56c6c]"
                    aria-label="清除 PDF"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
              <p className={ADMIN_FORM_HINT}>留空则详情页不显示下载按钮。</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end border-t border-[#ebeef5] pt-4">
        <button type="submit" className={ADMIN_BTN_PRIMARY}>
          {initialData ? '保存修改' : '创建商品'}
        </button>
      </div>
    </form>
  );
}

function PromoForm({ onSave }: { onSave: (data: Partial<Promotion>) => void }) {
  const promoImageFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPromoImage, setUploadingPromoImage] = useState(false);
  const [promoUploadError, setPromoUploadError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Promotion>>({
    title: '',
    subtitle: '',
    imageUrl: '',
    link: '',
    active: true,
    type: 'hero',
    priority: 1
  });

  const uploadPromoImageToStorage = async (file: File) => {
    setUploadingPromoImage(true);
    setPromoUploadError(null);
    try {
      const url = await fileToDataUrl(file);
      setFormData((prev) => ({ ...prev, imageUrl: url }));
    } catch (e: any) {
      setPromoUploadError(e?.message || '活动图上传失败');
    } finally {
      setUploadingPromoImage(false);
      if (promoImageFileInputRef.current) promoImageFileInputRef.current.value = '';
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={ADMIN_FORM_LABEL}>标题</label>
          <input
            required
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className={ADMIN_FORM_CONTROL}
          />
        </div>
        <div>
          <label className={ADMIN_FORM_LABEL}>展示类型</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as Promotion['type'] })}
            className={`${ADMIN_FORM_CONTROL} cursor-pointer`}
          >
            <option value="hero">首页大图</option>
            <option value="card">推广卡片</option>
            <option value="sale">公告条</option>
          </select>
        </div>
      </div>
      <div>
        <label className={ADMIN_FORM_LABEL}>配图地址</label>
        <div className="mt-1 flex gap-2">
          <input
            required
            type="text"
            value={formData.imageUrl}
            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            className={`${ADMIN_FORM_CONTROL} min-w-0 flex-1`}
          />
          <button
            type="button"
            onClick={() => promoImageFileInputRef.current?.click()}
            disabled={uploadingPromoImage}
            className={`${ADMIN_BTN_DEFAULT} inline-flex shrink-0 items-center gap-2 disabled:opacity-50`}
          >
            <ImageIcon className="h-4 w-4" />
            {uploadingPromoImage ? '上传中…' : '上传'}
          </button>
        </div>
        <input
          ref={promoImageFileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            void uploadPromoImageToStorage(file);
          }}
        />
        {promoUploadError && (
          <div className="mt-2 rounded-sm border border-[#fde2e2] bg-[#fef0f0] px-3 py-2 text-sm text-[#f56c6c]">
            {promoUploadError}
          </div>
        )}
        {formData.imageUrl && (
          <div className="mt-3 aspect-video overflow-hidden rounded-sm border border-[#dcdfe6] bg-[#f5f7fa]">
            <img src={formData.imageUrl} alt="" className="h-full w-full object-cover" />
          </div>
        )}
        <p className={ADMIN_FORM_HINT}>大图建议 16:9 或更宽；卡片可用方图或竖图。</p>
      </div>
      <div>
        <label className={ADMIN_FORM_LABEL}>副标题</label>
        <input
          required
          type="text"
          value={formData.subtitle}
          onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
          className={ADMIN_FORM_CONTROL}
        />
      </div>
      <div>
        <label className={ADMIN_FORM_LABEL}>跳转链接</label>
        <input
          type="text"
          value={formData.link}
          onChange={(e) => setFormData({ ...formData, link: e.target.value })}
          placeholder="/collections/new"
          className={ADMIN_FORM_CONTROL}
        />
      </div>
      <button type="submit" className={`${ADMIN_BTN_PRIMARY} w-full`}>
        创建活动
      </button>
    </form>
  );
}
