import { useParams, Link } from 'react-router-dom';
import { useProduct, useProducts } from '../hooks/useProducts';
import { useCart } from '../components/CartContext';
import { motion, AnimatePresence } from 'motion/react';
import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  Download,
  FileText,
  Minus,
  PackageCheck,
  Play,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Truck,
} from 'lucide-react';
import Logo from '../components/Logo';

type ProductMedia = {
  type: 'image' | 'video';
  url: string;
  label: string;
};

const assetLabels = [
  'White Background',
  'Angle View',
  'Scene View',
  'Lifestyle Scene',
  'Function Detail',
  'Dimension Proof',
  'Scale Reference',
  'Platform Support',
  'Customer Context',
];

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { product, loading } = useProduct(id!);
  const { products: relatedProducts } = useProducts(product?.category);
  const { addItem } = useCart();
  const [activeMedia, setActiveMedia] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showAddedMsg, setShowAddedMsg] = useState(false);

  if (loading || !product) {
    return <div className="h-screen flex items-center justify-center font-black uppercase tracking-tighter text-2xl animate-pulse">Loading...</div>;
  }

  const images = product.images.length ? product.images : ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=1200'];

  const imageAt = (index: number) => images[index % images.length];

  const media: ProductMedia[] = [
    ...(product.videoUrl ? [{ type: 'video' as const, url: product.videoUrl, label: 'Product Video' }] : []),
    ...images.map((url, index) => ({
      type: 'image' as const,
      url,
      label: assetLabels[index] || `Detail ${index + 1}`,
    })),
  ];

  const currentMedia = media[activeMedia] || media[0];

  const assetPlan = useMemo(() => ([
    { title: 'Main Visual', count: 1, image: imageAt(0), note: 'Clear hero recognition for storefront and marketplace use.' },
    { title: 'Angle View', count: 1, image: imageAt(1), note: 'Shape, silhouette, and profile from the buyer-facing angle.' },
    { title: 'Scene Views', count: 2, image: imageAt(2), note: 'Room-scale context that shows proportion and styling range.' },
    { title: 'Function Detail', count: 1, image: imageAt(4), note: 'Transformation, modularity, or material behavior in close view.' },
    { title: 'Dimension Proof', count: 2, image: imageAt(5), note: 'Size confidence before purchase and platform listing support.' },
    { title: 'Platform Research', count: 2, image: imageAt(7), note: 'Evidence assets for channels, ads, and product education.' },
  ]), [product.id, product.images.join('|')]);

  const detailModules = [
    { label: 'Core Selling Points', value: product.features?.length || 3 },
    { label: 'Human Context', value: 1 },
    { label: 'Usage Scene', value: 1 },
    { label: 'Install Docs', value: 2 },
    { label: 'After-sales', value: 1 },
    { label: 'Brand Assets', value: 2 },
  ];

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

  return (
    <div className="w-full bg-white text-brand-navy">
      <section className="max-w-7xl mx-auto px-4 pt-10 pb-24">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-brand-navy/30 font-bold mb-10">
          <Link to="/" className="hover:text-brand-navy transition-colors">Home</Link>
          <span className="opacity-30">/</span>
          <Link to={`/category/${product.category}`} className="hover:text-brand-navy capitalize">{product.category}</Link>
          <span className="opacity-30">/</span>
          <span className="text-brand-navy">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] gap-12 xl:gap-20">
          <div className="space-y-5">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative aspect-[4/3] overflow-hidden bg-brand-gray border border-brand-gray rounded-3xl"
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
                <img src={currentMedia.url} alt={product.name} className="w-full h-full object-cover" />
              )}
              <div className="absolute left-5 top-5 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-brand-navy shadow-sm">
                {currentMedia.label}
              </div>
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
            <div className="flex items-center gap-3 mb-6">
              <span className="text-brand-beige text-[9px] uppercase tracking-[0.3em] font-bold bg-brand-beige/5 px-3 py-1 rounded-full border border-brand-beige/10">Premium Collection</span>
              <span className="text-brand-navy/30 text-[9px] uppercase tracking-[0.3em] font-bold">{product.stock} In Stock</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-brand font-bold uppercase tracking-tighter text-brand-navy mb-8 leading-[0.85]">{product.name}</h1>

            <p className="text-lg text-brand-navy/65 leading-relaxed font-medium mb-8">{product.description}</p>

            <div className="grid grid-cols-2 gap-3 mb-8">
              {detailModules.map((item) => (
                <div key={item.label} className="border border-brand-gray rounded-xl px-4 py-3 bg-white">
                  <p className="text-[9px] uppercase tracking-widest font-bold text-brand-navy/35 mb-1">{item.label}</p>
                  <p className="text-2xl font-brand font-bold tracking-tighter text-brand-navy">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="flex items-baseline gap-4 mb-8">
              <span className={`text-5xl font-brand font-bold ${product.onSale ? 'text-brand-beige' : 'text-brand-navy'} tracking-tighter`}>
                € {(product.discountPrice || product.price).toLocaleString()}
              </span>
              {product.onSale && (
                <span className="text-lg text-brand-navy/25 font-bold line-through tracking-tighter">€ {product.price.toLocaleString()}</span>
              )}
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

      <section className="border-y border-brand-gray bg-brand-gray/35">
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-12">
            <div>
              <span className="text-brand-beige text-[11px] font-black uppercase tracking-[0.45em] block mb-4">Asset System</span>
              <h2 className="text-4xl md:text-6xl font-brand font-bold uppercase tracking-tighter leading-none">Product Visual Stack</h2>
            </div>
            <p className="max-w-lg text-sm md:text-base text-brand-navy/60 font-medium leading-relaxed">
              The page is arranged around the material set used for this product: main visual, angle proof, scene context, function, dimensions, video, and platform support assets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {assetPlan.map((asset, index) => (
              <motion.article
                key={asset.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ delay: index * 0.04 }}
                className={`group overflow-hidden bg-white border border-brand-gray rounded-2xl ${index === 0 ? 'md:col-span-2 xl:col-span-1' : ''}`}
              >
                <div className="aspect-[4/3] overflow-hidden bg-brand-gray">
                  <img src={asset.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-brand-navy">{asset.title}</h3>
                    <span className="w-7 h-7 rounded-full bg-brand-navy text-white text-[10px] font-black flex items-center justify-center">{asset.count}</span>
                  </div>
                  <p className="text-sm text-brand-navy/55 leading-relaxed font-medium">{asset.note}</p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-28">
        <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-16 items-start">
          <div>
            <span className="text-brand-beige text-[11px] font-black uppercase tracking-[0.45em] block mb-4">Core Value</span>
            <h2 className="text-4xl md:text-6xl font-brand font-bold uppercase tracking-tighter leading-none mb-8">Why It Works</h2>
            <p className="text-lg text-brand-navy/60 leading-relaxed font-medium mb-10">
              Instead of burying benefits under generic specs, the page gives each proof asset a job: show the silhouette, prove the function, validate size, and make purchase risk feel smaller.
            </p>
            <div className="space-y-4">
              {(product.features || ['Compact Footprint', 'Fast Assembly', 'Premium Comfort']).map((feature) => (
                <div key={feature} className="flex items-center gap-4 border-b border-brand-gray py-4">
                  <Check className="w-5 h-5 text-brand-beige shrink-0" />
                  <span className="text-sm font-black uppercase tracking-widest text-brand-navy">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-brand-gray border border-brand-gray">
              <img src={imageAt(2)} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="space-y-5 pt-12">
              <div className="aspect-square overflow-hidden rounded-2xl bg-brand-gray border border-brand-gray">
                <img src={imageAt(3)} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="bg-brand-navy text-white rounded-2xl p-8">
                <Sparkles className="w-7 h-7 text-brand-beige mb-6" />
                <p className="text-2xl font-brand font-bold uppercase tracking-tighter leading-tight">Zip Small. Live Big.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-brand-charcoal text-white py-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-brand-beige text-[11px] font-black uppercase tracking-[0.45em] block mb-4">Size Confidence</span>
            <h2 className="text-4xl md:text-6xl font-brand font-bold uppercase tracking-tighter leading-none mb-8">Measured For Real Rooms</h2>
            <p className="text-white/65 text-lg leading-relaxed font-medium mb-10">
              Dimension assets should sit close to the purchase area and again in the proof section, because size is one of the highest-friction decisions for furniture.
            </p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Width', value: product.dimensions?.width || 0 },
                { label: 'Height', value: product.dimensions?.height || 0 },
                { label: 'Depth', value: product.dimensions?.depth || 0 },
              ].map((item) => (
                <div key={item.label} className="border border-white/10 rounded-2xl p-5">
                  <p className="text-[9px] uppercase tracking-widest font-bold text-white/35 mb-2">{item.label}</p>
                  <p className="text-3xl font-brand font-bold tracking-tighter">{item.value}<span className="text-sm text-brand-beige ml-1">cm</span></p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="aspect-[5/4] rounded-3xl overflow-hidden bg-white/5 border border-white/10">
              <img src={imageAt(5)} alt="" className="w-full h-full object-cover opacity-90" />
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-28">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <span className="text-brand-beige text-[11px] font-black uppercase tracking-[0.45em] block mb-4">Support</span>
            <h2 className="text-4xl md:text-5xl font-brand font-bold uppercase tracking-tighter leading-none">Install, Service, Brand</h2>
          </div>

          <a href="#" className="group border border-brand-gray rounded-2xl p-8 hover:border-brand-beige transition-colors">
            <FileText className="w-8 h-8 text-brand-beige mb-8" />
            <h3 className="text-sm font-black uppercase tracking-widest text-brand-navy mb-3">Installation Document</h3>
            <p className="text-sm text-brand-navy/55 leading-relaxed font-medium mb-8">Assembly manual and care checkpoints for the product package.</p>
            <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-navy group-hover:text-brand-beige">
              Download <Download className="w-4 h-4" />
            </span>
          </a>

          <a href="#" className="group border border-brand-gray rounded-2xl p-8 hover:border-brand-beige transition-colors">
            <Play className="w-8 h-8 text-brand-beige mb-8" />
            <h3 className="text-sm font-black uppercase tracking-widest text-brand-navy mb-3">Installation Video</h3>
            <p className="text-sm text-brand-navy/55 leading-relaxed font-medium mb-8">Video walkthrough for setup, conversion, and feature explanation.</p>
            <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-navy group-hover:text-brand-beige">
              Watch <ArrowRight className="w-4 h-4" />
            </span>
          </a>

          <div className="border border-brand-gray rounded-2xl p-8">
            <ShieldCheck className="w-8 h-8 text-brand-beige mb-8" />
            <h3 className="text-sm font-black uppercase tracking-widest text-brand-navy mb-3">After-sales Terms</h3>
            <p className="text-sm text-brand-navy/55 leading-relaxed font-medium">365-day worry-free returns, quality guarantee, and responsive support for every order.</p>
          </div>

          <div className="border border-brand-gray rounded-2xl p-8">
            <RotateCcw className="w-8 h-8 text-brand-beige mb-8" />
            <h3 className="text-sm font-black uppercase tracking-widest text-brand-navy mb-3">Usage Scenario</h3>
            <p className="text-sm text-brand-navy/55 leading-relaxed font-medium">Compact apartment, guest-room conversion, and flexible living-room planning.</p>
          </div>

          <div className="border border-brand-gray rounded-2xl p-8">
            <PackageCheck className="w-8 h-8 text-brand-beige mb-8" />
            <h3 className="text-sm font-black uppercase tracking-widest text-brand-navy mb-3">Platform Proof</h3>
            <p className="text-sm text-brand-navy/55 leading-relaxed font-medium">Gallery assets are structured for storefront, ads, marketplace, and customer service use.</p>
          </div>
        </div>
      </section>

      <section className="bg-brand-gray/35 border-y border-brand-gray">
        <div className="max-w-7xl mx-auto px-4 py-24 grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-14 items-center">
          <div>
            <Logo size="lg" className="mb-10" />
            <h2 className="text-4xl md:text-6xl font-brand font-bold uppercase tracking-tighter leading-none mb-8">Built For Smaller Spaces, Not Smaller Lives</h2>
            <p className="text-lg text-brand-navy/60 leading-relaxed font-medium">
              ZipSofa is positioned around transformation: a compact object that carries comfort, flexibility, and visual calm into everyday rooms.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div className="aspect-square rounded-2xl overflow-hidden bg-white border border-brand-gray">
              <img src={imageAt(6)} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="aspect-square rounded-2xl overflow-hidden bg-white border border-brand-gray">
              <img src={imageAt(7)} alt="" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {recommendations.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-28">
          <div className="flex justify-between items-end mb-14">
            <div>
              <span className="text-brand-beige text-[11px] font-black uppercase tracking-[0.45em] block mb-4">More</span>
              <h2 className="text-4xl md:text-5xl font-brand font-bold uppercase tracking-tighter text-brand-navy">You May Also Like</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {recommendations.map((item, index) => (
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
                    <img src={item.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={item.name} />
                  </div>
                  <h4 className="text-sm font-black uppercase tracking-tight text-brand-navy group-hover:text-brand-accent transition-colors leading-tight mb-2">{item.name}</h4>
                  <p className="text-lg font-black text-brand-navy tracking-tighter">€ {(item.discountPrice || item.price).toLocaleString()}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
