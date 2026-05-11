import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { useState, useEffect, useMemo, Fragment } from 'react';
import { useCart } from '../components/CartContext';
import { usePromotions, useStoreConfig } from '../hooks/useAdminData';
import { mergeTrustItems } from '../lib/siteContent';
import type { Promotion } from '../types';
import heroModelSceneImage from '../assets/hero-model-scene.png';

const BRAND_BOARD_IMAGE = '/homaire-brand-board.png';

const fallbackProductImage = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=1200&h=1200';

const HERO_IMAGE_FALLBACK = heroModelSceneImage;

const DEFAULT_HERO_BANNERS = [
  {
    title: "Every Corner of Home",
    subtitle: "Practical, comfortable pieces for living rooms that work as hard as you do.",
    imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=2000",
    cta: "Shop Sofas",
    link: "/category/sofas"
  },
  {
    title: "Curated for Modern Living",
    subtitle: "Thoughtful form, warm materials, and layouts that feel complete — not crowded.",
    imageUrl: heroModelSceneImage,
    cta: "Explore Now",
    link: "/category/sofas"
  },
  {
    title: "Restful Bedrooms",
    subtitle: "Beds and accents shaped for calm, storage, and everyday ease.",
    imageUrl: "https://images.unsplash.com/photo-1505693415918-91e514789da1?auto=format&fit=crop&q=80&w=2000",
    cta: "Shop Beds",
    link: "/category/beds"
  },
  {
    title: "Gather & Dine",
    subtitle: "Tables sized for real rooms — everyday meals and unhurried weekends.",
    imageUrl: "https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&q=80&w=2000",
    cta: "Shop Tables",
    link: "/category/tables"
  },
  {
    title: "Outdoor & Garden",
    subtitle: "Weather-ready comfort for balconies, patios, and open-air moments.",
    imageUrl: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=2000",
    cta: "Shop Garden",
    link: "/category/garden"
  }
] as const;

function resolveHeroBannerImageUrl(banner: Pick<Promotion, 'imageUrl'> | (typeof DEFAULT_HERO_BANNERS)[number] | undefined): string {
  const raw = banner && 'imageUrl' in banner ? banner.imageUrl : undefined;
  if (typeof raw === 'string' && raw.trim().length > 0) return raw.trim();
  return HERO_IMAGE_FALLBACK;
}

function cssUrlValue(url: string): string {
  return `url("${url.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}")`;
}

