import React, { useState, FormEvent, useRef, Fragment } from 'react';
import { useProducts } from '../hooks/useProducts';
import { useOrders, usePromotions, useAdminActions } from '../hooks/useAdminData';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { 
  Plus, Trash2, Edit, Package, DollarSign, ShoppingBag, 
  Users, LayoutDashboard, Search, X, Check, ArrowRight,
  TrendingUp, Clock, AlertCircle, Eye, Tag, Image as ImageIcon,
  ChevronRight, Filter, Download, MoreHorizontal, Settings
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { Product, Order, Promotion, StoreConfig } from '../types';
import { useStoreConfig } from '../hooks/useAdminData';
import { SiteSettingsForm } from '../components/admin/SiteSettingsForm';
import { fileToDataUrl } from '../lib/fileToDataUrl';

export default function AdminDashboard() {
  const { products } = useProducts();
  const { orders, updateOrderStatus } = useOrders();
  const { promotions, togglePromotion, deletePromotion, addPromotion } = usePromotions();
  const { addProduct, bulkAddProducts, updateProduct, deleteProduct } = useAdminActions();
  const { config, updateConfig } = useStoreConfig();
  
  const { user, profile, loading: authLoading, login, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'promotions' | 'settings'>('products');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingPromo, setIsAddingPromo] = useState(false);

  // Stats calculation
  const totalRevenue = orders.reduce((acc, order) => order.status !== 'cancelled' ? acc + order.total : acc, 0);
  const activeOrdersCount = orders.filter(o => ['pending', 'processing', 'shipped'].includes(o.status)).length;
  const lowStockThreshold = config?.lowStockThreshold || 10;
  const lowStockProducts = products.filter(p => p.stock < lowStockThreshold);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-gray/30 text-brand-navy">
        <p className="text-sm font-medium">正在加载登录状态…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-brand-gray/30 px-6 text-center">
        <div>
          <h1 className="text-2xl font-brand font-bold text-brand-navy mb-2">管理员登录</h1>
          <p className="text-sm text-brand-navy/60 max-w-md">
            当前为本地模式：数据保存在本机浏览器。登录时第三步填写管理员口令（默认 <code className="text-xs bg-white px-1 py-0.5 rounded">admin</code>
            ，可通过环境变量 <code className="text-xs bg-white px-1 py-0.5 rounded">VITE_LOCAL_ADMIN_PASSWORD</code> 修改）。
          </p>
        </div>
        <button
          type="button"
          onClick={() => login()}
          className="bg-brand-navy text-white px-8 py-4 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-brand-beige transition-colors"
        >
          登录（本地会话）
        </button>
        <Link to="/" className="text-xs font-bold uppercase tracking-widest text-brand-navy/40 hover:text-brand-navy">
          返回商店首页
        </Link>
      </div>
    );
  }

  if (!profile?.isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-brand-gray/30 px-6 text-center">
        <div>
          <h1 className="text-2xl font-brand font-bold text-brand-navy mb-2">无访问权限</h1>
          <p className="text-sm text-brand-navy/60 max-w-md">
            当前账号 <span className="font-semibold text-brand-navy">{user.email}</span> 不是管理员会话。请点击下方退出后重新登录，并在提示「管理员口令」时填写正确口令（默认 <code className="text-xs bg-white px-1 py-0.5 rounded">admin</code>）。
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <button
            type="button"
            onClick={() => void logout()}
            className="text-xs font-bold uppercase tracking-widest text-brand-navy border border-brand-gray px-6 py-3 rounded-full hover:bg-brand-gray/40 transition-colors"
          >
            退出登录
          </button>
          <Link to="/" className="text-xs font-bold uppercase tracking-widest text-brand-beige hover:underline">
            返回商店首页
          </Link>
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Revenue', value: `€ ${totalRevenue.toLocaleString()}`, icon: <TrendingUp className="w-4 h-4" />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Active Orders', value: activeOrdersCount.toString(), icon: <ShoppingBag className="w-4 h-4" />, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Inventory', value: products.length.toString(), icon: <Package className="w-4 h-4" />, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Customers', value: '1.2k', icon: <Users className="w-4 h-4" />, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="flex min-h-screen bg-brand-gray/30 font-sans text-brand-navy">
      {/* Sidebar - Compact & Professional */}
      <aside className="w-64 bg-white border-r border-brand-gray flex flex-col fixed h-full z-40">
        <div className="p-8 border-b border-brand-gray">
          <Link to="/" className="flex flex-col gap-1">
            <span className="text-xl font-brand font-bold tracking-tighter text-brand-navy leading-none">HOMAIRE</span>
            <span className="text-[9px] font-bold tracking-[0.4em] text-brand-beige uppercase">Executive Hub</span>
          </Link>
        </div>
        
        <nav className="flex-grow p-4 space-y-1">
          {[
            { id: 'products', label: 'Inventory', icon: <Package className="w-4 h-4" /> },
            { id: 'orders', label: 'Purchases', icon: <ShoppingBag className="w-4 h-4" /> },
            { id: 'promotions', label: 'Campaigns', icon: <Tag className="w-4 h-4" /> },
            { id: 'settings', label: 'Site & CMS', icon: <Settings className="w-4 h-4" /> },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === tab.id ? 'bg-brand-navy text-white shadow-lg' : 'text-brand-navy/40 hover:bg-brand-gray hover:text-brand-navy'}`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-brand-gray">
          <div className="flex items-center gap-3 p-3 bg-brand-gray/50 rounded-2xl">
            <div className="w-8 h-8 bg-brand-navy rounded-xl flex items-center justify-center font-bold text-xs uppercase text-white shadow-sm">
              {user?.displayName?.[0] || 'A'}
            </div>
            <div className="flex-grow min-w-0">
              <p className="text-[10px] font-bold truncate text-brand-navy uppercase tracking-tight">{user?.displayName || 'Admin'}</p>
              <p className="text-[9px] text-brand-navy/40 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow ml-64 p-12">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-brand font-bold text-brand-navy uppercase tracking-tighter leading-none">{activeTab}</h1>
            <p className="text-[10px] font-bold text-brand-navy/30 uppercase tracking-widest mt-2">Executive Overview / {activeTab} Management</p>
          </div>
          
          <div className="flex gap-3">
            {activeTab === 'products' && (
              <button 
                onClick={() => setIsImporting(true)}
                className="bg-white text-brand-navy px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest border border-brand-gray flex items-center gap-2 hover:border-brand-navy transition-all shadow-sm"
              >
                <Download className="w-3 h-3" /> Catalog Import
              </button>
            )}
            {(activeTab === 'products' || activeTab === 'promotions') && (
              <button 
                onClick={() => {
                  if (activeTab === 'products') setIsAddingProduct(true);
                  if (activeTab === 'promotions') setIsAddingPromo(true);
                }}
                className="bg-brand-navy text-white px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-brand-beige transition-all shadow-xl shadow-brand-navy/10"
              >
                <Plus className="w-3 h-3" /> New Entry
              </button>
            )}
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-8 mb-12">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-[2rem] border border-brand-gray shadow-sm transition-all hover:shadow-xl hover:border-brand-beige group">
              <div className="flex justify-between items-start mb-4">
                <div className={`${stat.bg} ${stat.color} p-3 rounded-2xl transition-transform group-hover:scale-110`}>
                  {stat.icon}
                </div>
                <span className="text-[9px] font-bold text-brand-navy/30 uppercase tracking-[0.2em]">{stat.label}</span>
              </div>
              <p className="text-3xl font-brand font-bold text-brand-navy tracking-tighter">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-[2rem] border border-brand-gray shadow-sm overflow-hidden p-2">
          <div className="bg-white rounded-[1.5rem] overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'products' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-brand-gray bg-brand-gray/20">
                          <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-brand-navy/40">Product Design</th>
                          <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-brand-navy/40">Category</th>
                          <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-brand-navy/40">Inventory</th>
                          <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-brand-navy/40">Price Index</th>
                          <th className="px-8 py-5 text-right text-[10px] font-bold uppercase tracking-widest text-brand-navy/40">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-gray">
                        {products.map((product) => (
                          <tr key={product.id} className="hover:bg-brand-gray/10 transition-colors group">
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-4">
                                <img src={product.images[0]} alt="" className="w-12 h-12 object-cover rounded-xl bg-brand-gray shadow-sm" />
                                <span className="font-bold text-brand-navy uppercase text-xs tracking-tight">{product.name}</span>
                              </div>
                            </td>
                            <td className="px-8 py-5 text-brand-navy/60 text-xs font-medium capitalize tracking-tight">{product.category}</td>
                            <td className="px-8 py-5">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${product.stock < lowStockThreshold ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                                {product.stock} Units
                              </span>
                            </td>
                            <td className="px-8 py-5 font-bold text-brand-navy">€ {product.price.toLocaleString()}</td>
                            <td className="px-8 py-5 text-right">
                              <div className="flex justify-end gap-2">
                                <button onClick={() => setEditingProduct(product)} className="text-brand-navy/30 hover:text-brand-navy p-2 rounded-xl hover:bg-white transition-all"><Edit className="w-4 h-4" /></button>
                                <button onClick={() => { if(confirm("Archive entry?")) deleteProduct(product.id); }} className="text-brand-navy/30 hover:text-red-500 p-2 rounded-xl hover:bg-white transition-all"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

              {activeTab === 'orders' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-brand-gray bg-brand-gray/20">
                        <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-brand-navy/40">Order Identification</th>
                        <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-brand-navy/40">Sanctuary Delivery Details</th>
                        <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-brand-navy/40">Valuation</th>
                        <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-brand-navy/40">Shipment Status</th>
                        <th className="px-8 py-5 text-right text-[10px] font-bold uppercase tracking-widest text-brand-navy/40">Logistics Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-gray">
                      {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-brand-gray/10 transition-colors">
                          <td className="px-8 py-5">
                            <span className="font-bold text-brand-navy uppercase text-xs tracking-tight">#{order.id?.slice(-8).toUpperCase()}</span>
                          </td>
                          <td className="px-8 py-5">
                            <div className="text-brand-navy font-bold text-xs uppercase tracking-tight">{order.shippingAddress?.fullName}</div>
                            <div className="text-[10px] text-brand-navy/40 font-bold uppercase tracking-widest mt-1">{order.shippingAddress?.email}</div>
                          </td>
                          <td className="px-8 py-5 font-bold text-brand-navy">€ {order.total.toLocaleString()}</td>
                          <td className="px-8 py-5">
                            <select 
                              value={order.status}
                              onChange={(e) => updateOrderStatus(order.id!, e.target.value as any)}
                              className="text-[10px] font-bold uppercase tracking-widest bg-brand-gray border-none rounded-lg focus:ring-2 focus:ring-brand-beige py-1.5 px-3 outline-none"
                            >
                              <option value="pending">Pending</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td className="px-8 py-5 text-right text-[10px] font-bold uppercase tracking-widest text-brand-navy/40">
                            {new Date(order.createdAt?.seconds * 1000).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'promotions' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
                  {promotions.map((promo) => (
                    <div key={promo.id} className="border border-brand-gray rounded-[2rem] overflow-hidden flex bg-white hover:border-brand-beige transition-all group">
                      <div className="w-40 h-auto bg-brand-gray overflow-hidden">
                        <img src={promo.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      </div>
                      <div className="p-8 flex-grow flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-brand font-bold text-brand-navy uppercase tracking-tight">{promo.title}</h3>
                            <span className="text-[9px] font-bold uppercase tracking-[0.2em] py-1 px-2.5 rounded-full bg-brand-gray text-brand-navy/60 border border-brand-gray">{promo.type}</span>
                          </div>
                          <p className="text-[10px] text-brand-navy/40 font-bold uppercase tracking-widest leading-relaxed">{promo.subtitle}</p>
                        </div>
                        <div className="flex justify-between items-center mt-6">
                          <button 
                            onClick={() => togglePromotion(promo.id, !promo.active)}
                            className={`text-[9px] font-bold uppercase tracking-[0.3em] px-4 py-1.5 rounded-full transition-all ${promo.active ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-brand-gray text-brand-navy/20 border border-brand-gray'}`}
                          >
                            {promo.active ? 'Operational' : 'Disabled'}
                          </button>
                          <button onClick={() => deletePromotion(promo.id)} className="text-brand-navy/20 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 transition-all"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="p-8 max-w-2xl">
                  <Fragment key={config ? 'site-cfg' : 'site-cfg-pending'}>
                    <SiteSettingsForm config={config} onSave={updateConfig} />
                  </Fragment>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

        {/* Floating Admin Badge */}
        <div className="fixed bottom-10 right-10 bg-brand-navy text-white p-6 rounded-[2.5rem] shadow-3xl flex items-center gap-6 z-50 border border-white/5 border-b-4 border-b-brand-beige">
           <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center animate-pulse">
              <div className="w-3 h-3 bg-white rounded-full shadow-lg" />
           </div>
           <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] leading-none mb-2">Live Node Status</p>
              <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.3em]">Operational / Secured</p>
           </div>
        </div>
      </main>

      {/* Product Management Modal */}
      {(isAddingProduct || editingProduct) && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="absolute inset-0 bg-brand-charcoal/80 backdrop-blur-md" 
              onClick={() => { setIsAddingProduct(false); setEditingProduct(null); }} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="relative w-full max-w-4xl bg-white rounded-[4rem] shadow-3xl overflow-hidden max-h-[90vh] flex flex-col border border-brand-gray"
            >
               <div className="p-12 border-b border-brand-gray flex justify-between items-center bg-brand-gray/20">
                  <div>
                    <h2 className="text-4xl font-brand font-bold uppercase tracking-tighter text-brand-navy">
                       {editingProduct ? 'Update Entry' : 'New Listing'}
                    </h2>
                    <p className="text-brand-navy/30 font-bold uppercase text-[10px] tracking-[0.3em] mt-3">Product / Asset / Management</p>
                  </div>
                  <button 
                     onClick={() => { setIsAddingProduct(false); setEditingProduct(null); }}
                     className="w-14 h-14 bg-white hover:bg-brand-gray text-brand-navy/30 hover:text-brand-navy transition-all rounded-[2rem] flex items-center justify-center shadow-sm border border-brand-gray"
                  >
                     <X className="w-6 h-6" />
                  </button>
               </div>
               
               <div className="flex-grow overflow-y-auto p-12 custom-scrollbar">
                  <ProductForm 
                    initialData={editingProduct || undefined} 
                    onSave={async (data) => {
                      if (editingProduct) await updateProduct(editingProduct.id, data);
                      else await addProduct(data as any);
                      setIsAddingProduct(false);
                      setEditingProduct(null);
                    }} 
                  />
               </div>
            </motion.div>
         </div>
      )}

      {/* Promo Modal */}
      {isAddingPromo && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="absolute inset-0 bg-brand-charcoal/80 backdrop-blur-md" 
              onClick={() => setIsAddingPromo(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="relative w-full max-w-2xl bg-white rounded-[4rem] shadow-3xl overflow-hidden border border-brand-gray"
            >
               <div className="p-12 border-b border-brand-gray flex justify-between items-center bg-brand-gray/20 font-brand">
                  <h2 className="text-4xl font-bold uppercase tracking-tighter text-brand-navy">Visual Campaign</h2>
                  <button onClick={() => setIsAddingPromo(false)} className="bg-white p-4 rounded-2xl border border-brand-gray text-brand-navy/30 hover:text-brand-navy transition-colors"><X /></button>
               </div>
               <div className="p-12">
                  <PromoForm onSave={async (data) => {
                     await addPromotion(data as any);
                     setIsAddingPromo(false);
                  }} />
               </div>
            </motion.div>
         </div>
      )}

      {/* Import Modal */}
      {isImporting && (
        <ImportModal 
          onImport={async (data) => {
            await bulkAddProducts(data);
            setIsImporting(false);
          }} 
          onClose={() => setIsImporting(false)} 
        />
      )}
    </div>
  );
}

