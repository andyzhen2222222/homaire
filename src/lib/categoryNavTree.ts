import type { Category, NavDepartment } from '../types';
import { ensureNavDepartments } from './defaultNavDepartments';
import { countProductsInCategorySubtree, sanitizeCategoriesParents } from './categoryTree';

export type NavMenuLink = {
  id: string;
  name: string;
  slug: string;
  href: string;
  productCount: number;
};

export type NavMenuL3 = NavMenuLink;

export type NavMenuL2 = NavMenuLink & {
  children: NavMenuL3[];
};

export type NavMenuL1 = NavMenuLink & {
  children: NavMenuL2[];
};

export type NavMenuDepartment = NavMenuLink & {
  l1Groups: NavMenuL1[];
};

function sortByOrder(a: Category, b: Category): number {
  return (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
}

function childrenOf(parentId: string, byParent: Map<string | null, Category[]>): Category[] {
  return [...(byParent.get(parentId) || [])].sort(sortByOrder);
}

function toLink(cat: Category, productCount = 0): NavMenuLink {
  return {
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    href: `/category/${cat.slug}`,
    productCount,
  };
}

function slugProductCount(
  slug: string,
  categories: Category[],
  products: { category: string }[],
): number {
  if (!products.length) return 0;
  return countProductsInCategorySubtree(slug, categories, products);
}

/** Build 3-level storefront nav from DB categories + config.navDepartments */
export function buildStorefrontNavMenu(
  categories: Category[],
  navDepartments?: NavDepartment[] | null,
  products: { category: string }[] = [],
): NavMenuDepartment[] {
  const list = sanitizeCategoriesParents(categories);
  const byParent = new Map<string | null, Category[]>();
  for (const c of list) {
    const pid = c.parentId ?? null;
    if (!byParent.has(pid)) byParent.set(pid, []);
    byParent.get(pid)!.push(c);
  }

  const departments = ensureNavDepartments(list, navDepartments);
  const byId = new Map(list.map((c) => [c.id, c]));

  return departments
    .map((dept) => {
    const l1Groups: NavMenuL1[] = dept.categoryIds
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((l1) => {
        const l2Nodes = childrenOf(l1!.id, byParent);
        const l2Groups: NavMenuL2[] = l2Nodes.map((l2) => {
          const l3Nodes = childrenOf(l2.id, byParent);
          return {
            ...toLink(l2, slugProductCount(l2.slug, list, products)),
            children: l3Nodes.map((l3) => toLink(l3, slugProductCount(l3.slug, list, products))),
          };
        });
        return {
          ...toLink(l1!, slugProductCount(l1!.slug, list, products)),
          children: l2Groups,
        };
      })
      .filter((l1) => l1.children.length > 0);

    const firstHref = l1Groups[0]?.href || `/category/${dept.slug}`;
    return {
      id: dept.id,
      name: dept.name,
      slug: dept.slug,
      href: firstHref,
      productCount: 0,
      l1Groups,
    };
  })
    .filter((dept) => dept.l1Groups.length > 0);
}
