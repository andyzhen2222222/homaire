import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight, Edit, Plus } from 'lucide-react';
import type { Category, Product } from '../../types';
import { getCategoryLevel, countProductsInCategorySubtree } from '../../lib/categoryTree';
import { CategoryFeishuSyncCell } from './CategoryFeishuSync';

type Props = {
  categories: Category[];
  products: Product[];
  onEdit: (cat: Category) => void;
  onAddChild: (parentId: string) => void;
  onDelete: (id: string) => void;
  onFeishuSync: (cat: Category) => void;
  feishuRowSyncId: string | null;
};

function buildTreeRows(categories: Category[]): Category[] {
  const byParent = new Map<string | null, Category[]>();
  for (const c of categories) {
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

export function CategoryTreePanel({
  categories,
  products,
  onEdit,
  onAddChild,
  onDelete,
  onFeishuSync,
  feishuRowSyncId,
}: Props) {
  const rows = useMemo(() => buildTreeRows(categories), [categories]);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());

  const toggle = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const hasChildren = (id: string) => categories.some((c) => c.parentId === id);

  const visibleRows = rows.filter((cat) => {
    let pid = cat.parentId ?? null;
    while (pid) {
      if (collapsed.has(pid)) return false;
      pid = categories.find((c) => c.id === pid)?.parentId ?? null;
    }
    return true;
  });

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="px-3 py-2 text-xs font-semibold text-slate-600">Category tree</th>
            <th className="px-3 py-2 text-xs font-semibold text-slate-600 w-16">Level</th>
            <th className="px-3 py-2 text-xs font-semibold text-slate-600 w-14">Cover</th>
            <th className="px-3 py-2 text-xs font-semibold text-slate-600">Slug</th>
            <th className="px-3 py-2 text-xs font-semibold text-slate-600">Feishu</th>
            <th className="px-3 py-2 text-xs font-semibold text-slate-600 w-16">Items</th>
            <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {visibleRows.map((cat) => {
            const level = getCategoryLevel(cat.id, categories);
            const productCount = countProductsInCategorySubtree(cat.slug, categories, products);
            const indent = (level - 1) * 20;
            const child = hasChildren(cat.id);
            const isCollapsed = collapsed.has(cat.id);
            const canAddChild = level < 3;

            return (
              <tr key={cat.id} className="hover:bg-slate-50/80">
                <td className="px-3 py-2">
                  <div className="flex min-w-0 items-center gap-1" style={{ paddingLeft: indent }}>
                    {child ? (
                      <button
                        type="button"
                        onClick={() => toggle(cat.id)}
                        className="shrink-0 rounded p-0.5 text-slate-400 hover:bg-slate-100"
                        aria-label={isCollapsed ? 'Expand' : 'Collapse'}
                      >
                        {isCollapsed ? (
                          <ChevronRight className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    ) : (
                      <span className="w-5 shrink-0" />
                    )}
                    <span
                      className={`truncate font-medium ${
                        level === 1 ? 'text-slate-900' : level === 2 ? 'text-slate-800' : 'text-slate-600 text-[13px]'
                      }`}
                    >
                      {cat.name}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2 text-xs tabular-nums text-slate-500">L{level}</td>
                <td className="px-3 py-2">
                  {cat.image ? (
                    <img src={cat.image} alt="" className="h-9 w-9 rounded border object-cover bg-slate-100" />
                  ) : (
                    <span className="text-[10px] text-slate-300">—</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <Link
                    to={`/category/${cat.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-[#1677ff] hover:underline"
                  >
                    /{cat.slug}
                  </Link>
                </td>
                <td className="px-3 py-2">
                  <CategoryFeishuSyncCell
                    cat={cat}
                    syncing={feishuRowSyncId === cat.id}
                    onSync={() => onFeishuSync(cat)}
                  />
                </td>
                <td className="px-3 py-2 text-xs tabular-nums text-slate-600">{productCount}</td>
                <td className="px-3 py-2 text-right">
                  <div className="flex justify-end flex-wrap gap-1">
                    {canAddChild ? (
                      <button
                        type="button"
                        title="Add child category"
                        onClick={() => onAddChild(cat.id)}
                        className="rounded border border-slate-200 px-2 py-1 text-[11px] text-[#1677ff] hover:bg-slate-50 inline-flex items-center gap-0.5"
                      >
                        <Plus className="h-3 w-3" /> Child
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => onEdit(cat)}
                      className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const msg =
                          productCount > 0
                            ? `About ${productCount} products use this subtree. Delete category config only?`
                            : 'Delete this category?';
                        if (confirm(msg)) onDelete(cat.id);
                      }}
                      className="rounded px-2 py-1 text-[11px] text-red-500 hover:bg-red-50"
                    >
                      Del
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
