import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect, useMemo, Fragment } from 'react';
import type { Product, Promotion, StoreConfig, Category } from '../../types';
import { displayStoreProductTitle } from '../../lib/storeShortTitle';
import { mergeTrustItems } from '../../lib/siteContent';
import { HOME_CATEGORY_FLOOR_LIMIT, resolveHomeCategoryFloorProducts } from '../../lib/homeCategoryFloor';
import {
  homeCategoryTileImageErrorFallback,
  mergeHomeCategoryTiles,
  mergeHomeHeroSpotlights,
  mergeHomeReviewItems,
} from '../../lib/homePageDefaults';
import { HOME_MANIFESTO_DEFAULTS, HOME_MANIFESTO_TAGLINE } from '../../content/homaireBrandStory';
import heroModelSceneImage from '../../assets/hero-model-scene.png';

const fallbackProductImage = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=1200&h=1200';

const HERO_IMAGE_FALLBACK = heroModelSceneImage;

function ReviewStars({ rating, compact }: { rating?: number; compact?: boolean }) {
  if (rating == null || rating < 1) return null;
  const filled = Math.min(5, Math.max(1, Math.round(rating)));
  const starClass = compact ? 'text-sm' : 'text-lg';
  return (
    <div className={`flex gap-0.5 text-brand-beige ${compact ? 'mb-2' : 'mb-4'}`} aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={`${starClass} leading-none ${i < filled ? 'opacity-100' : 'opacity-20'}`}>
          ★
        </span>
      ))}
    </div>
  );
}

/** 首页「Most Desired」栅格卡片标题 */
const HOME_FEATURED_PRODUCT_TITLE_MAX = 56;
/** 楼层主推卡片标题上限 */
const HOME_FLOOR_PRODUCT_TITLE_MAX = 48;

function isProductOnPromotion(p: Product): boolean {
  const cat = (p.category || '').trim().toLowerCase();
  if (cat === 'sale') return true;
  if (p.onSale) return true;
  const d = p.discountPrice;
  return typeof d === 'number' && d > 0 && d < p.price;
}

function pickSaleFloorProducts(products: Product[], limit: number): Product[] {
  const list = products.filter(isProductOnPromotion);
  return [...list]
    .sort((a, b) => {
      const score = (p: Product) => {
        const d = p.discountPrice;
        if (typeof d === 'number' && d > 0 && d < p.price) return p.price - d;
        return p.onSale ? p.price * 0.01 : 0;
      };
      const sb = score(b) - score(a);
      if (sb !== 0) return sb;
      return b.price - a.price;
    })
    .slice(0, limit);
}

function FloorProductCard({
  product,
  onAddToCart,
}: {
  product: Product;
  onAddToCart: (p: Product) => void;
}) {
  const title = displayStoreProductTitle(product, HOME_FLOOR_PRODUCT_TITLE_MAX);
  const img = product.images?.[0] || fallbackProductImage;
  const hasDeal =
    typeof product.discountPrice === 'number' &&
    product.discountPrice > 0 &&
    product.discountPrice < product.price;
  const showPromoBadge = product.onSale || hasDeal || product.category?.toLowerCase() === 'sale';
  const payPrice = hasDeal ? product.discountPrice! : product.price;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group min-w-0"
    >
      <div className="relative mb-3 aspect-[3/4] overflow-hidden rounded-2xl border border-brand-border bg-white shadow-sm">
        <Link to={`/product/${product.id}`} className="absolute inset-0 z-0 block">
          <img
            src={img}
            alt=""
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
        </Link>
        {showPromoBadge ? (
          <span className="pointer-events-none absolute left-2.5 top-2.5 z-[1] rounded-full bg-brand-navy px-2.5 py-1 text-[8px] font-bold uppercase tracking-wider text-white">
            Sale
          </span>
        ) : null}
        <div className="pointer-events-none absolute inset-0 z-[1] bg-brand-navy/0 transition-colors duration-500 group-hover:bg-brand-navy/25" />
        <button
          type="button"
          onClick={() => onAddToCart(product)}
          className="absolute bottom-2.5 left-2.5 right-2.5 z-10 flex translate-y-14 items-center justify-center gap-2 rounded-xl bg-brand-beige py-3 text-[9px] font-bold uppercase tracking-widest text-white shadow-lg transition-all duration-500 hover:bg-white hover:text-brand-navy group-hover:translate-y-0"
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          Add
        </button>
      </div>
      <Link to={`/product/${product.id}`} className="block">
        <h3 className="line-clamp-2 hyphens-auto break-words font-brand text-xs font-bold uppercase leading-snug tracking-tight text-brand-navy group-hover:text-brand-beige">
          {title}
        </h3>
        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0">
          <span className="font-brand text-base font-bold tracking-tighter text-brand-navy">€{payPrice.toLocaleString()}</span>
          {hasDeal ? (
            <span className="text-[10px] font-bold uppercase tracking-wide text-brand-navy/35 line-through">
              €{product.price.toLocaleString()}
            </span>
          ) : null}
        </div>
      </Link>
    </motion.div>
  );
}

