import type { Order, ShippingAddress } from '../types';
import { authHeaders } from './authToken';

export async function createCheckoutOrder(params: {
  items: { productId: string; quantity: number }[];
  shippingAddress: ShippingAddress;
}): Promise<Order & { id: string }> {
  const res = await fetch('/api/v1/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(params),
  });
  const body = (await res.json()) as { ok?: boolean; order?: Order & { id: string }; error?: string };
  if (!res.ok || !body.ok || !body.order) {
    throw new Error(body.error || `Checkout failed (${res.status})`);
  }
  return body.order;
}
