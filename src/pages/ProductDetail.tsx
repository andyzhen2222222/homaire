import { useParams, Link } from 'react-router-dom';
import { useProduct, useProducts } from '../hooks/useProducts';
import { useStoreConfig, useCategories } from '../hooks/useAdminData';
import { displayStoreProductTitle, isSkuLikeProductCode, resolveStoreProductDisplayTitle } from '../lib/storeShortTitle';
import { resolveProductHighlights } from '../lib/productHighlights';
import { displayCategoryName } from '../lib/categoryLabels';
import { useCart } from '../components/CartContext';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useMemo } from 'react';
import {
  Check,
  Download,
  FileText,
  Minus,
  Play,
  Plus,
  Truck,
} from 'lucide-react';
import Logo from '../components/Logo';
import { formatEurPrice, roundStorePrice } from '../lib/storePrice';
import {
  formatStoreMoney,
  getProductDetailLowStockHint,
  getProductDetailOutOfStockHint,
  getProductDetailShippingFootnote,
  getProductDetailShippingFreeLabel,
  getProductDetailShippingLabel,
  getProductDetailStockLabel,
  getShippingFlatFee,
  getShippingFreeThreshold,
} from '../lib/storeShipping';

type ProductMedia = {
  type: 'image' | 'video';
  url: string;
  label: string;
};

/** 详情侧栏只展示一段导购摘要；完整长文在下方 Product Story / detailHtml。 */
function leadDescriptionParagraph(raw: string, maxChars = 400): string {
  const t = (raw || '').trim();
  if (!t) return '';
  const chunks = t
    .split(/\n{2,}/)
    .map((c) => c.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const block = chunks[0] ?? t.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  if (block.length <= maxChars) return block;
  const cut = block.slice(0, maxChars);
  const sp = cut.lastIndexOf(' ');
  const head = sp > maxChars * 0.55 ? cut.slice(0, sp) : cut;
  return `${head.trimEnd()}…`;
}

/** 品牌区配图：去重后取画廊后段，避免与首屏主图/缩略图因取模重复；不足 3 张不展示以免与首屏同图。 */
function pickBrandSectionImages(urls: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const u of urls) {
    if (!u || seen.has(u)) continue;
    seen.add(u);
    unique.push(u);
  }
  const n = unique.length;
  if (n < 3) return [];
  return [unique[n - 2], unique[n - 1]];
}

/** 供应链 / 抓取 HTML 里常见无信息 eyebrow，后台未单独维护时应隐藏 */
const PLACEHOLDER_EYEBROW_LABELS = new Set([
  '',
  'product',
  'products',
  'detail',
  'details',
  'info',
  'description',
  'overview',
]);

function eyebrowTextIsPlaceholder(raw: string): boolean {
  const t = (raw ?? '').replace(/\u00a0/g, ' ').trim();
  if (!t) return true;
  if (t.length > 64) return false;
  const lower = t.toLowerCase();
  return PLACEHOLDER_EYEBROW_LABELS.has(t) || PLACEHOLDER_EYEBROW_LABELS.has(lower);
}

/** 从 Product Story HTML 中移除占位 eyebrow，避免页面上出现重复的「PRODUCT」等角标 */
function stripPlaceholderStoryEyebrows(html: string): string {
  if (!html.trim()) return html;
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') return html;
  try {
    const doc = new DOMParser().parseFromString(`<div class="detail-story-wrap">${html}</div>`, 'text/html');
    const wrap = doc.querySelector('.detail-story-wrap');
    if (!wrap) return html;
    wrap.querySelectorAll('.eyebrow').forEach((el) => {
      if (eyebrowTextIsPlaceholder(el.textContent || '')) el.remove();
    });
    return wrap.innerHTML;
  } catch {
    return html;
  }
}

