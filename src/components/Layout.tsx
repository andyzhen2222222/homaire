import { Link, Outlet } from 'react-router-dom';
import { ShoppingCart, User, Search, Menu, X, LayoutDashboard, ChevronDown, Truck, MapPin, Wrench, ShieldCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useCart } from './CartContext';
import { motion, AnimatePresence } from 'motion/react';
import Logo from './Logo';
import { useStoreConfig } from '../hooks/useAdminData';
import { HOMAIRE_SLOGAN } from '../content/homaireBrandStory';
import {
  GLOBAL_SERVICE_STRIP_TITLE_DEFAULT,
  GLOBAL_SERVICE_DELIVERY_TIME_DEFAULT,
  GLOBAL_SERVICE_DELIVERY_AREA_DEFAULT,
  GLOBAL_SERVICE_INSTALLATION_DEFAULT,
  GLOBAL_SERVICE_WARRANTY_DEFAULT,
} from '../lib/globalServiceStripDefaults';

const DEF_TOP1 = 'Free Shipping & Returns';
const DEF_TOP2 = '365-Day Worry-Free Warranty';
const DEF_TOP3 = '5-Year Quality Guarantee';
const DEF_HELP = 'Help & Support';
const DEF_LOCALE = 'English (EN)';
const DEF_FOOTER_INTRO =
  'Homaire creates practical and comfortable home solutions for modern living — furniture, outdoor, kitchen, bathroom, pets, lighting and more — so every space feels more complete.';
const DEF_FOOTER_COPY = '© 2026 HOMAIRE. ALL RIGHTS RESERVED.';
const DEF_FOOTER_SLOGAN = HOMAIRE_SLOGAN;
const DEF_NEWS_TITLE = 'Newsletter';
const DEF_NEWS_SUB = 'Receive latest design trends and exclusive product launches.';
const DEF_NEWS_CTA = 'Join The Club';
const DEF_NEWS_PH = 'Email Address';

