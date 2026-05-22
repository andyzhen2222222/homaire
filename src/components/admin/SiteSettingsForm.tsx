import React, { useMemo, useState } from 'react';
import type { HomeTrustItem, HomeReviewItem, StoreConfig } from '../../types';
import { DEFAULT_CATEGORY_HEROES } from '../../data/categoryHeroes';
import { DEFAULT_HOME_TRUST } from '../../lib/siteContent';
import { mergeHomeReviewItems } from '../../lib/homePageDefaults';
import { HOME_MANIFESTO_DEFAULTS, HOMAIRE_SLOGAN } from '../../content/homaireBrandStory';
import {
  GLOBAL_SERVICE_STRIP_TITLE_DEFAULT,
  GLOBAL_SERVICE_DELIVERY_TIME_DEFAULT,
  GLOBAL_SERVICE_DELIVERY_AREA_DEFAULT,
  GLOBAL_SERVICE_INSTALLATION_DEFAULT,
  GLOBAL_SERVICE_WARRANTY_DEFAULT,
} from '../../lib/globalServiceStripDefaults';
import {
  DEFAULT_PRODUCT_DETAIL_LOW_STOCK_HINT,
  DEFAULT_PRODUCT_DETAIL_OUT_OF_STOCK_HINT,
  DEFAULT_PRODUCT_DETAIL_SHIPPING_FOOTNOTE_TEMPLATE,
  DEFAULT_PRODUCT_DETAIL_SHIPPING_FREE_LABEL,
  DEFAULT_PRODUCT_DETAIL_SHIPPING_LABEL,
  DEFAULT_PRODUCT_DETAIL_STOCK_LABEL,
  DEFAULT_SHIPPING_FLAT_FEE,
  DEFAULT_SHIPPING_FREE_THRESHOLD,
} from '../../lib/storeShipping';
import {
  ADM_BTN_PRIMARY,
  ADM_CARD,
  ADM_CARD_TITLE,
  ADM_FORM_WRAP,
  ADM_HINT,
  ADM_INPUT,
  ADM_LABEL,
  ADM_LABEL_COMPACT,
  ADM_SECTION_DESC,
  ADM_SUBCARD,
  ADM_TEXTAREA,
} from '../../lib/adminVueUi';

