import { prisma } from '../db/client';
import { mapProduct } from '../mappers/catalogMappers';
import type { Product, ShippingAddress } from '../../src/types';

export type UserAddressDto = ShippingAddress & {
  id: string;
  label?: string;
  isDefault: boolean;
};

export async function listAddresses(userId: string): Promise<UserAddressDto[]> {
  const rows = await prisma.userAddress.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });
  return rows.map((r) => ({
    id: r.id,
    label: r.label ?? undefined,
    isDefault: r.isDefault,
    fullName: r.fullName,
    phone: r.phone ?? undefined,
    address: r.address,
    city: r.city,
    state: r.state ?? undefined,
    zip: r.zip ?? undefined,
    country: r.country ?? undefined,
  }));
}

export async function createAddress(
  userId: string,
  input: ShippingAddress & { label?: string; isDefault?: boolean }
): Promise<UserAddressDto> {
  if (input.isDefault) {
    await prisma.userAddress.updateMany({ where: { userId }, data: { isDefault: false } });
  }
  const row = await prisma.userAddress.create({
    data: {
      userId,
      label: input.label ?? null,
      fullName: input.fullName,
      phone: input.phone ?? null,
      address: input.address,
      city: input.city,
      state: input.state ?? null,
      zip: input.zip ?? null,
      country: input.country ?? null,
      isDefault: input.isDefault ?? false,
    },
  });
  return {
    id: row.id,
    label: row.label ?? undefined,
    isDefault: row.isDefault,
    fullName: row.fullName,
    phone: row.phone ?? undefined,
    address: row.address,
    city: row.city,
    state: row.state ?? undefined,
    zip: row.zip ?? undefined,
    country: row.country ?? undefined,
  };
}

export async function updateAddress(
  userId: string,
  addressId: string,
  input: Partial<ShippingAddress & { label?: string; isDefault?: boolean }>
): Promise<UserAddressDto | null> {
  const existing = await prisma.userAddress.findFirst({ where: { id: addressId, userId } });
  if (!existing) return null;
  if (input.isDefault) {
    await prisma.userAddress.updateMany({ where: { userId }, data: { isDefault: false } });
  }
  const row = await prisma.userAddress.update({
    where: { id: addressId },
    data: {
      label: input.label ?? existing.label,
      fullName: input.fullName ?? existing.fullName,
      phone: input.phone ?? existing.phone,
      address: input.address ?? existing.address,
      city: input.city ?? existing.city,
      state: input.state ?? existing.state,
      zip: input.zip ?? existing.zip,
      country: input.country ?? existing.country,
      isDefault: input.isDefault ?? existing.isDefault,
    },
  });
  return {
    id: row.id,
    label: row.label ?? undefined,
    isDefault: row.isDefault,
    fullName: row.fullName,
    phone: row.phone ?? undefined,
    address: row.address,
    city: row.city,
    state: row.state ?? undefined,
    zip: row.zip ?? undefined,
    country: row.country ?? undefined,
  };
}

export async function deleteAddress(userId: string, addressId: string): Promise<boolean> {
  const result = await prisma.userAddress.deleteMany({ where: { id: addressId, userId } });
  return result.count > 0;
}

export async function listWishlist(userId: string): Promise<Product[]> {
  const rows = await prisma.wishlistItem.findMany({
    where: { userId },
    include: { product: true },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map((r) => mapProduct(r.product));
}

export async function addWishlistItem(userId: string, productId: string): Promise<void> {
  await prisma.wishlistItem.upsert({
    where: { userId_productId: { userId, productId } },
    create: { userId, productId },
    update: {},
  });
}

export async function removeWishlistItem(userId: string, productId: string): Promise<boolean> {
  const r = await prisma.wishlistItem.deleteMany({ where: { userId, productId } });
  return r.count > 0;
}

export async function getCart(userId: string): Promise<{ productId: string; quantity: number; product: Product }[]> {
  const rows = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: true },
  });
  return rows.map((r) => ({
    productId: r.productId,
    quantity: r.quantity,
    product: mapProduct(r.product),
  }));
}

export async function replaceCart(
  userId: string,
  items: { productId: string; quantity: number }[]
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.cartItem.deleteMany({ where: { userId } });
    for (const item of items) {
      if (item.quantity > 0) {
        await tx.cartItem.create({
          data: { userId, productId: item.productId, quantity: item.quantity },
        });
      }
    }
  });
}

export async function addCartItem(
  userId: string,
  productId: string,
  quantity: number
): Promise<void> {
  const existing = await prisma.cartItem.findUnique({
    where: { userId_productId: { userId, productId } },
  });
  if (existing) {
    await prisma.cartItem.update({
      where: { userId_productId: { userId, productId } },
      data: { quantity: existing.quantity + quantity },
    });
  } else {
    await prisma.cartItem.create({ data: { userId, productId, quantity } });
  }
}
