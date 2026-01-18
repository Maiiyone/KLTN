'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { MainLayout } from '@/components/layouts/MainLayout';
import { ProductCard } from '@/components/ProductCard';
import { Input } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { productsAPI } from '@/lib/api/products';
import { useCartStore } from '@/lib/store/cart-store';
import { useToast } from '@/components/ui/Toast';
import { Product } from '@/lib/types';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const addItem = useCartStore((state) => state.addItem);
  const toast = useToast();

  useEffect(() => {
    fetchProducts();
  }, [page, searchTerm]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productsAPI.getProducts({
        page,
        limit: 12,
        search: searchTerm || undefined,
      });
      setProducts(data);
    } catch (err) {
      setError('Không thể tải sản phẩm. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
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
      <div className="bg-white py-6 shadow-sm">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Sản Phẩm</h1>
          
          <form onSubmit={handleSearch} className="max-w-xl">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button type="submit">
                <Search className="w-5 h-5" />
              </Button>
            </div>
          </form>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        {loading ? (
          <Loading />
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Không tìm thấy sản phẩm nào.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center gap-2 mt-8">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Trang trước
              </Button>
              <span className="px-4 py-2 text-gray-700">Trang {page}</span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => p + 1)}
                disabled={products.length < 12}
              >
                Trang sau
              </Button>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}

