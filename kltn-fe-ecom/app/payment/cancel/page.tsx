'use client';

import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Button } from '@/components/ui/Button';
import { XCircle } from 'lucide-react';

export default function PaymentCancelPage() {
  const router = useRouter();

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                <XCircle className="w-12 h-12 text-gray-500" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-900">Đã hủy thanh toán</h1>

            <p className="text-gray-600">
              Bạn đã hủy giao dịch thanh toán. Đơn hàng của bạn vẫn được giữ trong hệ thống.
            </p>

            <div className="space-y-2 pt-4">
              <Button onClick={() => router.push('/checkout')} className="w-full">
                Thử lại
              </Button>
              <Button onClick={() => router.push('/orders')} variant="outline" className="w-full">
                Xem đơn hàng
              </Button>
              <Button onClick={() => router.push('/')} variant="outline" className="w-full">
                Về trang chủ
              </Button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