const DEFAULT_HERO_BANNERS = [
  {
    title: 'Every Corner of Home',
    subtitle: 'Practical, comfortable pieces for living rooms that work as hard as you do.',
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=2000',
    cta: 'Shop Sofas',
    link: '/category/sofas',
  },
  {
    title: 'Curated for Modern Living',
    subtitle: 'Thoughtful form, warm materials, and layouts that feel complete — not crowded.',
    imageUrl: heroModelSceneImage,
    cta: 'Explore Now',
    link: '/category/sofas',
  },
  {
    title: 'Restful Bedrooms',
    subtitle: 'Beds and accents shaped for calm, storage, and everyday ease.',
    imageUrl: 'https://images.unsplash.com/photo-1505693415918-91e514789da1?auto=format&fit=crop&q=80&w=2000',
    cta: 'Shop Beds',
    link: '/category/beds',
  },
  {
    title: 'Gather & Dine',
    subtitle: 'Tables sized for real rooms — everyday meals and unhurried weekends.',
    imageUrl: 'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&q=80&w=2000',
    cta: 'Shop Tables',
    link: '/category/tables',
  },
  {
    title: 'Outdoor & Garden',
    subtitle: 'Weather-ready comfort for balconies, patios, and open-air moments.',
    imageUrl: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=2000',
    cta: 'Shop Garden',
    link: '/category/garden',
  },
] as const;

function resolveHeroBannerImageUrl(
  banner: Pick<Promotion, 'imageUrl'> | (typeof DEFAULT_HERO_BANNERS)[number] | undefined
): string {
  const raw = banner && 'imageUrl' in banner ? banner.imageUrl : undefined;
  if (typeof raw === 'string' && raw.trim().length > 0) return raw.trim();
  return HERO_IMAGE_FALLBACK;
}

function cssUrlValue(url: string): string {
  return `url("${url.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}")`;
}

export type HomeSectionsProps = {
  products: Product[];
  productsLoading: boolean;
  promotions: Promotion[];
  config: StoreConfig | null | undefined;
  /** 与首页宫格 slug 对齐时用于封面图（分类管理后台 `Category.image`） */
  categories?: Category[];
  onAddToCart: (product: Product) => void;
  /** 非空时在内容顶部显示一条提示（如后台实时预览） */
  previewBanner?: string | null;
};

