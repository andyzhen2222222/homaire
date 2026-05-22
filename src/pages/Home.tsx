import { useProducts } from '../hooks/useProducts';
import { usePromotions, useStoreConfig, useCategories } from '../hooks/useAdminData';
import { useCart } from '../components/CartContext';
import { HomeSections } from '../components/home/HomeSections';

export default function Home() {
  const { products, loading: productsLoading } = useProducts();
  const { promotions } = usePromotions();
  const { config } = useStoreConfig();
  const { categories } = useCategories();
  const { addItem } = useCart();

  return (
    <HomeSections
      products={products}
      productsLoading={productsLoading}
      promotions={promotions}
      config={config}
      categories={categories}
      onAddToCart={(product) => addItem(product as any)}
    />
  );
}