const emptyForm: Partial<StoreConfig> = {
  storeName: 'Homaire',
  siteTitle: 'Homaire',
  siteTagline: HOMAIRE_SLOGAN.replace(/\.$/, ''),
  currency: 'EUR',
  contactEmail: '',
  lowStockThreshold: 10,
  shippingFreeThreshold: DEFAULT_SHIPPING_FREE_THRESHOLD,
  shippingFlatFee: DEFAULT_SHIPPING_FLAT_FEE,
  shippingPolicy: '',
  returnPolicy: '',
  maintenanceMode: false,
  topBarLine1: 'Free Shipping & Returns',
  topBarLine2: '365-Day Worry-Free Warranty',
  topBarLine3: '5-Year Quality Guarantee',
  topBarHelpText: 'Help & Support',
  topBarLocaleText: 'English (EN)',
  footerIntro:
    'Homaire creates practical and comfortable home solutions for modern living — furniture, outdoor, kitchen, bathroom, pets, lighting and more — so every space feels more complete.',
  footerCopyright: '© 2026 HOMAIRE. ALL RIGHTS RESERVED.',
  footerSloganLine: HOMAIRE_SLOGAN,
  newsletterTitle: 'Newsletter',
  newsletterSubcopy: 'Receive latest design trends and exclusive product launches.',
  newsletterCtaLabel: 'Join The Club',
  newsletterPlaceholder: 'Email Address',
  globalServiceStripTitle: GLOBAL_SERVICE_STRIP_TITLE_DEFAULT,
  globalServiceDeliveryTime: GLOBAL_SERVICE_DELIVERY_TIME_DEFAULT,
  globalServiceDeliveryArea: GLOBAL_SERVICE_DELIVERY_AREA_DEFAULT,
  globalServiceInstallation: GLOBAL_SERVICE_INSTALLATION_DEFAULT,
  globalServiceWarranty: GLOBAL_SERVICE_WARRANTY_DEFAULT,
  productDetailStockLabel: DEFAULT_PRODUCT_DETAIL_STOCK_LABEL,
  productDetailShippingLabel: DEFAULT_PRODUCT_DETAIL_SHIPPING_LABEL,
  productDetailShippingFreeLabel: DEFAULT_PRODUCT_DETAIL_SHIPPING_FREE_LABEL,
  productDetailLowStockHint: DEFAULT_PRODUCT_DETAIL_LOW_STOCK_HINT,
  productDetailOutOfStockHint: DEFAULT_PRODUCT_DETAIL_OUT_OF_STOCK_HINT,
  productDetailShippingFootnote: DEFAULT_PRODUCT_DETAIL_SHIPPING_FOOTNOTE_TEMPLATE,
  homeReviewsEyebrow: 'Customer voices',
  homeReviewsTitle: 'What customers say',
  homeReviewsIntro:
    'Short notes from shoppers about delivery, quality, and how pieces fit real rooms — more useful here than a static brand board.',
  homeManifestoEyebrow: HOME_MANIFESTO_DEFAULTS.homeManifestoEyebrow,
  homeManifestoTitle: HOME_MANIFESTO_DEFAULTS.homeManifestoTitle,
  homeManifestoBody: HOME_MANIFESTO_DEFAULTS.homeManifestoBody,
  homeManifestoCtaLabel: HOME_MANIFESTO_DEFAULTS.homeManifestoCtaLabel,
  homeManifestoCtaHref: HOME_MANIFESTO_DEFAULTS.homeManifestoCtaHref,
  homeManifestoImageUrl: HOME_MANIFESTO_DEFAULTS.homeManifestoImageUrl,
  homeManifestoCardTitle: HOME_MANIFESTO_DEFAULTS.homeManifestoCardTitle,
  homeManifestoCardSub: HOME_MANIFESTO_DEFAULTS.homeManifestoCardSub,
  homeManifestoCardYear: HOME_MANIFESTO_DEFAULTS.homeManifestoCardYear,
  homeShopEyebrow: 'Curation',
  homeShopTitle: 'Shop by Function',
  homeShopViewAllLabel: 'View All',
  homeTrendingEyebrow: 'The Selection',
  homeTrendingTitle: 'Most Desired Objects',
};

function mergeReviewsFromConfig(config?: StoreConfig | null): HomeReviewItem[] {
  return mergeHomeReviewItems(config);
}

function mergeCategoryHeroesFromConfig(config?: StoreConfig | null): StoreConfig['categoryHeroes'] {
  const out: NonNullable<StoreConfig['categoryHeroes']> = {};
  for (const k of Object.keys(DEFAULT_CATEGORY_HEROES)) {
    const d = DEFAULT_CATEGORY_HEROES[k];
    const o = config?.categoryHeroes?.[k];
    out[k] = {
      title: (o?.title && o.title.trim()) || d.title,
      subtitle: (o?.subtitle && o.subtitle.trim()) || d.subtitle,
      image: (o?.image && o.image.trim()) || d.image,
    };
  }
  return out;
}

function mergeTrustFromConfig(config?: StoreConfig | null): HomeTrustItem[] {
  return DEFAULT_HOME_TRUST.map((d, i) => {
    const o = config?.homeTrustItems?.[i];
    return {
      title: (o?.title && o.title.trim()) || d.title,
      sub: (o?.sub && o.sub.trim()) || d.sub,
      iconPath: (o?.iconPath && o.iconPath.trim()) || d.iconPath,
    };
  });
}

