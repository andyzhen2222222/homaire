import type { Category } from '../types';
import { getGigab2bCategoriesFlat } from './gigab2bCategoryData';

/** GIGAB2B taxonomy (18 L1 / 96+ L2 / leaf L3). Regenerate via `npm run generate:categories`. */
export function getDefaultCategories(): Category[] {
  return getGigab2bCategoriesFlat();
}
