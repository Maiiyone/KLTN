'use client';

import { PaymentStatusType } from '@/lib/types';

interface PaymentStatusBadgeProps {
  status: PaymentStatusType;
  className?: string;
}

export function PaymentStatusBadge({ status, className = '' }: PaymentStatusBadgeProps) {
  const statusConfig = {
    pending: {
      text: 'Chờ thanh toán',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-800',
      icon: '⏳',
    },
    paid: {
      text: 'Đã thanh toán',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      icon: '✅',
    },
    failed: {
      text: 'Thất bại',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      icon: '❌',
    },
    refunded: {
      text: 'Đã hoàn tiền',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800',
      icon: '↩️',
    },
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.bgColor} ${config.textColor} ${className}`}
    >
      <span>{config.icon}</span>
      <span>{config.text}</span>
    </span>
  );
}

