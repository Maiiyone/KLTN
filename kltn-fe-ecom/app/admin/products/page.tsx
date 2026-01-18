'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import { Alert } from '@/components/ui/Alert';
import { adminProductsAPI } from '@/lib/api/admin';
import { Product } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { getErrorMessage } from '@/lib/error-handler';

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchProducts();
  }, [page, searchTerm]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await adminProductsAPI.getProducts({
        page,
        limit: 20,
        search: searchTerm || undefined,
      });
      setProducts(data.items || []);
      setTotal(data.total);
    } catch (err) {
      setError('Không thể tải danh sách sản phẩm.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    router.push('/admin/products/create');
  };

  const handleEdit = (product: Product) => {
    router.push(`/admin/products/${product.id}/edit`);
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Bạn có chắc muốn xóa sản phẩm ${product.product_name}?`)) return;

    try {
      await adminProductsAPI.deleteProduct(product.id);
      alert('Xóa sản phẩm thành công!');
      fetchProducts();
    } catch (err: any) {
      alert(getErrorMessage(err));
    }
  };

  const toggleProductStatus = async (product: Product) => {
    try {
      await adminProductsAPI.updateProduct(product.id, {
        is_active: !product.is_active,
      });
      fetchProducts();
    } catch (err: any) {
      alert(getErrorMessage(err));
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex gap-4">
              <Input
                placeholder="Tìm kiếm sản phẩm..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="flex-1"
              />
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Thêm sản phẩm
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold">
              Danh sách sản phẩm ({total})
            </h2>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loading />
            ) : error ? (
              <Alert variant="error">{error}</Alert>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100 border-b-2 border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">ID</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">Mã SP</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">Tên sản phẩm</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">Giá</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">Tồn kho</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">Đánh giá</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">Đã bán</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">Trạng thái</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {products.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{product.id}</td>
                          <td className="px-4 py-3 text-sm font-bold text-gray-900">{product.product_code}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{product.product_name}</td>
                          <td className="px-4 py-3 text-sm font-bold text-green-600">
                            {formatPrice(product.current_price)}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold">
                            <span className={product.stock_quantity && product.stock_quantity < 10 ? 'text-red-600 font-bold' : 'text-gray-900'}>
                              {product.stock_quantity || 0}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {product.average_rating ? (
                              <span>⭐ {product.average_rating.toFixed(1)} ({product.review_count})</span>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">{product.total_sold || 0}</td>
                          <td className="px-4 py-3 text-sm">
                            <Badge variant={product.is_active ? 'success' : 'danger'}>
                              {product.is_active ? 'Hoạt động' : 'Ẩn'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEdit(product)}
                                className="p-1 hover:bg-gray-100 rounded"
                                title="Chỉnh sửa"
                              >
                                <Edit className="w-4 h-4 text-blue-600" />
                              </button>
                              <button
                                onClick={() => toggleProductStatus(product)}
                                className="p-1 hover:bg-gray-100 rounded"
                                title={product.is_active ? 'Ẩn' : 'Hiện'}
                              >
                                {product.is_active ? (
                                  <EyeOff className="w-4 h-4 text-orange-600" />
                                ) : (
                                  <Eye className="w-4 h-4 text-green-600" />
                                )}
                              </button>
                              <button
                                onClick={() => handleDelete(product)}
                                className="p-1 hover:bg-gray-100 rounded"
                                title="Xóa"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Trang trước
                  </Button>
                  <span className="px-4 py-2 text-gray-700">
                    Trang {page} / {Math.ceil(total / 20)}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= Math.ceil(total / 20)}
                  >
                    Trang sau
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