function normalizeDetailHtmlStory(html: string): string {
  const raw = html.trim();
  if (!raw) return raw;
  if (/<[a-zA-Z][\s\S]*?>/.test(raw)) return raw;
  const escaped = raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n{2,}/g, '</p><p class="detail-body-paragraph leading-relaxed">')
    .replace(/\n/g, '<br/>');
  return `<div class="detail-html-body space-y-4"><p class="detail-body-paragraph leading-relaxed">${escaped}</p></div>`;
}
const PRODUCT_STORY_BODY_CLASSNAME = [
  'w-full min-w-0 space-y-6 text-brand-navy/65 font-medium leading-relaxed text-base md:text-lg',
  '[&_.detail-html-body]:text-brand-navy/80 [&_.detail-html-body_a]:text-brand-beige [&_.detail-html-body_a]:underline',
  '[&_.detail-html-body_img]:w-full [&_.detail-html-body_img]:max-h-[480px] [&_.detail-html-body_img]:rounded-2xl [&_.detail-html-body_img]:object-cover',
  '[&_.detail-block]:grid [&_.detail-block]:grid-cols-1 [&_.detail-block]:md:grid-cols-2 [&_.detail-block]:gap-6 [&_.detail-block]:items-center [&_.detail-block]:bg-white [&_.detail-block]:border [&_.detail-block]:border-brand-gray [&_.detail-block]:rounded-3xl [&_.detail-block]:overflow-hidden [&_.detail-block.reverse>div:first-child]:md:order-2 [&_.detail-block_img]:w-full [&_.detail-block_img]:aspect-square [&_.detail-block_img]:object-cover',
  '[&_.detail-block:not(:has(img))]:!block [&_.detail-block:not(:has(img))]:!max-w-3xl [&_.detail-block:not(:has(img))]:!bg-transparent [&_.detail-block:not(:has(img))]:!border-0 [&_.detail-block:not(:has(img))]:!rounded-none [&_.detail-block:not(:has(img))]:!overflow-visible [&_.detail-block:not(:has(img))]:!shadow-none',
  '[&_.detail-block:not(:has(img))]:border-l-[3px] [&_.detail-block:not(:has(img))]:border-brand-beige/75 [&_.detail-block:not(:has(img))]:pl-7 [&_.detail-block:not(:has(img))]:py-1',
  '[&_.detail-block:not(:has(img))>div]:!p-0 [&_.detail-block:not(:has(img))>div:not(:has(img))]:!p-0',
  '[&_h2]:font-brand [&_h2]:text-4xl [&_h2]:font-bold [&_h2]:uppercase [&_h2]:tracking-tighter [&_h2]:text-brand-navy [&_h2]:mb-6',
  '[&_.detail-block:not(:has(img))_h2]:!normal-case [&_.detail-block:not(:has(img))_h2]:!text-2xl [&_.detail-block:not(:has(img))_h2]:!md:text-3xl [&_.detail-block:not(:has(img))_h2]:!tracking-tight [&_.detail-block:not(:has(img))_h2]:!mb-4',
  '[&_h3]:font-brand [&_h3]:text-3xl [&_h3]:font-bold [&_h3]:uppercase [&_h3]:tracking-tighter [&_h3]:text-brand-navy [&_h3]:mb-5',
  '[&_.detail-block:not(:has(img))_h3]:!normal-case [&_.detail-block:not(:has(img))_h3]:!text-xl [&_.detail-block:not(:has(img))_h3]:!md:text-2xl [&_.detail-block:not(:has(img))_h3]:!tracking-tight [&_.detail-block:not(:has(img))_h3]:!mb-3',
  '[&_p]:mb-6',
  '[&_.detail-block:not(:has(img))_p]:!mb-5 [&_.detail-block:not(:has(img))_p]:!text-brand-navy/70 [&_.detail-block:not(:has(img))_p]:!font-normal [&_.detail-block:not(:has(img))_p]:!leading-[1.75]',
  '[&_.eyebrow]:text-brand-beige [&_.eyebrow]:text-[10px] [&_.eyebrow]:font-black [&_.eyebrow]:uppercase [&_.eyebrow]:tracking-[0.35em] [&_.eyebrow]:mb-4',
  '[&_.detail-block:not(:has(img))_.eyebrow]:!mb-2',
  '[&_.detail-block>div:not(:has(img))]:p-8 [&_.detail-block>div:not(:has(img))]:md:p-10',
  '[&_ul]:grid [&_ul]:grid-cols-1 [&_ul]:md:grid-cols-2 [&_ul]:gap-3 [&_li]:list-none [&_li]:rounded-xl [&_li]:border [&_li]:border-brand-gray [&_li]:px-5 [&_li]:py-4 [&_li]:text-sm [&_li]:font-black [&_li]:uppercase [&_li]:tracking-widest [&_li]:text-brand-navy',
].join(' ');

