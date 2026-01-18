'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus } from 'lucide-react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { adminProductsAPI, CreateProductData } from '@/lib/api/admin';
import { useForm } from 'react-hook-form';
import { getErrorMessage } from '@/lib/error-handler';

export default function CreateProductPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      is_active: true,
      stock_quantity: 0,
      product_position: 0,
    }
  });

  const onSubmit = async (data: any) => {
    try {
      setSubmitting(true);
      await adminProductsAPI.createProduct(data as CreateProductData);
      alert('Tạo sản phẩm thành công!');
      router.push('/admin/products');
    } catch (err: any) {
      alert(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

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
              <h1 className="text-2xl font-bold text-gray-900">Thêm sản phẩm mới</h1>
              <p className="text-gray-600 mt-1">Điền thông tin để tạo sản phẩm mới</p>
            </div>
          </div>
          <Button onClick={handleSubmit(onSubmit)} isLoading={submitting}>
            <Plus className="w-4 h-4 mr-2" />
            Tạo sản phẩm
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
                  label="Mã sản phẩm *"
                  {...register('product_code', { required: true })}
                  error={errors.product_code && 'Vui lòng nhập mã sản phẩm'}
                  placeholder="SP001"
                />
                <Input
                  label="ID sản phẩm"
                  {...register('product_id')}
                  placeholder="product-123"
                />
              </div>

              <Input
                label="Tên sản phẩm *"
                {...register('product_name', { required: true })}
                error={errors.product_name && 'Vui lòng nhập tên sản phẩm'}
                placeholder="Tên sản phẩm"
              />

              <Input
                label="Tiêu đề"
                {...register('title')}
                placeholder="Tiêu đề hiển thị"
              />

              <Textarea
                label="Mô tả"
                {...register('description')}
                rows={4}
                placeholder="Mô tả chi tiết về sản phẩm..."
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
                  placeholder="50000"
                />
                <Input
                  label="Giá gốc (VND)"
                  type="number"
                  {...register('original_price', { valueAsNumber: true })}
                  placeholder="70000"
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
                  placeholder="20"
                />
                <Input
                  label="Text giảm giá"
                  {...register('discount_text')}
                  placeholder="-20%"
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
                  placeholder="100"
                />
                <Input
                  label="Vị trí hiển thị"
                  type="number"
                  {...register('product_position', { valueAsNumber: true })}
                  placeholder="0"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  {...register('is_active')}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  defaultChecked
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
                placeholder="https://example.com/image.jpg"
              />
              <Input
                label="Alt text hình ảnh"
                {...register('image_alt')}
                placeholder="Mô tả hình ảnh"
              />
              <Input
                label="URL sản phẩm"
                {...register('product_url')}
                placeholder="https://example.com/product"
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
              <Plus className="w-4 h-4 mr-2" />
              Tạo sản phẩm
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}

