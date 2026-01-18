'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Loading } from '@/components/ui/Loading';
import { Alert } from '@/components/ui/Alert';
import { adminProductsAPI, UpdateProductData } from '@/lib/api/admin';
import { Product } from '@/lib/types';
import { useForm } from 'react-hook-form';
import { getErrorMessage } from '@/lib/error-handler';

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm();

  useEffect(() => {
    fetchProduct();
  }, [params.id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const data = await adminProductsAPI.getProduct(Number(params.id));
      setProduct(data);
      
      // Populate form
      Object.keys(data).forEach((key) => {
        setValue(key, data[key as keyof Product]);
      });
    } catch (err) {
      setError('Không thể tải thông tin sản phẩm.');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      setSubmitting(true);
      await adminProductsAPI.updateProduct(Number(params.id), data as UpdateProductData);
      alert('Cập nhật sản phẩm thành công!');
      router.push('/admin/products');
    } catch (err: any) {
      alert(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <Loading />
      </AdminLayout>
    );
  }

  if (error || !product) {
    return (
      <AdminLayout>
        <Alert variant="error">{error || 'Không tìm thấy sản phẩm'}</Alert>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/admin/products')}>
              <ArrowLeft className="w-5 h-5 mr-2" />
              Quay lại
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa sản phẩm</h1>
              <p className="text-gray-600 mt-1">Mã: {product.product_code}</p>
            </div>
          </div>
          <Button onClick={handleSubmit(onSubmit)} isLoading={submitting}>
            <Save className="w-4 h-4 mr-2" />
            Lưu thay đổi
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-bold">Thông tin cơ bản</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Mã sản phẩm"
                  {...register('product_code')}
                  disabled
                />
                <Input
                  label="ID sản phẩm"
                  {...register('product_id')}
                />
              </div>

              <Input
                label="Tên sản phẩm *"
                {...register('product_name', { required: true })}
                error={errors.product_name && 'Vui lòng nhập tên sản phẩm'}
              />

              <Input
                label="Tiêu đề"
                {...register('title')}
              />

              <Textarea
                label="Mô tả"
                {...register('description')}
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-bold">Giá và đơn vị</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Giá hiện tại (VND) *"
                  type="number"
                  {...register('current_price', { required: true, valueAsNumber: true })}
                  error={errors.current_price && 'Vui lòng nhập giá'}
                />
                <Input
                  label="Giá gốc (VND)"
                  type="number"
                  {...register('original_price', { valueAsNumber: true })}
                />
                <Input
                  label="Đơn vị"
                  {...register('unit')}
                  placeholder="gam, kg, hộp..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Phần trăm giảm giá (%)"
                  type="number"
                  {...register('discount_percent', { valueAsNumber: true })}
                />
                <Input
                  label="Text giảm giá"
                  {...register('discount_text')}
                  placeholder="-17%"
                />
              </div>
            </CardContent>
          </Card>

          {/* Stock & Display */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-bold">Kho hàng và hiển thị</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Tồn kho"
                  type="number"
                  {...register('stock_quantity', { valueAsNumber: true })}
                />
                <Input
                  label="Vị trí hiển thị"
                  type="number"
                  {...register('product_position', { valueAsNumber: true })}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  {...register('is_active')}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  Hiển thị sản phẩm
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Images & URLs */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-bold">Hình ảnh và liên kết</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="URL hình ảnh"
                {...register('image_url')}
                placeholder="https://..."
              />
              <Input
                label="Alt text hình ảnh"
                {...register('image_alt')}
              />
              <Input
                label="URL sản phẩm"
                {...register('product_url')}
                placeholder="https://..."
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4 sticky bottom-0 bg-white p-4 border-t border-gray-200 rounded-lg shadow-lg">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.push('/admin/products')}
            >
              Hủy
            </Button>
            <Button type="submit" isLoading={submitting}>
              <Save className="w-4 h-4 mr-2" />
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}