export default function Layout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, profile, login } = useAuth();
  const { itemCount } = useCart();
  const { config } = useStoreConfig();

  useEffect(() => {
    const t = (config?.siteTitle || config?.storeName || 'Homaire').trim();
    document.title = t;
  }, [config?.siteTitle, config?.storeName]);

  const navLinks = [
    {
      name: '沙发',
      href: '/category/sofas',
      sublinks: [
        { name: '布艺沙发', href: '/category/sofas?sub=fabric' },
        { name: '皮革沙发', href: '/category/sofas?sub=leather' },
        { name: '转角沙发', href: '/category/sofas?sub=corner' },
        { name: '沙发床', href: '/category/sofas?sub=sofabed' },
      ],
    },
    {
      name: '床',
      href: '/category/beds',
      sublinks: [
        { name: '实木床', href: '/category/beds?sub=solidwood' },
        { name: '软包床', href: '/category/beds?sub=upholstered' },
        { name: '极简床架', href: '/category/beds?sub=minimalist' },
      ],
    },
    {
      name: '桌子',
      href: '/category/tables',
      sublinks: [
        { name: '餐桌', href: '/category/tables?sub=dining' },
        { name: '茶几', href: '/category/tables?sub=coffee' },
        { name: '边几', href: '/category/tables?sub=side' },
      ],
    },
    {
      name: '椅子',
      href: '/category/chairs',
      sublinks: [
        { name: '餐椅', href: '/category/chairs?sub=dining' },
        { name: '扶手椅', href: '/category/chairs?sub=armchair' },
        { name: '休闲椅', href: '/category/chairs?sub=lounge' },
      ],
    },
    {
      name: '户外',
      href: '/category/garden',
      sublinks: [
        { name: '户外沙发', href: '/category/garden?sub=sofa' },
        { name: '庭院套装', href: '/category/garden?sub=set' },
      ],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg">
      {/* Top Banner */}
      <div className="bg-brand-navy text-white text-[11px] py-1.5 px-4 flex justify-between items-center shrink-0">
        <div className="flex gap-6 uppercase tracking-wider font-medium opacity-80">
          <span className="hidden sm:inline">{(config?.topBarLine1 || DEF_TOP1).trim()}</span>
          <span className="hidden md:inline">{(config?.topBarLine2 || DEF_TOP2).trim()}</span>
          <span>{(config?.topBarLine3 || DEF_TOP3).trim()}</span>
        </div>
        <div className="flex gap-4">
          <span className="hidden sm:inline opacity-60">{(config?.topBarHelpText || DEF_HELP).trim()}</span>
          <span className="font-bold uppercase tracking-widest text-[9px] bg-white/10 px-2 py-0.5 rounded">
            {(config?.topBarLocaleText || DEF_LOCALE).trim()}
          </span>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-brand-bg/95 backdrop-blur-sm border-b border-brand-border h-20 flex items-center">
        <div className="max-w-7xl mx-auto w-full px-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            {/* Mobile Menu Toggle */}
            <button 
              className="lg:hidden p-2 text-brand-navy" 
              onClick={() => setIsMenuOpen(true)}
              id="mobile-menu-btn"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Logo */}
            <Link to="/" id="main-logo" className="shrink-0">
              <Logo size="xl" className="origin-left" />
            </Link>
          </div>

          {/* Search Bar - Professional Style */}
          <div className="hidden lg:block flex-1 max-w-xl mx-12">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search products, categories or styles..." 
                className="w-full bg-brand-gray border-none rounded-full py-2.5 px-6 text-sm focus:ring-2 focus:ring-brand-beige/20 outline-none"
              />
              <div className="absolute right-4 top-2.5">
                <Search className="w-5 h-5 text-brand-navy/30" />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-6">
            {/* Entry point for Admin */}
            {profile?.isAdmin && (
              <Link to="/admin" className="flex flex-col items-center group text-brand-beige h-10 justify-center px-4 rounded-xl hover:bg-brand-gray transition-all border border-brand-beige/20" id="admin-link">
                <LayoutDashboard className="w-5 h-5 group-hover:scale-110 transition-transform" strokeWidth={2} />
                <span className="text-[8px] mt-1 uppercase font-black tracking-widest">Admin</span>
              </Link>
            )}

            <div className="flex flex-col items-center">
              {user ? (
                <Link to="/profile" className="flex flex-col items-center group relative h-10 justify-center px-2" id="profile-link">
                  <User className="w-5 h-5 group-hover:text-brand-beige transition-colors text-brand-navy" strokeWidth={1.5} />
                  <span className="text-[9px] mt-1 uppercase font-bold group-hover:text-brand-beige tracking-tighter text-brand-navy">Account</span>
                </Link>
              ) : (
                <button 
                  onClick={login} 
                  className="flex flex-col items-center group cursor-pointer h-10 justify-center px-2"
                  id="login-btn"
                >
                  <User className="w-5 h-5 group-hover:text-brand-beige transition-colors text-brand-navy" strokeWidth={1.5} />
                  <span className="text-[9px] mt-1 uppercase font-bold group-hover:text-brand-beige tracking-tighter text-brand-navy">Login</span>
                </button>
              )}
            </div>
            
            <Link to="/cart" className="flex flex-col items-center relative group h-10 justify-center px-2" id="cart-link">
              <ShoppingCart className="w-5 h-5 group-hover:text-brand-beige transition-colors text-brand-navy" strokeWidth={1.5} />
              <span className="text-[9px] mt-1 uppercase font-bold group-hover:text-brand-beige tracking-tighter text-brand-navy">Bag</span>
              {itemCount > 0 && (
                <span className="absolute top-0 right-0 bg-brand-beige text-white text-[8px] rounded-full w-3.5 h-3.5 flex items-center justify-center font-black">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Secondary Nav */}
      <nav className="hidden lg:flex border-b border-brand-border bg-brand-bg sticky top-20 z-40">
        <div className="max-w-7xl mx-auto w-full px-4 py-1 flex gap-8 text-[13px] font-semibold tracking-wide">
          <Link to="/category/sale" className="text-brand-accent hover:opacity-80 transition-opacity py-3">限时特惠</Link>
          <Link
            to="/brand-story"
            className="border-b border-transparent py-3 text-brand-navy/80 transition-colors hover:border-brand-beige/40 hover:text-brand-beige"
          >
            品牌故事
          </Link>
          {navLinks.map(link => (
            <div key={link.href} className="relative group/nav py-3">
              <Link 
                to={link.href} 
                className="text-brand-navy hover:text-brand-beige transition-colors flex items-center gap-1"
                id={`nav-link-${link.href.replace(/[^a-z0-9]+/gi, '-')}`}
              >
                {link.name}
                <ChevronDown className="w-3 h-3 opacity-30 group-hover/nav:rotate-180 transition-transform" />
              </Link>
              
              {/* Dropdown Menu */}
              <div className="absolute top-full left-0 bg-white border border-brand-gray shadow-2xl p-6 min-w-[200px] opacity-0 translate-y-4 pointer-events-none group-hover/nav:opacity-100 group-hover/nav:translate-y-0 group-hover/nav:pointer-events-auto transition-all duration-300 z-50 rounded-b-xl overflow-hidden">
                <div className="absolute left-0 top-0 w-1 h-full bg-brand-beige/20" />
                <div className="flex flex-col gap-4">
                  {link.sublinks?.map(sub => (
                    <Link 
                      key={sub.name} 
                      to={sub.href} 
                      className="text-[12px] text-brand-navy/60 hover:text-brand-navy transition-colors whitespace-nowrap"
                    >
                      {sub.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
          <Link to="/category/lighting" className="text-brand-navy hover:text-brand-beige transition-colors py-3">灯具</Link>
          <Link to="/category/accessories" className="text-brand-navy hover:text-brand-beige transition-colors py-3">家居配件</Link>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-brand-navy/40 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-80 bg-brand-bg z-[101] p-8"
              id="mobile-drawer"
            >
              <div className="flex justify-between items-center mb-12">
                <Logo variant="symbol" size="lg" />
                <button onClick={() => setIsMenuOpen(false)} id="close-menu-btn" className="p-2 hover:bg-brand-gray rounded-full">
                  <X className="w-6 h-6 text-brand-navy" />
                </button>
              </div>
              <nav className="flex flex-col gap-6 text-lg font-brand font-semibold text-brand-navy">
                <Link
                  to="/category/sale"
                  onClick={() => setIsMenuOpen(false)}
                  className="hover:text-brand-beige py-2 border-b border-brand-gray text-brand-accent"
                >
                  限时特惠
                </Link>
                <Link
                  to="/brand-story"
                  onClick={() => setIsMenuOpen(false)}
                  className="hover:text-brand-beige py-2 border-b border-brand-gray"
                >
                  品牌故事
                </Link>
                {navLinks.map(link => (
                  <Link 
                    key={link.href} 
                    to={link.href} 
                    onClick={() => setIsMenuOpen(false)}
                    className="hover:text-brand-beige py-2 border-b border-brand-gray"
                  >
                    {link.name}
                  </Link>
                ))}
                <Link
                  to="/category/lighting"
                  onClick={() => setIsMenuOpen(false)}
                  className="hover:text-brand-beige py-2 border-b border-brand-gray"
                >
                  灯具
                </Link>
                <Link
                  to="/category/accessories"
                  onClick={() => setIsMenuOpen(false)}
                  className="hover:text-brand-beige py-2 border-b border-brand-gray"
                >
                  家居配件
                </Link>
              </nav>
              <div className="mt-20">
                <p className="text-[10px] font-bold text-brand-sage uppercase tracking-[0.2em] mb-4">{HOMAIRE_SLOGAN}</p>
                <div className="h-0.5 w-12 bg-brand-beige" />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Global service strip (above footer) */}
      <section
        className="mt-24 border-t border-brand-gray bg-white px-4 py-14 sm:py-16"
        aria-labelledby="global-service-strip-heading"
      >
        <div className="max-w-7xl mx-auto">
          <h2
            id="global-service-strip-heading"
            className="font-brand text-4xl md:text-5xl font-bold uppercase tracking-tighter text-brand-navy leading-tight mb-10 text-center sm:text-left"
          >
            {(config?.globalServiceStripTitle || GLOBAL_SERVICE_STRIP_TITLE_DEFAULT).trim()}
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {(
              [
                {
                  icon: Truck,
                  label: 'Delivery time',
                  body: (config?.globalServiceDeliveryTime || GLOBAL_SERVICE_DELIVERY_TIME_DEFAULT).trim(),
                },
                {
                  icon: MapPin,
                  label: 'Delivery area',
                  body: (config?.globalServiceDeliveryArea || GLOBAL_SERVICE_DELIVERY_AREA_DEFAULT).trim(),
                },
                {
                  icon: Wrench,
                  label: 'Installation',
                  body: (config?.globalServiceInstallation || GLOBAL_SERVICE_INSTALLATION_DEFAULT).trim(),
                },
                {
                  icon: ShieldCheck,
                  label: 'Warranty',
                  body: (config?.globalServiceWarranty || GLOBAL_SERVICE_WARRANTY_DEFAULT).trim(),
                },
              ] as const
            ).map(({ icon: Icon, label, body }) => (
              <div
                key={label}
                className="flex gap-4 rounded-2xl border border-brand-gray/80 bg-brand-gray/10 p-5 sm:p-6 shadow-sm"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-brand-beige shadow-sm ring-1 ring-brand-gray/40">
                  <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden />
                </span>
                <div className="min-w-0">
                  <h3 className="font-brand text-[10px] font-bold uppercase tracking-widest text-brand-navy/45 mb-2">
                    {label}
                  </h3>
                  <p className="text-sm leading-relaxed text-brand-navy/75 font-medium">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-navy text-white py-32 px-4 mt-16 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-16 mb-20">
            <div className="lg:col-span-2">
              <Link to="/" className="mb-8 block">
                <Logo light showSlogan size="lg" className="origin-left" />
              </Link>
              <p className="text-white/65 text-sm leading-relaxed max-w-sm mb-10 font-medium">
                {(config?.footerIntro || DEF_FOOTER_INTRO).trim()}
              </p>
              <div className="flex gap-4">
                {['Instagram', 'Pinterest', 'Twitter', 'Facebook'].map((social) => (
                  <a key={social} href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-brand-beige transition-all group overflow-hidden relative">
                    <span className="text-[8px] font-black uppercase tracking-tighter opacity-0 group-hover:opacity-100 absolute inset-0 flex items-center justify-center bg-brand-navy transition-opacity">{social}</span>
                    <div className="w-1 h-1 bg-white rounded-full group-hover:scale-150 transition-transform" />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-brand font-bold uppercase tracking-widest text-[10px] mb-8 text-brand-beige">Collections</h4>
              <ul className="space-y-4 text-[11px] font-medium uppercase tracking-widest text-white/50">
                <li><Link to="/category/sofas" className="hover:text-brand-beige transition-colors">Living Room</Link></li>
                <li><Link to="/category/beds" className="hover:text-brand-beige transition-colors">Bedroom</Link></li>
                <li><Link to="/category/tables" className="hover:text-brand-beige transition-colors">Dining Room</Link></li>
                <li><Link to="/category/sale" className="hover:text-brand-accent transition-colors">Sale Event</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-brand font-bold uppercase tracking-widest text-[10px] mb-8 text-brand-beige">About</h4>
              <ul className="space-y-4 text-[11px] font-medium uppercase tracking-widest text-white/50">
                <li><Link to="/brand-story" className="hover:text-brand-beige transition-colors">品牌故事</Link></li>
                <li><Link to="/" className="hover:text-brand-beige transition-colors">Craftsmanship</Link></li>
                <li><Link to="/admin" className="hover:text-brand-beige transition-colors">Admin Access</Link></li>
                <li><Link to="/" className="hover:text-brand-beige transition-colors">Sustainability</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-brand font-bold uppercase tracking-widest text-[10px] mb-8 text-brand-beige">
                {(config?.newsletterTitle || DEF_NEWS_TITLE).trim()}
              </h4>
              <p className="text-xs text-white/40 mb-6 font-medium leading-relaxed">
                {(config?.newsletterSubcopy || DEF_NEWS_SUB).trim()}
              </p>
              <form className="flex flex-col gap-3">
                <input 
                  type="email" 
                  placeholder={(config?.newsletterPlaceholder || DEF_NEWS_PH).trim()} 
                  className="bg-white/5 border border-white/10 px-6 py-4 text-xs w-full focus:outline-none focus:border-brand-beige transition-colors rounded-xl font-bold uppercase tracking-widest"
                />
                <button className="bg-brand-beige text-white px-8 py-4 text-[10px] uppercase font-bold tracking-widest whitespace-nowrap rounded-xl shadow-xl hover:bg-white hover:text-brand-navy transition-all">
                  {(config?.newsletterCtaLabel || DEF_NEWS_CTA).trim()}
                </button>
              </form>
            </div>
          </div>

          <div className="border-t border-white/5 pt-12 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex gap-12 text-[9px] font-medium uppercase tracking-[0.2em] text-white/30">
              <p>{(config?.footerCopyright || DEF_FOOTER_COPY).trim()}</p>
              <p className="flex items-center gap-2">
                <span className="w-1 h-1 bg-brand-beige rounded-full" />
                {(config?.footerSloganLine || DEF_FOOTER_SLOGAN).trim()}
              </p>
            </div>
            <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest text-white/30">
              <Link to="/" className="hover:text-white transition-colors">Privacy</Link>
              <Link to="/" className="hover:text-white transition-colors">Terms</Link>
              <Link to="/" className="hover:text-white transition-colors">Sustainability</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
