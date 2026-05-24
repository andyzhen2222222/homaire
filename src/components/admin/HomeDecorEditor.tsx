import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, ImageIcon, RotateCcw, Save } from 'lucide-react';
import type { HomeCategoryTile, HomeHeroSpotlightItem, HomeReviewItem, Product, StoreConfig } from '../../types';
import { useProducts } from '../../hooks/useProducts';
import { usePromotions, useCategories } from '../../hooks/useAdminData';
import { HomeSections } from '../home/HomeSections';
import { mergeHomeTrustDraftItems } from '../../lib/siteContent';
import { buildHomeCategoryTilesDraftSeed, mergeHomeHeroSpotlights, mergeHomeReviewItems } from '../../lib/homePageDefaults';
import { fileToDataUrl } from '../../lib/fileToDataUrl';
import {
  ADM_BTN_DEFAULT,
  ADM_BTN_PRIMARY,
  ADM_CARD,
  ADM_CARD_TITLE,
  ADM_INPUT,
  ADM_PREVIEW_FRAME,
  ADM_SUBCARD,
  ADM_TEXTAREA,
} from '../../lib/adminVueUi';

function buildHomeDecorDraft(config: StoreConfig | null): Partial<StoreConfig> {
  return {
    homeTrustItems: mergeHomeTrustDraftItems(config),
    homeCategoryTiles: buildHomeCategoryTilesDraftSeed(config),
    homeHeroSpotlights: mergeHomeHeroSpotlights(config),
    homeReviewsEyebrow: config?.homeReviewsEyebrow,
    homeReviewsTitle: config?.homeReviewsTitle,
    homeReviewsIntro: config?.homeReviewsIntro,
    homeReviewsItems: mergeHomeReviewItems(config),
    homeManifestoEyebrow: config?.homeManifestoEyebrow,
    homeManifestoTitle: config?.homeManifestoTitle,
    homeManifestoBody: config?.homeManifestoBody,
    homeManifestoCtaLabel: config?.homeManifestoCtaLabel,
    homeManifestoCtaHref: config?.homeManifestoCtaHref,
    homeManifestoImageUrl: config?.homeManifestoImageUrl,
    homeManifestoCardTitle: config?.homeManifestoCardTitle,
    homeManifestoCardSub: config?.homeManifestoCardSub,
    homeManifestoCardYear: config?.homeManifestoCardYear,
    homeShopEyebrow: config?.homeShopEyebrow,
    homeShopTitle: config?.homeShopTitle,
    homeShopViewAllLabel: config?.homeShopViewAllLabel,
    homeTrendingEyebrow: config?.homeTrendingEyebrow,
    homeTrendingTitle: config?.homeTrendingTitle,
  };
}

function mergePreviewStoreConfig(base: StoreConfig | null, draft: Partial<StoreConfig>): StoreConfig | null {
  const b = base || { id: 'global' };
  return {
    ...b,
    ...draft,
    homeTrustItems: draft.homeTrustItems ?? mergeHomeTrustDraftItems(b),
    homeCategoryTiles:
      draft.homeCategoryTiles !== undefined ? draft.homeCategoryTiles : b.homeCategoryTiles,
    homeHeroSpotlights: draft.homeHeroSpotlights ?? b.homeHeroSpotlights,
    homeReviewsItems: draft.homeReviewsItems ?? b.homeReviewsItems,
  };
}

const HOME_DECOR_SAVE_KEYS: (keyof StoreConfig)[] = [
  'homeTrustItems',
  'homeCategoryTiles',
  'homeHeroSpotlights',
  'homeReviewsEyebrow',
  'homeReviewsTitle',
  'homeReviewsIntro',
  'homeReviewsItems',
  'homeManifestoEyebrow',
  'homeManifestoTitle',
  'homeManifestoBody',
  'homeManifestoCtaLabel',
  'homeManifestoCtaHref',
  'homeManifestoImageUrl',
  'homeManifestoCardTitle',
  'homeManifestoCardSub',
  'homeManifestoCardYear',
  'homeShopEyebrow',
  'homeShopTitle',
  'homeShopViewAllLabel',
  'homeTrendingEyebrow',
  'homeTrendingTitle',
];

