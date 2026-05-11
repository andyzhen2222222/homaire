import type { StoreConfig } from '../types';

export type TrustRowItem = { title: string; sub: string; iconPath: string };

export const DEFAULT_HOME_TRUST: TrustRowItem[] = [
  { title: 'Free Delivery', sub: 'On all premium orders', iconPath: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { title: '2-Year Warranty', sub: 'Guaranteed quality', iconPath: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { title: 'For Every Corner', sub: 'Whole-home solutions', iconPath: 'M5 13l4 4L19 7' },
  { title: 'Expert Support', sub: 'Dedicated customer care', iconPath: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z' },
];

export function mergeTrustItems(config?: StoreConfig | null): TrustRowItem[] {
  const raw = config?.homeTrustItems;
  if (!Array.isArray(raw) || raw.length < 4) return DEFAULT_HOME_TRUST;
  return [0, 1, 2, 3].map((i) => {
    const item = raw[i] as { title?: string; sub?: string; iconPath?: string };
    const d = DEFAULT_HOME_TRUST[i];
    return {
      title: (item?.title && String(item.title).trim()) || d.title,
      sub: (item?.sub && String(item.sub).trim()) || d.sub,
      iconPath: (item?.iconPath && String(item.iconPath).trim()) || d.iconPath,
    };
  });
}
