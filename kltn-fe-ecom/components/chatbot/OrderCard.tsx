'use client';

import Link from 'next/link';
import { Package, CheckCircle, Clock, XCircle } from 'lucide-react';
import { ChatbotOrder } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

interface ChatOrderCardProps {
  order: ChatbotOrder;
}

export function ChatOrderCard({ order }: ChatOrderCardProps) {
  const statusIcons = {
    pending: Clock,
    confirmed: CheckCircle,
    shipping: Package,
    delivered: CheckCircle,
    cancelled: XCircle,
  };

  const statusColors = {
    pending: 'warning',
    confirmed: 'info',
    shipping: 'info',
    delivered: 'success',
    cancelled: 'default',
  } as const;

  const statusLabels = {
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    shipping: 'Đang giao',
    delivered: 'Đã giao',
    cancelled: 'Đã hủy',
  };

  const Icon = statusIcons[order.status] || Package;
  const statusColor = statusColors[order.status] || 'default';

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden my-2">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-gray-600" />
            <div>
              <h4 className="font-extrabold text-sm text-gray-900">
                Đơn hàng #{order.order_number}
              </h4>
            </div>
          </div>
          <Badge variant={statusColor}>
            {statusLabels[order.status]}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-600 font-semibold">Tổng tiền:</p>
            <p className="text-lg font-extrabold text-green-600">
              {formatPrice(order.total_amount)}
            </p>
          </div>
          <Link
            href="/orders"
            className="text-xs font-semibold text-green-600 hover:text-green-700 underline"
          >
            Xem chi tiết →
          </Link>
        </div>
      </div>
    </div>
  );
}