function ImportModal({ onImport, onClose }: { onImport: (data: any[]) => Promise<void>, onClose: () => void }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processData = (rawData: any[]) => {
    return rawData.map(item => ({
      name: item.name || item.Name || '',
      price: Number(item.price || item.Price || 0),
      category: (item.category || item.Category || 'sofas').toLowerCase(),
      stock: Number(item.stock || item.Stock || 0),
      description: item.description || item.Description || '',
      detailHtml: item.detailHtml || item.DetailHtml || item.html || item.HTML || '',
      images: typeof item.images === 'string' ? item.images.split(',').map((s: string) => s.trim()) : (Array.isArray(item.images) ? item.images : []),
      features: typeof item.features === 'string' ? item.features.split(/[\n,]/).map((s: string) => s.trim()).filter(Boolean) : (Array.isArray(item.features) ? item.features : []),
      subCategory: item.subCategory || item.SubCategory || '',
      videoUrl: item.videoUrl || item.VideoUrl || item.video || item.Video || '',
      manualUrl: item.manualUrl || item.ManualUrl || item.manual || item.Manual || '',
      onSale: Boolean(item.onSale || item.OnSale || false),
      discountPrice: Number(item.discountPrice || item.DiscountPrice || 0)
    }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    const reader = new FileReader();

    if (file.name.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        complete: async (results) => {
          try {
            const products = processData(results.data);
            await onImport(products);
          } catch (err: any) {
            setError(err.message);
          } finally {
            setLoading(false);
          }
        },
        error: (err) => {
          setError(err.message);
          setLoading(false);
        }
      });
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      reader.onload = async (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);
          const products = processData(data);
          await onImport(products);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      reader.readAsBinaryString(file);
    } else {
      setError('Unsupported file format. Please use CSV or XLSX.');
      setLoading(false);
    }
  };

  const handleJsonImport = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = JSON.parse(input);
      if (!Array.isArray(data)) throw new Error('Data must be an array of product objects');
      await onImport(data);
    } catch (e: any) {
      setError(e.message || 'Invalid JSON format');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-brand-charcoal/80 backdrop-blur-md" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-xl bg-white rounded-3xl p-8 flex flex-col shadow-2xl overflow-hidden">
        <header className="flex justify-between items-center mb-8 border-b border-brand-gray pb-6">
          <h2 className="text-2xl font-brand font-bold text-brand-navy">BULK IMPORT</h2>
          <button onClick={onClose} className="p-2 hover:bg-brand-gray rounded-lg transition-colors"><X className="w-6 h-6 text-brand-navy/20 hover:text-brand-navy" /></button>
        </header>

        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-brand-gray rounded-[2rem] hover:border-brand-beige hover:bg-brand-gray/20 transition-all group"
            >
              <Download className="w-10 h-10 text-brand-navy/10 group-hover:text-brand-beige mb-3" />
              <span className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest">Upload Dataset</span>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".csv, .xlsx, .xls"
              />
            </button>
            <div className="bg-brand-gray/30 p-6 rounded-[2rem] border border-brand-gray flex flex-col justify-center">
              <h3 className="text-[10px] font-bold text-brand-navy uppercase tracking-[0.2em] mb-4">Schema Headers</h3>
              <p className="text-[9px] text-brand-navy/60 leading-relaxed font-bold uppercase tracking-widest">
                <code className="bg-white/50 px-1.5 py-0.5 rounded mr-1">name</code> 
                <code className="bg-white/50 px-1.5 py-0.5 rounded mr-1">price</code> 
                <code className="bg-white/50 px-1.5 py-0.5 rounded mr-1">category</code> 
                <code className="bg-white/50 px-1.5 py-0.5 rounded">stock</code>
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-brand-gray"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-[0.3em] text-brand-navy/20">
              <span className="bg-white px-6">JSON Integration</span>
            </div>
          </div>

          <textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='[{"name": "Nordic Sofa", "price": 1200, "category": "sofas", "stock": 5}]'
            className="w-full h-32 bg-brand-gray border-none rounded-[1.5rem] text-[10px] font-mono p-6 focus:ring-2 focus:ring-brand-beige outline-none"
          />

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-red-100">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-4 pt-4">
            <button onClick={onClose} className="px-8 py-3 text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest hover:text-brand-navy transition-colors">Abort</button>
            <button 
              onClick={handleJsonImport}
              disabled={loading || !input.trim()}
              className="bg-brand-navy text-white px-10 py-4 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-beige disabled:opacity-50 transition-all shadow-3xl"
            >
              {loading ? 'Synthesizing...' : 'Execute JSON Import'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Sub-components for forms
function ProductForm({ initialData, onSave }: { initialData?: Product, onSave: (data: Partial<Product>) => void }) {
  const imagesFileInputRef = useRef<HTMLInputElement>(null);
  const manualFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingManual, setUploadingManual] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [newImageUrl, setNewImageUrl] = useState('');

  const [formData, setFormData] = useState<Partial<Product>>(initialData || {
    name: '',
    price: 0,
    description: '',
    detailHtml: '',
    category: 'sofas',
    subCategory: '',
    images: [],
    features: [],
    videoUrl: '',
    manualUrl: '',
    stock: 0,
    onSale: false,
    discountPrice: 0
  });

  const uploadImagesToStorage = async (files: FileList) => {
    setUploadingImages(true);
    setUploadError(null);
    try {
      const uploadedUrls: string[] = [];
      for (const file of Array.from(files)) {
        uploadedUrls.push(await fileToDataUrl(file));
      }
      setFormData((prev) => ({
        ...prev,
        images: [...(prev.images || []), ...uploadedUrls],
      }));
    } catch (e: any) {
      setUploadError(e?.message || 'Upload failed');
    } finally {
      setUploadingImages(false);
      if (imagesFileInputRef.current) imagesFileInputRef.current.value = '';
    }
  };

  const uploadManualToStorage = async (file: File) => {
    setUploadingManual(true);
    setUploadError(null);
    try {
      const url = await fileToDataUrl(file);
      setFormData((prev) => ({ ...prev, manualUrl: url }));
    } catch (e: any) {
      setUploadError(e?.message || 'Manual upload failed');
    } finally {
      setUploadingManual(false);
      if (manualFileInputRef.current) manualFileInputRef.current.value = '';
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-12">
      <div className="grid grid-cols-2 gap-10">
        <div className="space-y-8">
          <div>
            <label className="text-[10px] font-bold text-brand-navy/30 uppercase tracking-[0.3em] block mb-4">Core Metadata</label>
            <div className="space-y-6">
              <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Design Name" className="w-full bg-brand-gray border border-brand-gray rounded-xl p-4 text-[11px] font-bold uppercase tracking-widest text-brand-navy outline-none focus:ring-2 focus:ring-brand-beige" />
              <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Master Narrative" rows={4} className="w-full bg-brand-gray border border-brand-gray rounded-[1.5rem] p-6 text-[11px] font-bold uppercase tracking-widest text-brand-navy outline-none focus:ring-2 focus:ring-brand-beige" />
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-brand-gray border border-brand-gray rounded-xl p-4 text-[11px] font-bold uppercase tracking-widest text-brand-navy outline-none focus:ring-2 focus:ring-brand-beige cursor-pointer">
                <option value="sofas">Sofas</option>
                <option value="beds">Beds</option>
                <option value="tables">Tables</option>
                <option value="chairs">Chairs</option>
                <option value="garden">Garden</option>
                <option value="lighting">Lighting</option>
                <option value="storage">Storage</option>
                <option value="decor">Decor</option>
              </select>
              <input type="text" value={formData.subCategory || ''} onChange={e => setFormData({...formData, subCategory: e.target.value})} placeholder="Series / Subcategory (optional)" className="w-full bg-brand-gray border border-brand-gray rounded-xl p-4 text-[11px] font-bold uppercase tracking-widest text-brand-navy outline-none focus:ring-2 focus:ring-brand-beige" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-brand-navy/30 uppercase tracking-[0.3em] block mb-4">Core Selling Points</label>
            <textarea
              value={(formData.features || []).join('\n')}
              onChange={(e) => setFormData({
                ...formData,
                features: e.target.value.split('\n').map((line) => line.trim()).filter(Boolean),
              })}
              placeholder={'One selling point per line\nCompact modular footprint\nEasy everyday care'}
              rows={5}
              className="w-full bg-brand-gray border border-brand-gray rounded-[1.5rem] p-6 text-[11px] font-bold uppercase tracking-widest text-brand-navy outline-none focus:ring-2 focus:ring-brand-beige"
            />
            <p className="mt-3 text-[9px] font-bold uppercase tracking-[0.3em] text-brand-navy/20">
              These appear in the first screen of the product detail page.
            </p>
          </div>

          <div>
            <label className="text-[10px] font-bold text-brand-navy/30 uppercase tracking-[0.3em] block mb-4">Detail HTML</label>
            <textarea
              value={formData.detailHtml || ''}
              onChange={(e) => setFormData({ ...formData, detailHtml: e.target.value })}
              placeholder={'<section class="detail-block">\n  <div><img src="https://..." alt="Lifestyle scene" /></div>\n  <div>\n    <p class="eyebrow">Living Scenario</p>\n    <h3>Designed around real rooms</h3>\n    <p>Write the product story here.</p>\n  </div>\n</section>\n\n<section class="detail-block reverse">\n  <div><img src="https://..." alt="Material detail" /></div>\n  <div>\n    <p class="eyebrow">Material & Comfort</p>\n    <h3>Comfort that works every day</h3>\n    <p>Write a second image-text module here.</p>\n  </div>\n</section>'}
              rows={8}
              className="w-full bg-brand-gray border border-brand-gray rounded-[1.5rem] p-6 text-[11px] font-mono tracking-wide text-brand-navy outline-none focus:ring-2 focus:ring-brand-beige"
            />
            <p className="mt-3 text-[9px] font-bold uppercase tracking-[0.3em] text-brand-navy/20">
              Optional. If empty, the storefront builds this section from description and selling points.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-6">
              <label className="text-[10px] font-bold text-brand-navy/30 uppercase tracking-[0.3em] block mb-4">Valuation & Assets</label>
              <input required type="number" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} placeholder="Base Valuation" className="w-full bg-brand-gray border border-brand-gray rounded-xl p-4 text-[11px] font-bold uppercase tracking-widest text-brand-navy outline-none focus:ring-2 focus:ring-brand-beige" />
              <input required type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: parseInt(e.target.value)})} placeholder="Current Units" className="w-full bg-brand-gray border border-brand-gray rounded-xl p-4 text-[11px] font-bold uppercase tracking-widest text-brand-navy outline-none focus:ring-2 focus:ring-brand-beige" />
            </div>
            <div className="space-y-6">
              <label className="text-[10px] font-bold text-brand-navy/30 uppercase tracking-[0.3em] block mb-4">Campaign status</label>
              <label className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-brand-navy/60 cursor-pointer group">
                <input type="checkbox" checked={formData.onSale} onChange={e => setFormData({...formData, onSale: e.target.checked})} className="w-5 h-5 rounded border-brand-gray text-brand-navy focus:ring-brand-beige" />
                <span className="group-hover:text-brand-navy transition-colors">Operational Sale</span>
              </label>
              {formData.onSale && (
                <input type="number" value={formData.discountPrice} onChange={e => setFormData({...formData, discountPrice: parseFloat(e.target.value)})} placeholder="Discounted Valuation" className="w-full bg-brand-gray border border-brand-gray rounded-xl p-4 text-[11px] font-bold uppercase tracking-widest text-brand-navy outline-none focus:ring-2 focus:ring-brand-beige" />
              )}
            </div>
          </div>

          <div className="bg-brand-gray/40 border border-brand-gray rounded-[2rem] p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-brand-navy/40 mb-3">Lean Listing Mode</p>
            <p className="text-sm leading-relaxed text-brand-navy/60 font-medium">
              This form only asks for fields that directly affect the storefront: product copy, category, core selling points, price, stock, sale status, gallery, video, and optional installation PDF.
            </p>
          </div>
        </div>

	        <div className="space-y-8">
	          <div>
	            <label className="text-[10px] font-bold text-brand-navy/30 uppercase tracking-[0.3em] block mb-4">Visual Documentation</label>
	            <div className="space-y-4">
                <div className="bg-brand-beige/5 border border-brand-beige/20 rounded-2xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-brand-navy/50 mb-2">Image Standard</p>
                  <p className="text-xs leading-relaxed text-brand-navy/55 font-medium">
                    Recommended: square 1:1 JPG/PNG, at least 1600 x 1600 px, product centered with comfortable margins. Non-square images will be center-cropped on the storefront.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => imagesFileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-brand-gray text-[10px] font-bold uppercase tracking-widest text-brand-navy hover:border-brand-beige transition-colors disabled:opacity-50"
                    disabled={uploadingImages}
                  >
                    <ImageIcon className="w-4 h-4" />
                    {uploadingImages ? 'Uploading...' : 'Upload Images'}
                  </button>
                  <input
                    ref={imagesFileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (!e.target.files || e.target.files.length === 0) return;
                      void uploadImagesToStorage(e.target.files);
                    }}
                  />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/30">
                    {initialData?.id ? 'Saved To Product Folder' : 'Saved To Drafts Folder'}
                  </span>
                </div>

                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="Paste Image URL (optional)"
                    className="flex-grow bg-brand-gray border border-brand-gray rounded-xl p-4 text-[11px] font-bold tracking-widest text-brand-navy outline-none focus:ring-2 focus:ring-brand-beige"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const url = newImageUrl.trim();
                      if (!url) return;
                      setFormData((prev) => ({ ...prev, images: [...(prev.images || []), url] }));
                      setNewImageUrl('');
                    }}
                    className="px-6 py-4 rounded-xl bg-brand-navy text-white text-[10px] font-bold uppercase tracking-widest hover:bg-brand-beige transition-colors"
                  >
                    Add
                  </button>
                </div>

                {uploadError && (
                  <div className="text-[10px] font-bold uppercase tracking-widest text-red-600 bg-red-50 border border-red-100 rounded-xl p-4">
                    {uploadError}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4">
                  {(formData.images || []).slice(0, 9).map((url, idx) => (
                    <div key={`${url}-${idx}`} className="relative group">
                      <img
                        src={url}
                        alt=""
                        className="w-full aspect-square object-cover rounded-[1.5rem] bg-brand-gray border border-brand-gray shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            images: (prev.images || []).filter((_, i) => i !== idx),
                          }));
                        }}
                        className="absolute top-3 right-3 w-9 h-9 rounded-xl bg-white/90 border border-brand-gray text-brand-navy/40 hover:text-red-600 hover:border-red-200 hover:bg-white transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center"
                        aria-label="Remove image"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-brand-navy/20">
                  Upload 6-10 square images for the strongest product detail layout.
                </p>
	            </div>
	          </div>

            <div>
              <label className="text-[10px] font-bold text-brand-navy/30 uppercase tracking-[0.3em] block mb-4">Product Video</label>
              <input
                type="url"
                value={formData.videoUrl || ''}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                placeholder="Paste Product Video URL (optional)"
                className="w-full bg-brand-gray border border-brand-gray rounded-xl p-4 text-[11px] font-bold tracking-widest text-brand-navy outline-none focus:ring-2 focus:ring-brand-beige"
              />
              <p className="mt-3 text-[9px] font-bold uppercase tracking-[0.3em] text-brand-navy/20">
                Optional. If present, it appears as the first selectable media item.
              </p>
            </div>

            <div>
              <label className="text-[10px] font-bold text-brand-navy/30 uppercase tracking-[0.3em] block mb-4">Installation PDF</label>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <input
                    type="url"
                    value={formData.manualUrl || ''}
                    onChange={(e) => setFormData({ ...formData, manualUrl: e.target.value })}
                    placeholder="Paste PDF Download URL (optional)"
                    className="flex-grow bg-brand-gray border border-brand-gray rounded-xl p-4 text-[11px] font-bold tracking-widest text-brand-navy outline-none focus:ring-2 focus:ring-brand-beige"
                  />
                  <button
                    type="button"
                    onClick={() => manualFileInputRef.current?.click()}
                    disabled={uploadingManual}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-brand-gray text-[10px] font-bold uppercase tracking-widest text-brand-navy hover:border-brand-beige transition-colors disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    {uploadingManual ? 'Uploading...' : 'Upload PDF'}
                  </button>
                </div>
                <input
                  ref={manualFileInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    void uploadManualToStorage(file);
                  }}
                />
                {formData.manualUrl && (
                  <div className="flex items-center justify-between gap-4 bg-brand-gray/40 border border-brand-gray rounded-xl px-4 py-3">
                    <a href={formData.manualUrl} target="_blank" rel="noreferrer" className="min-w-0 truncate text-[10px] font-bold uppercase tracking-widest text-brand-navy/50 hover:text-brand-navy">
                      {formData.manualUrl}
                    </a>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, manualUrl: '' }))}
                      className="shrink-0 text-brand-navy/30 hover:text-red-600"
                      aria-label="Remove manual URL"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-brand-navy/20">
                  Optional. If empty, the product page will hide the PDF download button.
                </p>
              </div>
            </div>

        </div>
      </div>

      <div className="flex justify-end gap-4 pt-10 border-t border-brand-gray">
        <button type="submit" className="bg-brand-navy text-white px-16 py-6 rounded-full text-[11px] font-bold uppercase tracking-widest hover:bg-brand-beige transition-all shadow-3xl">
          {initialData ? 'Update Core Entry' : 'Synchronize Product'}
        </button>
      </div>
    </form>
  );
}

