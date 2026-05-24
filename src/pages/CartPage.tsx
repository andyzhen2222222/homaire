import { useCart } from '../components/CartContext';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, Plus, Minus, ArrowRight, ShieldCheck, Truck } from 'lucide-react';
import { useStoreConfig } from '../hooks/useAdminData';
import { formatStoreMoney, getShippingFlatFee, getShippingFreeThreshold } from '../lib/storeShipping';
import { formatEurPrice } from '../lib/storePrice';
import { displayStoreProductTitle } from '../lib/storeShortTitle';

const CART_ROW_TITLE_MAX = 52;

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice, itemCount } = useCart();
  const { config } = useStoreConfig();
  const freeTh = getShippingFreeThreshold(config);
  const flatFee = getShippingFlatFee(config);
  const shipComplimentary = totalPrice > freeTh;
  const shipLine = shipComplimentary ? 'COMPLIMENTARY' : formatStoreMoney(flatFee, config?.currency);
  const estTotal = shipComplimentary ? totalPrice : totalPrice + flatFee;

  return (
    <div className="max-w-7xl mx-auto px-4 py-32 bg-white min-h-screen">
      <h1 className="text-6xl font-brand font-bold uppercase tracking-tighter text-brand-navy mb-16">YOUR SELECTION</h1>

      {itemCount === 0 ? (
        <div className="text-center py-48 border border-brand-gray bg-brand-gray/30 rounded-[4rem] flex flex-col items-center">
          <p className="text-3xl font-brand font-bold uppercase tracking-tighter text-brand-navy/10 mb-12 italic">Your curation is currently empty.</p>
          <Link 
            to="/" 
            className="inline-block bg-brand-navy text-white px-16 py-6 rounded-full text-[11px] uppercase font-bold tracking-widest hover:bg-brand-beige transition-all shadow-3xl"
          >
            Explore Collections
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-20">
          {/* Item List */}
          <div className="lg:col-span-2 space-y-16">
            <AnimatePresence>
              {items.map((item) => {
                const rowTitle = displayStoreProductTitle(item, CART_ROW_TITLE_MAX);
                return (
                <motion.div 
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex gap-10 pb-16 border-b border-brand-gray group"
                >
                  <Link to={`/product/${item.id}`} className="w-40 sm:w-64 aspect-[4/5] bg-brand-gray rounded-[2rem] flex-shrink-0 overflow-hidden border border-brand-gray transition-all shadow-sm relative group-hover:shadow-xl">
                    <img src={item.images[0]} alt={rowTitle} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  </Link>
                  <div className="flex-grow flex flex-col justify-between py-4 min-w-0">
                    <div>
                      <div className="flex justify-between items-start gap-4 mb-4">
                        <Link to={`/product/${item.id}`} className="text-3xl font-brand font-bold uppercase tracking-tighter text-brand-navy hover:text-brand-beige transition-colors leading-tight min-w-0 line-clamp-3 break-words hyphens-auto">{rowTitle}</Link>
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="text-brand-navy/20 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-brand-gray"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                      <p className="text-brand-navy/40 text-[10px] uppercase font-bold tracking-[0.3em]">{item.category}</p>
                    </div>
                    
                    <div className="flex justify-between items-end">
                      <div className="flex items-center bg-white border border-brand-navy rounded-full overflow-hidden">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-4 hover:bg-brand-gray transition-colors text-brand-navy"
                        ><Minus className="w-3 h-3" /></button>
                        <span className="w-12 text-center font-bold text-brand-navy text-sm">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-4 hover:bg-brand-gray transition-colors text-brand-navy"
                        ><Plus className="w-3 h-3" /></button>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-brand font-bold text-brand-navy tracking-tighter leading-none mb-2">{formatEurPrice(item.price * item.quantity)}</p>
                        {item.quantity > 1 && (
                          <p className="text-[10px] font-bold text-brand-navy/30 uppercase tracking-[0.2em]">{formatEurPrice(item.price)} unit price</p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white p-12 sticky top-48 border border-brand-gray rounded-[3rem] shadow-xl">
              <h2 className="text-4xl font-brand font-bold uppercase tracking-tighter text-brand-navy mb-10 border-b border-brand-gray pb-6">CURATION SUMMARY</h2>
              <div className="space-y-6 text-sm font-bold mb-10 pb-10 border-b border-brand-gray text-brand-navy/40">
                <div className="flex justify-between items-center">
                  <span className="uppercase tracking-[0.2em] text-[10px]">Value Contribution</span>
                  <span className="text-brand-navy">{formatEurPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="uppercase tracking-[0.2em] text-[10px]">Logistics / Handling</span>
                  <span className={shipComplimentary ? 'text-emerald-600' : 'text-brand-navy'}>
                    {shipLine}
                  </span>
                </div>
              </div>
              <div className="flex justify-between text-4xl font-brand font-bold text-brand-navy mb-12 uppercase tracking-tighter pt-4">
                <span>EST. TOTAL</span>
                <span>{formatStoreMoney(estTotal, config?.currency)}</span>
              </div>
              <button 
                className="w-full bg-brand-navy text-white py-6 rounded-full uppercase font-bold tracking-widest text-[11px] flex items-center justify-center gap-4 hover:bg-brand-beige transition-all group shadow-3xl"
                onClick={() => alert('Secure payment integration pending.')}
              >
                PROCEED TO ACQUISITION
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <div className="mt-12 space-y-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-navy/20 flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-brand-beige" /> BRAND AUTHENTICITY GUARANTEED
                </p>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-navy/20 flex items-center gap-3">
                  <Truck className="w-5 h-5 text-brand-beige" /> GLOBAL WHITE-GLOVE DELIVERY
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
