import { useProducts } from '../hooks/useProducts';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Tag, Zap, Percent, ArrowRight, Clock, ShoppingCart } from 'lucide-react';
import { useMemo } from 'react';
import { useCart } from '../components/CartContext';
import { displayStoreProductTitle } from '../lib/storeShortTitle';

const SALE_GRID_TITLE_MAX = 56;

export default function SalePage() {
  const { products, loading } = useProducts();
  const { addItem } = useCart();

  const saleProducts = useMemo(() => {
    return products.filter(p => p.onSale || p.category === 'sale');
  }, [products]);

  if (loading) {
    return <div className="h-screen flex items-center justify-center font-black uppercase tracking-tighter text-3xl animate-pulse">Loading Deals...</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Sale Hero */}
      <section className="bg-brand-beige text-white py-32 relative overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-white/10 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-brand-navy/10 rounded-full blur-2xl" />
        
        <div className="max-w-7xl mx-auto px-4 relative z-10 pt-[100px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-3 bg-white text-brand-beige px-8 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest mb-10 shadow-2xl border border-brand-beige/20">
              <Zap className="w-4 h-4 fill-current" /> Privilege Access ends in 04:22:15
            </div>
            <h1 className="text-7xl md:text-9xl font-brand font-bold uppercase tracking-tighter mb-8 leading-none drop-shadow-xl">
              UP TO <br /> <span className="text-brand-navy">70% OFF</span>
            </h1>
            <p className="max-w-xl mx-auto text-brand-navy/60 font-medium uppercase text-xs tracking-[0.2em] leading-relaxed">
              For Every Corner of Home — premium craftsmanship at exceptional event pricing.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Trust Banner */}
      <div className="bg-brand-navy py-6 overflow-hidden whitespace-nowrap border-y border-brand-navy">
        <div className="flex gap-16 animate-marquee">
          {Array.from({ length: 15 }).map((_, i) => (
             <div key={i} className="flex items-center gap-6 text-white font-bold uppercase tracking-[0.3em] text-[10px]">
               <Percent className="w-4 h-4 text-brand-beige" /> BRAND PRIVILEGE 
               <Tag className="w-4 h-4 text-brand-beige" /> EXECUTIVE DEALS 
               <Clock className="w-4 h-4 text-brand-beige" /> LIMITED RUN
             </div>
          ))}
        </div>
      </div>

      {/* Sale Grid */}
      <section className="max-w-7xl mx-auto px-4 py-32">
        <div className="flex justify-between items-end mb-20 border-b border-brand-gray pb-12">
            <div>
                <h2 className="text-5xl font-brand font-bold uppercase tracking-tighter text-brand-navy leading-none">THE PRIVILEGE COLLECTION</h2>
                <p className="text-brand-navy/30 font-bold uppercase text-[10px] tracking-[0.3em] mt-4">{saleProducts.length} Curated Pieces Identified</p>
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-10 gap-y-20">
          {saleProducts.map((product, i) => {
            const listTitle = displayStoreProductTitle(product, SALE_GRID_TITLE_MAX);
            return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 12) * 0.05 }}
              className="group"
            >
              <Link to={`/product/${product.id}`}>
                <div className="aspect-[4/5] bg-brand-gray overflow-hidden mb-6 relative border border-brand-gray transition-all shadow-sm rounded-[2rem]">
                  <img 
                    src={product.images[0]} 
                    alt={listTitle} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  />
                  
                  {/* Sale Badges */}
                  <div className="absolute top-6 left-6 flex flex-col gap-2">
                    <span className="bg-brand-beige text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full shadow-2xl">
                      -{Math.round((1 - (product.discountPrice || product.price) / product.price) * 100)}%
                    </span>
                    <span className="bg-brand-navy text-white text-[8px] font-bold uppercase tracking-widest px-3 py-1 rounded-lg shadow-xl">
                      Signature Sale
                    </span>
                  </div>

                  <button 
                    className="absolute bottom-6 left-6 right-6 bg-brand-navy text-white py-5 text-[10px] font-bold uppercase tracking-widest translate-y-24 group-hover:translate-y-0 transition-all duration-500 shadow-3xl rounded-2xl flex items-center justify-center gap-2 hover:bg-brand-beige"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      addItem(product);
                    }}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Acquire Selection <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="px-2">
                  <h3 className="text-base font-brand font-bold uppercase tracking-tight mb-2 text-brand-navy group-hover:text-brand-beige transition-colors line-clamp-2 break-words hyphens-auto">{listTitle}</h3>
                  <div className="flex items-center gap-4">
                    <span className="text-xl font-bold text-brand-beige">€ {(product.discountPrice || product.price).toLocaleString()}</span>
                    <span className="text-xs font-bold text-brand-navy/20 line-through">€ {product.price.toLocaleString()}</span>
                  </div>
                </div>
              </Link>
            </motion.div>
            );
          })}
        </div>

        {saleProducts.length === 0 && (
          <div className="text-center py-48 bg-brand-gray/30 border border-brand-gray rounded-[4rem]">
             <p className="font-bold uppercase tracking-tighter text-4xl text-brand-navy/10">Limited Entries Identified</p>
          </div>
        )}
      </section>

      {/* Featured Promo */}
      <section className="bg-brand-gray/30 py-32 mb-32 border-y border-brand-gray">
          <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
             <div className="relative group overflow-hidden rounded-[3rem] shadow-3xl border border-brand-gray">
                <img 
                    src="https://images.unsplash.com/photo-1540574163026-643ea20ade25?auto=format&fit=crop&q=80&w=1200" 
                    className="w-full aspect-square object-cover transition-transform duration-1000 group-hover:scale-105"
                    alt="Outlet Collection"
                />
                <div className="absolute inset-0 bg-brand-beige/5 group-hover:bg-transparent transition-colors" />
             </div>
             <div>
                <span className="text-brand-beige font-bold uppercase tracking-[0.4em] text-[10px] block mb-6">Archive Access</span>
                <h2 className="text-5xl md:text-8xl font-brand font-bold uppercase tracking-tighter text-brand-navy leading-[0.8] mb-10">THE HOMAIRE <br /> SALE</h2>
                <p className="text-brand-navy/60 font-medium mb-12 leading-relaxed text-xl">
                    Signature silhouettes, floor samples, and archived editions at exclusive brand privilege prices. These pieces define our history and your space.
                </p>
                <div className="grid grid-cols-2 gap-12 mb-16">
                    <div>
                        <p className="text-5xl font-brand font-bold text-brand-navy tracking-tighter leading-none mb-3">400+</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/30">Daily Entries</p>
                    </div>
                    <div>
                        <p className="text-5xl font-brand font-bold text-brand-navy tracking-tighter leading-none mb-3">99.2%</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/30">Client Loyalty</p>
                    </div>
                </div>
                <Link 
                  to="/category/sofas" 
                  className="inline-block bg-brand-navy text-white px-16 py-6 rounded-full font-bold uppercase tracking-widest hover:bg-brand-beige transition-all shadow-3xl"
                >
                    Browse The Archive
                </Link>
             </div>
          </div>
      </section>
    </div>
  );
}
