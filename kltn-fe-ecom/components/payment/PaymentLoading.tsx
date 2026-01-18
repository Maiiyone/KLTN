'use client';

import { Loader2 } from 'lucide-react';

interface PaymentLoadingProps {
  message?: string;
}

export function PaymentLoading({ message = 'Đang xử lý thanh toán...' }: PaymentLoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="relative">
        <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
      </div>
      <p className="text-lg font-medium text-gray-700">{message}</p>
      <p className="text-sm text-gray-500">Vui lòng không tắt trình duyệt</p>
    </div>
  );
}

