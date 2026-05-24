import type { Category, NavDepartment } from '../types';

export const NAV_DEPARTMENT_SPECS: {
  name: string;
  slug: string;
  sortOrder: number;
  l1Slugs: string[];
}[] = [
  {
    name: 'Home & Furniture',
    slug: 'home-furniture',
    sortOrder: 0,
    l1Slugs: ['furniture', 'lighting', 'household-supplies-decor'],
  },
  {
    name: 'Outdoor & Sports',
    slug: 'outdoor-sports',
    sortOrder: 1,
    l1Slugs: ['garden-outdoor', 'fitness-sports'],
  },
  {
    name: 'Kitchen & Bath',
    slug: 'kitchen-bath',
    sortOrder: 2,
    l1Slugs: ['kitchen', 'bath-faucets'],
  },
  {
    name: 'Appliances & Tools',
    slug: 'appliances-tools',
    sortOrder: 3,
    l1Slugs: ['electrical-appliances', 'tools-tool-organizers', 'home-improvement'],
  },
  {
    name: 'Pets & Kids',
    slug: 'pets-kids',
    sortOrder: 4,
    l1Slugs: ['pet-supplies', 'toys'],
  },
  {
    name: 'Auto & Travel',
    slug: 'auto-travel',
    sortOrder: 5,
    l1Slugs: ['auto-parts-transport', 'travel'],
  },
  {
    name: 'Commercial & Parts',
    slug: 'commercial-parts',
    sortOrder: 6,
    l1Slugs: ['commercial', 'industrial-scientific', 'other', 'part'],
  },
];

export function buildDefaultNavDepartments(categories: Category[]): NavDepartment[] {
  const l1 = categories.filter((c) => !c.parentId);
  const bySlug = new Map(l1.map((c) => [c.slug.trim().toLowerCase(), c]));

  return NAV_DEPARTMENT_SPECS.map((spec) => {
    const categoryIds = spec.l1Slugs
      .map((slug) => bySlug.get(slug.trim().toLowerCase())?.id)
      .filter(Boolean) as string[];
    return {
      id: `nav_dept_${spec.slug}`,
      name: spec.name,
      slug: spec.slug,
      sortOrder: spec.sortOrder,
      categoryIds,
    };
  }).filter((d) => d.categoryIds.length > 0);
}

export function ensureNavDepartments(
  categories: Category[],
  existing?: NavDepartment[] | null,
): NavDepartment[] {
  const valid = (existing || []).filter((d) => d?.name?.trim() && Array.isArray(d.categoryIds));
  if (valid.length > 0) {
    const l1Ids = new Set(categories.filter((c) => !c.parentId).map((c) => c.id));
    return valid
      .map((d) => ({
        ...d,
        categoryIds: d.categoryIds.filter((id) => l1Ids.has(id)),
      }))
      .filter((d) => d.categoryIds.length > 0)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }
  return buildDefaultNavDepartments(categories);
}

export function createEmptyNavDepartment(sortOrder = 0): NavDepartment {
  return {
    id: `nav_dept_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: '',
    slug: '',
    sortOrder,
    categoryIds: [],
  };
}
