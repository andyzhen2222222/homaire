import type { Product, ShippingAddress } from '../types';
import { authHeaders } from './authToken';

export type UserAddressDto = ShippingAddress & {
  id: string;
  label?: string;
  isDefault: boolean;
};

export async function fetchAddresses(): Promise<UserAddressDto[]> {
  const res = await fetch('/api/v1/me/addresses', { headers: authHeaders(), cache: 'no-store' });
  const body = (await res.json()) as { ok?: boolean; addresses?: UserAddressDto[] };
  return body.ok && body.addresses ? body.addresses : [];
}

export async function createAddressApi(
  input: ShippingAddress & { label?: string; isDefault?: boolean }
): Promise<UserAddressDto> {
  const res = await fetch('/api/v1/me/addresses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(input),
  });
  const body = (await res.json()) as { ok?: boolean; address?: UserAddressDto; error?: string };
  if (!res.ok || !body.ok || !body.address) throw new Error(body.error || 'Failed to save address');
  return body.address;
}

export async function deleteAddressApi(id: string): Promise<void> {
  await fetch(`/api/v1/me/addresses/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
}

export async function fetchWishlist(): Promise<Product[]> {
  const res = await fetch('/api/v1/me/wishlist', { headers: authHeaders(), cache: 'no-store' });
  const body = (await res.json()) as { ok?: boolean; products?: Product[] };
  return body.ok && body.products ? body.products : [];
}

export async function addWishlistApi(productId: string): Promise<void> {
  await fetch('/api/v1/me/wishlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ productId }),
  });
}

export async function removeWishlistApi(productId: string): Promise<void> {
  await fetch(`/api/v1/me/wishlist/${encodeURIComponent(productId)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
}