export function HomeSections({
  products,
  productsLoading,
  promotions,
  config,
  onAddToCart,
  previewBanner,
  categories,
}: HomeSectionsProps) {
  const [currentBanner, setCurrentBanner] = useState(0);
  const [heroSlideImageFailed, setHeroSlideImageFailed] = useState(false);

  const heroSideRows = useMemo(() => {
    const promos = promotions.filter((p) => p.active && p.type === 'card').slice(0, 3);
    const spots = mergeHomeHeroSpotlights(config).slice(0, Math.max(0, 3 - promos.length));
    return [
      ...promos.map((promo) => ({ kind: 'promo' as const, promo })),
      ...spots.map((spot) => ({ kind: 'spotlight' as const, spot })),
    ];
  }, [promotions, config]);

  const displayBanners = useMemo(() => {
    const heroes = promotions.filter((p) => p.active && p.type === 'hero');
    if (heroes.length > 0) {
      return heroes.map((p) => ({
        ...p,
        imageUrl: resolveHeroBannerImageUrl(p),
      }));
    }
    return [...DEFAULT_HERO_BANNERS];
  }, [promotions]);

  const trustItems = useMemo(() => mergeTrustItems(config), [config]);
  const categoryTiles = useMemo(() => mergeHomeCategoryTiles(config, categories), [config, categories]);
  const reviewItems = useMemo(() => mergeHomeReviewItems(config), [config]);

  const saleFloorProducts = useMemo(() => pickSaleFloorProducts(products, 8), [products]);
  const categoryFloors = useMemo(
    () =>
      categoryTiles
        .filter((t) => t.slug.trim().toLowerCase() !== 'sale')
        .map((tile) => ({
          tile,
          items: resolveHomeCategoryFloorProducts(tile.slug, products, categories, categoryTiles, HOME_CATEGORY_FLOOR_LIMIT),
        }))
        .filter((row) => row.items.length > 0),
    [products, categoryTiles, categories],
  );

  const featuredProducts = products.slice(0, 8);
  const productImage = (product: { images?: string[] }) => product.images?.[0] || fallbackProductImage;

  const currentHeroSlide = displayBanners[currentBanner];
  const resolvedHeroImageUrl = heroSlideImageFailed
    ? HERO_IMAGE_FALLBACK
    : (currentHeroSlide?.imageUrl?.trim() || HERO_IMAGE_FALLBACK);

  useEffect(() => {
    setHeroSlideImageFailed(false);
  }, [currentBanner]);

  useEffect(() => {
    if (displayBanners.length > 0) {
      const timer = setInterval(() => {
        setCurrentBanner((prev) => (prev + 1) % displayBanners.length);
      }, 8000);
      return () => clearInterval(timer);
    }
  }, [displayBanners.length]);

  return (
    <div className="space-y-1 pb-20 bg-brand-gray">
      {previewBanner ? (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 text-center text-xs font-bold uppercase tracking-widest py-2 px-4">
          {previewBanner}
        </div>
      ) : null}

      <section className="bg-brand-gray p-1">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-1 h-[70vh]">
          <div className="md:col-span-8 relative bg-brand-bg overflow-hidden group">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentBanner}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
                className="absolute inset-0"
              >
                <div className="absolute inset-0 bg-brand-gray overflow-hidden">
                  <div
                    aria-hidden
                    className="absolute inset-0 z-0 bg-cover bg-center opacity-90 motion-safe:scale-105 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                    style={{ backgroundImage: cssUrlValue(resolvedHeroImageUrl) }}
                  />
                  <motion.img
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 10, ease: 'linear' }}
                    src={resolvedHeroImageUrl}
                    alt={currentHeroSlide?.title ?? 'Hero'}
                    className={`absolute inset-0 z-[1] w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-700 ${resolvedHeroImageUrl.includes('08906967') ? 'w-[300%] h-[200%] max-w-none' : ''}`}
                    style={resolvedHeroImageUrl.includes('08906967') ? { objectPosition: '0% 0%' } : {}}
                    referrerPolicy="no-referrer"
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    onError={() => setHeroSlideImageFailed(true)}
                  />
                  <div className="absolute inset-0 z-[2] bg-gradient-to-r from-white/60 to-transparent pointer-events-none" />
                </div>
                <div className="absolute bottom-12 left-12 max-w-md z-10">
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  >
                    <span className="text-brand-sage text-xs font-bold uppercase tracking-[0.3em] mb-4 block">Homaire</span>
                    <h1 className="text-4xl md:text-6xl font-brand font-bold leading-[0.9] text-brand-navy mb-6 uppercase tracking-tighter">
                      {displayBanners[currentBanner]?.title}
                    </h1>
                    <p className="text-brand-charcoal/80 text-lg mb-8 font-medium">
                      {displayBanners[currentBanner]?.subtitle}
                    </p>
                    <Link
                      to={displayBanners[currentBanner]?.link || '/category/sofas'}
                      className="inline-flex items-center gap-4 bg-brand-navy text-white px-10 py-5 font-bold uppercase text-[10px] tracking-widest hover:bg-brand-beige transition-all shadow-2xl hover:-translate-y-1"
                    >
                      {displayBanners[currentBanner]?.cta || 'Explore Selection'} <ArrowRight className="w-4 h-4" />
                    </Link>
                  </motion.div>
                </div>
              </motion.div>
            </AnimatePresence>

            <button
              type="button"
              onClick={() =>
                setCurrentBanner((currentBanner - 1 + displayBanners.length) % displayBanners.length)
              }
              className="absolute left-6 top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full bg-white/80 border border-white/60 text-brand-navy shadow-sm backdrop-blur hover:bg-white transition-colors flex items-center justify-center"
              aria-label="Previous banner"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentBanner((currentBanner + 1) % displayBanners.length)}
              className="absolute right-6 top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full bg-white/80 border border-white/60 text-brand-navy shadow-sm backdrop-blur hover:bg-white transition-colors flex items-center justify-center"
              aria-label="Next banner"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <div className="absolute bottom-8 right-8 flex gap-2 z-10">
              {displayBanners.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`切换到第 ${i + 1} 张`}
                  onClick={() => setCurrentBanner(i)}
                  className={`h-1 transition-all duration-500 ${currentBanner === i ? 'w-12 bg-brand-beige' : 'w-4 bg-white/30 hover:bg-white/60'}`}
                />
              ))}
            </div>
          </div>

          <div className="md:col-span-4 flex flex-col gap-1">
            {heroSideRows.map((row, idx) => {
              const navy = idx % 2 === 1;
              if (row.kind === 'promo') {
                const promo = row.promo;
                return (
                  <div
                    key={promo.id}
                    className={`flex-1 relative overflow-hidden group ${navy ? 'bg-brand-navy text-white' : 'bg-white text-brand-navy'}`}
                  >
                    <img
                      src={promo.imageUrl || fallbackProductImage}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-40 transition-opacity duration-700"
                    />
                    <div className="relative z-10 flex h-full flex-col justify-center p-8 sm:p-10">
                      <span className="mb-3 font-bold uppercase tracking-[0.3em] text-brand-beige text-[10px] sm:mb-4">
                        Campaign · card
                      </span>
                      <h2 className="mb-3 font-brand text-2xl font-bold uppercase leading-none tracking-tighter sm:mb-4">
                        {promo.title}
                      </h2>
                      <p className="mb-6 text-sm font-medium opacity-70 sm:mb-8">{promo.subtitle}</p>
                      <Link
                        to={promo.link || '/'}
                        className="inline-block w-fit border-b border-brand-beige text-[10px] font-bold uppercase tracking-widest hover:text-brand-beige"
                      >
                        Explore
                      </Link>
                    </div>
                  </div>
                );
              }
              const s = row.spot;
              const to = s.link.trim().startsWith('/') ? s.link.trim() : `/${s.link.trim()}`;
              return (
                <Link
                  key={`${to}-${idx}`}
                  to={to}
                  className={`group relative flex-1 overflow-hidden ${navy ? 'bg-brand-navy text-white' : 'bg-white text-brand-navy'}`}
                >
                  <img
                    src={(s.image || '').trim() || fallbackProductImage}
                    alt=""
                    className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                      navy ? 'opacity-15 group-hover:opacity-28' : 'opacity-20 group-hover:opacity-35'
                    }`}
                  />
                  <div className="relative z-10 flex h-full flex-col justify-center p-8">
                    <span className="mb-3 font-bold uppercase tracking-[0.3em] text-brand-beige text-[10px]">{s.eyebrow}</span>
                    <h2 className="mb-3 min-h-0 font-brand text-2xl font-bold uppercase leading-none tracking-tighter line-clamp-3 break-words hyphens-auto">
                      {s.title}
                    </h2>
                    {s.subtitle ? (
                      <p className={`mb-5 text-sm font-medium ${navy ? 'opacity-70' : 'opacity-70'}`}>{s.subtitle}</p>
                    ) : null}
                    <span
                      className={
                        navy
                          ? 'inline-block border border-white/20 px-5 py-3.5 text-center text-[10px] font-bold uppercase tracking-widest transition-all hover:border-brand-beige hover:bg-brand-beige hover:text-brand-navy'
                          : 'inline-block w-fit border-b border-brand-beige text-[10px] font-bold uppercase tracking-widest group-hover:text-brand-beige'
                      }
                    >
                      {(s.ctaLabel || 'Explore').trim()}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white border-y border-brand-gray">
        <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {trustItems.map((item, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-gray rounded-full flex items-center justify-center text-brand-navy">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.iconPath} />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-tight text-brand-navy">{item.title}</p>
                <p className="text-[10px] text-brand-navy/40 font-medium uppercase tracking-wider">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 pt-24">
        <div className="flex justify-between items-end mb-12 border-b border-brand-gray pb-6">
          <div>
            <span className="text-brand-beige text-[10px] uppercase tracking-[0.3em] font-bold block mb-2">
              {(config?.homeShopEyebrow || 'Curation').trim()}
            </span>
            <h2 className="text-4xl text-brand-navy uppercase font-brand font-bold tracking-tighter">
              {(config?.homeShopTitle || 'Shop by Function').trim()}
            </h2>
          </div>
          <Link
            to="/"
            className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/30 hover:text-brand-navy transition-colors pb-1 border-b border-transparent hover:border-brand-navy/30"
          >
            {(config?.homeShopViewAllLabel || 'View All').trim()}
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categoryTiles.map((cat, i) => (
            <motion.div
              key={`${cat.slug}-${i}`}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Link
                to={`/category/${cat.slug}`}
                className="group block relative aspect-square overflow-hidden bg-brand-gray rounded-3xl"
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="relative z-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                  onError={(e) => {
                    const el = e.currentTarget;
                    if (el.dataset.fallback === '1') return;
                    el.dataset.fallback = '1';
                    el.src = homeCategoryTileImageErrorFallback(cat.slug, cat.name, i);
                  }}
                />
                <div className="absolute inset-0 z-[1] bg-brand-navy/20 group-hover:bg-brand-navy/40 transition-colors" />
                <div className="absolute bottom-0 left-0 right-0 p-8 z-[2]">
                  <h3 className="text-white text-2xl font-brand font-bold uppercase tracking-tighter leading-none mb-3">{cat.name}</h3>
                  <div className="w-8 h-1 bg-brand-beige group-hover:w-16 transition-all duration-500" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 pt-20">
        {productsLoading || saleFloorProducts.length > 0 || categoryFloors.length > 0 ? (
          <div className="space-y-14">
            {productsLoading ? (
              <div className="space-y-4">
                <div className="h-5 w-40 animate-pulse rounded bg-brand-gray" />
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-brand-gray" />
                  ))}
                </div>
              </div>
            ) : null}

            {!productsLoading && saleFloorProducts.length > 0 ? (
              <div>
                <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-brand-gray pb-4">
                  <div>
                    <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.35em] text-brand-sage">
                      Special offers
                    </span>
                    <h2 className="font-brand text-2xl font-bold uppercase tracking-tighter text-brand-navy md:text-3xl">
                      On promotion
                    </h2>
                  </div>
                  <Link
                    to="/category/sale"
                    className="border-b border-transparent pb-0.5 text-[10px] font-bold uppercase tracking-widest text-brand-navy/35 transition-colors hover:border-brand-navy/30 hover:text-brand-navy"
                  >
                    View sale
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                  {saleFloorProducts.map((product) => (
                    <div key={product.id}>
                      <FloorProductCard product={product} onAddToCart={onAddToCart} />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {!productsLoading &&
              categoryFloors.map(({ tile, items }) => (
                <div key={tile.slug}>
                  <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-brand-gray pb-4">
                    <div>
                      <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.35em] text-brand-beige">
                        Featured in category
                      </span>
                      <h2 className="font-brand text-2xl font-bold uppercase tracking-tighter text-brand-navy md:text-3xl">
                        {tile.name}
                      </h2>
                    </div>
                    <Link
                      to={`/category/${tile.slug}`}
                      className="border-b border-transparent pb-0.5 text-[10px] font-bold uppercase tracking-widest text-brand-navy/35 transition-colors hover:border-brand-navy/30 hover:text-brand-navy"
                    >
                      View all
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                    {items.map((product) => (
                      <div key={product.id}>
                        <FloorProductCard product={product} onAddToCart={onAddToCart} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        ) : null}
      </section>

      <section className="max-w-7xl mx-auto px-4 pt-14">
        <div className="overflow-hidden rounded-3xl border border-brand-border bg-white px-5 py-8 shadow-sm sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="mb-8 max-w-2xl lg:mb-10">
            <span className="mb-3 block text-[10px] font-bold uppercase tracking-[0.35em] text-brand-sage">
              {(config?.homeReviewsEyebrow || 'Customer voices').trim()}
            </span>
            <h2 className="mb-3 font-brand text-2xl font-bold leading-tight tracking-tight text-brand-navy md:text-3xl">
              {(config?.homeReviewsTitle || 'What customers say').trim()}
            </h2>
            {(config?.homeReviewsIntro || '').trim() ? (
              <p className="max-w-xl text-sm font-medium leading-relaxed text-brand-charcoal/75 md:text-base">
                {(config?.homeReviewsIntro || '').trim()}
              </p>
            ) : null}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
            {reviewItems.map((rev, i) => (
              <motion.article
                key={`${rev.author}-${i}`}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="flex flex-col rounded-2xl border border-brand-gray/80 bg-brand-gray/10 p-4 md:p-5"
              >
                <ReviewStars rating={rev.rating} compact />
                <blockquote className="mb-4 line-clamp-4 flex-grow border-l-2 border-brand-beige pl-4 text-xs font-medium leading-relaxed text-brand-navy/85 md:text-sm">
                  {rev.quote}
                </blockquote>
                <footer className="border-t border-brand-gray/50 pt-3">
                  <p className="font-brand text-xs font-bold uppercase tracking-tight text-brand-navy md:text-sm">
                    {rev.author}
                  </p>
                  {rev.subtitle ? (
                    <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-brand-navy/40">
                      {rev.subtitle}
                    </p>
                  ) : null}
                </footer>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative mt-24 overflow-hidden bg-brand-navy py-24 text-white md:py-32">
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle, #d4af7a 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>
        <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-stretch gap-16 px-4 md:flex-row md:items-center md:gap-20 lg:gap-24">
          <div className="min-w-0 flex-1 border-l-[3px] border-brand-beige/80 pl-6 md:pl-8">
            <motion.div initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <span className="mb-4 block text-[10px] font-bold uppercase tracking-[0.4em] text-brand-beige md:text-xs">
                {(config?.homeManifestoEyebrow || HOME_MANIFESTO_DEFAULTS.homeManifestoEyebrow).trim()}
              </span>
              <h2 className="mb-4 font-brand text-3xl font-bold uppercase leading-[0.95] tracking-tighter md:text-5xl lg:text-6xl">
                {(config?.homeManifestoTitle || HOME_MANIFESTO_DEFAULTS.homeManifestoTitle)
                  .trim()
                  .split('\n')
                  .filter(Boolean)
                  .map((line, i) => (
                    <Fragment key={i}>
                      {i > 0 && <br />}
                      {line}
                    </Fragment>
                  ))}
              </h2>
              <p className="mb-3 max-w-xl text-sm font-medium uppercase tracking-[0.2em] text-brand-beige/90 md:text-[11px]">
                {HOME_MANIFESTO_TAGLINE}
              </p>
              <p className="mb-10 max-w-xl text-base font-medium leading-relaxed text-white/75 md:text-lg">
                {(config?.homeManifestoBody || HOME_MANIFESTO_DEFAULTS.homeManifestoBody).trim()}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to={(config?.homeManifestoCtaHref || HOME_MANIFESTO_DEFAULTS.homeManifestoCtaHref).trim() || '/brand-story'}
                  className="inline-flex items-center gap-3 bg-brand-beige px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-navy shadow-xl transition-all hover:bg-white hover:text-brand-navy md:px-10 md:py-5"
                >
                  {(config?.homeManifestoCtaLabel || HOME_MANIFESTO_DEFAULTS.homeManifestoCtaLabel).trim()}{' '}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/category/sofas"
                  className="inline-flex items-center border border-white/25 px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/90 transition-colors hover:border-brand-beige hover:text-brand-beige md:px-8 md:py-5"
                >
                  Shop sofas
                </Link>
              </div>
            </motion.div>
          </div>
          <div className="relative w-full flex-1">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative aspect-[4/5] w-full max-w-md overflow-hidden rounded-[2.5rem] shadow-2xl md:max-w-none lg:rounded-[3rem]"
            >
              <img
                src={(config?.homeManifestoImageUrl || HOME_MANIFESTO_DEFAULTS.homeManifestoImageUrl).trim()}
                alt=""
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/70 via-brand-navy/10 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/15 bg-white/10 p-6 backdrop-blur-md md:bottom-8 md:left-8 md:right-8 md:rounded-3xl md:p-8">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                  <div>
                    <span className="mb-1 block font-brand text-3xl font-bold text-white md:text-4xl">
                      {(config?.homeManifestoCardTitle || HOME_MANIFESTO_DEFAULTS.homeManifestoCardTitle).trim()}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand-beige">
                      {(config?.homeManifestoCardSub || HOME_MANIFESTO_DEFAULTS.homeManifestoCardSub).trim()}
                    </span>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="block max-w-[11rem] text-[10px] font-bold uppercase leading-snug tracking-widest text-white/70 sm:ml-auto">
                      {(config?.homeManifestoCardYear || HOME_MANIFESTO_DEFAULTS.homeManifestoCardYear).trim()}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-32">
        <div className="text-center max-w-2xl mx-auto mb-20">
          <span className="text-brand-beige text-[10px] uppercase tracking-[0.4em] font-bold block mb-4">
            {(config?.homeTrendingEyebrow || 'The Selection').trim()}
          </span>
          <h2 className="text-4xl font-brand font-bold uppercase tracking-tighter text-brand-navy">
            {(config?.homeTrendingTitle || 'Most Desired Objects').trim()}
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {productsLoading ? (
            [1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="aspect-[4/5] bg-brand-gray animate-pulse rounded-[3rem]" />
            ))
          ) : (
            featuredProducts.map((product, i) => {
              const title = displayStoreProductTitle(product, HOME_FEATURED_PRODUCT_TITLE_MAX);
              return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group"
              >
                <Link to={`/product/${product.id}`} className="block">
                  <div className="aspect-[4/5] bg-white overflow-hidden mb-8 shadow-sm border border-brand-border relative group rounded-[3rem]">
                    <img
                      src={productImage(product)}
                      alt={title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                    />
                    {product.onSale && (
                      <div className="absolute top-8 right-8 bg-brand-navy text-white px-5 py-2.5 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] shadow-xl border border-white/20">
                        Special Offer
                      </div>
                    )}
                    <div className="absolute inset-0 bg-brand-navy/0 group-hover:bg-brand-navy/40 transition-all duration-500" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onAddToCart(product);
                      }}
                      className="absolute bottom-8 left-8 right-8 bg-brand-beige text-white py-5 text-[10px] uppercase font-bold tracking-widest translate-y-24 group-hover:translate-y-0 transition-all duration-500 hover:bg-white hover:text-brand-navy shadow-2xl flex items-center justify-center gap-3 rounded-2xl"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Add To Collection
                    </button>
                  </div>
                  <div className="flex justify-between items-start px-4">
                    <div className="min-w-0 flex-1 pr-2">
                      <h3 className="text-xl font-brand font-bold uppercase tracking-tighter mb-2 text-brand-navy group-hover:text-brand-beige transition-colors line-clamp-2 break-words hyphens-auto">
                        {title}
                      </h3>
                      <span className="text-brand-navy/30 text-[10px] uppercase font-bold tracking-[0.3em]">{product.category}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-brand font-bold text-brand-navy tracking-tighter">
                        €{product.price.toLocaleString()}
                      </span>
                      {product.onSale && (
                        <p className="text-[10px] text-brand-navy/20 font-bold line-through">
                          €{Math.round(product.price * 1.25).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