function pickHomeDecorPayload(draft: Partial<StoreConfig>): Partial<StoreConfig> {
  const out: Partial<StoreConfig> = {};
  for (const k of HOME_DECOR_SAVE_KEYS) {
    const v = draft[k];
    if (v !== undefined) (out as Record<string, unknown>)[k as string] = v;
  }
  return out;
}

export function HomeDecorEditor({
  config,
  configLoading,
  onSave,
}: {
  config: StoreConfig | null;
  configLoading: boolean;
  onSave: (data: Partial<StoreConfig>) => Promise<void> | void;
}) {
  const { products, loading: productsLoading } = useProducts();
  const { promotions } = usePromotions();
  const { categories } = useCategories();
  const [draft, setDraft] = useState<Partial<StoreConfig>>({});
  const [saving, setSaving] = useState(false);
  const [uploadIdx, setUploadIdx] = useState<number | null>(null);
  const tileFileRefs = useRef<(HTMLInputElement | null)[]>([]);
  const prevConfigLoading = useRef(true);

  const resetDraft = useCallback(() => {
    setDraft(buildHomeDecorDraft(config));
  }, [config]);

  useEffect(() => {
    if (configLoading) {
      prevConfigLoading.current = true;
      return;
    }
    if (prevConfigLoading.current) {
      prevConfigLoading.current = false;
      resetDraft();
    }
  }, [configLoading, resetDraft]);

  const previewConfig = useMemo(() => mergePreviewStoreConfig(config, draft), [config, draft]);

  const updateTrust = (index: number, field: 'title' | 'sub' | 'iconPath', value: string) => {
    setDraft((prev) => {
      const list = [...(prev.homeTrustItems || mergeHomeTrustDraftItems(config))];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, homeTrustItems: list };
    });
  };

  const updateTile = (index: number, field: 'name' | 'slug' | 'image', value: string) => {
    setDraft((prev) => {
      const baseTiles = prev.homeCategoryTiles ?? buildHomeCategoryTilesDraftSeed(config);
      const tiles = baseTiles.map((t, i) => (i === index ? { ...t, [field]: value } : t));
      return { ...prev, homeCategoryTiles: tiles };
    });
  };

  const updateTileFeaturedIds = (index: number, raw: string) => {
    const ids = raw
      .split(/[\s,;]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 16);
    setDraft((prev) => {
      const baseTiles = prev.homeCategoryTiles ?? buildHomeCategoryTilesDraftSeed(config);
      const tiles = baseTiles.map((t, i) => {
        if (i !== index) return t;
        return { ...t, featuredProductIds: ids.length ? ids : undefined };
      });
      return { ...prev, homeCategoryTiles: tiles };
    });
  };

  const updateReview = (index: number, field: keyof HomeReviewItem, value: string) => {
    setDraft((prev) => {
      const base = prev.homeReviewsItems ?? mergeHomeReviewItems(config);
      const list = base.map((item, i) => {
        if (i !== index) return item;
        if (field === 'rating') {
          const n = Number(value);
          return {
            ...item,
            rating: !value.trim() || !Number.isFinite(n) ? undefined : Math.min(5, Math.max(1, Math.round(n))),
          };
        }
        return { ...item, [field]: value };
      });
      return { ...prev, homeReviewsItems: list };
    });
  };

  const updateSpotlight = (index: number, field: keyof HomeHeroSpotlightItem, value: string) => {
    setDraft((prev) => {
      const base = prev.homeHeroSpotlights ?? mergeHomeHeroSpotlights(config);
      const list = base.map((item, i) => (i === index ? { ...item, [field]: value } : item));
      return { ...prev, homeHeroSpotlights: list };
    });
  };

  const onTileImageUpload = async (index: number, file: File) => {
    setUploadIdx(index);
    try {
      const url = await fileToDataUrl(file);
      updateTile(index, 'image', url);
    } finally {
      setUploadIdx(null);
      const el = tileFileRefs.current[index];
      if (el) el.value = '';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(pickHomeDecorPayload(draft));
    } finally {
      setSaving(false);
    }
  };

  if (configLoading) {
    return <p className="py-8 text-sm text-[#909399]">正在加载站点配置…</p>;
  }

  return (
    <div className="space-y-5">
      <div className={`${ADM_CARD} flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between`}>
        <div className="min-w-0">
          <h2 className="text-base font-medium text-[#303133]">首页编辑</h2>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-[#909399]">
            右侧表单修改会立即反映在预览中。首屏左侧轮播对应「营销活动」中的{' '}
            <span className="text-[#606266]">hero</span>；右侧竖条优先展示{' '}
            <span className="text-[#606266]">card</span>（最多 3 条），不足时用下方「Hero 推广位」补齐。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => resetDraft()} className={`${ADM_BTN_DEFAULT} gap-1.5`}>
            <RotateCcw className="h-3.5 w-3.5" />
            恢复已保存
          </button>
          <Link to="/" target="_blank" rel="noreferrer" className={`${ADM_BTN_DEFAULT} gap-1.5 no-underline`}>
            <ExternalLink className="h-3.5 w-3.5" />
            打开前台
          </Link>
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave()}
            className={`${ADM_BTN_PRIMARY} gap-1.5`}
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? '保存中…' : '保存首页'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs text-[#909399]">实时预览</p>
          <div className={`${ADM_PREVIEW_FRAME} shadow-inner`}>
            <HomeSections
              products={products}
              productsLoading={productsLoading}
              promotions={promotions}
              config={previewConfig}
              categories={categories}
              onAddToCart={(_p: Product) => {}}
              previewBanner="首页预览（未单独发布）"
            />
          </div>
        </div>

        <div className="max-h-[min(85vh,920px)] space-y-4 overflow-y-auto pr-1">
          <section className={`${ADM_CARD} space-y-3`}>
            <h3 className={ADM_CARD_TITLE}>信任条（4 项）</h3>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`${ADM_SUBCARD} space-y-2`}>
                <input
                  type="text"
                  placeholder="标题"
                  value={draft.homeTrustItems?.[i]?.title || ''}
                  onChange={(e) => updateTrust(i, 'title', e.target.value)}
                  className={ADM_INPUT}
                />
                <input
                  type="text"
                  placeholder="副标题"
                  value={draft.homeTrustItems?.[i]?.sub || ''}
                  onChange={(e) => updateTrust(i, 'sub', e.target.value)}
                  className={ADM_INPUT}
                />
                <input
                  type="text"
                  placeholder="SVG path d（可留空使用默认图标）"
                  value={draft.homeTrustItems?.[i]?.iconPath || ''}
                  onChange={(e) => updateTrust(i, 'iconPath', e.target.value)}
                  className={`${ADM_INPUT} font-mono text-xs`}
                />
              </div>
            ))}
          </section>

          <section className={`${ADM_CARD} space-y-3`}>
            <h3 className={ADM_CARD_TITLE}>Hero 右侧推广位（3 项）</h3>
            <p className="text-xs leading-relaxed text-[#909399]">
              与 <span className="font-mono text-[#606266]">card</span>{' '}
              活动互补：card 不足 3 条时按顺序填满；全部为 card 时本区不展示。链接请以 / 开头。
            </p>
            {(draft.homeHeroSpotlights || mergeHomeHeroSpotlights(config)).map((row, i) => (
              <div key={i} className={`${ADM_SUBCARD} space-y-2`}>
                <p className="text-xs font-medium text-[#606266]">推广位 #{i + 1}</p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="角标，如 Hot category"
                    value={row.eyebrow}
                    onChange={(e) => updateSpotlight(i, 'eyebrow', e.target.value)}
                    className={ADM_INPUT}
                  />
                  <input
                    type="text"
                    placeholder="链接，如 /category/sofas"
                    value={row.link}
                    onChange={(e) => updateSpotlight(i, 'link', e.target.value)}
                    className={`${ADM_INPUT} font-mono text-xs`}
                  />
                </div>
                <input
                  type="text"
                  placeholder="主标题"
                  value={row.title}
                  onChange={(e) => updateSpotlight(i, 'title', e.target.value)}
                  className={ADM_INPUT}
                />
                <input
                  type="text"
                  placeholder="副标题（可选）"
                  value={row.subtitle || ''}
                  onChange={(e) => updateSpotlight(i, 'subtitle', e.target.value)}
                  className={ADM_INPUT}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="按钮文案，如 Browse sofas"
                    value={row.ctaLabel || ''}
                    onChange={(e) => updateSpotlight(i, 'ctaLabel', e.target.value)}
                    className={ADM_INPUT}
                  />
                  <input
                    type="text"
                    placeholder="背景图 URL"
                    value={row.image || ''}
                    onChange={(e) => updateSpotlight(i, 'image', e.target.value)}
                    className={`${ADM_INPUT} text-xs`}
                  />
                </div>
              </div>
            ))}
          </section>

          <section className={`${ADM_CARD} space-y-3`}>
            <h3 className={ADM_CARD_TITLE}>分类磁贴（8 个）</h3>
            <p className="text-xs leading-relaxed text-[#909399]">
              内置默认图为 <span className="font-mono text-[#606266]">public/home-categories/*.png</span>。配图留空时依次：分类封面 → 关键词 → 内置图。主推顺序：本项 id →
              分类管理主推 → 商品勾选 → 自动补齐。
            </p>
            {(draft.homeCategoryTiles || buildHomeCategoryTilesDraftSeed(config)).map((tile, i) => (
              <div key={i} className={`${ADM_SUBCARD} space-y-2`}>
                <p className="text-xs font-medium text-[#606266]">宫格 #{i + 1}</p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={tile.name}
                    onChange={(e) => updateTile(i, 'name', e.target.value)}
                    className={ADM_INPUT}
                    placeholder="名称"
                  />
                  <input
                    type="text"
                    value={tile.slug}
                    onChange={(e) => updateTile(i, 'slug', e.target.value)}
                    className={ADM_INPUT}
                    placeholder="slug，如 sofas"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[#606266]">
                    该 slug 品类楼层 · 主推商品 id（逗号分隔，最多 16）
                  </label>
                  <input
                    type="text"
                    value={(tile.featuredProductIds ?? []).join(', ')}
                    onChange={(e) => updateTileFeaturedIds(i, e.target.value)}
                    className={`${ADM_INPUT} font-mono text-xs`}
                    placeholder="例如 prod_001, prod_002"
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tile.image}
                    onChange={(e) => updateTile(i, 'image', e.target.value)}
                    className={`min-w-0 flex-1 ${ADM_INPUT} text-xs`}
                    placeholder="图片 URL"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={(el) => {
                      tileFileRefs.current[i] = el;
                    }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void onTileImageUpload(i, f);
                    }}
                  />
                  <button
                    type="button"
                    disabled={uploadIdx === i}
                    onClick={() => tileFileRefs.current[i]?.click()}
                    className={`${ADM_BTN_DEFAULT} inline-flex shrink-0 items-center gap-1 px-3 py-2 text-xs disabled:opacity-50`}
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                    {uploadIdx === i ? '…' : '上传'}
                  </button>
                </div>
              </div>
            ))}
          </section>

          <section className={`${ADM_CARD} space-y-3`}>
            <h3 className={ADM_CARD_TITLE}>选购区与精选区标题</h3>
            {(
              [
                ['homeShopEyebrow', '选购区小标题'],
                ['homeShopTitle', '选购区主标题'],
                ['homeShopViewAllLabel', '「查看全部」文案'],
                ['homeTrendingEyebrow', '精选区小标题'],
                ['homeTrendingTitle', '精选区主标题'],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <label className="mb-1.5 block text-xs text-[#606266]">{label}</label>
                <input
                  type="text"
                  value={(draft[key] as string) || ''}
                  onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                  className={ADM_INPUT}
                />
              </div>
            ))}
          </section>

          <section className={`${ADM_CARD} space-y-3`}>
            <h3 className={ADM_CARD_TITLE}>顾客评价（4 条）</h3>
            <p className="text-xs leading-relaxed text-[#909399]">
              展示买家口吻摘要（建议匿名化）。星级 1–5，留空则不显示星级。
            </p>
            {(
              [
                ['homeReviewsEyebrow', '区块小标题'],
                ['homeReviewsTitle', '区块主标题'],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <label className="mb-1.5 block text-xs text-[#606266]">{label}</label>
                <input
                  type="text"
                  value={(draft[key] as string) || ''}
                  onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                  className={ADM_INPUT}
                />
              </div>
            ))}
            <div>
              <label className="mb-1.5 block text-xs text-[#606266]">导语（可选，一两句）</label>
              <textarea
                rows={2}
                value={draft.homeReviewsIntro || ''}
                onChange={(e) => setDraft((d) => ({ ...d, homeReviewsIntro: e.target.value }))}
                className={ADM_TEXTAREA}
              />
            </div>
            {(draft.homeReviewsItems || mergeHomeReviewItems(config)).map((rev, i) => (
              <div key={i} className={`${ADM_SUBCARD} space-y-2`}>
                <p className="text-xs font-medium text-[#606266]">评价 #{i + 1}</p>
                <textarea
                  rows={3}
                  placeholder="评价正文"
                  value={rev.quote}
                  onChange={(e) => updateReview(i, 'quote', e.target.value)}
                  className={ADM_TEXTAREA}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="署名，如 Anna K."
                    value={rev.author}
                    onChange={(e) => updateReview(i, 'author', e.target.value)}
                    className={ADM_INPUT}
                  />
                  <input
                    type="text"
                    placeholder="副标题，如 Verified · Berlin"
                    value={rev.subtitle || ''}
                    onChange={(e) => updateReview(i, 'subtitle', e.target.value)}
                    className={ADM_INPUT}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[#606266]">星级 1–5（可空）</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    step={1}
                    value={rev.rating ?? ''}
                    onChange={(e) => updateReview(i, 'rating', e.target.value)}
                    className={`max-w-[8rem] ${ADM_INPUT}`}
                  />
                </div>
              </div>
            ))}
          </section>

          <section className={`${ADM_CARD} space-y-3`}>
            <h3 className={ADM_CARD_TITLE}>宣言区（深蓝横幅）</h3>
            {(
              [
                ['homeManifestoEyebrow', '小标题'],
                ['homeManifestoCtaHref', '按钮链接（站内路径）'],
                ['homeManifestoCtaLabel', '按钮文字'],
                ['homeManifestoImageUrl', '右侧大图 URL'],
                ['homeManifestoCardTitle', '卡片主文案'],
                ['homeManifestoCardSub', '卡片副文案'],
                ['homeManifestoCardYear', '卡片角落年份/说明'],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <label className="mb-1.5 block text-xs text-[#606266]">{label}</label>
                <input
                  type="text"
                  value={(draft[key] as string) || ''}
                  onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                  className={ADM_INPUT}
                />
              </div>
            ))}
            <div>
              <label className="mb-1.5 block text-xs text-[#606266]">主标题（可用换行）</label>
              <textarea
                rows={3}
                value={draft.homeManifestoTitle || ''}
                onChange={(e) => setDraft((d) => ({ ...d, homeManifestoTitle: e.target.value }))}
                className={ADM_TEXTAREA}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-[#606266]">段落正文</label>
              <textarea
                rows={3}
                value={draft.homeManifestoBody || ''}
                onChange={(e) => setDraft((d) => ({ ...d, homeManifestoBody: e.target.value }))}
                className={ADM_TEXTAREA}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