export default function Home() {
  const { products, loading: productsLoading } = useProducts();
  const { promotions } = usePromotions();
  const { config } = useStoreConfig();
  const { addItem } = useCart();
  const [currentBanner, setCurrentBanner] = useState(0);
  const [heroSlideImageFailed, setHeroSlideImageFailed] = useState(false);

  const activeHeroPromos = promotions.filter(p => p.active && p.type === 'hero');
  const activeCardPromos = promotions.filter(p => p.active && p.type === 'card');
  const activeSalePromos = promotions.filter(p => p.active && p.type === 'sale');

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

  useEffect(() => {
    setHeroSlideImageFailed(false);
  }, [currentBanner]);

  useEffect(() => {
    if (displayBanners.length > 0) {
      const timer = setInterval(() => {
        setCurrentBanner(prev => (prev + 1) % displayBanners.length);
      }, 8000);
      return () => clearInterval(timer);
    }
  }, [displayBanners.length]);

  const featuredCategories = [
    { name: 'Sofas', slug: 'sofas', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=600' },
    { name: 'Beds', slug: 'beds', image: 'https://images.unsplash.com/photo-1505691938895-1758d7eaa511?auto=format&fit=crop&q=80&w=600' },
    { name: 'Tables', slug: 'tables', image: 'https://images.unsplash.com/photo-1577145745727-42b88d4cfc84?auto=format&fit=crop&q=80&w=600' },
    { name: 'Chairs', slug: 'chairs', image: 'https://images.unsplash.com/photo-1592078619091-155851b720b0?auto=format&fit=crop&q=80&w=600' },
    { name: 'Garden', slug: 'garden', image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=600' },
    { name: 'Lighting', slug: 'lighting', image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&q=80&w=600' },
    { name: 'Storage', slug: 'storage', image: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&q=80&w=600' },
    { name: 'Decor', slug: 'decor', image: 'https://images.unsplash.com/photo-1513519247388-4e284044efd3?auto=format&fit=crop&q=80&w=600' },
  ];

  const sidebarProducts = products.slice(0, 3);
  const featuredProducts = products.slice(0, 8);
  const productImage = (product: { images?: string[] }) => product.images?.[0] || fallbackProductImage;

  const currentHeroSlide = displayBanners[currentBanner];
  const resolvedHeroImageUrl = heroSlideImageFailed
    ? HERO_IMAGE_FALLBACK
    : (currentHeroSlide?.imageUrl?.trim() || HERO_IMAGE_FALLBACK);

  return (
    <div className="space-y-1 pb-20 bg-brand-gray">
      {/* Main Layout Area */}
      <section className="bg-brand-gray p-1">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-1 h-[70vh]">
          {/* Hero Section */}
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
                  {/* CSS poster layer: fills hero when img is slow or has no usable src */}
                  <div
                    aria-hidden
                    className="absolute inset-0 z-0 bg-cover bg-center opacity-90 motion-safe:scale-105 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                    style={{ backgroundImage: cssUrlValue(resolvedHeroImageUrl) }}
                  />
                  <motion.img 
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 10, ease: "linear" }}
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
                      to={displayBanners[currentBanner]?.link || "/category/sofas"} 
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
              onClick={() => setCurrentBanner((currentBanner - 1 + displayBanners.length) % displayBanners.length)}
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
            
            {/* Banner Indicators */}
            <div className="absolute bottom-8 right-8 flex gap-2 z-10">
               {displayBanners.map((_, i) => (
                 <button 
                  key={i} 
                  onClick={() => setCurrentBanner(i)}
                  className={`h-1 transition-all duration-500 ${currentBanner === i ? 'w-12 bg-brand-beige' : 'w-4 bg-white/30 hover:bg-white/60'}`} 
                 />
               ))}
            </div>
          </div>

          {/* Sidebar Promos - Card Type */}
          <div className="md:col-span-4 flex flex-col gap-1">
            {activeCardPromos.length > 0 ? (
              activeCardPromos.slice(0, 2).map((promo, idx) => (
                <div key={promo.id} className={`flex-1 relative overflow-hidden group ${idx === 1 ? 'bg-brand-navy text-white' : 'bg-white text-brand-navy'}`}>
                   <img src={promo.imageUrl || fallbackProductImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-40 transition-opacity duration-700" />
                   <div className="relative p-10 h-full flex flex-col justify-center z-10">
                      <span className="text-brand-beige font-bold uppercase text-[10px] tracking-[0.3em] mb-4">Featured / {promo.type}</span>
                      <h2 className="text-2xl font-brand font-bold mb-4 uppercase leading-none tracking-tighter">{promo.title}</h2>
                      <p className="text-sm opacity-70 mb-8 font-medium">{promo.subtitle}</p>
                      <Link to={promo.link || "/"} className="text-[10px] font-bold border-b border-brand-beige uppercase tracking-widest hover:text-brand-beige transition-colors inline-block w-fit">
                        Explore
                      </Link>
                   </div>
                </div>
              ))
            ) : sidebarProducts.length > 0 ? (
              sidebarProducts.map((product, idx) => (
                <Link
                  key={product.id}
                  to={`/product/${product.id}`}
                  className={`flex-1 relative overflow-hidden group ${idx === 1 ? 'bg-brand-navy text-white' : 'bg-white text-brand-navy'}`}
                >
                  <img src={productImage(product)} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-35 transition-opacity duration-700" />
                  <div className="relative p-8 h-full flex flex-col justify-center z-10">
                    <span className="text-brand-beige font-bold uppercase text-[10px] tracking-[0.3em] mb-3">Featured Product</span>
                    <h2 className="text-2xl font-brand font-bold mb-3 uppercase leading-none tracking-tighter">{product.name}</h2>
                    <p className="text-sm opacity-70 mb-5 font-medium capitalize">{product.category}</p>
                    <span className="text-[10px] font-bold border-b border-brand-beige uppercase tracking-widest hover:text-brand-beige transition-colors inline-block w-fit">
                      View Product
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <>
                <div className="flex-1 bg-white p-10 flex flex-col justify-center border-l-4 border-l-brand-beige relative overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1505693415918-91e514789da1?auto=format&fit=crop&q=80&w=900" alt="" className="absolute inset-0 w-full h-full object-cover opacity-15" />
                  <div className="relative z-10">
                    <span className="text-brand-beige font-bold uppercase text-[10px] tracking-widest mb-2 block">Limited Series</span>
                    <h2 className="text-2xl font-brand font-bold text-brand-navy mb-2 uppercase leading-tight">Master <br />Suites</h2>
                    <p className="text-sm text-brand-navy/60 mb-6 font-medium">Curated comfort for the most intimate spaces.</p>
                    <Link to="/category/beds" className="text-[10px] font-bold border-b border-brand-beige uppercase tracking-widest hover:opacity-70 transition-opacity inline-block w-fit">
                      View Gallery
                    </Link>
                  </div>
                </div>
                <div className="flex-1 bg-brand-navy text-white p-10 flex flex-col justify-center overflow-hidden group relative">
                  <img src="https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&q=80&w=900" alt="" className="absolute inset-0 w-full h-full object-cover opacity-15 group-hover:opacity-25 transition-opacity" />
                  <div className="relative z-10">
                    <h2 className="text-2xl font-brand font-bold mb-2 text-brand-beige uppercase leading-tight">The Archive</h2>
                    <p className="text-sm opacity-60 mb-6 font-medium">Timeless pieces reaching their final availability.</p>
                    <Link to="/category/sale" className="inline-block border border-white/20 text-white px-6 py-4 text-[10px] font-bold uppercase tracking-widest hover:bg-brand-beige hover:border-brand-beige transition-all text-center">
                      Shop Archive
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="bg-white border-y border-brand-gray">
        <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {trustItems.map((item, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-gray rounded-full flex items-center justify-center text-brand-navy">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.iconPath}></path></svg>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-tight text-brand-navy">{item.title}</p>
                <p className="text-[10px] text-brand-navy/40 font-medium uppercase tracking-wider">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Categories */}
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
          <Link to="/" className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/30 hover:text-brand-navy transition-colors pb-1 border-b border-transparent hover:border-brand-navy/30">
            {(config?.homeShopViewAllLabel || 'View All').trim()}
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featuredCategories.map((cat, i) => (
            <motion.div
              key={cat.slug}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Link to={`/category/${cat.slug}`} className="group block relative aspect-square overflow-hidden bg-brand-gray rounded-3xl">
                <img 
                  src={cat.image} 
                  alt={cat.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" 
                />
                <div className="absolute inset-0 bg-brand-navy/20 group-hover:bg-brand-navy/40 transition-colors" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <h3 className="text-white text-2xl font-brand font-bold uppercase tracking-tighter leading-none mb-3">{cat.name}</h3>
                  <div className="w-8 h-1 bg-brand-beige group-hover:w-16 transition-all duration-500" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* About Homaire */}
      <section className="max-w-7xl mx-auto px-4 pt-32">
        <div className="bg-white rounded-[4rem] overflow-hidden shadow-sm border border-brand-border">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="p-16 lg:p-24 flex flex-col justify-center order-2 lg:order-1">
              <span className="text-brand-sage text-[10px] uppercase tracking-[0.4em] font-bold block mb-8">
                {(config?.homeAboutEyebrow || 'About Homaire').trim()}
              </span>
              <h2 className="text-4xl md:text-5xl font-brand font-bold text-brand-navy leading-[1.05] tracking-tight mb-10">
                {(config?.homeAboutTitle || 'Practical comfort for modern homes').trim()}
              </h2>
              <p className="text-brand-charcoal/85 text-lg mb-6 font-medium leading-relaxed border-l-2 border-brand-beige pl-8">
                {(config?.homeAboutBody ||
                  'Homaire creates practical and comfortable home solutions for modern living. With a wide range of products across furniture, outdoor, kitchen, bathroom, pets, lighting and more, we help you make every space feel more complete.'
                ).trim()}
              </p>
              <p className="text-brand-navy font-brand font-semibold text-2xl tracking-tight">Homaire</p>
              <p className="text-brand-beige font-medium text-sm uppercase tracking-[0.2em] mt-3">For Every Corner of Home.</p>
            </div>
            <div className="aspect-[4/5] lg:aspect-auto relative min-h-[420px] lg:min-h-[560px] overflow-hidden bg-brand-gray order-1 lg:order-2">
              <img
                src={(config?.homeAboutBrandBoardUrl || BRAND_BOARD_IMAGE).trim()}
                alt="Homaire brand guidelines and visual identity"
                className="w-full h-full object-contain object-center p-6 sm:p-10 bg-[#f5f4ef]"
              />
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-l from-brand-sage/10 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Banner - Philosophy */}
      <section className="bg-brand-navy text-white py-32 mt-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          {/* Brand Pattern Background */}
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, #d4af7a 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center gap-20 relative z-10">
          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-brand-beige text-xs uppercase tracking-[0.4em] font-bold block mb-6">
                {(config?.homeManifestoEyebrow || 'Our promise').trim()}
              </span>
              <h2 className="text-4xl md:text-6xl font-brand font-bold mb-10 leading-[0.95] tracking-tighter uppercase">
                {(config?.homeManifestoTitle || 'For every corner\nof home.')
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
              <p className="text-white/70 text-lg mb-12 font-medium leading-relaxed max-w-xl">
                {(config?.homeManifestoBody ||
                  'From the living room to the balcony, kitchen to bathroom, we bring together pieces that feel considered, livable, and easy to love — so you can shape a home that works for real routines, not just photos.'
                ).trim()}
              </p>
              <Link
                to={(config?.homeManifestoCtaHref || '/').trim() || '/'}
                className="inline-flex items-center gap-4 bg-brand-beige text-brand-navy px-10 py-5 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-white hover:text-brand-navy transition-all shadow-2xl"
              >
                {(config?.homeManifestoCtaLabel || 'Shop the collection').trim()} <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
          <div className="flex-1 w-full relative">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="aspect-[4/5] relative rounded-[3rem] overflow-hidden shadow-2xl"
            >
              <img 
                src={(config?.homeManifestoImageUrl ||
                  'https://images.unsplash.com/photo-1540574163026-643ea20ade25?auto=format&fit=crop&q=80&w=1000'
                ).trim()} 
                alt="Craftsmanship" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/60 to-transparent" />
              <div className="absolute bottom-8 left-8 right-8 bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20">
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-4xl font-brand font-bold text-white block mb-1">
                      {(config?.homeManifestoCardTitle || 'Homaire').trim()}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-brand-beige">
                      {(config?.homeManifestoCardSub || 'Home living').trim()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-white uppercase tracking-widest block">
                      {(config?.homeManifestoCardYear || 'Since 2020').trim()}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trending Now */}
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
            [1,2,3,4,5,6,7,8].map(i => <div key={i} className="aspect-[4/5] bg-brand-gray animate-pulse rounded-[3rem]" />)
          ) : (
            featuredProducts.map((product, i) => (
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
                      alt={product.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" 
                    />
                    {product.onSale && (
                      <div className="absolute top-8 right-8 bg-brand-navy text-white px-5 py-2.5 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] shadow-xl border border-white/20">
                        Special Offer
                      </div>
                    )}
                    <div className="absolute inset-0 bg-brand-navy/0 group-hover:bg-brand-navy/40 transition-all duration-500" />
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        addItem(product as any);
                      }}
                      className="absolute bottom-8 left-8 right-8 bg-brand-beige text-white py-5 text-[10px] uppercase font-bold tracking-widest translate-y-24 group-hover:translate-y-0 transition-all duration-500 hover:bg-white hover:text-brand-navy shadow-2xl flex items-center justify-center gap-3 rounded-2xl"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Add To Collection
                    </button>
                  </div>
                  <div className="flex justify-between items-start px-4">
                    <div>
                      <h3 className="text-xl font-brand font-bold uppercase tracking-tighter mb-2 text-brand-navy group-hover:text-brand-beige transition-colors">{product.name}</h3>
                      <span className="text-brand-navy/30 text-[10px] uppercase font-bold tracking-[0.3em]">{product.category}</span>
                    </div>
                    <div className="text-right">
                       <span className="text-2xl font-brand font-bold text-brand-navy tracking-tighter">€{product.price.toLocaleString()}</span>
                       {product.onSale && <p className="text-[10px] text-brand-navy/20 font-bold line-through">€{Math.round(product.price * 1.25).toLocaleString()}</p>}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
