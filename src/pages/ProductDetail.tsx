import { useParams, Link } from 'react-router-dom';
import { useProduct, useProducts } from '../hooks/useProducts';
import { useCart } from '../components/CartContext';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import {
  Check,
  Download,
  FileText,
  Minus,
  Play,
  Plus,
  Sparkles,
} from 'lucide-react';
import Logo from '../components/Logo';

type ProductMedia = {
  type: 'image' | 'video';
  url: string;
  label: string;
};

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

  const coreFeatures = product.features?.length
    ? product.features
    : ['Compact Footprint', 'Fast Assembly', 'Premium Comfort'];

  const fallbackDetailHtml = `
    <section class="detail-block">
      <div>
        <img src="${imageAt(1)}" alt="${product.name} lifestyle view" />
      </div>
      <div>
        <p class="eyebrow">Living Scenario</p>
        <h3>Designed around real rooms</h3>
        <p>${product.description}</p>
      </div>
    </section>
    <section class="detail-block reverse">
      <div>
        <img src="${imageAt(2)}" alt="${product.name} material view" />
      </div>
      <div>
        <p class="eyebrow">Material & Comfort</p>
        <h3>Comfort that works every day</h3>
        <p>Soft upholstery, compact proportions, and easy-to-live-with construction make this piece suitable for apartments, guest rooms, and flexible living spaces.</p>
      </div>
    </section>
  `;

  const detailHtml = product.detailHtml?.trim() || fallbackDetailHtml;

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

            <div className="space-y-3 mb-8">
              {coreFeatures.slice(0, 5).map((feature) => (
                <div key={feature} className="flex items-center gap-4 border border-brand-gray rounded-xl px-4 py-3 bg-white">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-beige/10 text-brand-beige">
                    <Check className="w-4 h-4" />
                  </span>
                  <span className="text-sm font-black uppercase tracking-widest text-brand-navy leading-snug">{feature}</span>
                </div>
              ))}
            </div>

            {product.manualUrl && (
              <a
                href={product.manualUrl}
                target="_blank"
                rel="noreferrer"
                className="mb-8 flex items-center justify-between gap-4 border border-brand-beige/30 bg-brand-beige/5 rounded-xl px-5 py-4 text-brand-navy hover:border-brand-beige hover:bg-brand-beige/10 transition-colors"
              >
                <span className="flex items-center gap-3 min-w-0">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-brand-beige">
                    <FileText className="w-5 h-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[10px] font-black uppercase tracking-widest text-brand-navy">Installation PDF</span>
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-brand-navy/35 mt-1 truncate">Download assembly guide</span>
                  </span>
                </span>
                <Download className="w-4 h-4 shrink-0 text-brand-beige" />
              </a>
            )}

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
          <div className="grid grid-cols-1 lg:grid-cols-[0.72fr_1.28fr] gap-12 items-start">
            <div>
              <span className="text-brand-beige text-[11px] font-black uppercase tracking-[0.45em] block mb-4">Details</span>
              <h2 className="text-4xl md:text-6xl font-brand font-bold uppercase tracking-tighter leading-none">Product Story</h2>
            </div>
            <div
              className="space-y-6 text-brand-navy/65 font-medium leading-relaxed text-base md:text-lg [&_.detail-block]:grid [&_.detail-block]:grid-cols-1 [&_.detail-block]:md:grid-cols-2 [&_.detail-block]:gap-6 [&_.detail-block]:items-center [&_.detail-block]:bg-white [&_.detail-block]:border [&_.detail-block]:border-brand-gray [&_.detail-block]:rounded-3xl [&_.detail-block]:overflow-hidden [&_.detail-block.reverse>div:first-child]:md:order-2 [&_img]:w-full [&_img]:aspect-square [&_img]:object-cover [&_h2]:font-brand [&_h2]:text-4xl [&_h2]:font-bold [&_h2]:uppercase [&_h2]:tracking-tighter [&_h2]:text-brand-navy [&_h2]:mb-6 [&_h3]:font-brand [&_h3]:text-3xl [&_h3]:font-bold [&_h3]:uppercase [&_h3]:tracking-tighter [&_h3]:text-brand-navy [&_h3]:mb-5 [&_p]:mb-6 [&_.eyebrow]:text-brand-beige [&_.eyebrow]:text-[10px] [&_.eyebrow]:font-black [&_.eyebrow]:uppercase [&_.eyebrow]:tracking-[0.35em] [&_.eyebrow]:mb-4 [&_.detail-block>div:not(:has(img))]:p-8 [&_.detail-block>div:not(:has(img))]:md:p-10 [&_ul]:grid [&_ul]:grid-cols-1 [&_ul]:md:grid-cols-2 [&_ul]:gap-3 [&_li]:list-none [&_li]:rounded-xl [&_li]:border [&_li]:border-brand-gray [&_li]:px-5 [&_li]:py-4 [&_li]:text-sm [&_li]:font-black [&_li]:uppercase [&_li]:tracking-widest [&_li]:text-brand-navy"
              dangerouslySetInnerHTML={{ __html: detailHtml }}
            />
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
              {coreFeatures.map((feature) => (
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

      <section className="bg-brand-gray/35 border-y border-brand-gray">
        <div className="max-w-7xl mx-auto px-4 py-24 grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-14 items-center">
          <div>
            <Logo size="lg" className="mb-10" />
            <h2 className="text-4xl md:text-6xl font-brand font-bold uppercase tracking-tighter leading-none mb-8">Make Room For The Life You Want</h2>
            <p className="text-lg text-brand-navy/60 leading-relaxed font-medium">
              ZipSofa creates flexible furniture for homes that need to work harder. Every piece is designed to save space, feel comfortable, and adapt to the way real rooms change through the day.
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
