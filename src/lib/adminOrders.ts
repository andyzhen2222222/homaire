import type { OrderStatus } from '../types';
import type { LocalOrder } from './localDb';
import { getLocalOrdersSorted, localAddOrder } from './localDb';

export type OrderStatusFilter = OrderStatus | 'all';

export interface OrderListQuery {
  status?: OrderStatusFilter;
  keyword?: string;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: '待处理',
  processing: '处理中',
  shipped: '已发货',
  delivered: '已签收',
  cancelled: '已取消',
};

export const SHIP_CARRIER_OPTIONS = ['DHL', 'FedEx', 'UPS', '顺丰', '中通', '其他'] as const;

export function formatOrderId(id: string): string {
  return `#${id.slice(-8).toUpperCase()}`;
}

export function formatOrderDate(createdAt?: { seconds?: number }): string {
  if (typeof createdAt?.seconds !== 'number') return '—';
  return new Date(createdAt.seconds * 1000).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function canShipOrder(status: OrderStatus): boolean {
  return status === 'pending' || status === 'processing';
}

export function canMarkProcessing(status: OrderStatus): boolean {
  return status === 'pending';
}

export function queryOrders(orders: LocalOrder[], query: OrderListQuery): LocalOrder[] {
  const kw = query.keyword?.trim().toLowerCase();
  const status = query.status ?? 'all';

  return orders.filter((order) => {
    if (status !== 'all' && order.status !== status) return false;
    if (!kw) return true;

    const idMatch = order.id.toLowerCase().includes(kw);
    const nameMatch = order.shippingAddress?.fullName?.toLowerCase().includes(kw);
    const emailMatch = order.shippingAddress?.email?.toLowerCase().includes(kw);
    const phoneMatch = order.shippingAddress?.phone?.toLowerCase().includes(kw);
    const trackingMatch = order.trackingNumber?.toLowerCase().includes(kw);
    const itemMatch = order.items.some((i) => i.name.toLowerCase().includes(kw));

    return idMatch || nameMatch || emailMatch || phoneMatch || trackingMatch || itemMatch;
  });
}

export function countOrdersByStatus(orders: LocalOrder[]): Record<OrderStatus, number> {
  const counts: Record<OrderStatus, number> = {
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  };
  for (const o of orders) {
    counts[o.status] += 1;
  }
  return counts;
}

/** 无订单时生成一条演示数据，便于后台联调 */
export function seedDemoOrderIfEmpty(userId = 'demo_user'): string | null {
  if (getLocalOrdersSorted().length > 0) return null;

  return localAddOrder({
    userId,
    status: 'pending',
    total: 1299,
    items: [
      {
        productId: 'demo_product',
        quantity: 1,
        price: 1299,
        name: '演示商品 · Modular Sofa',
      },
    ],
    shippingAddress: {
      fullName: 'Zhang Wei',
      email: 'demo@local.test',
      phone: '+86 138 0000 0000',
      address: '88 Design District Ave',
      city: 'Shanghai',
      zip: '200000',
      country: 'CN',
    },
  });
}
