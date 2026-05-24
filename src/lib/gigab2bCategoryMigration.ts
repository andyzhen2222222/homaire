import type { Category, Product } from '../types';
import {
  getGigab2bCategoriesFlat,
  isLegacyFlatCategoryTree,
  migrateLegacyProductCategory,
} from '../data/gigab2bCategoryData';
import { migrateCategoriesToEnglish } from './categoryLabels';
import { sanitizeCategoriesParents } from './categoryTree';

/** Replace legacy 8 flat categories and remap product slugs to GIGAB2B taxonomy */
export function applyGigab2bCategoryMigration(state: {
  categories: Category[];
  products: Product[];
}): { categories: Category[]; products: Product[]; dirty: boolean } {
  let dirty = false;
  let categories = sanitizeCategoriesParents(state.categories);

  if (isLegacyFlatCategoryTree(categories)) {
    categories = getGigab2bCategoriesFlat();
    dirty = true;
  } else {
    const { categories: enCats, dirty: enDirty } = migrateCategoriesToEnglish(categories);
    if (enDirty || JSON.stringify(enCats) !== JSON.stringify(categories)) {
      categories = enCats;
      dirty = true;
    }
  }

  const products = state.products.map((p) => {
    const next = migrateLegacyProductCategory(p.category || '');
    if (next !== (p.category || '').trim().toLowerCase()) {
      dirty = true;
      return { ...p, category: next };
    }
    return p;
  });

  return { categories, products, dirty };
}
