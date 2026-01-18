'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package } from 'lucide-react';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import { Alert } from '@/components/ui/Alert';
import { ordersAPI } from '@/lib/api/orders';
import { Order } from '@/lib/types';
import { formatPrice, formatDate } from '@/lib/utils';

const statusVariants: Record<string, 'default' | 'warning' | 'success' | 'info'> = {
  pending: 'warning',
  confirmed: 'info',
  shipping: 'info',
  delivered: 'success',
  cancelled: 'default',
};

const statusLabels: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
};

const paymentStatusLabels: Record<string, string> = {
  pending: 'Chưa thanh toán',
  paid: 'Đã thanh toán',
  failed: 'Thất bại',
  refunded: 'Đã hoàn tiền',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await ordersAPI.getOrders();
      setOrders(data);
    } catch (err) {
      setError('Không thể tải danh sách đơn hàng.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-extrabold mb-8 text-gray-900">Đơn Hàng Của Tôi</h1>

        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        {loading ? (
          <Loading />
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-xl text-gray-600 mb-6">Bạn chưa có đơn hàng nào</p>
              <Link
                href="/products"
                className="inline-block px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Bắt đầu mua sắm
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-6">
                  <div className="flex flex-wrap items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-extrabold mb-1 text-gray-900">
                        Đơn hàng #{order.order_number}
                      </h3>
                      <p className="text-sm text-gray-700 font-semibold">
                        Đặt ngày: {formatDate(order.created_at)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={statusVariants[order.status] || 'default'}>
                        {statusLabels[order.status]}
                      </Badge>
                      <Badge variant={order.payment_status === 'paid' ? 'success' : 'warning'}>
                        {paymentStatusLabels[order.payment_status]}
                      </Badge>
                    </div>
                  </div>

                  <div className="border-t border-b py-4 mb-4">
                    <div className="space-y-2">
                      {order.order_items?.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-gray-700 font-semibold">
                           {item.product?.product_name ?? `Sản phẩm #${item.product_id}`} <span className="text-green-600">x {item.quantity}</span>
                          </span>
                          <span className="font-bold text-gray-900">
                            {formatPrice(item.total_price)}
                          </span>
                        </div>
                      )) || (
                        <p className="text-sm text-gray-500 italic">Không có sản phẩm</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-700 font-bold mb-1">📍 Địa chỉ giao hàng:</p>
                      <p className="text-sm font-semibold text-gray-900">{order.shipping_address}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-700 font-bold mb-1">💰 Tổng tiền:</p>
                      <p className="text-2xl font-extrabold text-green-600">
                        {formatPrice(order.total_amount)}
                      </p>
                    </div>
                  </div>

                  {order.notes && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-gray-900 font-semibold">📝 Ghi chú: <span className="font-normal">{order.notes}</span></p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

