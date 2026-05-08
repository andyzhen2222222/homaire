import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ShoppingCart, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { useState, useEffect } from 'react';
import { useCart } from '../components/CartContext';
import { usePromotions } from '../hooks/useAdminData';

export default function Home() {
  const { products, loading: productsLoading } = useProducts();
  const { promotions, loading: promosLoading } = usePromotions();
  const { addItem } = useCart();
  const [currentBanner, setCurrentBanner] = useState(0);

  const activeHeroPromos = promotions.filter(p => p.active && p.type === 'hero');
  const activeCardPromos = promotions.filter(p => p.active && p.type === 'card');
  const activeSalePromos = promotions.filter(p => p.active && p.type === 'sale');

  // Fallback banners if none in DB
  const defaultBanners = [
    {
      title: "Modular Mastery",
      subtitle: "Explore the perfect fusion of minimalist art and ultimate comfort",
      imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=2000",
      cta: "View Collection",
      link: "/category/sofas"
    },
    {
      title: "The Founder's Selection",
      subtitle: "Elena Moretti curates the definitive collection for modular living.",
      imageUrl: "/artifact/839c4e09f5820461bdfa89df8af7df2db1afb96a.png",
      cta: "Explore Now",
      link: "/category/sofas"
    }
  ];

  const displayBanners = activeHeroPromos.length > 0 ? activeHeroPromos : defaultBanners;

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
    { name: 'Decor', slug: 'decor', image: 'https://images.unsplash.com/photo-1513519247388-4e284044efd3?auto=format&fit=crop&q=80&w=600' },
  ];

  return (
    <div className="space-y-1 pb-20 bg-brand-gray">
      {/* Main Layout Area */}
      <section className="bg-brand-gray p-1">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-1 h-[70vh]">
          {/* Hero Section */}
          <div className="md:col-span-8 relative bg-white overflow-hidden group">
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
                  <motion.img 
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 10, ease: "linear" }}
                    src={displayBanners[currentBanner]?.imageUrl} 
                    alt={displayBanners[currentBanner]?.title} 
                    className={`w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-700 ${displayBanners[currentBanner]?.imageUrl?.includes('08906967') ? 'w-[300%] h-[200%] max-w-none' : ''}`}
                    style={displayBanners[currentBanner]?.imageUrl?.includes('08906967') ? { objectPosition: '0% 0%' } : {}}
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-white/60 to-transparent" />
                </div>
                <div className="absolute bottom-12 left-12 max-w-md z-10">
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  >
                    <span className="text-brand-beige text-xs font-bold uppercase tracking-[0.3em] mb-4 block">Zip Small. Live Big.</span>
                    <h1 className="text-4xl md:text-6xl font-brand font-bold leading-[0.9] text-brand-navy mb-6 uppercase tracking-tighter">
                      {displayBanners[currentBanner]?.title}
                    </h1>
                    <p className="text-brand-navy/70 text-lg mb-8 font-medium">
                      {displayBanners[currentBanner]?.subtitle}
                    </p>
                    <Link 
                      to={displayBanners[currentBanner]?.link || "/category/sofas"} 
                      className="inline-flex items-center gap-4 bg-brand-navy text-white px-10 py-5 font-bold uppercase text-[10px] tracking-widest hover:bg-brand-beige transition-all shadow-2xl hover:-translate-y-1"
                    >
                      Explore Selection <ArrowRight className="w-4 h-4" />
                    </Link>
                  </motion.div>
                </div>
              </motion.div>
            </AnimatePresence>
            
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
                   <img src={promo.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-40 transition-opacity duration-700" />
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
            ) : (
              <>
                <div className="flex-1 bg-white p-10 flex flex-col justify-center border-l-4 border-l-brand-beige">
                  <span className="text-brand-beige font-bold uppercase text-[10px] tracking-widest mb-2">Limited Series</span>
                  <h2 className="text-2xl font-brand font-bold text-brand-navy mb-2 uppercase leading-tight">Master <br />Suites</h2>
                  <p className="text-sm text-brand-navy/60 mb-6 font-medium">Curated comfort for the most intimate spaces.</p>
                  <Link to="/category/beds" className="text-[10px] font-bold border-b border-brand-beige uppercase tracking-widest hover:opacity-70 transition-opacity inline-block w-fit">
                    View Gallery
                  </Link>
                </div>
                <div className="flex-1 bg-brand-navy text-white p-10 flex flex-col justify-center overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Sparkles className="w-20 h-20" />
                  </div>
                  <h2 className="text-2xl font-brand font-bold mb-2 text-brand-beige uppercase leading-tight">The Archive</h2>
                  <p className="text-sm opacity-60 mb-6 font-medium">Timeless pieces reaching their final availability.</p>
                  <Link to="/category/sale" className="inline-block border border-white/20 text-white px-6 py-4 text-[10px] font-bold uppercase tracking-widest hover:bg-brand-beige hover:border-brand-beige transition-all text-center">
                    Shop Archive
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="bg-white border-y border-brand-gray">
        <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { title: 'Free Delivery', sub: 'On all premium orders', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
            { title: '2-Year Warranty', sub: 'Guaranteed quality', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
            { title: 'Zip Small. Live Big.', sub: 'Compact efficiency', icon: 'M5 13l4 4L19 7' },
            { title: 'Expert Support', sub: 'Amsterdam based team', icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z' }
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-gray rounded-full flex items-center justify-center text-brand-navy">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon}></path></svg>
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
            <span className="text-brand-beige text-[10px] uppercase tracking-[0.3em] font-bold block mb-2">Curation</span>
            <h2 className="text-4xl text-brand-navy uppercase font-brand font-bold tracking-tighter">Shop by Function</h2>
          </div>
          <Link to="/" className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/30 hover:text-brand-navy transition-colors pb-1 border-b border-transparent hover:border-brand-navy/30">
            View All
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

      {/* Founder's Vision Section */}
      <section className="max-w-7xl mx-auto px-4 pt-32">
        <div className="bg-white rounded-[4rem] overflow-hidden shadow-sm border border-brand-gray">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="p-16 lg:p-24 flex flex-col justify-center">
              <span className="text-brand-beige text-[10px] uppercase tracking-[0.4em] font-bold block mb-8">Letter from the Founder</span>
              <h2 className="text-4xl md:text-6xl font-brand font-bold text-brand-navy uppercase leading-[0.9] tracking-tighter mb-10">THE <br />FOUNDER'S <br />VISION</h2>
              <p className="text-brand-navy/60 text-lg mb-12 font-medium leading-relaxed italic border-l-2 border-brand-beige pl-8">
                "Our design philosophy is simple: we create space where it doesn't exist. ZipSofa is about the intersection of high-concept aesthetics and the reality of modern life. Every stitch is a commitment to living big, regardless of the square footage."
              </p>
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-brand-navy text-xl font-brand font-bold uppercase tracking-tight">Elena Moretti</p>
                  <p className="text-brand-navy/30 text-[10px] uppercase font-bold tracking-[0.3em]">Chief Design Officer & Founder</p>
                </div>
              </div>
            </div>
            <div className="aspect-[4/5] lg:aspect-auto relative min-h-[600px] overflow-hidden">
              {/* Pose 1: Standing Pose (from 4x2 standing grid) */}
              <div className="absolute inset-0 w-full h-full bg-brand-gray/20">
                <img 
                  src="/artifact/b801a6b0c20a67232f05fe31707fc84a569769ed" 
                  alt="Elena Moretti - Founder Standing" 
                  className="w-[400%] h-[200%] max-w-none object-cover"
                  style={{ objectPosition: '0% 0%' }}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      parent.style.backgroundImage = 'url(https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800)';
                      parent.style.backgroundSize = 'cover';
                    }
                  }}
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-l from-brand-navy/0 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Banner - Philosophy */}
      <section className="bg-brand-navy text-white py-32 mt-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          {/* Brand Pattern Background */}
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, #C4A07A 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center gap-20 relative z-10">
          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-brand-beige text-xs uppercase tracking-[0.4em] font-bold block mb-6">Manifesto</span>
              <h2 className="text-4xl md:text-6xl font-brand font-bold mb-10 leading-[0.95] tracking-tighter uppercase">ZIP SMALL.<br />LIVE BIG.</h2>
              <p className="text-white/60 text-lg mb-12 font-medium leading-relaxed max-w-xl">
                True luxury isn't about space; it's about context. We design furniture that adapts to your life, whether you're blooming in a studio or expanding in a penthouse. Precision engineering meets high-aesthetic comfort.
              </p>
              <Link to="/" className="inline-flex items-center gap-4 bg-brand-beige text-white px-10 py-5 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-white hover:text-brand-navy transition-all shadow-2xl">
                The Brand Story <ArrowRight className="w-4 h-4" />
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
                src="https://images.unsplash.com/photo-1540574163026-643ea20ade25?auto=format&fit=crop&q=80&w=1000" 
                alt="Craftsmanship" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/60 to-transparent" />
              <div className="absolute bottom-8 left-8 right-8 bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20">
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-4xl font-brand font-bold text-white block mb-1">Amsterdam</span>
                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-brand-beige">Design Studio</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-white uppercase tracking-widest block">Est. 2020</span>
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
          <span className="text-brand-beige text-[10px] uppercase tracking-[0.4em] font-bold block mb-4">The Selection</span>
          <h2 className="text-4xl font-brand font-bold uppercase tracking-tighter text-brand-navy">Most Desired Objects</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
          {productsLoading ? (
            [1,2,3].map(i => <div key={i} className="aspect-[4/5] bg-brand-gray animate-pulse rounded-[3rem]" />)
          ) : (
            products.slice(0, 3).map((product, i) => (
              <motion.div 
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group"
              >
                <Link to={`/product/${product.id}`} className="block">
                  <div className="aspect-[4/5] bg-white overflow-hidden mb-8 shadow-sm border border-brand-gray relative group rounded-[3rem]">
                    <img 
                      src={product.images[0]} 
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
