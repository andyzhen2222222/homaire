import type { Category } from '../types';

const CAT_IMG = (file: string) => `/home-categories/${file}`;

/** 与首页宫格默认图一致（`public/home-categories/`），用作本地库首次/迁移；可在后台分类或首页装修中覆盖。 */export function getDefaultCategories(): Category[] {
  return [
    { id: 'cat_sofas', name: 'Sofas', slug: 'sofas', image: CAT_IMG('homaire-cat-sofas.png') },
    { id: 'cat_beds', name: 'Beds', slug: 'beds', image: CAT_IMG('homaire-cat-beds.png') },
    { id: 'cat_tables', name: 'Tables', slug: 'tables', image: CAT_IMG('homaire-cat-tables.png') },
    { id: 'cat_chairs', name: 'Chairs', slug: 'chairs', image: CAT_IMG('homaire-cat-chairs.png') },
    { id: 'cat_garden', name: 'Garden', slug: 'garden', image: CAT_IMG('homaire-cat-garden.png') },
    { id: 'cat_lighting', name: 'Lighting', slug: 'lighting', image: CAT_IMG('homaire-cat-lighting.png') },
    { id: 'cat_storage', name: 'Storage', slug: 'storage', image: CAT_IMG('homaire-cat-storage.png') },
    { id: 'cat_decor', name: 'Decor', slug: 'decor', image: CAT_IMG('homaire-cat-decor.png') },
  ];
}
