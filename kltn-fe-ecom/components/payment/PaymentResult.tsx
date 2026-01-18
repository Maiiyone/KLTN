'use client';

import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PaymentStatus } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface PaymentResultProps {
  status: 'success' | 'failed' | 'pending';
  paymentData?: PaymentStatus;
  onViewOrder?: () => void;
  onRetry?: () => void;
  onBackToHome?: () => void;
}

export function PaymentResult({
  status,
  paymentData,
  onViewOrder,
  onRetry,
  onBackToHome,
}: PaymentResultProps) {
  if (status === 'success') {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900">Thanh toán thành công!</h1>

          <p className="text-gray-600">
            Đơn hàng của bạn đã được thanh toán và đang được xử lý
          </p>

          {paymentData && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-left">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Mã giao dịch:</span>
                <span className="font-medium">{paymentData.transaction_id || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Số tiền:</span>
                <span className="font-medium text-green-600">
                  {formatPrice(paymentData.amount)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Phương thức:</span>
                <span className="font-medium uppercase">{paymentData.payment_method}</span>
              </div>
              {paymentData.paid_at && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Thời gian:</span>
                  <span className="font-medium">
                    {format(new Date(paymentData.paid_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2 pt-4">
            {onViewOrder && (
              <Button onClick={onViewOrder} className="w-full">
                Xem đơn hàng
              </Button>
            )}
            {onBackToHome && (
              <Button onClick={onBackToHome} variant="outline" className="w-full">
                Về trang chủ
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900">Thanh toán thất bại</h1>

          <p className="text-gray-600">
            {paymentData?.failed_reason || 'Đã có lỗi xảy ra trong quá trình thanh toán'}
          </p>

          {paymentData && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-left">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Mã đơn hàng:</span>
                <span className="font-medium">#{paymentData.order_id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Số tiền:</span>
                <span className="font-medium">{formatPrice(paymentData.amount)}</span>
              </div>
            </div>
          )}

          <div className="space-y-2 pt-4">
            {onRetry && (
              <Button onClick={onRetry} className="w-full">
                Thử lại
              </Button>
            )}
            {onBackToHome && (
              <Button onClick={onBackToHome} variant="outline" className="w-full">
                Về trang chủ
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Pending state
  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-12 h-12 text-orange-500" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900">Đang chờ thanh toán</h1>

        <p className="text-gray-600">
          Đơn hàng của bạn đang chờ xác nhận thanh toán
        </p>

        {paymentData && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-left">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Mã đơn hàng:</span>
              <span className="font-medium">#{paymentData.order_id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Số tiền:</span>
              <span className="font-medium">{formatPrice(paymentData.amount)}</span>
            </div>
          </div>
        )}

        <div className="space-y-2 pt-4">
          {onBackToHome && (
            <Button onClick={onBackToHome} variant="outline" className="w-full">
              Về trang chủ
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

