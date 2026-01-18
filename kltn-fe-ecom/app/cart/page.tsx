'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Trash2, Plus, Minus } from 'lucide-react';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useCartStore } from '@/lib/store/cart-store';
import { useAuthStore } from '@/lib/store/auth-store';
import { formatPrice } from '@/lib/utils';

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, getTotalPrice } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  const safeItems = (items || []).filter((item) => item && item.product);

  const handleCheckout = () => {
    if (!isAuthenticated) {
      alert('Vui lòng đăng nhập để tiếp tục');
      router.push('/auth/login');
      return;
    }
    router.push('/checkout');
  };

  if (safeItems.length === 0) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16">
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-xl text-gray-800 font-semibold mb-6">Giỏ hàng của bạn đang trống</p>
              <Button onClick={() => router.push('/products')}>
                Tiếp tục mua sắm
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-extrabold mb-8 text-gray-900">Giỏ Hàng</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {safeItems.map((item, index) => (
              <Card key={`${item.product?.id ?? 'no-id'}-${index}`}>
                <CardContent className="flex gap-4 p-4">
                  <div className="relative w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {item.product?.image_url ? (
                      <Image
                        src={item.product.image_url}
                        alt={item.product?.product_name || 'Product image'}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <span className="text-3xl">🌾</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1 text-gray-900">
                      {item.product?.product_name || 'Sản phẩm' }
                    </h3>
                    <p className="text-green-600 font-extrabold text-xl mb-2">
                      {formatPrice((item.product?.current_price ?? 0))}
                    </p>
                    <p className="text-sm text-gray-800 font-semibold">
                      Đơn vị: {item.product?.unit || '-'}
                    </p>
                  </div>

                  <div className="flex flex-col items-end justify-between">
                    <button
                      onClick={() => item.product?.id && removeItem(item.product.id)}
                      className="text-red-600 hover:text-red-700 p-2"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => item.product?.id && updateQuantity(item.product.id, item.quantity - 1)}
                        className="p-2 hover:bg-gray-200 rounded-lg border-2 border-gray-300 bg-white transition-all hover:border-gray-400"
                      >
                        <Minus className="w-5 h-5 stroke-[3]" />
                      </button>
                      <span className="w-14 text-center font-extrabold text-xl text-gray-900">{item.quantity}</span>
                      <button
                        onClick={() => item.product?.id && updateQuantity(item.product.id, item.quantity + 1)}
                        className="p-2 hover:bg-gray-200 rounded-lg border-2 border-gray-300 bg-white transition-all hover:border-gray-400"
                      >
                        <Plus className="w-5 h-5 stroke-[3]" />
                      </button>
                    </div>

                    <p className="font-extrabold text-xl text-gray-900">
                      {formatPrice((item.product?.current_price ?? 0) * item.quantity)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div>
            <Card>
              <CardHeader>
                <h2 className="text-2xl font-extrabold text-gray-900">Tổng đơn hàng</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-gray-900 font-bold text-base">
                  <span>Tạm tính:</span>
                  <span className="font-extrabold">{formatPrice(getTotalPrice())}</span>
                </div>
                <div className="flex justify-between text-gray-900 font-bold text-base">
                  <span>Phí vận chuyển:</span>
                  <span className="text-green-600 font-extrabold">Miễn phí</span>
                </div>
                <div className="border-t-2 pt-4">
                  <div className="flex justify-between text-2xl font-extrabold">
                    <span className="text-gray-900">Tổng cộng:</span>
                    <span className="text-green-600">{formatPrice(getTotalPrice())}</span>
                  </div>
                </div>
                <Button onClick={handleCheckout} className="w-full font-bold text-lg">
                  Tiến hành thanh toán
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