export function SiteSettingsForm({
  config,
  onSave,
}: {
  config?: StoreConfig | null;
  onSave: (data: Partial<StoreConfig>) => void;
}) {
  const [formData, setFormData] = useState<Partial<StoreConfig>>(() => ({
    ...emptyForm,
    ...(config || {}),
    categoryHeroes: mergeCategoryHeroesFromConfig(config),
    homeTrustItems: mergeTrustFromConfig(config),
    homeReviewsItems: mergeReviewsFromConfig(config),
  }));

  const categorySlugs = useMemo(() => Object.keys(DEFAULT_CATEGORY_HEROES), []);

  const updateHero = (slug: string, field: 'title' | 'subtitle' | 'image', value: string) => {
    setFormData((prev) => {
      const heroes = { ...(prev.categoryHeroes || {}) };
      const cur = { ...(heroes[slug] || {}) };
      heroes[slug] = { ...cur, [field]: value };
      return { ...prev, categoryHeroes: heroes };
    });
  };

  const updateTrust = (index: number, field: keyof HomeTrustItem, value: string) => {
    setFormData((prev) => {
      const list = [...(prev.homeTrustItems || mergeTrustFromConfig(config))];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, homeTrustItems: list };
    });
  };

  const updateReview = (index: number, field: keyof HomeReviewItem, value: string) => {
    setFormData((prev) => {
      const list = [...(prev.homeReviewsItems || mergeReviewsFromConfig(config))];
      if (field === 'rating') {
        const n = Number(value);
        list[index] = {
          ...list[index],
          rating: !value.trim() || !Number.isFinite(n) ? undefined : Math.min(5, Math.max(1, Math.round(n))),
        };
      } else {
        list[index] = { ...list[index], [field]: value };
      }
      return { ...prev, homeReviewsItems: list };
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(formData);
      }}
      className={ADM_FORM_WRAP}
    >
      <section className={`${ADM_CARD} space-y-4`}>
        <h3 className={ADM_CARD_TITLE}>店铺与运营</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={ADM_LABEL}>店铺名称</label>
            <input
              type="text"
              value={formData.storeName || ''}
              onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
              className={ADM_INPUT}
            />
          </div>
          <div>
            <label className={ADM_LABEL}>浏览器标签标题</label>
            <input
              type="text"
              value={formData.siteTitle || ''}
              onChange={(e) => setFormData({ ...formData, siteTitle: e.target.value })}
              className={ADM_INPUT}
            />
          </div>
          <div>
            <label className={ADM_LABEL}>货币代码</label>
            <input
              type="text"
              value={formData.currency || ''}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className={ADM_INPUT}
            />
          </div>
          <div>
            <label className={ADM_LABEL}>联系邮箱</label>
            <input
              type="email"
              value={formData.contactEmail || ''}
              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              className={ADM_INPUT}
            />
          </div>
          <div>
            <label className={ADM_LABEL}>低库存阈值</label>
            <input
              type="number"
              value={formData.lowStockThreshold ?? 10}
              onChange={(e) => setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value, 10) || 0 })}
              className={ADM_INPUT}
            />
          </div>
          <div>
            <label className={ADM_LABEL}>免运费门槛（与店铺货币一致）</label>
            <input
              type="number"
              min={1}
              step={1}
              value={formData.shippingFreeThreshold ?? DEFAULT_SHIPPING_FREE_THRESHOLD}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  shippingFreeThreshold: parseFloat(e.target.value) || DEFAULT_SHIPPING_FREE_THRESHOLD,
                })
              }
              className={ADM_INPUT}
            />
            <p className={ADM_HINT}>购物车 / 商品页：小计严格大于该金额则不加基础运费。</p>
          </div>
          <div>
            <label className={ADM_LABEL}>基础运费（未达免运门槛时）</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={formData.shippingFlatFee ?? DEFAULT_SHIPPING_FLAT_FEE}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  shippingFlatFee: parseFloat(e.target.value) || 0,
                })
              }
              className={ADM_INPUT}
            />
          </div>
          <div className="flex items-center gap-2 md:col-span-2">
            <input
              id="maint"
              type="checkbox"
              checked={!!formData.maintenanceMode}
              onChange={(e) => setFormData({ ...formData, maintenanceMode: e.target.checked })}
              className="h-4 w-4 rounded border-[#dcdfe6] text-[#409eff] focus:ring-[#c6e2ff]"
            />
            <label htmlFor="maint" className="cursor-pointer text-sm text-[#606266]">
              维护模式（前台可显示维护提示）
            </label>
          </div>
        </div>
        <div>
          <label className={ADM_LABEL}>配送政策</label>
          <textarea
            rows={4}
            value={formData.shippingPolicy || ''}
            onChange={(e) => setFormData({ ...formData, shippingPolicy: e.target.value })}
            className={ADM_TEXTAREA}
          />
        </div>
        <div>
          <label className={ADM_LABEL}>退换货政策</label>
          <textarea
            rows={4}
            value={formData.returnPolicy || ''}
            onChange={(e) => setFormData({ ...formData, returnPolicy: e.target.value })}
            className={ADM_TEXTAREA}
          />
        </div>
      </section>

      <section className={`${ADM_CARD} space-y-4`}>
        <h3 className={ADM_CARD_TITLE}>商品详情 · 库存与运费</h3>
        <p className={ADM_SECTION_DESC}>
          对应 <code className="rounded border border-[#ebeef5] bg-[#fafafa] px-1.5 py-0.5 font-mono text-[11px] text-[#606266]">/product/:id</code>{' '}
          价格区域卡片文案。低库存仍使用上方「低库存阈值」；运费数字使用「免运费门槛」与「基础运费」。脚注可使用占位符{' '}
          <code className="rounded border border-[#ebeef5] bg-[#fafafa] px-1.5 py-0.5 font-mono text-[11px]">{'{threshold}'}</code>、
          <code className="rounded border border-[#ebeef5] bg-[#fafafa] px-1.5 py-0.5 font-mono text-[11px]">{'{flat}'}</code>（按店铺货币格式化替换）。
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={ADM_LABEL}>库存标题</label>
            <input
              type="text"
              value={formData.productDetailStockLabel || ''}
              onChange={(e) => setFormData({ ...formData, productDetailStockLabel: e.target.value })}
              className={ADM_INPUT}
            />
          </div>
          <div>
            <label className={ADM_LABEL}>运费标题</label>
            <input
              type="text"
              value={formData.productDetailShippingLabel || ''}
              onChange={(e) => setFormData({ ...formData, productDetailShippingLabel: e.target.value })}
              className={ADM_INPUT}
            />
          </div>
          <div>
            <label className={ADM_LABEL}>已达免运时的说明行</label>
            <input
              type="text"
              value={formData.productDetailShippingFreeLabel || ''}
              onChange={(e) => setFormData({ ...formData, productDetailShippingFreeLabel: e.target.value })}
              className={ADM_INPUT}
            />
          </div>
          <div>
            <label className={ADM_LABEL}>低库存提示</label>
            <input
              type="text"
              value={formData.productDetailLowStockHint || ''}
              onChange={(e) => setFormData({ ...formData, productDetailLowStockHint: e.target.value })}
              className={ADM_INPUT}
            />
          </div>
          <div>
            <label className={ADM_LABEL}>无货提示</label>
            <input
              type="text"
              value={formData.productDetailOutOfStockHint || ''}
              onChange={(e) => setFormData({ ...formData, productDetailOutOfStockHint: e.target.value })}
              className={ADM_INPUT}
            />
          </div>
        </div>
        <div>
          <label className={ADM_LABEL}>运费脚注（模板）</label>
          <textarea
            rows={3}
            value={formData.productDetailShippingFootnote || ''}
            onChange={(e) => setFormData({ ...formData, productDetailShippingFootnote: e.target.value })}
            placeholder={DEFAULT_PRODUCT_DETAIL_SHIPPING_FOOTNOTE_TEMPLATE}
            className={ADM_TEXTAREA}
          />
        </div>
      </section>

      <section className={`${ADM_CARD} space-y-4`}>
        <h3 className={ADM_CARD_TITLE}>顶部公告栏</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {(['topBarLine1', 'topBarLine2', 'topBarLine3'] as const).map((key) => (
            <div key={key}>
              <label className={ADM_LABEL}>{key}</label>
              <input
                type="text"
                value={(formData[key] as string) || ''}
                onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                className={ADM_INPUT}
              />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={ADM_LABEL}>帮助入口文案</label>
            <input
              type="text"
              value={formData.topBarHelpText || ''}
              onChange={(e) => setFormData({ ...formData, topBarHelpText: e.target.value })}
              className={ADM_INPUT}
            />
          </div>
          <div>
            <label className={ADM_LABEL}>语言 / 地区角标</label>
            <input
              type="text"
              value={formData.topBarLocaleText || ''}
              onChange={(e) => setFormData({ ...formData, topBarLocaleText: e.target.value })}
              className={ADM_INPUT}
            />
          </div>
        </div>
      </section>

      <section className={`${ADM_CARD} space-y-4`}>
        <h3 className={ADM_CARD_TITLE}>全站服务条（页脚上方）</h3>
        <p className={ADM_SECTION_DESC}>
          全页深色页脚上方展示：配送时效、覆盖范围、安装与保修。留空并保存后可配合重置使用内置默认。
        </p>
        <div>
          <label className={ADM_LABEL}>区块标题</label>
          <input
            type="text"
            value={formData.globalServiceStripTitle || ''}
            onChange={(e) => setFormData({ ...formData, globalServiceStripTitle: e.target.value })}
            className={ADM_INPUT}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={ADM_LABEL}>配送时效</label>
            <textarea
              rows={4}
              value={formData.globalServiceDeliveryTime || ''}
              onChange={(e) => setFormData({ ...formData, globalServiceDeliveryTime: e.target.value })}
              className={ADM_TEXTAREA}
            />
          </div>
          <div>
            <label className={ADM_LABEL}>配送范围</label>
            <textarea
              rows={4}
              value={formData.globalServiceDeliveryArea || ''}
              onChange={(e) => setFormData({ ...formData, globalServiceDeliveryArea: e.target.value })}
              className={ADM_TEXTAREA}
            />
          </div>
          <div>
            <label className={ADM_LABEL}>安装说明</label>
            <textarea
              rows={4}
              value={formData.globalServiceInstallation || ''}
              onChange={(e) => setFormData({ ...formData, globalServiceInstallation: e.target.value })}
              className={ADM_TEXTAREA}
            />
          </div>
          <div>
            <label className={ADM_LABEL}>保修说明</label>
            <textarea
              rows={4}
              value={formData.globalServiceWarranty || ''}
              onChange={(e) => setFormData({ ...formData, globalServiceWarranty: e.target.value })}
              className={ADM_TEXTAREA}
            />
          </div>
        </div>
      </section>

      <section className={`${ADM_CARD} space-y-4`}>
        <h3 className={ADM_CARD_TITLE}>页脚与订阅</h3>
        <div>
          <label className={ADM_LABEL}>页脚介绍段落</label>
          <textarea
            rows={4}
            value={formData.footerIntro || ''}
            onChange={(e) => setFormData({ ...formData, footerIntro: e.target.value })}
            className={ADM_TEXTAREA}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={ADM_LABEL}>版权行</label>
            <input
              type="text"
              value={formData.footerCopyright || ''}
              onChange={(e) => setFormData({ ...formData, footerCopyright: e.target.value })}
              className={ADM_INPUT}
            />
          </div>
          <div>
            <label className={ADM_LABEL}>标语行</label>
            <input
              type="text"
              value={formData.footerSloganLine || ''}
              onChange={(e) => setFormData({ ...formData, footerSloganLine: e.target.value })}
              className={ADM_INPUT}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={ADM_LABEL}>订阅区标题</label>
            <input
              type="text"
              value={formData.newsletterTitle || ''}
              onChange={(e) => setFormData({ ...formData, newsletterTitle: e.target.value })}
              className={ADM_INPUT}
            />
          </div>
          <div>
            <label className={ADM_LABEL}>订阅按钮文案</label>
            <input
              type="text"
              value={formData.newsletterCtaLabel || ''}
              onChange={(e) => setFormData({ ...formData, newsletterCtaLabel: e.target.value })}
              className={ADM_INPUT}
            />
          </div>
        </div>
        <div>
          <label className={ADM_LABEL}>订阅区说明</label>
          <textarea
            rows={2}
            value={formData.newsletterSubcopy || ''}
            onChange={(e) => setFormData({ ...formData, newsletterSubcopy: e.target.value })}
            className={ADM_TEXTAREA}
          />
        </div>
        <div>
          <label className={ADM_LABEL}>邮箱占位符</label>
          <input
            type="text"
            value={formData.newsletterPlaceholder || ''}
            onChange={(e) => setFormData({ ...formData, newsletterPlaceholder: e.target.value })}
            className={ADM_INPUT}
          />
        </div>
      </section>

      <section className={`${ADM_CARD} space-y-4`}>
        <h3 className={ADM_CARD_TITLE}>首页信任条（4 项）</h3>
        <p className={ADM_HINT}>iconPath：SVG 的 d 路径；留空使用默认图标。</p>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`${ADM_SUBCARD} grid grid-cols-1 gap-3 md:grid-cols-3`}>
            <div>
              <label className={ADM_LABEL_COMPACT}>标题 {i + 1}</label>
              <input
                type="text"
                value={formData.homeTrustItems?.[i]?.title || ''}
                onChange={(e) => updateTrust(i, 'title', e.target.value)}
                className={ADM_INPUT}
              />
            </div>
            <div>
              <label className={ADM_LABEL_COMPACT}>副标题 {i + 1}</label>
              <input
                type="text"
                value={formData.homeTrustItems?.[i]?.sub || ''}
                onChange={(e) => updateTrust(i, 'sub', e.target.value)}
                className={ADM_INPUT}
              />
            </div>
            <div>
              <label className={ADM_LABEL_COMPACT}>iconPath {i + 1}</label>
              <input
                type="text"
                value={formData.homeTrustItems?.[i]?.iconPath || ''}
                onChange={(e) => updateTrust(i, 'iconPath', e.target.value)}
                className={`${ADM_INPUT} font-mono text-xs`}
              />
            </div>
          </div>
        ))}
      </section>

      <section className={`${ADM_CARD} space-y-4`}>
        <h3 className={ADM_CARD_TITLE}>首页评价与宣言</h3>
        <div className="grid grid-cols-1 gap-4">
          {(
            [
              ['homeReviewsEyebrow', '评价区 · 小标题'],
              ['homeReviewsTitle', '评价区 · 主标题'],
              ['homeManifestoEyebrow', '宣言区 · 小标题'],
              ['homeManifestoCtaHref', '宣言区 · 按钮链接'],
              ['homeManifestoCtaLabel', '宣言区 · 按钮文案'],
              ['homeManifestoImageUrl', '宣言区 · 右侧大图 URL'],
              ['homeManifestoCardTitle', '宣言卡片 · 主文案'],
              ['homeManifestoCardSub', '宣言卡片 · 副文案'],
              ['homeManifestoCardYear', '宣言卡片 · 年份/角标'],
              ['homeShopEyebrow', '选购区 · 小标题'],
              ['homeShopTitle', '选购区 · 主标题'],
              ['homeShopViewAllLabel', '选购区 · 查看全部'],
              ['homeTrendingEyebrow', '精选区 · 小标题'],
              ['homeTrendingTitle', '精选区 · 主标题'],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <label className={ADM_LABEL}>{label}</label>
              <input
                type="text"
                value={(formData[key] as string) || ''}
                onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                className={ADM_INPUT}
              />
            </div>
          ))}
        </div>
        <div>
          <label className={ADM_LABEL}>评价区导语（可选）</label>
          <textarea
            rows={3}
            value={formData.homeReviewsIntro || ''}
            onChange={(e) => setFormData({ ...formData, homeReviewsIntro: e.target.value })}
            className={ADM_TEXTAREA}
          />
        </div>
        <p className={ADM_HINT}>评价卡片共 4 条；更细编辑可在「首页」标签完成。</p>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`${ADM_SUBCARD} space-y-3`}>
            <div>
              <label className={ADM_LABEL_COMPACT}>评价正文 {i + 1}</label>
              <textarea
                rows={2}
                value={formData.homeReviewsItems?.[i]?.quote || ''}
                onChange={(e) => updateReview(i, 'quote', e.target.value)}
                className={ADM_TEXTAREA}
              />
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <div>
                <label className={ADM_LABEL_COMPACT}>署名 {i + 1}</label>
                <input
                  type="text"
                  value={formData.homeReviewsItems?.[i]?.author || ''}
                  onChange={(e) => updateReview(i, 'author', e.target.value)}
                  className={ADM_INPUT}
                />
              </div>
              <div>
                <label className={ADM_LABEL_COMPACT}>副标题 {i + 1}</label>
                <input
                  type="text"
                  value={formData.homeReviewsItems?.[i]?.subtitle || ''}
                  onChange={(e) => updateReview(i, 'subtitle', e.target.value)}
                  className={ADM_INPUT}
                />
              </div>
              <div>
                <label className={ADM_LABEL_COMPACT}>星级 1–5（可选）</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={formData.homeReviewsItems?.[i]?.rating ?? ''}
                  onChange={(e) => updateReview(i, 'rating', e.target.value)}
                  className={ADM_INPUT}
                />
              </div>
            </div>
          </div>
        ))}
        <div>
          <label className={ADM_LABEL}>宣言主标题（可换行）</label>
          <textarea
            rows={3}
            value={formData.homeManifestoTitle || ''}
            onChange={(e) => setFormData({ ...formData, homeManifestoTitle: e.target.value })}
            className={ADM_TEXTAREA}
          />
        </div>
        <div>
          <label className={ADM_LABEL}>宣言正文</label>
          <textarea
            rows={4}
            value={formData.homeManifestoBody || ''}
            onChange={(e) => setFormData({ ...formData, homeManifestoBody: e.target.value })}
            className={ADM_TEXTAREA}
          />
        </div>
      </section>

      <section className={`${ADM_CARD} space-y-4`}>
        <h3 className={ADM_CARD_TITLE}>分类页横幅</h3>
        <div className="max-h-[480px] space-y-4 overflow-y-auto pr-1">
          {categorySlugs.map((slug) => (
            <div key={slug} className={`${ADM_SUBCARD} space-y-2`}>
              <p className="text-xs font-medium text-[#303133]">{slug}</p>
              <input
                type="text"
                placeholder="标题"
                value={formData.categoryHeroes?.[slug]?.title || ''}
                onChange={(e) => updateHero(slug, 'title', e.target.value)}
                className={ADM_INPUT}
              />
              <input
                type="text"
                placeholder="副标题"
                value={formData.categoryHeroes?.[slug]?.subtitle || ''}
                onChange={(e) => updateHero(slug, 'subtitle', e.target.value)}
                className={ADM_INPUT}
              />
              <input
                type="text"
                placeholder="图片 URL"
                value={formData.categoryHeroes?.[slug]?.image || ''}
                onChange={(e) => updateHero(slug, 'image', e.target.value)}
                className={`${ADM_INPUT} font-mono text-xs`}
              />
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-end border-t border-[#ebeef5] pt-4">
        <button type="submit" className={ADM_BTN_PRIMARY}>
          保存站点配置
        </button>
      </div>
    </form>
  );
}
