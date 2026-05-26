import { prisma } from '../db/client';
import { mapOrder } from '../mappers/catalogMappers';
import type { Order, OrderStatus, ShippingAddress } from '../../src/types';

function generateOrderId(): string {
  const d = new Date();
  const ymd = d.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ORD-${ymd}-${rand}`;
}

function linePrice(price: number, onSale: boolean, discountPrice: number | null): number {
  if (onSale && discountPrice != null && discountPrice > 0 && discountPrice < price) {
    return discountPrice;
  }
  return price;
}

export async function createOrder(params: {
  userId: string;
  items: { productId: string; quantity: number }[];
  shippingAddress: ShippingAddress;
}): Promise<Order & { id: string }> {
  const settings = await prisma.storeSettings.findUnique({ where: { id: 'global' } });
  if (settings?.maintenanceMode) {
    throw new Error('Store is in maintenance mode');
  }

  const productIds = params.items.map((i) => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  const productMap = new Map(products.map((p) => [p.id, p]));

  let total = 0;
  const lineItems: { productId: string; quantity: number; price: number; name: string }[] = [];

  for (const item of params.items) {
    const product = productMap.get(item.productId);
    if (!product) throw new Error(`Product not found: ${item.productId}`);
    if (product.stock < item.quantity) {
      throw new Error(`Insufficient stock for ${product.name}`);
    }
    const unitPrice = linePrice(product.price, product.onSale, product.discountPrice);
    total += unitPrice * item.quantity;
    lineItems.push({
      productId: product.id,
      quantity: item.quantity,
      price: unitPrice,
      name: product.shortTitle || product.name,
    });
  }

  if (lineItems.length === 0) throw new Error('Order must have at least one item');

  const orderId = generateOrderId();
  const addr = params.shippingAddress;

  const order = await prisma.$transaction(async (tx) => {
    for (const line of lineItems) {
      const updated = await tx.product.updateMany({
        where: { id: line.productId, stock: { gte: line.quantity } },
        data: { stock: { decrement: line.quantity } },
      });
      if (updated.count === 0) {
        throw new Error(`Stock changed for product ${line.productId}`);
      }
    }

    return tx.order.create({
      data: {
        id: orderId,
        userId: params.userId,
        total,
        status: 'pending',
        shippingFullName: addr.fullName,
        shippingEmail: addr.email ?? null,
        shippingPhone: addr.phone ?? null,
        shippingAddress: addr.address,
        shippingCity: addr.city,
        shippingState: addr.state ?? null,
        shippingZip: addr.zip ?? null,
        shippingCountry: addr.country ?? null,
        items: {
          create: lineItems.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
            price: l.price,
            name: l.name,
          })),
        },
      },
      include: { items: true },
    });
  });

  return mapOrder(order);
}

export async function listOrdersForUser(userId: string, status?: OrderStatus): Promise<(Order & { id: string })[]> {
  const rows = await prisma.order.findMany({
    where: { userId, ...(status ? { status } : {}) },
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(mapOrder);
}

export async function getOrderById(
  orderId: string,
  userId?: string
): Promise<(Order & { id: string }) | null> {
  const row = await prisma.order.findFirst({
    where: { id: orderId, ...(userId ? { userId } : {}) },
    include: { items: true },
  });
  return row ? mapOrder(row) : null;
}

export async function listAllOrders(params: {
  status?: OrderStatus;
  keyword?: string;
  page?: number;
  limit?: number;
}): Promise<(Order & { id: string })[]> {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(100, Math.max(1, params.limit ?? 50));
  const where: Record<string, unknown> = {};
  if (params.status) where.status = params.status;
  if (params.keyword) {
    const kw = params.keyword.trim();
    where.OR = [
      { id: { contains: kw } },
      { shippingFullName: { contains: kw } },
      { shippingEmail: { contains: kw } },
    ];
  }
  const rows = await prisma.order.findMany({
    where,
    include: { items: true },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  });
  return rows.map(mapOrder);
}

export async function patchOrder(
  orderId: string,
  patch: {
    status?: OrderStatus;
    carrier?: string;
    trackingNumber?: string;
    adminNote?: string;
  }
): Promise<(Order & { id: string }) | null> {
  const data: Record<string, unknown> = { ...patch };
  if (patch.status === 'shipped') {
    data.shippedAt = new Date();
  }
  try {
    const row = await prisma.order.update({
      where: { id: orderId },
      data,
      include: { items: true },
    });
    return mapOrder(row);
  } catch {
    return null;
  }
}

export async function shipOrder(
  orderId: string,
  carrier: string,
  trackingNumber: string
): Promise<(Order & { id: string }) | null> {
  return patchOrder(orderId, {
    status: 'shipped',
    carrier,
    trackingNumber,
  });
}
