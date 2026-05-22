import type { Category } from '../types';

/** 分类在树中的层级：1=一级，2=二级，3=三级 */
export function getCategoryLevel(catId: string, categories: Category[]): number {
  const byId = new Map(categories.map((c) => [c.id, c]));
  let depth = 1;
  let cur: Category | undefined = byId.get(catId);
  while (cur?.parentId) {
    depth += 1;
    cur = byId.get(cur.parentId);
    if (depth > 32) break;
  }
  return depth;
}

/** 以某节点为根的子树高度（含自身为 1） */
export function maxSubtreeDepthFrom(catId: string, categories: Category[]): number {
  const children = categories.filter((c) => c.parentId === catId);
  if (children.length === 0) return 1;
  return 1 + Math.max(...children.map((ch) => maxSubtreeDepthFrom(ch.id, categories)));
}

/** 将节点 `catId` 挂到 `newParentId` 下是否会形成环（newParentId 在 catId 的子树中） */
export function wouldCreatingParentCycle(
  categories: Category[],
  catId: string,
  newParentId: string | null,
): boolean {
  if (!newParentId || newParentId === catId) return newParentId === catId;
  let cur: string | null | undefined = newParentId;
  const byId = new Map(categories.map((c) => [c.id, c]));
  let guard = 0;
  while (cur && guard++ < 64) {
    if (cur === catId) return true;
    cur = byId.get(cur)?.parentId ?? null;
  }
  return false;
}

/** 校验 parentId 指向的 id 均存在；无效则置为 null */
export function sanitizeCategoriesParents(categories: Category[]): Category[] {
  const ids = new Set(categories.map((c) => c.id));
  return categories.map((c) => ({
    ...c,
    parentId: c.parentId && ids.has(c.parentId) ? c.parentId : null,
    sortOrder: typeof c.sortOrder === 'number' && !Number.isNaN(c.sortOrder) ? c.sortOrder : 0,
  }));
}

/** 深度优先展开：同级按 sortOrder、再按 name */
export function flattenCategoryTreeSorted(categories: Category[]): Category[] {
  const list = sanitizeCategoriesParents(categories);
  const byParent = new Map<string | null, Category[]>();
  for (const c of list) {
    const pid = c.parentId ?? null;
    if (!byParent.has(pid)) byParent.set(pid, []);
    byParent.get(pid)!.push(c);
  }
  for (const arr of byParent.values()) {
    arr.sort(
      (a, b) =>
        (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
    );
  }
  const out: Category[] = [];
  const walk = (parentId: string | null) => {
    for (const node of byParent.get(parentId) || []) {
      out.push(node);
      walk(node.id);
    }
  };
  walk(null);
  return out;
}

/** 面包屑式名称：A › B › C */
export function getCategoryPathLabel(catId: string, categories: Category[]): string {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const parts: string[] = [];
  let cur: Category | undefined = byId.get(catId);
  let guard = 0;
  while (cur && guard++ < 32) {
    parts.unshift(cur.name);
    cur = cur.parentId ? byId.get(cur.parentId) : undefined;
  }
  return parts.join(' › ');
}

/** 商品分类下拉：每项 slug + 完整路径文案 */
export function buildCategorySelectOptions(categories: Category[]): { slug: string; name: string }[] {
  const flat = flattenCategoryTreeSorted(categories);
  return flat.map((c) => ({
    slug: c.slug,
    name: getCategoryPathLabel(c.id, categories),
  }));
}

/** 从根 slug 起包含自身与所有后代分类的 slug 集合（用于列表筛选） */
export function getSubtreeSlugsByRootSlug(rootSlug: string, categories: Category[]): Set<string> {
  const list = sanitizeCategoriesParents(categories);
  const root = list.find((c) => c.slug === rootSlug);
  if (!root) return new Set([rootSlug]);
  const out = new Set<string>();
  const walk = (id: string) => {
    const node = list.find((c) => c.id === id);
    if (!node) return;
    out.add(node.slug);
    for (const ch of list.filter((c) => c.parentId === node.id)) walk(ch.id);
  };
  walk(root.id);
  return out;
}

/** 某节点的所有后代 id（不含自身） */
export function getDescendantIds(catId: string, categories: Category[]): Set<string> {
  const out = new Set<string>();
  const walk = (id: string) => {
    for (const ch of categories.filter((c) => c.parentId === id)) {
      out.add(ch.id);
      walk(ch.id);
    }
  };
  walk(catId);
  return out;
}

export function countProductsInCategorySubtree(
  catSlug: string,
  categories: Category[],
  products: { category: string }[],
): number {
  const slugs = getSubtreeSlugsByRootSlug(catSlug, categories);
  return products.filter((p) => slugs.has(p.category)).length;
}
