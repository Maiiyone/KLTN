'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layouts/MainLayout';
import { ProductCard } from '@/components/ProductCard';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { Alert } from '@/components/ui/Alert';
import { productsAPI } from '@/lib/api/products';
import { adminDashboardAPI } from '@/lib/api/admin';
import { useCartStore } from '@/lib/store/cart-store';
import { useToast } from '@/components/ui/Toast';
import { Product, PublicStats } from '@/lib/types';
import { ArrowRight, Users, Package, ShoppingBag, DollarSign } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [publicStats, setPublicStats] = useState<PublicStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const addItem = useCartStore((state) => state.addItem);
  const toast = useToast();

  useEffect(() => {
    fetchProducts();
    fetchPublicStats();
  }, []);

  const fetchProducts = async () => {
  try {
    setLoading(true);
    const res = await productsAPI.getProducts({ page: 1, limit: 8 });
  

    // res có thể là: array | {items: array} | {data: array} | {results: array}
    const list =
      Array.isArray(res) ? res :
      Array.isArray((res as any)?.items) ? (res as any).items :
      Array.isArray((res as any)?.data) ? (res as any).data :
      Array.isArray((res as any)?.results) ? (res as any).results :
      [];

    setProducts(list);
  } catch (err) {
    setError('Không thể tải sản phẩm. Vui lòng thử lại sau.');
    setProducts([]); // đảm bảo luôn là mảng
  } finally {
    setLoading(false);
  }
};

  const fetchPublicStats = async () => {
    try {
      const data = await adminDashboardAPI.getPublicStats();
      setPublicStats(data);
    } catch (err) {
      console.error('Không thể tải thống kê công khai:', err);
    }
  };

  const handleAddToCart = (product: Product) => {
    addItem(product, 1);
    toast.success(
      'Đã thêm vào giỏ hàng!',
      `1 ${product.unit} ${product.product_name}`,
      3000
    );
  };

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-600 via-green-700 to-green-800 text-white py-24 md:py-32 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAtNi42MjcgNS4zNzMtMTIgMTItMTJzMTIgNS4zNzMgMTIgMTItNS4zNzMgMTItMTIgMTItMTItNS4zNzMtMTItMTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block mb-6 animate-bounce">
              <span className="text-6xl md:text-7xl">🌾</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight animate-in fade-in slide-in-from-bottom duration-700">
              Nông Sản Sạch, Chất Lượng Cao
            </h1>
            <p className="text-xl md:text-2xl mb-10 text-green-100 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom duration-700 delay-150">
              Cung cấp nông sản sạch từ các trang trại địa phương, đảm bảo an toàn và
              dinh dưỡng cho gia đình bạn
            </p>
            <div className="flex flex-wrap gap-4 justify-center animate-in fade-in slide-in-from-bottom duration-700 delay-300">
              <Link href="/products">
                <Button size="lg" className="bg-white text-green-700 hover:bg-green-50 shadow-xl hover:shadow-2xl">
                  <span className="text-lg font-bold">Xem sản phẩm</span>
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Public Stats Section */}
      {publicStats && (
        <section className="py-16 bg-white border-b border-gray-100">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200 shadow-sm hover:shadow-md transition-all">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-500 text-white mb-4 shadow-md">
                  <Users className="w-7 h-7" />
                </div>
                <p className="text-3xl font-bold text-blue-900 mb-1">
                   {Number(publicStats?.total_users ?? 0).toLocaleString()}
                </p>
                <p className="text-sm text-blue-700 font-medium">Khách hàng</p>
              </div>

              <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border border-green-200 shadow-sm hover:shadow-md transition-all">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-500 text-white mb-4 shadow-md">
                  <Package className="w-7 h-7" />
                </div>
                <p className="text-3xl font-bold text-green-900 mb-1">
                 {Number(publicStats?.total_users ?? 0).toLocaleString()}
                </p>
                <p className="text-sm text-green-700 font-medium">Sản phẩm</p>
              </div>

              <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border border-purple-200 shadow-sm hover:shadow-md transition-all">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-purple-500 text-white mb-4 shadow-md">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <p className="text-3xl font-bold text-purple-900 mb-1">
                  {Number(publicStats?.total_orders ?? 0).toLocaleString()}
                </p>
                <p className="text-sm text-purple-700 font-medium">Đơn hàng</p>
              </div>

              <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl border border-yellow-200 shadow-sm hover:shadow-md transition-all">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-yellow-500 text-white mb-4 shadow-md">
                  <DollarSign className="w-7 h-7" />
                </div>
                <p className="text-3xl font-bold text-yellow-900 mb-1">
                 {formatPrice(Number(publicStats?.total_revenue ?? 0))}
                </p>
                <p className="text-sm text-yellow-700 font-medium">Doanh thu</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-4">
            <div className="text-center md:text-left">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                Sản Phẩm Nổi Bật
              </h2>
              <p className="text-gray-600 text-lg">Những sản phẩm được yêu thích nhất</p>
            </div>
            <Link href="/products">
              <Button variant="outline" size="lg" className="shadow-md hover:shadow-lg">
                Xem tất cả
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>

          {error && (
            <Alert variant="error" className="mb-6">
              {error}
            </Alert>
          )}

          {loading ? (
            <Loading />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-green-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">Tại Sao Chọn Chúng Tôi?</h2>
          <p className="text-center text-gray-600 text-lg mb-12 max-w-2xl mx-auto">
            Cam kết mang đến cho bạn những sản phẩm nông sản tươi ngon, an toàn nhất
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 text-center shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 text-white text-4xl mb-6 shadow-lg">
                🌱
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">100% Sạch</h3>
              <p className="text-gray-600 leading-relaxed">
                Tất cả sản phẩm đều được kiểm tra chất lượng và an toàn thực phẩm nghiêm ngặt
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 text-center shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white text-4xl mb-6 shadow-lg">
                🚚
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Giao Hàng Nhanh</h3>
              <p className="text-gray-600 leading-relaxed">
                Giao hàng nhanh chóng trong vòng 24h tại khu vực nội thành
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 text-center shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-600 text-white text-4xl mb-6 shadow-lg">
                💯
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Đảm Bảo Chất Lượng</h3>
              <p className="text-gray-600 leading-relaxed">
                Hoàn tiền 100% nếu sản phẩm không đạt chất lượng cam kết
              </p>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
