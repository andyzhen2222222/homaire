import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { motion, AnimatePresence } from 'motion/react';
import { SlidersHorizontal, X, ShoppingCart } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useCart } from '../components/CartContext';
import { DEFAULT_CATEGORY_HEROES } from '../data/categoryHeroes';
import { useStoreConfig, useCategories } from '../hooks/useAdminData';
import { displayStoreProductListTitle } from '../lib/storeShortTitle';
import { getProductDetailOutOfStockHint, getProductDetailLowStockHint } from '../lib/storeShipping';
import { getProductStockQty, isProductLowStock, isProductOutOfStock } from '../lib/productStock';
import { ProductListImage } from '../components/ProductListImage';
import { PRODUCT_LIST_IMAGE_ASPECT_CLASS, PRODUCT_LIST_IMAGE_PLACEHOLDER } from '../lib/productImages';
import { formatEurPrice } from '../lib/storePrice';
import { displaySubCategoryLabel, getCategoryEnglishName, displayCategoryName } from '../lib/categoryLabels';

const CATEGORY_HERO_FALLBACK = PRODUCT_LIST_IMAGE_PLACEHOLDER;

/** 分类栅格 `text-base`，与首页卡片一致 */
const CATEGORY_GRID_TITLE_MAX = 56;

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const subCategory = searchParams.get('sub');
  const { addItem } = useCart();
  const { config } = useStoreConfig();
  const { categories } = useCategories();

  const { products, loading } = useProducts(slug);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'newest'>('featured');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [selectedSubs, setSelectedSubs] = useState<string[]>([]);

  // Get available subcategories for this category
  const availableSubs = useMemo(() => {
    const subs = new Set<string>();
    products.forEach(p => {
      if (p.subCategory) subs.add(p.subCategory);
    });
    return Array.from(subs);
  }, [products]);

  const lowStockThreshold = Math.max(1, config?.lowStockThreshold ?? 10);
  const outOfStockLabel = getProductDetailOutOfStockHint(config);
  const lowStockLabel = getProductDetailLowStockHint(config);

  const sortedProducts = useMemo(() => {
    let result = [...products];

    if (subCategory) {
      result = result.filter((p) => p.subCategory === subCategory);
    }
    if (selectedSubs.length > 0) {
      result = result.filter((p) => p.subCategory && selectedSubs.includes(p.subCategory));
    }
    result = result.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);

    if (sortBy === 'price-asc') result.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-desc') result.sort((a, b) => b.price - a.price);

    // 无库存商品仍展示，仅排到同排序规则下的后面
    result.sort((a, b) => {
      const aOut = isProductOutOfStock(a);
      const bOut = isProductOutOfStock(b);
      if (aOut === bOut) return 0;
      return aOut ? 1 : -1;
    });

    return result;
  }, [products, sortBy, priceRange, subCategory, selectedSubs]);

  const isSubCategory = useMemo(() => {
    if (!slug) return false;
    const catRow = categories.find((c) => c.slug === slug);
    return Boolean(catRow?.parentId);
  }, [slug, categories]);

  const currentCategory = useMemo(() => {
    const base =
      slug && DEFAULT_CATEGORY_HEROES[slug]
        ? DEFAULT_CATEGORY_HEROES[slug]
        : {
            title: (slug || 'collection')
              .replace(/-/g, ' ')
              .replace(/\b\w/g, (c) => c.toUpperCase()),
            subtitle: 'Discover pieces curated for modern living.',
            image: CATEGORY_HERO_FALLBACK,
          };
    const enSlugTitle = slug ? getCategoryEnglishName(slug, categories) : '';
    const catRow = slug ? categories.find((c) => c.slug === slug) : undefined;
    const dbTitle = catRow ? displayCategoryName(catRow) : enSlugTitle;
    const ov = slug ? config?.categoryHeroes?.[slug] : undefined;
    const dbImage = (catRow?.image || '').trim();
    const heroDefault = slug ? DEFAULT_CATEGORY_HEROES[slug]?.image : undefined;
    if (!ov) {
      return {
        ...(dbTitle ? { ...base, title: dbTitle } : base),
        image: dbImage || base.image || heroDefault || CATEGORY_HERO_FALLBACK,
      };
    }
    return {
      title: (ov.title && ov.title.trim()) || dbTitle || base.title,
      subtitle: (ov.subtitle && ov.subtitle.trim()) || base.subtitle,
      image: (ov.image && ov.image.trim()) || dbImage || base.image || heroDefault || CATEGORY_HERO_FALLBACK,
    };
  }, [slug, config?.categoryHeroes, categories]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 animate-pulse mt-[100px]">
        {!isSubCategory && <div className="h-20 bg-brand-gray mb-12 w-1/3 rounded-xl" />}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className="aspect-square bg-brand-gray rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col min-h-screen bg-white ${isSubCategory ? 'pt-[100px]' : ''}`}>
      {!isSubCategory && (
      <section className="relative h-[55vh] w-full overflow-hidden shrink-0 mt-[100px]">
        <div className="absolute inset-0 bg-brand-navy/30 z-10" />
        <div className="absolute inset-0 w-full h-full">
          <motion.img
            initial={{ scale: 1.05, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            src={currentCategory.image}
            alt=""
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.src = CATEGORY_HERO_FALLBACK;
            }}
          />
        </div>
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white to-transparent z-25" />
      </section>
      )}

      <div className="max-w-7xl mx-auto px-4 py-16 flex-grow w-full">
        {/* Category Header */}
        <div className="mb-12 border-b border-brand-gray pb-12">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-brand-navy/30 font-bold mb-6">
            <Link to="/" className="hover:text-brand-beige transition-colors">Home</Link>
            <span className="opacity-30">/</span>
            <span className="text-brand-navy">{currentCategory.title}</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
              <h1 className="text-4xl md:text-6xl font-brand font-bold uppercase tracking-tighter text-brand-navy mb-4 leading-[0.9]">
                {currentCategory.title}
              </h1>
              <p className="text-brand-navy/60 max-w-xl font-medium leading-relaxed text-lg">{currentCategory.subtitle}</p>
            </div>
            <div className="flex items-center gap-6">
               <span className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/40">{sortedProducts.length} Exclusive Pieces</span>
            </div>
          </div>
        </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-12 py-6 border-y border-brand-gray">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-3 px-8 py-3 bg-white border border-brand-navy rounded-full text-[10px] font-bold uppercase tracking-widest hover:border-brand-beige transition-all group"
          >
            <SlidersHorizontal className="w-3 h-3 group-hover:text-brand-beige" />
            Curate
            {showFilters && <X className="w-3 h-3 ml-2 text-brand-beige" />}
          </button>
        </div>

        <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/40">Arrange by:</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-[10px] font-bold uppercase tracking-widest outline-none cursor-pointer hover:text-brand-beige transition-colors text-brand-navy"
            >
              <option value="featured">Featured Selection</option>
              <option value="price-asc">Price Index: Low to High</option>
              <option value="price-desc">Price Index: High to Low</option>
              <option value="newest">Recent Releases</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Filters Sidebar */}
        <AnimatePresence>
          {showFilters && (
            <motion.aside 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full lg:w-72 space-y-12 bg-brand-gray/30 p-8 rounded-3xl h-fit border border-brand-gray"
            >
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-navy mb-6">Series</h4>
                <div className="flex flex-col gap-2">
                  {availableSubs.map((sub) => (
                    <button 
                      key={sub}
                      onClick={() => {
                        setSelectedSubs(prev => 
                          prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub]
                        );
                      }}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${selectedSubs.includes(sub) ? 'bg-brand-navy text-white shadow-xl -translate-y-1' : 'bg-white text-brand-navy/50 hover:bg-white hover:text-brand-navy border border-transparent hover:border-brand-beige'}`}
                    >
                      <span>{displaySubCategoryLabel(sub)}</span>
                      {selectedSubs.includes(sub) && <X className="w-3 h-3" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-navy mb-6">Budget Index</h4>
                <div className="space-y-4">
                  <input 
                    type="range" 
                    min="0" 
                    max="5000" 
                    step="100"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                    className="w-full accent-brand-beige"
                  />
                  <div className="flex justify-between text-[10px] font-bold text-brand-navy/40">
                    <span>€ 0</span>
                    <span className="text-brand-beige">Max {formatEurPrice(priceRange[1])}</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => {
                  setPriceRange([0, 5000]);
                  setSelectedSubs([]);
                }}
                className="w-full py-4 text-[10px] font-bold uppercase tracking-widest text-brand-navy/30 hover:text-brand-beige transition-colors border-t border-brand-gray"
              >
                Reset Curations
              </button>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Product Grid */}
        <div className="flex-grow">
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${showFilters ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-x-8 gap-y-20`}>
            {sortedProducts.map((product, i) => {
              const listTitle = displayStoreProductListTitle(product, CATEGORY_GRID_TITLE_MAX);
              const stockQty = getProductStockQty(product.stock);
              const outOfStock = isProductOutOfStock(product);
              const lowStock = isProductLowStock(product, lowStockThreshold);
              return (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: (i % 12) * 0.05 }}
                className="group"
              >
                <Link to={`/product/${product.id}`}>
                  <div className={`${PRODUCT_LIST_IMAGE_ASPECT_CLASS} bg-brand-gray overflow-hidden mb-6 relative border border-brand-gray shadow-sm rounded-2xl ${outOfStock ? 'opacity-90' : ''}`}>
                    <ProductListImage
                      product={product}
                      alt={listTitle}
                      className={`group-hover:scale-110 transition-transform duration-700 ${outOfStock ? 'grayscale-[0.35]' : ''}`}
                    />
                <div className="absolute top-4 left-4 flex flex-col gap-2 items-start">
                  {outOfStock ? (
                    <span className="bg-brand-navy/90 text-white text-[8px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-xl">
                      {outOfStockLabel}
                    </span>
                  ) : lowStock ? (
                    <span className="bg-amber-600 text-white text-[8px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-xl">
                      {lowStockLabel}
                    </span>
                  ) : null}
                  {product.onSale && !outOfStock ? (
                    <span className="bg-brand-beige text-white text-[8px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-xl">
                      -{Math.round((1 - (product.discountPrice || product.price) / product.price) * 100)}% Privilege
                    </span>
                  ) : null}
                </div>
                    <button
                      type="button"
                      disabled={outOfStock}
                      className={`absolute bottom-4 left-4 right-4 py-4 text-[10px] uppercase font-bold tracking-widest transition-all duration-500 shadow-2xl rounded-xl flex items-center justify-center gap-2 ${
                        outOfStock
                          ? 'bg-brand-gray text-brand-navy/40 cursor-not-allowed translate-y-0'
                          : 'bg-brand-navy text-white translate-y-20 group-hover:translate-y-0 hover:bg-brand-beige'
                      }`}
                      onClick={(e) => {
                        if (outOfStock) return;
                        e.preventDefault();
                        e.stopPropagation();
                        addItem(product);
                      }}
                    >
                      {outOfStock ? outOfStockLabel : (
                        <>
                          <ShoppingCart className="w-3 h-3" />
                          Add To Collection
                        </>
                      )}
                    </button>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-bold normal-case tracking-tight mb-1 text-brand-navy group-hover:text-brand-beige transition-colors leading-tight font-brand line-clamp-2 break-words hyphens-auto">{listTitle}</h3>
                      <p className="text-brand-navy/30 text-[9px] uppercase font-bold tracking-widest">
                        {outOfStock ? (
                          <span className="text-red-700/80">{outOfStockLabel}</span>
                        ) : (
                          <>Series: {displaySubCategoryLabel(product.subCategory)} · Stock {stockQty}</>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      {product.onSale && product.discountPrice != null && product.discountPrice > 0 && product.discountPrice < product.price ? (
                        <>
                          <span className="block text-lg font-bold font-brand text-brand-beige">
                            {formatEurPrice(product.discountPrice)}
                          </span>
                          <span className="block text-[10px] font-bold text-brand-navy/30 line-through">
                            {formatEurPrice(product.price)}
                          </span>
                        </>
                      ) : (
                        <span className={`block text-lg font-bold font-brand ${product.onSale ? 'text-brand-beige' : 'text-brand-navy'}`}>
                          {formatEurPrice(product.price)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
              );
            })}
          </div>
          
          {sortedProducts.length === 0 && (
            <div className="text-center py-40 bg-brand-gray/30 border border-brand-gray rounded-[40px]">
              <p className="font-bold uppercase tracking-tighter text-3xl text-brand-navy/20">No matching pieces identified.</p>
              <button 
                onClick={() => { setPriceRange([0, 5000]); setSortBy('featured'); }}
                className="mt-6 text-[10px] font-bold uppercase tracking-widest text-brand-beige hover:underline"
              >
                Clear Filters
              </button>
            </div>
          )}

          {/* Load More */}
          {sortedProducts.length > 0 && (
            <div className="mt-32 text-center">
              <button className="px-16 py-5 bg-brand-navy text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-beige transition-all shadow-2xl">
                Explore More Designs
              </button>
              <p className="mt-8 text-[10px] font-bold text-brand-navy/30 uppercase tracking-widest">
                Viewing {sortedProducts.length} of {products.length} Designs
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}
