import React, { useState, FormEvent } from 'react';
import {
  Search,
  Package,
  Truck,
  Eye,
  X,
  RefreshCw,
  MapPin,
  Phone,
  Mail,
} from 'lucide-react';
import { useAdminOrders } from '../../hooks/useAdminData';
import type { LocalOrder } from '../../lib/localDb';
import type { OrderStatus } from '../../types';
import {
  ORDER_STATUS_LABELS,
  SHIP_CARRIER_OPTIONS,
  formatOrderDate,
  formatOrderId,
  canShipOrder,
  canMarkProcessing,
  countOrdersByStatus,
  type OrderStatusFilter,
} from '../../lib/adminOrders';
import {
  ADM_BTN_DEFAULT,
  ADM_BTN_PRIMARY,
  ADM_INPUT,
  ADM_LABEL,
  ADM_HINT,
} from '../../lib/adminVueUi';

const STATUS_TABS: { value: OrderStatusFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待处理' },
  { value: 'processing', label: '处理中' },
  { value: 'shipped', label: '已发货' },
  { value: 'delivered', label: '已签收' },
  { value: 'cancelled', label: '已取消' },
];

const STATUS_BADGE: Record<OrderStatus, string> = {
  pending: 'border-amber-200 bg-amber-50 text-amber-800',
  processing: 'border-blue-200 bg-blue-50 text-blue-800',
  shipped: 'border-indigo-200 bg-indigo-50 text-indigo-800',
  delivered: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  cancelled: 'border-slate-200 bg-slate-100 text-slate-500',
};

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex rounded border px-2 py-0.5 text-[11px] font-medium ${STATUS_BADGE[status]}`}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}

function OrderDetailPanel({
  order,
  onClose,
  onMarkProcessing,
  onOpenShip,
  onStatusChange,
  onSaveNote,
}: {
  order: LocalOrder;
  onClose: () => void;
  onMarkProcessing: () => void;
  onOpenShip: () => void;
  onStatusChange: (status: OrderStatus) => void;
  onSaveNote: (note: string) => void;
}) {
  const [noteDraft, setNoteDraft] = useState(order.adminNote ?? '');

  return (
    <div className="flex h-full flex-col border-l border-[#ebeef5] bg-white">
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#ebeef5] px-5 py-4">
        <div className="min-w-0">
          <p className="text-xs text-[#909399]">订单详情</p>
          <h3 className="mt-1 font-mono text-base font-semibold text-[#303133]">
            {formatOrderId(order.id)}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={order.status} />
            <span className="text-xs text-[#909399]">{formatOrderDate(order.createdAt)}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-sm border border-[#dcdfe6] p-1.5 text-[#909399] hover:text-[#409eff]"
          aria-label="关闭"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        <section>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-[#303133]">
            <MapPin className="h-4 w-4 text-[#409eff]" />
            收货信息
          </h4>
          <div className="space-y-2 rounded-sm border border-[#ebeef5] bg-[#fafafa] p-4 text-sm text-[#606266]">
            <p className="font-medium text-[#303133]">{order.shippingAddress.fullName}</p>
            {order.shippingAddress.phone && (
              <p className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 shrink-0 opacity-60" />
                {order.shippingAddress.phone}
              </p>
            )}
            {order.shippingAddress.email && (
              <p className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 shrink-0 opacity-60" />
                {order.shippingAddress.email}
              </p>
            )}
            <p>
              {order.shippingAddress.address}
              {order.shippingAddress.city ? `，${order.shippingAddress.city}` : ''}
              {order.shippingAddress.zip ? ` ${order.shippingAddress.zip}` : ''}
              {order.shippingAddress.country ? ` · ${order.shippingAddress.country}` : ''}
            </p>
          </div>
        </section>

        {order.trackingNumber && (
          <section>
            <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-[#303133]">
              <Truck className="h-4 w-4 text-[#409eff]" />
              物流信息
            </h4>
            <div className="rounded-sm border border-indigo-100 bg-indigo-50/50 p-4 text-sm">
              <p className="text-[#606266]">
                承运商：<span className="font-medium text-[#303133]">{order.carrier}</span>
              </p>
              <p className="mt-1 text-[#606266]">
                运单号：<span className="font-mono font-medium text-[#303133]">{order.trackingNumber}</span>
              </p>
              {order.shippedAt && (
                <p className="mt-1 text-xs text-[#909399]">
                  发货时间：{formatOrderDate(order.shippedAt)}
                </p>
              )}
            </div>
          </section>
        )}

        <section>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-[#303133]">
            <Package className="h-4 w-4 text-[#409eff]" />
            商品明细
          </h4>
          <ul className="divide-y divide-[#ebeef5] rounded-sm border border-[#ebeef5]">
            {order.items.map((item, idx) => (
              <li key={`${item.productId}-${idx}`} className="flex justify-between gap-3 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-[#303133] line-clamp-2">{item.name}</p>
                  <p className="mt-0.5 text-xs text-[#909399]">
                    ×{item.quantity} · €{item.price.toLocaleString()}
                  </p>
                </div>
                <p className="shrink-0 font-medium tabular-nums text-[#303133]">
                  €{(item.price * item.quantity).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-right text-base font-semibold tabular-nums text-[#303133]">
            合计 €{order.total.toLocaleString()}
          </p>
        </section>

        <section>
          <label className={ADM_LABEL}>后台备注</label>
          <textarea
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            className={`${ADM_INPUT} min-h-[72px] resize-y`}
            placeholder="内部备注，客户不可见"
          />
          <button
            type="button"
            onClick={() => onSaveNote(noteDraft)}
            className={`${ADM_BTN_DEFAULT} mt-2 text-xs`}
          >
            保存备注
          </button>
        </section>

        <section>
          <label className={ADM_LABEL}>手动改状态</label>
          <select
            value={order.status}
            onChange={(e) => onStatusChange(e.target.value as OrderStatus)}
            className={ADM_INPUT}
            aria-label="订单状态"
          >
            {(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <p className={ADM_HINT}>发货请使用下方「确认发货」，会自动写入物流单号。</p>
        </section>
      </div>

      <div className="flex shrink-0 flex-wrap gap-2 border-t border-[#ebeef5] bg-[#fafafa] p-4">
        {canMarkProcessing(order.status) && (
          <button type="button" onClick={onMarkProcessing} className={ADM_BTN_DEFAULT}>
            开始处理
          </button>
        )}
        {canShipOrder(order.status) && (
          <button type="button" onClick={onOpenShip} className={ADM_BTN_PRIMARY}>
            <Truck className="mr-1.5 inline h-4 w-4" />
            确认发货
          </button>
        )}
      </div>
    </div>
  );
}

function ShipOrderModal({
  order,
  onClose,
  onSubmit,
}: {
  order: LocalOrder;
  onClose: () => void;
  onSubmit: (payload: { carrier: string; trackingNumber: string }) => Promise<void>;
}) {
  const [carrier, setCarrier] = useState<string>(SHIP_CARRIER_OPTIONS[0]);
  const [customCarrier, setCustomCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolvedCarrier = carrier === '其他' ? customCarrier.trim() : carrier;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({ carrier: resolvedCarrier, trackingNumber });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '发货失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/45" onClick={onClose} aria-label="关闭" />
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-md rounded border border-[#dcdfe6] bg-white p-6 shadow-lg"
      >
        <h3 className="text-base font-medium text-[#303133]">确认发货</h3>
        <p className="mt-1 text-xs text-[#909399]">
          订单 {formatOrderId(order.id)} · {order.shippingAddress.fullName}
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <label className={ADM_LABEL}>物流公司</label>
            <select
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              className={ADM_INPUT}
              aria-label="物流公司"
            >
              {SHIP_CARRIER_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {carrier === '其他' && (
              <input
                type="text"
                value={customCarrier}
                onChange={(e) => setCustomCarrier(e.target.value)}
                placeholder="输入物流公司名称"
                className={`${ADM_INPUT} mt-2`}
                required
              />
            )}
          </div>

          <div>
            <label className={ADM_LABEL}>运单号</label>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="必填"
              className={ADM_INPUT}
              required
            />
          </div>

          {error && (
            <p className="rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={ADM_BTN_DEFAULT} disabled={submitting}>
            取消
          </button>
          <button type="submit" className={ADM_BTN_PRIMARY} disabled={submitting}>
            {submitting ? '提交中…' : '确认发货'}
          </button>
        </div>
      </form>
    </div>
  );
}

export function OrderManagement() {
  const {
    allOrders,
    orders,
    loading,
    query,
    setQuery,
    selectedId,
    setSelectedId,
    selectedOrder,
    updateOrderStatus,
    markProcessing,
    shipOrder,
    saveAdminNote,
    seedDemo,
  } = useAdminOrders();

  const [keywordInput, setKeywordInput] = useState('');
  const [shipTarget, setShipTarget] = useState<LocalOrder | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const statusCounts = countOrdersByStatus(allOrders);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setQuery((q) => ({ ...q, keyword: keywordInput.trim() || undefined }));
  };

  const runAction = async (fn: () => Promise<void>) => {
    setActionError(null);
    try {
      await fn();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '操作失败');
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-12rem)] flex-col">
      {/* 筛选栏 */}
      <div className="shrink-0 space-y-3 border-b border-slate-200 bg-white px-4 py-3">
        <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              placeholder="订单号 / 姓名 / 邮箱 / 运单号 / 商品名"
              className="w-full rounded border border-slate-200 py-1.5 pl-9 pr-3 text-sm outline-none focus:border-[#409eff] focus:ring-1 focus:ring-[#c6e2ff]"
            />
          </div>
          <button
            type="submit"
            className="rounded border border-[#409eff] bg-[#409eff] px-3 py-1.5 text-sm text-white hover:bg-[#66b1ff]"
          >
            搜索
          </button>
          <button
            type="button"
            onClick={() => {
              setKeywordInput('');
              setQuery({ status: query.status ?? 'all', keyword: undefined });
            }}
            className="rounded border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:border-[#409eff] hover:text-[#409eff]"
          >
            重置
          </button>
        </form>

        <div className="flex flex-wrap gap-1">
          {STATUS_TABS.map((tab) => {
            const active = (query.status ?? 'all') === tab.value;
            const count =
              tab.value === 'all'
                ? allOrders.length
                : statusCounts[tab.value as OrderStatus] ?? 0;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setQuery((q) => ({ ...q, status: tab.value }))}
                className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                  active
                    ? 'bg-[#1677ff] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
                <span className="ml-1 opacity-80">({count})</span>
              </button>
            );
          })}
        </div>

        {actionError && (
          <p className="text-xs text-red-600">{actionError}</p>
        )}
      </div>

      <div className="flex min-h-0 flex-1">
        {/* 列表 */}
        <div className={`min-w-0 flex-1 ${selectedOrder ? 'lg:max-w-[calc(100%-380px)]' : ''}`}>
          {loading ? (
            <p className="p-8 text-center text-sm text-slate-500">加载订单…</p>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 p-16 text-center">
              <Package className="h-12 w-12 text-slate-300" />
              <p className="text-sm text-slate-500">暂无订单</p>
              {allOrders.length === 0 && (
                <button
                  type="button"
                  onClick={() => seedDemo()}
                  className="inline-flex items-center gap-2 rounded border border-[#409eff] px-4 py-2 text-sm text-[#409eff] hover:bg-[#ecf5ff]"
                >
                  <RefreshCw className="h-4 w-4" />
                  生成演示订单
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-3 py-2 text-xs font-semibold text-slate-600">订单号</th>
                    <th className="px-3 py-2 text-xs font-semibold text-slate-600">客户</th>
                    <th className="px-3 py-2 text-xs font-semibold text-slate-600">商品</th>
                    <th className="px-3 py-2 text-xs font-semibold text-slate-600">金额</th>
                    <th className="px-3 py-2 text-xs font-semibold text-slate-600">状态</th>
                    <th className="px-3 py-2 text-xs font-semibold text-slate-600">下单时间</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className={`transition-colors hover:bg-slate-50 ${
                        selectedId === order.id ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <td className="px-3 py-2 font-mono text-xs font-medium text-slate-800">
                        {formatOrderId(order.id)}
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-medium text-slate-800">{order.shippingAddress?.fullName}</div>
                        <div className="mt-0.5 text-xs text-slate-500">{order.shippingAddress?.email}</div>
                      </td>
                      <td className="max-w-[140px] px-3 py-2 text-xs text-slate-600">
                        <span className="line-clamp-2">
                          {order.items.map((i) => i.name).join('、')}
                        </span>
                        <span className="text-slate-400"> · {order.items.length} 项</span>
                      </td>
                      <td className="px-3 py-2 font-medium tabular-nums text-slate-900">
                        €{order.total.toLocaleString()}
                      </td>
                      <td className="px-3 py-2">
                        <StatusBadge status={order.status} />
                        {order.trackingNumber && (
                          <p className="mt-1 font-mono text-[10px] text-slate-400">{order.trackingNumber}</p>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs tabular-nums text-slate-500">
                        {formatOrderDate(order.createdAt)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedId(order.id)}
                            className="rounded border border-slate-200 p-1.5 text-slate-600 hover:border-[#409eff] hover:text-[#409eff]"
                            title="查看详情"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {canShipOrder(order.status) && (
                            <button
                              type="button"
                              onClick={() => setShipTarget(order)}
                              className="rounded border border-indigo-200 bg-indigo-50 p-1.5 text-indigo-700 hover:bg-indigo-100"
                              title="发货"
                            >
                              <Truck className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 详情侧栏 — 大屏 */}
        {selectedOrder && (
          <div className="hidden w-[380px] shrink-0 lg:block">
            <OrderDetailPanel
              order={selectedOrder}
              onClose={() => setSelectedId(null)}
              onMarkProcessing={() =>
                runAction(async () => {
                  await markProcessing(selectedOrder.id);
                })
              }
              onOpenShip={() => setShipTarget(selectedOrder)}
              onStatusChange={(status) =>
                runAction(async () => {
                  await updateOrderStatus(selectedOrder.id, status);
                })
              }
              onSaveNote={(note) =>
                runAction(async () => {
                  await saveAdminNote(selectedOrder.id, note);
                })
              }
            />
          </div>
        )}
      </div>

      {/* 详情 — 小屏全屏抽屉 */}
      {selectedOrder && (
        <div className="fixed inset-0 z-40 flex flex-col bg-white lg:hidden">
          <OrderDetailPanel
            order={selectedOrder}
            onClose={() => setSelectedId(null)}
            onMarkProcessing={() =>
              runAction(async () => {
                await markProcessing(selectedOrder.id);
              })
            }
            onOpenShip={() => setShipTarget(selectedOrder)}
            onStatusChange={(status) =>
              runAction(async () => {
                await updateOrderStatus(selectedOrder.id, status);
              })
            }
            onSaveNote={(note) =>
              runAction(async () => {
                await saveAdminNote(selectedOrder.id, note);
              })
            }
          />
        </div>
      )}

      {shipTarget && (
        <ShipOrderModal
          order={shipTarget}
          onClose={() => setShipTarget(null)}
          onSubmit={(payload) => shipOrder(shipTarget.id, payload)}
        />
      )}
    </div>
  );
}
