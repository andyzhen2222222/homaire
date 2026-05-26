import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import { AuthProvider } from './components/AuthContext';
import { AuthModal } from './components/AuthModal';
import { CartProvider } from './components/CartContext';
import CategoryPage from './pages/CategoryPage';
import ProductDetail from './pages/ProductDetail';
import CartPage from './pages/CartPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/AdminDashboard';
import SalePage from './pages/SalePage';
import BrandStoryPage from './pages/BrandStoryPage';
import ScrollToTop from './components/ScrollToTop';
import { bootstrapLocalDbOnce } from './lib/bootstrapLocalDb';
import { isRemoteStoreEnabled } from './lib/storeConfig';

export default function App() {
  useEffect(() => {
    void bootstrapLocalDbOnce();
  }, []);

  useEffect(() => {
    if (!isRemoteStoreEnabled()) return;
    document.documentElement.dataset.storeMode = 'remote';
  }, []);

  return (
    <AuthProvider>
      <AuthModal />
      <CartProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/category/sale" element={<SalePage />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="category/:slug" element={<CategoryPage />} />
              <Route path="product/:id" element={<ProductDetail />} />
              <Route path="cart" element={<CartPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="brand-story" element={<BrandStoryPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
