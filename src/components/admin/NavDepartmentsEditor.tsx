import { useMemo, useState } from 'react';
import type { Category, NavDepartment, StoreConfig } from '../../types';
import { buildDefaultNavDepartments, createEmptyNavDepartment } from '../../lib/defaultNavDepartments';
import {
  ADM_BTN_PRIMARY,
  ADM_CARD,
  ADM_CARD_TITLE,
  ADM_HINT,
  ADM_INPUT,
  ADM_LABEL,
  ADM_SUBCARD,
} from '../../lib/adminVueUi';
import { Plus, Trash2, GripVertical } from 'lucide-react';

const ADM_LABEL_COMPACT = 'block text-[11px] font-medium text-slate-500 mb-1';

type Props = {
  categories: Category[];
  config: StoreConfig | null;
  onSave: (navDepartments: NavDepartment[]) => Promise<void>;
};

function slugifyName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s*&\s*/g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export function NavDepartmentsEditor({ categories, config, onSave }: Props) {
  const l1Categories = useMemo(
    () => categories.filter((c) => !c.parentId).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [categories],
  );

  const [departments, setDepartments] = useState<NavDepartment[]>(() => {
    if (config?.navDepartments?.length) return config.navDepartments.map((d) => ({ ...d }));
    return buildDefaultNavDepartments(categories);
  });
  const [saving, setSaving] = useState(false);

  const assignedIds = new Set(departments.flatMap((d) => d.categoryIds));

  const updateDept = (id: string, patch: Partial<NavDepartment>) => {
    setDepartments((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const next = { ...d, ...patch };
        if (patch.name !== undefined && patch.slug === undefined) {
          next.slug = slugifyName(patch.name) || d.slug;
        }
        return next;
      }),
    );
  };

  const toggleCategory = (deptId: string, catId: string) => {
    setDepartments((prev) =>
      prev.map((d) => {
        if (d.id === deptId) {
          const has = d.categoryIds.includes(catId);
          return {
            ...d,
            categoryIds: has ? d.categoryIds.filter((x) => x !== catId) : [...d.categoryIds, catId],
          };
        }
        return { ...d, categoryIds: d.categoryIds.filter((x) => x !== catId) };
      }),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const cleaned = departments
        .filter((d) => d.name.trim())
        .map((d, i) => ({
          ...d,
          name: d.name.trim(),
          slug: (d.slug || slugifyName(d.name)).trim(),
          sortOrder: i,
        }));
      await onSave(cleaned);
      window.alert('导航部门已保存到服务端 catalog。');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={ADM_CARD + ' mb-6'}>
      <h3 className={ADM_CARD_TITLE}>前台导航部门</h3>
      <p className={ADM_HINT + ' mb-4'}>
        将一级分类归并为 6–8 个顶栏入口。Mega Menu 按分类库展示 L1 → L2 → L3。配置保存在服务端
        catalog.config.navDepartments。
      </p>

      <div className="space-y-4">
        {departments.map((dept) => (
          <div key={dept.id} className={ADM_SUBCARD}>
            <div className="flex flex-wrap items-start gap-3 mb-3">
              <GripVertical className="h-5 w-5 text-slate-300 mt-2 shrink-0" aria-hidden />
              <div className="flex-1 min-w-[200px] grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={ADM_LABEL_COMPACT}>部门名称</label>
                  <input
                    className={ADM_INPUT}
                    value={dept.name}
                    onChange={(e) => updateDept(dept.id, { name: e.target.value })}
                    placeholder="Home & Furniture"
                  />
                </div>
                <div>
                  <label className={ADM_LABEL_COMPACT}>Slug</label>
                  <input
                    className={ADM_INPUT}
                    value={dept.slug}
                    onChange={(e) => updateDept(dept.id, { slug: e.target.value })}
                    placeholder="home-furniture"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDepartments((prev) => prev.filter((d) => d.id !== dept.id))}
                className="p-2 text-red-500 hover:bg-red-50 rounded"
                title="删除部门"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <p className={ADM_LABEL + ' mb-2'}>本部门包含的一级分类</p>
            <div className="flex flex-wrap gap-2">
              {l1Categories.map((cat) => {
                const checked = dept.categoryIds.includes(cat.id);
                const takenElsewhere = !checked && assignedIds.has(cat.id);
                return (
                  <label
                    key={cat.id}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs cursor-pointer ${
                      checked
                        ? 'border-[#1677ff] bg-blue-50 text-[#1677ff]'
                        : takenElsewhere
                          ? 'border-slate-100 text-slate-300 cursor-not-allowed'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      disabled={takenElsewhere}
                      onChange={() => toggleCategory(dept.id, cat.id)}
                    />
                    {cat.name}
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setDepartments((prev) => [...prev, createEmptyNavDepartment(prev.length)])}
          className="inline-flex items-center gap-1 rounded border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          <Plus className="h-4 w-4" /> 添加部门
        </button>
        <button
          type="button"
          onClick={() => setDepartments(buildDefaultNavDepartments(categories))}
          className="rounded border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          恢复默认
        </button>
        <button type="button" disabled={saving} onClick={() => void handleSave()} className={ADM_BTN_PRIMARY}>
          {saving ? '保存中…' : '保存导航'}
        </button>
      </div>
    </div>
  );
}
