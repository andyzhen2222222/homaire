import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, ImageIcon, Sparkles } from 'lucide-react';
import type { Category } from '../../types';
import { GIGAB2B_HERO_IMAGES } from '../../data/gigab2bCategoryData';
import { fileToDataUrl } from '../../lib/fileToDataUrl';
import {
  ADM_BTN_DEFAULT,
  ADM_BTN_PRIMARY,
  ADM_CARD,
  ADM_CARD_TITLE,
  ADM_HINT,
  ADM_INPUT,
} from '../../lib/adminVueUi';

type Props = {
  categories: Category[];
  onUpdateCategory: (id: string, patch: Partial<Omit<Category, 'id'>>) => void | Promise<void>;
};

function sortLevel1(categories: Category[]): Category[] {
  return categories
    .filter((c) => !c.parentId)
    .sort(
      (a, b) =>
        (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
    );
}

export function CategoryCoverEditor({ categories, onUpdateCategory }: Props) {
  const level1 = useMemo(() => sortLevel1(categories), [categories]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const imageFor = (cat: Category) =>
    drafts[cat.id] !== undefined ? drafts[cat.id] : cat.image || '';

  const setDraft = (id: string, value: string) => {
    setDrafts((prev) => ({ ...prev, [id]: value }));
  };

  const changedIds = useMemo(() => {
    const ids: string[] = [];
    for (const cat of level1) {
      if (drafts[cat.id] === undefined) continue;
      if (drafts[cat.id].trim() !== (cat.image || '').trim()) ids.push(cat.id);
    }
    return ids;
  }, [drafts, level1]);

  const handleSaveAll = async () => {
    if (changedIds.length === 0) return;
    setSaving(true);
    try {
      for (const id of changedIds) {
        await onUpdateCategory(id, { image: (drafts[id] || '').trim() });
      }
      setDrafts((prev) => {
        const next = { ...prev };
        for (const id of changedIds) delete next[id];
        return next;
      });
      window.alert(`已保存 ${changedIds.length} 个大类封面。`);
    } finally {
      setSaving(false);
    }
  };

  const handleFillDefaults = () => {
    const next: Record<string, string> = { ...drafts };
    for (const cat of level1) {
      const current = (next[cat.id] !== undefined ? next[cat.id] : cat.image || '').trim();
      if (current) continue;
      const fallback = GIGAB2B_HERO_IMAGES[cat.slug];
      if (fallback) next[cat.id] = fallback;
    }
    setDrafts(next);
  };

  const handleApplyRecommendedAll = () => {
    const next: Record<string, string> = { ...drafts };
    for (const cat of level1) {
      const fallback = GIGAB2B_HERO_IMAGES[cat.slug];
      if (fallback) next[cat.id] = fallback;
    }
    setDrafts(next);
  };

  const handleUpload = async (cat: Category, file: File) => {
    setUploadingId(cat.id);
    try {
      const url = await fileToDataUrl(file);
      setDraft(cat.id, url);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : '上传失败');
    } finally {
      setUploadingId(null);
    }
  };

  if (level1.length === 0) {
    return null;
  }

  const missingCount = level1.filter((c) => !imageFor(c).trim()).length;

  return (
    <div className={`${ADM_CARD} mb-6 mx-3 mt-3`}>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h3 className={ADM_CARD_TITLE}>一级分类封面</h3>
          <p className={ADM_HINT + ' mt-1 max-w-2xl'}>
            共 {level1.length} 个大类。封面用于分类页顶部横幅、首页「按功能选购」宫格（slug 一致时）等。保存后写入服务端
            catalog。
          </p>
          {missingCount > 0 ? (
            <p className="mt-1 text-xs text-amber-700">还有 {missingCount} 个大类未设置封面。</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={handleFillDefaults} className={ADM_BTN_DEFAULT}>
            <Sparkles className="inline h-3.5 w-3.5 mr-1" />
            填充空缺
          </button>
          <button type="button" onClick={handleApplyRecommendedAll} className={ADM_BTN_DEFAULT}>
            全部应用推荐
          </button>
          <button
            type="button"
            disabled={saving || changedIds.length === 0}
            onClick={() => void handleSaveAll()}
            className={ADM_BTN_PRIMARY}
          >
            {saving ? '保存中…' : changedIds.length > 0 ? `保存 ${changedIds.length} 项` : '保存全部'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {level1.map((cat) => {
          const image = imageFor(cat);
          const dirty = drafts[cat.id] !== undefined && drafts[cat.id].trim() !== (cat.image || '').trim();
          return (
            <div
              key={cat.id}
              className={`rounded-lg border p-3 space-y-2 ${dirty ? 'border-[#1677ff] bg-blue-50/30' : 'border-slate-200 bg-slate-50/50'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{cat.name}</p>
                  <p className="text-[11px] text-slate-500 font-mono truncate">/{cat.slug}</p>
                </div>
                <Link
                  to={`/category/${cat.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 p-1 text-slate-400 hover:text-[#1677ff]"
                  title="预览分类页"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="aspect-[4/3] overflow-hidden rounded-md border border-slate-200 bg-white">
                {image ? (
                  <img src={image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-400">暂无封面</div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={uploadingId === cat.id}
                  onClick={() => fileRefs.current[cat.id]?.click()}
                  className={`${ADM_BTN_DEFAULT} flex-1 text-xs py-1.5 inline-flex items-center justify-center gap-1`}
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  {uploadingId === cat.id ? '上传中…' : '上传'}
                </button>
                <input
                  ref={(el) => {
                    fileRefs.current[cat.id] = el;
                  }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleUpload(cat, file);
                    e.target.value = '';
                  }}
                />
              </div>

              <input
                type="url"
                value={image}
                onChange={(e) => setDraft(cat.id, e.target.value)}
                placeholder="图片 URL"
                className={`${ADM_INPUT} text-xs font-mono`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