function PromoForm({ onSave }: { onSave: (data: Partial<Promotion>) => void }) {
  const promoImageFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPromoImage, setUploadingPromoImage] = useState(false);
  const [promoUploadError, setPromoUploadError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Promotion>>({
    title: '',
    subtitle: '',
    imageUrl: '',
    link: '',
    active: true,
    type: 'hero',
    priority: 1
  });

  const uploadPromoImageToStorage = async (file: File) => {
    setUploadingPromoImage(true);
    setPromoUploadError(null);
    try {
      const url = await fileToDataUrl(file);
      setFormData((prev) => ({ ...prev, imageUrl: url }));
    } catch (e: any) {
      setPromoUploadError(e?.message || 'Promotion image upload failed');
    } finally {
      setUploadingPromoImage(false);
      if (promoImageFileInputRef.current) promoImageFileInputRef.current.value = '';
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-8">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="text-[10px] font-bold text-brand-navy/30 uppercase tracking-[0.3em] block mb-4">Content Directive</label>
          <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-brand-gray border border-brand-gray rounded-xl p-4 text-[11px] font-bold uppercase tracking-widest text-brand-navy outline-none focus:ring-2 focus:ring-brand-beige" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-brand-navy/30 uppercase tracking-[0.3em] block mb-4">Interface Type</label>
          <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})} className="w-full bg-brand-gray border border-brand-gray rounded-xl p-4 text-[11px] font-bold uppercase tracking-widest text-brand-navy outline-none focus:ring-2 focus:ring-brand-beige">
            <option value="hero">Hero Large</option>
            <option value="card">Promo Card</option>
            <option value="sale">Announcement</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-[10px] font-bold text-brand-navy/30 uppercase tracking-[0.3em] block mb-4">Core Asset URL</label>
        <div className="flex gap-3">
          <input required type="text" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} className="flex-grow bg-brand-gray border border-brand-gray rounded-xl p-4 text-[11px] font-bold uppercase tracking-widest text-brand-navy outline-none focus:ring-2 focus:ring-brand-beige" />
          <button
            type="button"
            onClick={() => promoImageFileInputRef.current?.click()}
            disabled={uploadingPromoImage}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-brand-gray text-[10px] font-bold uppercase tracking-widest text-brand-navy hover:border-brand-beige transition-colors disabled:opacity-50"
          >
            <ImageIcon className="w-4 h-4" />
            {uploadingPromoImage ? 'Uploading...' : 'Upload'}
          </button>
        </div>
        <input
          ref={promoImageFileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            void uploadPromoImageToStorage(file);
          }}
        />
        {promoUploadError && (
          <div className="mt-3 text-[10px] font-bold uppercase tracking-widest text-red-600 bg-red-50 border border-red-100 rounded-xl p-4">
            {promoUploadError}
          </div>
        )}
        {formData.imageUrl && (
          <div className="mt-4 aspect-[16/9] overflow-hidden rounded-2xl bg-brand-gray border border-brand-gray">
            <img src={formData.imageUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <p className="mt-3 text-[9px] font-bold uppercase tracking-[0.3em] text-brand-navy/20">
          Hero images work best at 16:9 or wider. Promo cards can use square or portrait crops.
        </p>
      </div>
      <div>
        <label className="text-[10px] font-bold text-brand-navy/30 uppercase tracking-[0.3em] block mb-4">Sub-Narrative</label>
        <input required type="text" value={formData.subtitle} onChange={e => setFormData({...formData, subtitle: e.target.value})} className="w-full bg-brand-gray border border-brand-gray rounded-xl p-4 text-[11px] font-bold uppercase tracking-widest text-brand-navy outline-none focus:ring-2 focus:ring-brand-beige" />
      </div>
      <div>
        <label className="text-[10px] font-bold text-brand-navy/30 uppercase tracking-[0.3em] block mb-4">Destination link</label>
        <input type="text" value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} placeholder="/collections/new" className="w-full bg-brand-gray border border-brand-gray rounded-xl p-4 text-[11px] font-bold uppercase tracking-widest text-brand-navy outline-none focus:ring-2 focus:ring-brand-beige" />
      </div>
      <button type="submit" className="w-full bg-brand-navy text-white py-6 rounded-full text-[11px] font-bold uppercase tracking-[0.3em] hover:bg-brand-beige transition-all shadow-3xl">
        Establish Campaign
      </button>
    </form>
  );
}
