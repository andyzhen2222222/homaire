import React, { useMemo, useState } from 'react';
import type { HomeTrustItem, StoreConfig } from '../../types';
import { DEFAULT_CATEGORY_HEROES } from '../../data/categoryHeroes';
import { DEFAULT_HOME_TRUST } from '../../lib/siteContent';

const emptyForm: Partial<StoreConfig> = {
  storeName: 'Homaire',
  siteTitle: 'Homaire',
  siteTagline: 'For Every Corner of Home',
  currency: 'EUR',
  contactEmail: '',
  lowStockThreshold: 10,
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
  footerSloganLine: 'For Every Corner of Home.',
  newsletterTitle: 'Newsletter',
  newsletterSubcopy: 'Receive latest design trends and exclusive product launches.',
  newsletterCtaLabel: 'Join The Club',
  newsletterPlaceholder: 'Email Address',
  homeAboutEyebrow: 'About Homaire',
  homeAboutTitle: 'Practical comfort for modern homes',
  homeAboutBody:
    'Homaire creates practical and comfortable home solutions for modern living. With a wide range of products across furniture, outdoor, kitchen, bathroom, pets, lighting and more, we help you make every space feel more complete.',
  homeAboutBrandBoardUrl: '/homaire-brand-board.png',
  homeManifestoEyebrow: 'Our promise',
  homeManifestoTitle: 'For every corner\nof home.',
  homeManifestoBody:
    'From the living room to the balcony, kitchen to bathroom, we bring together pieces that feel considered, livable, and easy to love — so you can shape a home that works for real routines, not just photos.',
  homeManifestoCtaLabel: 'Shop the collection',
  homeManifestoCtaHref: '/',
  homeManifestoImageUrl:
    'https://images.unsplash.com/photo-1540574163026-643ea20ade25?auto=format&fit=crop&q=80&w=1000',
  homeManifestoCardTitle: 'Homaire',
  homeManifestoCardSub: 'Home living',
  homeManifestoCardYear: 'Since 2020',
  homeShopEyebrow: 'Curation',
  homeShopTitle: 'Shop by Function',
  homeShopViewAllLabel: 'View All',
  homeTrendingEyebrow: 'The Selection',
  homeTrendingTitle: 'Most Desired Objects',
};

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

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(formData);
      }}
      className="space-y-16 max-w-4xl"
    >
      <section className="space-y-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-brand-navy/40 border-b border-brand-gray pb-2">
          Store & operations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-[10px] font-bold text-brand-navy/30 uppercase tracking-[0.3em] block mb-2">Store name</label>
            <input
              type="text"
              value={formData.storeName || ''}
              onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
              className="w-full bg-brand-gray border border-brand-gray rounded-xl p-4 text-sm text-brand-navy outline-none focus:ring-2 focus:ring-brand-beige"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-brand-navy/30 uppercase tracking-[0.3em] block mb-2">Browser tab title</label>
            <input
              type="text"
              value={formData.siteTitle || ''}
              onChange={(e) => setFormData({ ...formData, siteTitle: e.target.value })}
              className="w-full bg-brand-gray border border-brand-gray rounded-xl p-4 text-sm text-brand-navy outline-none focus:ring-2 focus:ring-brand-beige"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-brand-navy/30 uppercase tracking-[0.3em] block mb-2">Currency</label>
            <input
              type="text"
              value={formData.currency || ''}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="w-full bg-brand-gray border border-brand-gray rounded-xl p-4 text-sm text-brand-navy outline-none focus:ring-2 focus:ring-brand-beige"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-brand-navy/30 uppercase tracking-[0.3em] block mb-2">Contact email</label>
            <input
              type="email"
              value={formData.contactEmail || ''}
              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              className="w-full bg-brand-gray border border-brand-gray rounded-xl p-4 text-sm text-brand-navy outline-none focus:ring-2 focus:ring-brand-beige"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-brand-navy/30 uppercase tracking-[0.3em] block mb-2">Low-stock threshold</label>
            <input
              type="number"
              value={formData.lowStockThreshold ?? 10}
              onChange={(e) => setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value, 10) || 0 })}
              className="w-full bg-brand-gray border border-brand-gray rounded-xl p-4 text-sm text-brand-navy outline-none focus:ring-2 focus:ring-brand-beige"
            />
          </div>
          <div className="flex items-center gap-3 pt-6">
            <input
              id="maint"
              type="checkbox"
              checked={!!formData.maintenanceMode}
              onChange={(e) => setFormData({ ...formData, maintenanceMode: e.target.checked })}
              className="rounded border-brand-gray"
            />
            <label htmlFor="maint" className="text-sm font-medium text-brand-navy cursor-pointer">
              Maintenance mode
            </label>
          </div>
        </div>
        <div>
          <label className="text-[10px] font-bold text-brand-navy/30 uppercase tracking-[0.3em] block mb-2">Shipping policy</label>
          <textarea
            rows={4}
            value={formData.shippingPolicy || ''}
            onChange={(e) => setFormData({ ...formData, shippingPolicy: e.target.value })}
            className="w-full bg-brand-gray border border-brand-gray rounded-xl p-4 text-sm text-brand-navy outline-none focus:ring-2 focus:ring-brand-beige"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-brand-navy/30 uppercase tracking-[0.3em] block mb-2">Return policy</label>
          <textarea
            rows={4}
            value={formData.returnPolicy || ''}
            onChange={(e) => setFormData({ ...formData, returnPolicy: e.target.value })}
            className="w-full bg-brand-gray border border-brand-gray rounded-xl p-4 text-sm text-brand-navy outline-none focus:ring-2 focus:ring-brand-beige"
          />
        </div>
      </section>

      <section className="space-y-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-brand-navy/40 border-b border-brand-gray pb-2">Top announcement bar</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['topBarLine1', 'topBarLine2', 'topBarLine3'] as const).map((key) => (
            <div key={key}>
              <label className="text-[10px] font-bold text-brand-navy/30 uppercase tracking-[0.2em] block mb-2">{key}</label>
              <input
                type="text"
                value={(formData[key] as string) || ''}
                onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                className="w-full bg-brand-gray border border-brand-gray rounded-xl p-3 text-sm text-brand-navy outline-none focus:ring-2 focus:ring-brand-beige"
              />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold text-brand-navy/30 uppercase tracking-[0.2em] block mb-2">Help text</label>
            <input
              type="text"
              value={formData.topBarHelpText || ''}
              onChange={(e) => setFormData({ ...formData, topBarHelpText: e.target.value })}
              className="w-full bg-brand-gray border border-brand-gray rounded-xl p-3 text-sm text-brand-navy outline-none focus:ring-2 focus:ring-brand-beige"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-brand-navy/30 uppercase tracking-[0.2em] block mb-2">Locale badge</label>
            <input
              type="text"
              value={formData.topBarLocaleText || ''}
              onChange={(e) => setFormData({ ...formData, topBarLocaleText: e.target.value })}
              className="w-full bg-brand-gray border border-brand-gray rounded-xl p-3 text-sm text-brand-navy outline-none focus:ring-2 focus:ring-brand-beige"
            />
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-brand-navy/40 border-b border-brand-gray pb-2">Footer</h3>
        <div>
          <label className="text-[10px] font-bold text-brand-navy/30 uppercase tracking-[0.3em] block mb-2">Intro paragraph</label>
          <textarea
            rows={4}
            value={formData.footerIntro || ''}
            onChange={(e) => setFormData({ ...formData, footerIntro: e.target.value })}
            className="w-full bg-brand-gray border border-brand-gray rounded-xl p-4 text-sm text-brand-navy outline-none focus:ring-2 focus:ring-brand-beige"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold text-brand-navy/30 uppercase tracking-[0.2em] block mb-2">Copyright line</label>
            <input
              type="text"
              value={formData.footerCopyright || ''}
              onChange={(e) => setFormData({ ...formData, footerCopyright: e.target.value })}
              className="w-full bg-brand-gray border border-brand-gray rounded-xl p-3 text-sm text-brand-navy outline-none focus:ring-2 focus:ring-brand-beige"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-brand-navy/30 uppercase tracking-[0.2em] block mb-2">Slogan line</label>
            <input
              type="text"
              value={formData.footerSloganLine || ''}
              onChange={(e) => setFormData({ ...formData, footerSloganLine: e.target.value })}
              className="w-full bg-brand-gray border border-brand-gray rounded-xl p-3 text-sm text-brand-navy outline-none focus:ring-2 focus:ring-brand-beige"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold text-brand-navy/30 uppercase tracking-[0.2em] block mb-2">Newsletter title</label>
            <input
              type="text"
              value={formData.newsletterTitle || ''}
              onChange={(e) => setFormData({ ...formData, newsletterTitle: e.target.value })}
              className="w-full bg-brand-gray border border-brand-gray rounded-xl p-3 text-sm text-brand-navy outline-none focus:ring-2 focus:ring-brand-beige"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-brand-navy/30 uppercase tracking-[0.2em] block mb-2">Newsletter CTA</label>
            <input
              type="text"
              value={formData.newsletterCtaLabel || ''}
              onChange={(e) => setFormData({ ...formData, newsletterCtaLabel: e.target.value })}
              className="w-full bg-brand-gray border border-brand-gray rounded-xl p-3 text-sm text-brand-navy outline-none focus:ring-2 focus:ring-brand-beige"
            />
          </div>
        </div>
        <div>
          <label className="text-[10px] font-bold text-brand-navy/30 uppercase tracking-[0.3em] block mb-2">Newsletter description</label>
          <textarea
            rows={2}
            value={formData.newsletterSubcopy || ''}
            onChange={(e) => setFormData({ ...formData, newsletterSubcopy: e.target.value })}
            className="w-full bg-brand-gray border border-brand-gray rounded-xl p-4 text-sm text-brand-navy outline-none focus:ring-2 focus:ring-brand-beige"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-brand-navy/30 uppercase tracking-[0.3em] block mb-2">Email placeholder</label>
          <input
            type="text"
            value={formData.newsletterPlaceholder || ''}
            onChange={(e) => setFormData({ ...formData, newsletterPlaceholder: e.target.value })}
            className="w-full bg-brand-gray border border-brand-gray rounded-xl p-3 text-sm text-brand-navy outline-none focus:ring-2 focus:ring-brand-beige"
          />
        </div>
      </section>

      <section className="space-y-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-brand-navy/40 border-b border-brand-gray pb-2">Home — trust row (4 items)</h3>
        <p className="text-[10px] text-brand-navy/40">iconPath：SVG path 的 `d` 属性（与首页 Lucide 风格一致）。留空则用内置默认图标。</p>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-brand-gray/40 rounded-xl border border-brand-gray">
            <div>
              <label className="text-[9px] font-bold text-brand-navy/30 uppercase block mb-1">Title {i + 1}</label>
              <input
                type="text"
                value={formData.homeTrustItems?.[i]?.title || ''}
                onChange={(e) => updateTrust(i, 'title', e.target.value)}
                className="w-full bg-white border border-brand-gray rounded-lg p-2 text-sm"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold text-brand-navy/30 uppercase block mb-1">Subtitle {i + 1}</label>
              <input
                type="text"
                value={formData.homeTrustItems?.[i]?.sub || ''}
                onChange={(e) => updateTrust(i, 'sub', e.target.value)}
                className="w-full bg-white border border-brand-gray rounded-lg p-2 text-sm"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold text-brand-navy/30 uppercase block mb-1">iconPath {i + 1}</label>
              <input
                type="text"
                value={formData.homeTrustItems?.[i]?.iconPath || ''}
                onChange={(e) => updateTrust(i, 'iconPath', e.target.value)}
                className="w-full bg-white border border-brand-gray rounded-lg p-2 text-xs font-mono"
              />
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-brand-navy/40 border-b border-brand-gray pb-2">Home — About & manifesto</h3>
        <div className="grid grid-cols-1 gap-4">
          {(
            [
              ['homeAboutEyebrow', 'About eyebrow'],
              ['homeAboutTitle', 'About title'],
              ['homeAboutBrandBoardUrl', 'About image URL'],
              ['homeManifestoEyebrow', 'Manifesto eyebrow'],
              ['homeManifestoCtaHref', 'Manifesto CTA link (path)'],
              ['homeManifestoCtaLabel', 'Manifesto CTA label'],
              ['homeManifestoImageUrl', 'Manifesto right image URL'],
              ['homeManifestoCardTitle', 'Manifesto card title'],
              ['homeManifestoCardSub', 'Manifesto card subtitle'],
              ['homeManifestoCardYear', 'Manifesto card year line'],
              ['homeShopEyebrow', 'Shop section eyebrow'],
              ['homeShopTitle', 'Shop section title'],
              ['homeShopViewAllLabel', 'Shop View all label'],
              ['homeTrendingEyebrow', 'Trending eyebrow'],
              ['homeTrendingTitle', 'Trending title'],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <label className="text-[10px] font-bold text-brand-navy/30 uppercase tracking-[0.2em] block mb-2">{label}</label>
              <input
                type="text"
                value={(formData[key] as string) || ''}
                onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                className="w-full bg-brand-gray border border-brand-gray rounded-xl p-3 text-sm text-brand-navy outline-none focus:ring-2 focus:ring-brand-beige"
              />
            </div>
          ))}
        </div>
        <div>
          <label className="text-[10px] font-bold text-brand-navy/30 uppercase tracking-[0.3em] block mb-2">About body</label>
          <textarea
            rows={4}
            value={formData.homeAboutBody || ''}
            onChange={(e) => setFormData({ ...formData, homeAboutBody: e.target.value })}
            className="w-full bg-brand-gray border border-brand-gray rounded-xl p-4 text-sm text-brand-navy outline-none focus:ring-2 focus:ring-brand-beige"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-brand-navy/30 uppercase tracking-[0.3em] block mb-2">Manifesto title（可用换行）</label>
          <textarea
            rows={3}
            value={formData.homeManifestoTitle || ''}
            onChange={(e) => setFormData({ ...formData, homeManifestoTitle: e.target.value })}
            className="w-full bg-brand-gray border border-brand-gray rounded-xl p-4 text-sm text-brand-navy outline-none focus:ring-2 focus:ring-brand-beige"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-brand-navy/30 uppercase tracking-[0.3em] block mb-2">Manifesto body</label>
          <textarea
            rows={4}
            value={formData.homeManifestoBody || ''}
            onChange={(e) => setFormData({ ...formData, homeManifestoBody: e.target.value })}
            className="w-full bg-brand-gray border border-brand-gray rounded-xl p-4 text-sm text-brand-navy outline-none focus:ring-2 focus:ring-brand-beige"
          />
        </div>
      </section>

      <section className="space-y-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-brand-navy/40 border-b border-brand-gray pb-2">
          Category pages — hero (title / subtitle / image URL)
        </h3>
        <div className="max-h-[480px] overflow-y-auto space-y-6 pr-2">
          {categorySlugs.map((slug) => (
            <div key={slug} className="p-5 bg-brand-gray/30 rounded-2xl border border-brand-gray space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-brand-navy">{slug}</p>
              <input
                type="text"
                placeholder="Title"
                value={formData.categoryHeroes?.[slug]?.title || ''}
                onChange={(e) => updateHero(slug, 'title', e.target.value)}
                className="w-full bg-white border border-brand-gray rounded-lg p-2 text-sm"
              />
              <input
                type="text"
                placeholder="Subtitle"
                value={formData.categoryHeroes?.[slug]?.subtitle || ''}
                onChange={(e) => updateHero(slug, 'subtitle', e.target.value)}
                className="w-full bg-white border border-brand-gray rounded-lg p-2 text-sm"
              />
              <input
                type="text"
                placeholder="Image URL"
                value={formData.categoryHeroes?.[slug]?.image || ''}
                onChange={(e) => updateHero(slug, 'image', e.target.value)}
                className="w-full bg-white border border-brand-gray rounded-lg p-2 text-xs font-mono"
              />
            </div>
          ))}
        </div>
      </section>

      <button
        type="submit"
        className="w-full bg-brand-navy text-white py-5 rounded-full text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-brand-beige transition-all shadow-xl"
      >
        Save site configuration
      </button>
    </form>
  );
}
