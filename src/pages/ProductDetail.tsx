import { useParams, Link } from 'react-router-dom';
import { useProduct, useProducts } from '../hooks/useProducts';
import { useCart } from '../components/CartContext';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { Plus, Minus, Info, Check, ShieldCheck, Truck, FileText, Download, Play } from 'lucide-react';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { product, loading } = useProduct(id!);
  const { products: relatedProducts } = useProducts(product?.category);
  const { addItem } = useCart();
  const [activeMedia, setActiveMedia] = useState(0); // 0 could be video if present
  const [quantity, setQuantity] = useState(1);
  const [showAddedMsg, setShowAddedMsg] = useState(false);
  const [activeTab, setActiveTab] = useState<'design' | 'specs' | 'docs' | 'shipping'>('design');

  const tabs = [
    { id: 'design', label: '01 / Design Details' },
    { id: 'specs', label: '02 / Specifications' },
    { id: 'docs', label: '03 / Documents' },
    { id: 'shipping', label: '04 / Shipping' }
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 250; // Offset for sticky nav and layout header

      for (const tab of tabs) {
        const element = document.getElementById(tab.id);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveTab(tab.id as any);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const [isZooming, setIsZooming] = useState(false);

  if (loading || !product) {
    return <div className="h-screen flex items-center justify-center font-black uppercase tracking-tighter text-2xl animate-pulse">Loading...</div>;
  }

  const media = product.videoUrl 
    ? [{ type: 'video', url: product.videoUrl }, ...product.images.map(img => ({ type: 'image', url: img }))]
    : product.images.map(img => ({ type: 'image', url: img }));

  const currentMedia = media[activeMedia];

  const recommendations = relatedProducts
    .filter(p => p.id !== product.id)
    .slice(0, 4);

  const handleAddToCart = () => {
    for(let i = 0; i < quantity; i++) {
      addItem(product);
    }
    setShowAddedMsg(true);
    setTimeout(() => setShowAddedMsg(false), 3000);
  };

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-24">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-brand-navy/30 font-bold mb-12">
        <Link to="/" className="hover:text-brand-navy transition-colors">Home</Link>
        <span className="opacity-30">/</span>
        <Link to={`/category/${product.category}`} className="hover:text-brand-navy capitalize">{product.category}</Link>
        <span className="opacity-30">/</span>
        <span className="text-brand-navy">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 xl:gap-24 mb-32">
        {/* Media */}
        <div className="space-y-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`aspect-square bg-brand-gray overflow-hidden border border-brand-gray shadow-xl rounded-2xl relative ${currentMedia.type === 'image' ? 'cursor-zoom-in' : ''} group`}
            onMouseMove={(e) => {
              if (currentMedia.type !== 'image') return;
              const rect = e.currentTarget.getBoundingClientRect();
              setZoomPos({
                x: ((e.clientX - rect.left) / rect.width) * 100,
                y: ((e.clientY - rect.top) / rect.height) * 100
              });
            }}
            onMouseEnter={() => currentMedia.type === 'image' && setIsZooming(true)}
            onMouseLeave={() => setIsZooming(false)}
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
              <motion.img 
                src={currentMedia.url} 
                alt={product.name} 
                className="w-full h-full object-cover transition-transform duration-300"
                style={{
                  transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                  scale: isZooming ? 2 : 1
                }}
              />
            )}
            {currentMedia.type === 'image' && (
              <div className="absolute bottom-4 right-4 bg-brand-navy/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest text-white opacity-0 group-hover:opacity-100 transition-opacity">
                Hover to Zoom
              </div>
            )}
          </motion.div>
          
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {media.map((item, idx) => (
              <button 
                key={idx}
                onClick={() => setActiveMedia(idx)}
                className={`w-24 aspect-square shrink-0 bg-white overflow-hidden border-2 transition-all rounded-xl relative ${activeMedia === idx ? 'border-brand-beige ring-4 ring-brand-beige/10 shadow-lg' : 'border-brand-gray hover:border-brand-beige/50'}`}
              >
                {item.type === 'video' ? (
                  <div className="w-full h-full bg-brand-navy flex items-center justify-center relative">
                    <Play className="w-6 h-6 text-white fill-current" />
                    <span className="absolute bottom-1 right-1 text-[8px] text-white font-bold uppercase bg-black/50 px-1 rounded">Video</span>
                  </div>
                ) : (
                  <img src={item.url} alt="" className="w-full h-full object-cover" />
                )}
                {activeMedia === idx && (
                  <motion.div layoutId="active-thumb" className="absolute inset-0 bg-brand-beige/5 ring-1 ring-inset ring-brand-beige/20" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="text-brand-beige text-[9px] uppercase tracking-[0.3em] font-bold bg-brand-beige/5 px-3 py-1 rounded-full border border-brand-beige/10">Premium Collection</span>
              <span className="text-brand-navy/30 text-[9px] uppercase tracking-[0.3em] font-bold">New Arrival</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-brand font-bold uppercase tracking-tighter text-brand-navy mb-8 leading-[0.85]">{product.name}</h1>
            
            <div className="flex items-baseline gap-4 mb-10">
              <span className={`text-5xl font-brand font-bold ${product.onSale ? 'text-brand-beige' : 'text-brand-navy'} tracking-tighter`}>
                € {product.price.toLocaleString()}
              </span>
              {product.onSale && (
                <span className="text-lg text-brand-navy/20 font-bold line-through tracking-tighter">€ {Math.round(product.price * 1.2)}</span>
              )}
            </div>
            
            <div className="prose prose-sm text-brand-navy/60 font-medium leading-relaxed mb-12 max-w-none text-lg">
              <p>{product.description}</p>
              <p className="mt-4">Designed with the "Zip Small. Live Big." philosophy, this piece maximizes your spatial efficiency without sacrificing the tactile luxury of high-end furniture.</p>
            </div>

            {/* Features */}
            {product.features && (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 mb-10 border-t border-brand-gray pt-10">
                {product.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-[10px] uppercase tracking-widest font-bold text-brand-navy">
                    <Check className="w-4 h-4 text-brand-beige" />
                    {f}
                  </li>
                ))}
              </ul>
            )}

            {/* Dimensions */}
            {product.dimensions && (
              <div className="bg-brand-gray/50 border border-brand-gray p-8 mb-10 rounded-2xl">
                <h4 className="text-[10px] uppercase tracking-widest font-bold text-brand-navy mb-6 flex items-center gap-2">
                  <Info className="w-3 h-3 text-brand-beige" /> Structural Specifications
                </h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="border-r border-brand-gray">
                    <span className="block text-[9px] text-brand-navy/40 uppercase font-bold tracking-widest mb-1">Width</span>
                    <span className="font-bold text-lg text-brand-navy tracking-tighter">{product.dimensions.width} cm</span>
                  </div>
                  <div className="border-r border-brand-gray">
                    <span className="block text-[9px] text-brand-navy/40 uppercase font-bold tracking-widest mb-1">Height</span>
                    <span className="font-bold text-lg text-brand-navy tracking-tighter">{product.dimensions.height} cm</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-brand-navy/40 uppercase font-bold tracking-widest mb-1">Depth</span>
                    <span className="font-bold text-lg text-brand-navy tracking-tighter">{product.dimensions.depth} cm</span>
                  </div>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <div className="flex items-center bg-white border border-brand-navy rounded-xl overflow-hidden shrink-0 shadow-sm">
                <button 
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="p-5 hover:text-brand-beige transition-colors text-brand-navy"
                ><Minus className="w-4 h-4" /></button>
                <span className="w-14 text-center font-bold text-2xl text-brand-navy">{quantity}</span>
                <button 
                  onClick={() => setQuantity(q => q + 1)}
                  className="p-5 hover:text-brand-beige transition-colors text-brand-navy"
                ><Plus className="w-4 h-4" /></button>
              </div>
              <button 
                onClick={handleAddToCart}
                className="flex-grow bg-brand-navy text-white uppercase font-bold tracking-widest text-[12px] py-5 hover:bg-brand-beige transition-all relative overflow-hidden shadow-2xl rounded-2xl group"
              >
                <span className="group-hover:scale-110 block transition-transform">Add to Collection</span>
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

            {/* USPs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-10 border-t border-brand-gray">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-brand-gray flex items-center justify-center rounded-xl text-brand-accent">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h5 className="text-[11px] uppercase font-black text-brand-navy mb-1">Worldwide Shipping</h5>
                  <p className="text-[10px] text-brand-navy/60 font-bold">Free on orders over €500</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-brand-gray flex items-center justify-center rounded-xl text-brand-accent">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h5 className="text-[11px] uppercase font-black text-brand-navy mb-1">10-Year Warranty</h5>
                  <p className="text-[10px] text-brand-navy/60 font-bold">A commitment to quality</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>

    {/* Detailed Info - Single Column Sections */}
    <section className="mb-32 border-t border-brand-gray relative">
      {/* Sticky Sub-nav - Offset to handle Layout's top headers */}
      <div className="sticky top-[136px] bg-white/95 backdrop-blur-md z-40 border-b border-brand-gray hidden md:block">
        <div className="max-w-[1250px] mx-auto px-4 flex gap-12 text-[10px] font-black uppercase tracking-[0.3em]">
          {tabs.map(item => (
            <button
              key={item.id}
              onClick={() => {
                const el = document.getElementById(item.id);
                if (el) {
                  const offset = 200; // Account for sticky headers
                  const bodyRect = document.body.getBoundingClientRect().top;
                  const elementRect = el.getBoundingClientRect().top;
                  const elementPosition = elementRect - bodyRect;
                  const offsetPosition = elementPosition - offset;

                  window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                  });
                }
              }}
              className={`py-6 transition-colors relative group ${activeTab === item.id ? 'text-brand-accent' : 'text-brand-navy/60 hover:text-brand-accent'}`}
            >
              {item.label}
              <span className={`absolute bottom-0 left-0 h-[2px] bg-brand-accent transition-all duration-300 ${activeTab === item.id ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
            </button>
          ))}
        </div>
      </div>

      <div className="w-full">
        {/* Design Details Section */}
        <div id="design" className="w-full py-32 scroll-mt-48">
          <div className="max-w-[1250px] mx-auto px-4">
            <div className="mb-16">
              <span className="text-brand-accent font-black text-[12px] uppercase tracking-[0.5em] block mb-4">Focus</span>
              <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-brand-navy leading-none">Design &<br/>Craftsmanship</h2>
            </div>
            
            {/* Immersive Visual Block */}
            <div className="relative aspect-[21/9] bg-brand-charcoal overflow-hidden mb-24 rounded-3xl shadow-2xl">
              <img 
                src={product.images[1] || product.images[0]} 
                className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-[2s]"
                alt="Atmospheric detail"
              />
              <div className="absolute inset-0 flex items-center justify-center text-center p-8">
                <div className="max-w-3xl">
                  <p className="text-xl md:text-3xl font-medium text-white/90 leading-tight italic">
                    "Furniture should be art that welcomes you home."
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-24 items-start">
              <div className="space-y-16">
                <div className="prose prose-xl text-brand-navy/70 font-medium leading-relaxed">
                  <h3 className="text-2xl font-black uppercase tracking-tight text-brand-navy mb-6">Redefining Space</h3>
                  <p>
                    Through a deep intersection of geometric precision and natural materials, this piece is designed to be the anchor of your living environment. We've optimized every angle for both visual balance and ergonomic support.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                   <div className="space-y-4">
                      <div className="w-8 h-[2px] bg-brand-accent"></div>
                      <span className="text-brand-accent font-black text-[10px] uppercase tracking-widest block">Material Selection</span>
                      <p className="text-sm font-bold text-brand-navy uppercase">AHEC Certified Sustainably Sourced Walnut</p>
                   </div>
                   <div className="space-y-4">
                      <div className="w-8 h-[2px] bg-brand-accent"></div>
                      <span className="text-brand-accent font-black text-[10px] uppercase tracking-widest block">Artisan Tech</span>
                      <p className="text-sm font-bold text-brand-navy uppercase">Seamless blind-joinery & computerized precision</p>
                   </div>
                </div>
              </div>
              <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl transform md:translate-y-12 transition-transform duration-700">
                <img src={product.images[2] || product.images[0]} className="w-full h-full object-cover hover:scale-110 transition-transform duration-1000" alt="Detail zoom" />
              </div>
            </div>
          </div>
        </div>

        {/* Specs Section */}
        <div id="specs" className="w-full py-32 bg-brand-gray scroll-mt-48">
          <div className="max-w-[1250px] mx-auto px-4">
            <div className="max-w-2xl">
              <span className="text-brand-accent font-black text-[12px] uppercase tracking-[0.5em] block mb-4">Integrity</span>
              <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-brand-navy mb-20 leading-none">Technical<br/>Specifications</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20">
              {[
                { label: 'Primary Material', value: 'North American Walnut' },
                { label: 'Filling', value: 'High-density Resilience Foam' },
                { label: 'Fabric Composition', value: '45% Linen / 55% Wool Blend' },
                { label: 'Assembly', value: 'Simple Self-Assembly (Tools Included)' },
                { label: 'Dimensions', value: `${product.dimensions?.width || 0} x ${product.dimensions?.height || 0} x ${product.dimensions?.depth || 0} CM` },
                { label: 'Package Weight', value: 'Approx. 45.3 KG' },
                { label: 'Max Load', value: '250 KG' },
                { label: 'Finishing', value: 'Matte Environment-friendly Oil' }
              ].map((spec, i) => (
                <div key={i} className="flex justify-between py-10 border-b border-brand-gray group hover:bg-brand-gray/60 px-4 transition-colors">
                  <span className="text-[11px] font-black uppercase tracking-widest text-brand-navy/50 group-hover:text-brand-accent transition-colors">{spec.label}</span>
                  <span className="text-base font-black text-brand-navy">{spec.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Docs Section */}
        <div id="docs" className="w-full py-32 scroll-mt-48">
          <div className="max-w-[1250px] mx-auto px-4">
            <div className="mb-20">
              <span className="text-brand-accent font-black text-[12px] uppercase tracking-[0.5em] block mb-4">Support</span>
              <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-brand-navy leading-none">Installation<br/>& Documentation</h2>
            </div>
            <div className="bg-brand-gray p-12 rounded-[32px] border border-brand-gray inline-block w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <a href="#" className="flex items-center justify-between p-8 bg-white rounded-2xl border border-brand-gray hover:border-brand-accent hover:shadow-xl transition-all group">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-brand-gray flex items-center justify-center rounded-xl text-brand-navy/50 group-hover:text-brand-accent group-hover:bg-brand-accent/5 transition-all">
                      <FileText className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-[13px] font-black uppercase tracking-widest text-brand-navy leading-none mb-2">Assembly Manual (PDF)</p>
                      <p className="text-[10px] font-bold text-brand-navy/50 uppercase tracking-widest">Global English / 2.4 MB</p>
                    </div>
                  </div>
                  <Download className="w-6 h-6 text-brand-navy/25 group-hover:text-brand-accent" />
                </a>
                <a href="#" className="flex items-center justify-between p-8 bg-white rounded-2xl border border-brand-gray hover:border-brand-accent hover:shadow-xl transition-all group">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-brand-gray flex items-center justify-center rounded-xl text-brand-navy/50 group-hover:text-brand-accent group-hover:bg-brand-accent/5 transition-all">
                      <Play className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-[13px] font-black uppercase tracking-widest text-brand-navy leading-none mb-2">Installation Video</p>
                      <p className="text-[10px] font-bold text-brand-navy/50 uppercase tracking-widest">4K Cinematic Guide</p>
                    </div>
                  </div>
                  <Check className="w-6 h-6 text-brand-navy/25 group-hover:text-brand-accent" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping Section */}
        <div id="shipping" className="w-full py-32 bg-brand-charcoal scroll-mt-48 overflow-hidden relative">
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-[50%] h-full bg-brand-accent opacity-5 -skew-x-12 translate-x-1/2"></div>
          
          <div className="max-w-[1250px] mx-auto px-4 relative z-10">
            <div className="mb-20 text-white">
              <span className="text-brand-accent font-black text-[12px] uppercase tracking-[0.5em] block mb-4">Logistics</span>
              <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none">Seamless<br/>Experience</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
              <div className="lg:col-span-7">
                <div className="bg-white/5 backdrop-blur-xl p-16 rounded-[40px] border border-white/10 text-white shadow-3xl">
                  <h4 className="text-4xl font-black uppercase tracking-tighter mb-8 italic">"Total Peace of Mind"</h4>
                  <p className="text-white/70 font-medium text-xl leading-relaxed mb-12">
                    We've optimized our logistics network to offer a zero-friction experience from terminal to your living room. Our white-glove service includes full assembly and debris removal.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="p-8 bg-white/5 rounded-2xl border border-white/5 hover:border-brand-accent transition-colors">
                      <Truck className="w-8 h-8 text-brand-accent mb-4" />
                      <h5 className="text-xs font-black uppercase tracking-widest mb-2">Network</h5>
                      <p className="text-[11px] text-white/70 font-bold uppercase">Dedicated furniture courier fleet</p>
                    </div>
                    <div className="p-8 bg-white/5 rounded-2xl border border-white/5 hover:border-brand-accent transition-colors">
                      <ShieldCheck className="w-8 h-8 text-brand-accent mb-4" />
                      <h5 className="text-xs font-black uppercase tracking-widest mb-2">Assurance</h5>
                      <p className="text-[11px] text-white/70 font-bold uppercase">Full structural insurance during transit</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-5">
                <div className="space-y-12">
                   {[
                     { label: 'Processing Time', value: '48 Hours' },
                     { label: 'Return Window', value: '365 Days' },
                     { label: 'Warranty Period', value: '10 Years' }
                   ].map((item, i) => (
                     <div key={i} className="group">
                        <span className="text-brand-accent font-black text-[10px] uppercase tracking-[0.3em] block mb-2">{item.label}</span>
                        <p className="text-4xl font-black text-white uppercase tracking-tighter group-hover:translate-x-4 transition-transform duration-500">{item.value}</p>
                     </div>
                   ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

      {/* Recommended Section */}
      {recommendations.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 pb-32">
          <div className="pt-24 border-t border-brand-gray">
          <div className="flex justify-between items-end mb-16">
            <div>
              <h2 className="text-5xl font-black uppercase tracking-tighter text-brand-navy">You May Also Like</h2>
              <p className="text-brand-navy/60 font-bold uppercase text-[10px] tracking-widest mt-4">Selected just for you based on your taste</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {recommendations.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group"
              >
                <Link to={`/product/${item.id}`}>
                  <div className="aspect-square bg-brand-gray overflow-hidden mb-6 rounded-2xl relative border border-brand-gray">
                    <img src={item.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={item.name} />
                    <button className="absolute bottom-4 left-4 right-4 bg-white text-brand-navy py-3 text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all rounded-xl shadow-xl hover:bg-brand-accent hover:text-white">
                      View Details
                    </button>
                  </div>
                  <h4 className="text-sm font-black uppercase tracking-tight text-brand-navy group-hover:text-brand-accent transition-colors leading-tight mb-2">{item.name}</h4>
                  <p className="text-lg font-black text-brand-navy tracking-tighter">¥ {item.discountPrice || item.price}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    )}
  </div>
);
}
