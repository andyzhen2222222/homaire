import { useAuth } from '../components/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, User as UserIcon, Package, MapPin, Settings, Heart, Truck, Clock, CheckCircle, ChevronRight, ShoppingBag } from 'lucide-react';
import { Navigate, Link } from 'react-router-dom';
import { useUserOrders } from '../hooks/useUserData';
import { useState } from 'react';

export default function ProfilePage() {
  const { user, profile, loading: authLoading, logout } = useAuth();
  const { orders, loading: ordersLoading } = useUserOrders();
  const [activeTab, setActiveTab] = useState('orders');

  if (authLoading) return <div className="h-screen flex items-center justify-center font-black uppercase tracking-tighter text-2xl animate-pulse">Loading...</div>;
  
  if (!user) return <Navigate to="/" />;

  const menuItems = [
    { id: 'orders', icon: <Package className="w-5 h-5" />, label: 'My Orders' },
    { id: 'wishlist', icon: <Heart className="w-5 h-5" />, label: 'Wishlist' },
    { id: 'addresses', icon: <MapPin className="w-5 h-5" />, label: 'Shipping Addresses' },
    { id: 'settings', icon: <Settings className="w-5 h-5" />, label: 'Account Settings' },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-orange-500" />;
      case 'processing': return <Settings className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'shipped': return <Truck className="w-4 h-4 text-brand-accent" />;
      case 'delivered': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <Clock className="w-4 h-4 text-brand-navy/40" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-32 bg-brand-gray/30 min-h-screen">
      <div className="flex flex-col lg:flex-row gap-20">
        {/* Sidebar */}
        <aside className="w-full lg:w-80 shrink-0">
          <div className="bg-white p-10 border border-brand-gray shadow-sm rounded-[3rem] sticky top-32">
            <div className="flex flex-col items-center mb-12 border-b border-brand-gray pb-12 text-center">
              <div className="w-28 h-28 bg-brand-gray rounded-[2.5rem] flex items-center justify-center mb-8 border-4 border-white shadow-2xl overflow-hidden group">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                ) : (
                  <UserIcon className="w-12 h-12 text-brand-navy/20" />
                )}
              </div>
              <h2 className="text-2xl font-brand font-bold uppercase tracking-tighter text-brand-navy leading-none">{user.displayName || 'Design Enthusiast'}</h2>
              <p className="text-[10px] text-brand-navy/40 font-bold uppercase tracking-[0.2em] mt-4">{user.email}</p>
              {profile?.isAdmin && (
                <div className="mt-6 px-4 py-1.5 bg-brand-navy text-white text-[9px] font-bold uppercase tracking-[0.3em] rounded-full shadow-lg shadow-brand-navy/10">
                  Design Director
                </div>
              )}
            </div>
            
            <nav className="space-y-2">
              {menuItems.map((item) => (
                <button 
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-4 px-6 py-4 transition-all text-[11px] uppercase font-bold tracking-widest rounded-2xl ${
                    activeTab === item.id 
                    ? 'bg-brand-navy text-white shadow-2xl' 
                    : 'text-brand-navy/40 hover:text-brand-navy hover:bg-brand-gray'
                  }`}
                >
                  <span className={activeTab === item.id ? 'text-brand-beige' : ''}>{item.icon}</span>
                  {item.label}
                </button>
              ))}
              
              <button 
                onClick={logout}
                className="w-full flex items-center gap-4 px-6 py-4 hover:bg-red-50 transition-all text-[11px] uppercase font-bold tracking-widest text-red-500 mt-16 border-t border-brand-gray pt-10 rounded-2xl"
              >
                <LogOut className="w-5 h-5" />
                Exit Sanctuary
              </button>
            </nav>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-grow">
          <AnimatePresence mode="wait">
            {activeTab === 'orders' && (
              <motion.div 
                key="orders"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-12"
              >
                <div className="bg-white p-16 border border-brand-gray shadow-sm rounded-[4rem]">
                  <h1 className="text-5xl font-brand font-bold uppercase tracking-tighter text-brand-navy mb-8 leading-none">
                    Acquisitions <span className="text-brand-beige">Archive</span>.
                  </h1>
                  <p className="text-brand-navy/60 font-medium leading-relaxed max-w-2xl text-lg italic">
                    Track your design pieces from our workshop to your sanctuary. Every ZIPSOFA piece is handcrafted with precision and purpose.
                  </p>
                </div>

                {ordersLoading ? (
                  <div className="space-y-6">
                    {[1, 2].map(i => <div key={i} className="h-48 bg-white animate-pulse border border-brand-gray rounded-[3rem]" />)}
                  </div>
                ) : orders.length > 0 ? (
                  <div className="space-y-8">
                    {orders.map((order) => (
                      <div key={order.id} className="bg-white border border-brand-gray shadow-sm rounded-[3rem] overflow-hidden hover:border-brand-beige transition-colors group">
                        <div className="px-10 py-8 border-b border-brand-gray flex flex-wrap gap-10 justify-between items-center bg-brand-gray/20">
                          <div className="flex gap-12">
                            <div>
                              <p className="text-[9px] font-bold text-brand-navy/30 uppercase tracking-[0.2em] mb-2">Order Index</p>
                              <p className="text-[11px] font-bold uppercase tracking-widest text-brand-navy">#{order.id?.slice(-8).toUpperCase()}</p>
                            </div>
                            <div>
                              <p className="text-[9px] font-bold text-brand-navy/30 uppercase tracking-[0.2em] mb-2">Status</p>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(order.status)}
                                <p className="text-[11px] font-bold uppercase tracking-widest text-brand-navy">{order.status}</p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                             <p className="text-[9px] font-bold text-brand-navy/30 uppercase tracking-[0.2em] mb-2">Sanctuary Arrival</p>
                             <p className="text-[11px] font-bold uppercase tracking-widest text-brand-navy">Anticipated in 14 days</p>
                          </div>
                        </div>
                        
                        <div className="p-10">
                          <div className="space-y-8">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex gap-8 items-center">
                                <div className="w-20 h-20 bg-brand-gray rounded-2xl overflow-hidden border border-brand-gray group-hover:shadow-lg transition-shadow">
                                  <div className="w-full h-full flex items-center justify-center text-brand-navy/20">
                                    <ShoppingBag className="w-8 h-8" />
                                  </div>
                                </div>
                                <div className="flex-grow">
                                  <h4 className="text-base font-brand font-bold uppercase tracking-tight text-brand-navy">{item.name}</h4>
                                  <p className="text-[10px] text-brand-navy/40 font-bold uppercase tracking-[0.2em] mt-1">Qty: {item.quantity} / Unit Price: € {item.price.toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xl font-bold text-brand-navy font-brand">€ {(item.price * item.quantity).toLocaleString()}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <div className="mt-12 pt-10 border-t border-brand-gray flex justify-between items-end">
                            <div>
                               <p className="text-[10px] font-bold text-brand-navy/30 uppercase tracking-[0.3em] mb-6">Delivery Node</p>
                               <div className="flex items-start gap-4">
                                  <div className="w-10 h-10 bg-brand-gray rounded-full flex items-center justify-center text-brand-beige">
                                    <MapPin className="w-5 h-5 shrink-0" />
                                  </div>
                                  <div>
                                     <p className="text-sm font-bold text-brand-navy uppercase tracking-tight">{order.shippingAddress.fullName}</p>
                                     <p className="text-[11px] text-brand-navy/60 font-medium uppercase tracking-widest mt-1">{order.shippingAddress.address}, {order.shippingAddress.city}</p>
                                  </div>
                               </div>
                            </div>
                            <div className="bg-brand-navy text-white p-10 rounded-[2.5rem] shadow-3xl text-right border-b-4 border-brand-beige">
                               <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.4em] mb-2">Total Valuation</p>
                               <p className="text-4xl font-brand font-bold tracking-tighter">€ {order.total.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white p-24 text-center border border-brand-gray rounded-[4rem] shadow-sm">
                    <div className="w-24 h-24 bg-brand-gray/50 rounded-[2rem] flex items-center justify-center mx-auto mb-10 border border-brand-gray shadow-inner">
                      <ShoppingBag className="w-10 h-10 text-brand-navy/10" />
                    </div>
                    <h3 className="text-3xl font-brand font-bold uppercase tracking-tighter text-brand-navy mb-6">Acquisition History Empty</h3>
                    <p className="text-brand-navy/40 text-[11px] font-bold uppercase tracking-widest leading-loose max-w-sm mx-auto mb-12">Your space is waiting for its centerpiece. Begin your design journey with ZipSofa.</p>
                    <Link to="/category/sofas" className="inline-flex items-center gap-4 bg-brand-navy text-white px-12 py-6 rounded-full font-bold uppercase text-xs tracking-widest hover:bg-brand-beige transition-all shadow-3xl">
                       Explore The Collection <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'wishlist' && (
              <motion.div 
                key="wishlist"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white p-32 text-center border border-brand-gray rounded-[4rem] shadow-sm min-h-[600px] flex flex-col items-center justify-center"
              >
                <motion.div 
                  animate={{ scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }}
                  transition={{ repeat: Infinity, duration: 6 }}
                  className="w-24 h-24 bg-brand-gray/50 rounded-[2.5rem] flex items-center justify-center mb-10 border border-brand-gray shadow-inner"
                >
                  <Heart className="w-10 h-10 text-brand-beige" fill="currentColor" />
                </motion.div>
                <h3 className="text-3xl font-brand font-bold uppercase tracking-tighter text-brand-navy mb-6">Your Curation</h3>
                <p className="text-brand-navy/40 text-[11px] font-bold uppercase tracking-[0.2em] leading-loose max-w-sm">Save the designs that synchronize with your vision for future acquisition.</p>
              </motion.div>
            )}

            {activeTab === 'addresses' && (
              <motion.div 
                key="addresses"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white p-16 border border-brand-gray shadow-sm rounded-[4rem]"
              >
                <h1 className="text-5xl font-brand font-bold uppercase tracking-tighter text-brand-navy mb-16 leading-none border-b border-brand-gray pb-12">Shipping <span className="text-brand-beige">Nodes</span>.</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <button className="border-2 border-dashed border-brand-gray p-12 rounded-[3rem] flex flex-col items-center justify-center group hover:border-brand-beige transition-all bg-brand-gray/20">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-6 text-brand-navy/20 group-hover:bg-brand-beige group-hover:text-white transition-all shadow-xl group-hover:scale-110">
                      <MapPin className="w-8 h-8" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-brand-navy/40 group-hover:text-brand-navy transition-colors">Establish New Logistics Node</span>
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div 
                key="settings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white p-16 border border-brand-gray shadow-sm rounded-[4rem]"
              >
                <h1 className="text-5xl font-brand font-bold uppercase tracking-tighter text-brand-navy mb-16 leading-none border-b border-brand-gray pb-12">Account <span className="text-brand-beige">Calibration</span>.</h1>
                <div className="space-y-12 max-w-xl">
                   <div>
                      <label className="text-[10px] font-bold uppercase tracking-[0.4em] text-brand-navy/30 mb-6 block">Identity Designation</label>
                      <input type="text" defaultValue={user.displayName || ''} className="w-full bg-brand-gray border border-brand-gray rounded-2xl p-6 text-base font-bold uppercase tracking-tight text-brand-navy focus:ring-2 focus:ring-brand-beige transition-all outline-none" />
                   </div>
                   <div>
                      <label className="text-[10px] font-bold uppercase tracking-[0.4em] text-brand-navy/30 mb-6 block">Secure Access channel</label>
                      <input type="email" defaultValue={user.email || ''} readOnly className="w-full bg-brand-gray/50 border border-brand-gray rounded-2xl p-6 text-base font-bold text-brand-navy/20 cursor-not-allowed uppercase tracking-tight" />
                   </div>
                   <button className="bg-brand-navy text-white px-16 py-6 rounded-full font-bold uppercase text-[11px] tracking-[0.3em] hover:bg-brand-beige transition-all shadow-3xl hover:shadow-brand-beige/20">
                      Synchronize Profile
                   </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