/** 「You May Also Like」卡片列宽约 288px，`text-sm` 全大写约两行可读 */
const RELATED_CARD_TITLE_MAX_CHARS = 56;

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { product, loading } = useProduct(id!);
  const { products: relatedProducts } = useProducts(product?.category);
  const { config } = useStoreConfig();
  const { categories } = useCategories();
  const { addItem } = useCart();
  const [activeMedia, setActiveMedia] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showAddedMsg, setShowAddedMsg] = useState(false);

  const displayTitle = useMemo(() => {
    if (!product) return '';
    return resolveStoreProductDisplayTitle(product);
  }, [product]);

  const modelCode = useMemo(() => {
    if (!product) return '';
    const raw = (product.name || '').trim();
    return isSkuLikeProductCode(raw) ? raw : '';
  }, [product]);

  const hasSecondaryTitleLine = useMemo(() => {
    if (!product) return false;
    if (modelCode) return true;
    return Boolean(product.shortTitle?.trim() && product.shortTitle.trim() !== displayTitle.trim());
  }, [product, modelCode, displayTitle]);

  const secondaryTitleLine = useMemo(() => {
    if (!product) return '';
    if (modelCode) return `Model ${modelCode}`;
    const st = (product.shortTitle || '').trim();
    if (st && st !== displayTitle.trim()) return product.name.trim();
    return '';
  }, [product, modelCode, displayTitle]);

  const sidebarLeadDescription = useMemo(() => {
    if (!product) return '';
    const fromDesc = leadDescriptionParagraph(product.description || '');
    if (fromDesc) return fromDesc;
    const plain = (product.detailHtml || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return leadDescriptionParagraph(plain);
  }, [product]);

  /** 侧栏卖点：首屏最多 4 条紧凑展示，其余折叠，避免与上方摘要抢空间 */
  const asideHighlights = useMemo(() => {
    if (!product) return { primary: [] as string[], rest: [] as string[] };
    const list = resolveProductHighlights(product);
    return {
      primary: list.slice(0, 4),
      rest: list.slice(4),
    };
  }, [product]);

  const brandSectionImages = useMemo(() => {
    const list = product?.images?.filter(Boolean);
    if (!list?.length) return [];
    return pickBrandSectionImages(list);
  }, [product?.images]);

  useEffect(() => {
    if (!displayTitle) return;
    const prev = document.title;
    document.title = `${displayTitle} · Homaire`;
    return () => {
      document.title = prev;
    };
  }, [displayTitle]);

  const categoryLabel = useMemo(() => {
    if (!product) return '';
    const cat = categories.find((c) => c.slug === product.category);
    return cat ? displayCategoryName(cat) : product.category;
  }, [product, categories]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center font-black uppercase tracking-tighter text-2xl animate-pulse">
        Loading...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-white text-brand-navy px-6">
        <p className="text-lg font-brand font-bold uppercase tracking-tight">Product not found</p>
        <p className="text-sm text-brand-navy/50 text-center max-w-md">
          This item may have been removed from the catalog, or the link is invalid.
        </p>
        <Link
          to="/"
          className="text-xs font-bold uppercase tracking-widest text-brand-beige border border-brand-beige px-8 py-3 rounded-full hover:bg-brand-beige hover:text-white transition-colors"
        >
          Back to home
        </Link>
      </div>
    );
  }

  const images = product.images?.length ? product.images : ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=1200'];

  const imageAt = (index: number) => images[index % images.length];

  const media: ProductMedia[] = [
    ...(product.videoUrl ? [{ type: 'video' as const, url: product.videoUrl, label: 'Product Video' }] : []),
    ...images.map((url, index) => ({
      type: 'image' as const,
      url,
      label: `Image ${String(index + 1).padStart(2, '0')}`,
    })),
  ];

  const currentMedia = media[activeMedia] || media[0];

  const mediaAltBase = displayStoreProductTitle(product);
  const mediaAltAttr = mediaAltBase.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

  const fallbackDetailHtml = `
    <section class="detail-block">
      <div>
        <img src="${imageAt(1)}" alt="${mediaAltAttr} lifestyle view" />
      </div>
      <div>
        <p class="eyebrow">Living Scenario</p>
        <h3>Designed around real rooms</h3>
        <p>${product.description}</p>
      </div>
    </section>
    <section class="detail-block reverse">
      <div>
        <img src="${imageAt(2)}" alt="${mediaAltAttr} material view" />
      </div>
      <div>
        <p class="eyebrow">Material & Comfort</p>
        <h3>Comfort that works every day</h3>
        <p>Soft upholstery, compact proportions, and easy-to-live-with construction make this piece suitable for apartments, guest rooms, and flexible living spaces.</p>
      </div>
    </section>
  `;

  const detailHtml = product.detailHtml?.trim() || fallbackDetailHtml;
  const detailHtmlForStory = stripPlaceholderStoryEyebrows(normalizeDetailHtmlStory(detailHtml));

  const recommendations = relatedProducts
    .filter((item) => item.id !== product.id)
    .slice(0, 4);

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i += 1) {
      addItem(product);
    }
    setShowAddedMsg(true);
    setTimeout(() => setShowAddedMsg(false), 3000);
  };

  const stockQty = Math.max(0, Math.floor(Number(product.stock) || 0));
  const lowStockThreshold = Math.max(1, config?.lowStockThreshold ?? 10);
  const stockOut = stockQty <= 0;
  const stockLow = !stockOut && stockQty < lowStockThreshold;
  const stockNumClass = stockOut
    ? 'text-red-600'
    : stockLow
      ? 'text-amber-700'
      : 'text-brand-navy';

  const unitPriceEur = roundStorePrice(
    product.onSale && product.discountPrice != null ? product.discountPrice : product.price
  );
  const lineSubtotalEur = Math.max(0, unitPriceEur * quantity);
  const freeShipThreshold = getShippingFreeThreshold(config);
  const flatShipFee = getShippingFlatFee(config);
  const shippingComplimentary = lineSubtotalEur > freeShipThreshold;
  const shippingEstimate = shippingComplimentary ? 0 : flatShipFee;
  const stockLabel = getProductDetailStockLabel(config);
  const shipLabel = getProductDetailShippingLabel(config);
  const shipFreeLabel = getProductDetailShippingFreeLabel(config);
  const lowStockHint = getProductDetailLowStockHint(config);
  const outStockHint = getProductDetailOutOfStockHint(config);
  const shippingFootnote = getProductDetailShippingFootnote(config, {
    threshold: freeShipThreshold,
    flatFee: flatShipFee,
  });

  return (
    <div className="w-full bg-white text-brand-navy">
      <section className="max-w-7xl mx-auto px-4 pt-10 pb-24">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-brand-navy/30 font-bold mb-10">
          <Link to="/" className="hover:text-brand-navy transition-colors">Home</Link>
          <span className="opacity-30">/</span>
          <Link to={`/category/${product.category}`} className="hover:text-brand-navy capitalize">{categoryLabel}</Link>
          <span className="opacity-30">/</span>
          <span className="text-brand-navy line-clamp-2">{displayTitle}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] gap-12 xl:gap-20">
          <div className="space-y-5">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative aspect-square overflow-hidden bg-brand-gray border border-brand-gray rounded-3xl"
            >
              {currentMedia.type === 'video' ? (
                <video
                  src={currentMedia.url}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                  controls
                />
              ) : (
                <img src={currentMedia.url} alt={mediaAltBase} className="w-full h-full object-cover" />
              )}
            </motion.div>

            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
              {media.slice(0, 8).map((item, index) => (
                <button
                  key={`${item.url}-${index}`}
                  onClick={() => setActiveMedia(index)}
                  className={`relative aspect-square overflow-hidden rounded-xl border transition-all ${activeMedia === index ? 'border-brand-beige ring-4 ring-brand-beige/10' : 'border-brand-gray hover:border-brand-beige/60'}`}
                  aria-label={item.label}
                >
                  {item.type === 'video' ? (
                    <div className="w-full h-full bg-brand-navy flex items-center justify-center">
                      <Play className="w-5 h-5 text-white fill-current" />
                    </div>
                  ) : (
                    <img src={item.url} alt="" className="w-full h-full object-cover" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <aside className="lg:sticky lg:top-40 self-start">
            <div className="mb-6">
              <span className="text-brand-beige text-[9px] uppercase tracking-[0.3em] font-bold bg-brand-beige/5 px-3 py-1 rounded-full border border-brand-beige/10 inline-block">
                Premium Collection
              </span>
            </div>

            <h1
              className={`font-brand font-bold tracking-tighter text-brand-navy text-balance normal-case break-words hyphens-auto ${
                displayTitle.length > 72
                  ? 'text-lg sm:text-xl md:text-2xl lg:text-3xl leading-snug line-clamp-4'
                  : displayTitle.length > 48
                    ? 'text-xl sm:text-2xl md:text-3xl lg:text-4xl leading-snug line-clamp-4'
                    : displayTitle.length > 28
                      ? 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl leading-[1.08] line-clamp-5'
                      : 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-[1.05]'
              } ${hasSecondaryTitleLine ? 'mb-3' : 'mb-8'}`}
            >
              {displayTitle}
            </h1>
            {hasSecondaryTitleLine ? (
              <p className="text-[11px] text-brand-navy/45 font-medium leading-snug mb-8 line-clamp-2">{secondaryTitleLine}</p>
            ) : null}

            {(asideHighlights.primary.length > 0 || asideHighlights.rest.length > 0) && (
              <div className="mb-6 border-t border-brand-gray/40 pt-5">
                <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-brand-navy/35 mb-3">Highlights</p>
                <ul className="space-y-2.5">
                  {asideHighlights.primary.map((feature, idx) => (
                    <li key={`ph-${String(idx)}`} className="flex gap-2.5 items-start">
                      <Check className="w-4 h-4 shrink-0 text-brand-beige mt-0.5" aria-hidden />
                      <span className="min-w-0 text-sm font-medium text-brand-navy/80 leading-snug normal-case line-clamp-2">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                {asideHighlights.rest.length > 0 ? (
                  <details className="mt-3 group">
                    <summary className="cursor-pointer list-none text-[10px] font-bold uppercase tracking-widest text-brand-beige hover:text-brand-navy transition-colors [&::-webkit-details-marker]:hidden flex items-center gap-1">
                      <span>+{asideHighlights.rest.length} more</span>
                    </summary>
                    <ul className="mt-3 space-y-2 border-l border-brand-beige/25 pl-3 ml-1">
                      {asideHighlights.rest.map((feature, idx) => (
                        <li key={`rh-${String(idx)}`} className="flex gap-2 items-start">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand-beige/80" aria-hidden />
                          <span className="min-w-0 text-xs font-medium text-brand-navy/70 leading-snug normal-case line-clamp-3">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : null}
              </div>
            )}

            <div className="mb-8">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className={`text-5xl font-brand font-bold ${product.onSale ? 'text-brand-beige' : 'text-brand-navy'} tracking-tighter`}>
                  {formatEurPrice(product.discountPrice || product.price)}
                </span>
                {product.onSale && (
                  <span className="text-lg text-brand-navy/25 font-bold line-through tracking-tighter">
                    {formatEurPrice(product.price)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center bg-white border border-brand-navy rounded-xl overflow-hidden shrink-0 shadow-sm">
                <button onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="p-5 hover:text-brand-beige transition-colors text-brand-navy" aria-label="Decrease quantity">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-14 text-center font-bold text-2xl text-brand-navy">{quantity}</span>
                <button onClick={() => setQuantity((value) => value + 1)} className="p-5 hover:text-brand-beige transition-colors text-brand-navy" aria-label="Increase quantity">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                className="flex-grow bg-brand-navy text-white uppercase font-bold tracking-widest text-[12px] py-5 hover:bg-brand-beige transition-all relative overflow-hidden shadow-2xl rounded-2xl group"
              >
                <span className="group-hover:scale-105 block transition-transform">Add to Bag</span>
                <AnimatePresence>
                  {showAddedMsg && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-brand-beige flex items-center justify-center text-white"
                    >
                      Added To Bag
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </aside>
        </div>
      </section>

      <section className="border-t border-brand-gray bg-white" aria-label="Availability, shipping, and documents">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
          <div className="rounded-[1.75rem] border border-brand-gray/80 bg-brand-gray/10 px-4 py-4 shadow-sm sm:px-6 sm:py-5">
            <div
              className={`grid grid-cols-1 gap-4 sm:gap-6 ${product.manualUrl ? 'lg:grid-cols-3' : 'sm:grid-cols-2'}`}
            >
              <div
                role="status"
                aria-live="polite"
                aria-label={stockOut ? outStockHint : `${stockLabel} ${stockQty}`}
                className="flex min-w-0 flex-col gap-0.5 rounded-xl bg-white/60 px-3 py-3 ring-1 ring-brand-gray/30 sm:px-4"
              >
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-navy/45">{stockLabel}</span>
                <span className={`text-xl font-brand font-bold tabular-nums tracking-tight ${stockNumClass}`}>
                  {stockOut ? '—' : stockQty}
                </span>
                {stockLow && !stockOut ? (
                  <span className="text-[10px] font-medium text-amber-800/90">{lowStockHint}</span>
                ) : null}
                {stockOut ? <span className="text-[10px] font-medium text-red-700/90">{outStockHint}</span> : null}
              </div>

              <div className="flex min-w-0 flex-col gap-0.5 rounded-xl bg-white/60 px-3 py-3 ring-1 ring-brand-gray/30 sm:px-4">
                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-navy/45">
                  <Truck className="h-3.5 w-3.5 shrink-0 text-brand-beige" aria-hidden />
                  {shipLabel}
                </span>
                <span className={`text-base font-bold tabular-nums ${shippingComplimentary ? 'text-emerald-700' : 'text-brand-navy'}`}>
                  {shippingComplimentary ? shipFreeLabel : formatStoreMoney(shippingEstimate, config?.currency)}
                </span>
                <span className="text-[10px] leading-snug text-brand-navy/45">{shippingFootnote}</span>
              </div>

              {product.manualUrl ? (
                <a
                  href={product.manualUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-[5.5rem] items-center justify-between gap-4 rounded-xl border border-brand-beige/35 bg-brand-beige/5 px-4 py-4 text-brand-navy transition-colors hover:border-brand-beige hover:bg-brand-beige/10 sm:col-span-2 lg:col-span-1"
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-brand-beige shadow-sm">
                      <FileText className="w-5 h-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[10px] font-black uppercase tracking-widest text-brand-navy">Installation PDF</span>
                      <span className="block text-[10px] font-bold uppercase tracking-widest text-brand-navy/35 mt-1 truncate">
                        Download assembly guide
                      </span>
                    </span>
                  </span>
                  <Download className="h-4 w-4 shrink-0 text-brand-beige" />
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-brand-gray bg-brand-gray/35">
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="flex flex-col gap-10 lg:gap-14">
            <header className="shrink-0">
              <span className="text-brand-beige text-[11px] font-black uppercase tracking-[0.45em] block mb-4">Details</span>
              <h2 className="text-4xl md:text-6xl font-brand font-bold uppercase tracking-tighter leading-none">Product Story</h2>
            </header>
            <div className={PRODUCT_STORY_BODY_CLASSNAME} dangerouslySetInnerHTML={{ __html: detailHtmlForStory }} />
          </div>
        </div>
      </section>

      <section className="bg-brand-gray/35 border-y border-brand-gray">
        <div
          className={`max-w-7xl mx-auto px-4 py-24 grid grid-cols-1 gap-14 items-center ${brandSectionImages.length > 0 ? 'lg:grid-cols-[0.9fr_1.1fr]' : ''}`}
        >
          <div>
            <Logo size="lg" className="mb-10" />
            <h2 className="text-4xl md:text-6xl font-brand font-bold text-brand-navy tracking-tight leading-tight mb-8">
              For Every Corner of Home.
            </h2>
            <p className="text-lg text-brand-navy/60 leading-relaxed font-medium text-pretty">
              {sidebarLeadDescription ||
                'Homaire brings together practical, comfortable pieces for real routines — living, dining, sleep, outdoor, and more — so your home feels complete without the clutter.'}
            </p>
          </div>
          {brandSectionImages.length > 0 ? (
            <div className="grid grid-cols-2 gap-5">
              {brandSectionImages.map((src, idx) => (
                <div
                  key={`${src}-${String(idx)}`}
                  className="aspect-square rounded-2xl overflow-hidden bg-white border border-brand-gray"
                >
                  <img
                    src={src}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {recommendations.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-28">
          <div className="flex justify-between items-end mb-14">
            <div>
              <span className="text-brand-beige text-[11px] font-black uppercase tracking-[0.45em] block mb-4">More</span>
              <h2 className="text-4xl md:text-5xl font-brand font-bold uppercase tracking-tighter text-brand-navy leading-tight">You May Also Like</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {recommendations.map((item, index) => {
              const cardTitle = displayStoreProductTitle(item, RELATED_CARD_TITLE_MAX_CHARS);
              return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06 }}
                className="group"
              >
                <Link to={`/product/${item.id}`}>
                  <div className="aspect-square bg-brand-gray overflow-hidden mb-6 rounded-2xl relative border border-brand-gray">
                    <img src={item.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={cardTitle} />
                  </div>
                  <h4 className="text-sm font-black uppercase tracking-tight text-brand-navy group-hover:text-brand-accent transition-colors leading-tight mb-2 line-clamp-2 break-words hyphens-auto">{cardTitle}</h4>
                  <p className="text-lg font-black text-brand-navy tracking-tighter">{formatEurPrice(item.discountPrice || item.price)}</p>
                </Link>
              </motion.div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
