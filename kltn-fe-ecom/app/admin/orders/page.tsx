'use client';

import { useEffect, useState } from 'react';
import { Search, Eye } from 'lucide-react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import { Alert } from '@/components/ui/Alert';
import { Modal } from '@/components/ui/Modal';
import { adminOrdersAPI, UpdateOrderData } from '@/lib/api/admin';
import { Order } from '@/lib/types';
import { formatPrice, formatDate } from '@/lib/utils';
import { getErrorMessage } from '@/lib/error-handler';

const statusOptions = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'pending', label: 'Chờ xác nhận' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'shipping', label: 'Đang giao' },
  { value: 'delivered', label: 'Đã giao' },
  { value: 'cancelled', label: 'Đã hủy' },
];

const paymentStatusOptions = [
  { value: '', label: 'Tất cả thanh toán' },
  { value: 'pending', label: 'Chưa thanh toán' },
  { value: 'paid', label: 'Đã thanh toán' },
  { value: 'failed', label: 'Thất bại' },
  { value: 'refunded', label: 'Đã hoàn tiền' },
];

const statusVariants: Record<string, 'default' | 'warning' | 'success' | 'info' | 'danger'> = {
  pending: 'warning',
  confirmed: 'info',
  shipping: 'info',
  delivered: 'success',
  cancelled: 'danger',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [page, searchTerm, statusFilter, paymentFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await adminOrdersAPI.getOrders({
        page,
        limit: 20,
        search: searchTerm || undefined,
        status: statusFilter as any || undefined,
        payment_status: paymentFilter as any || undefined,
      });
      setOrders(data.items || []);
      setTotal(data.total);
    } catch (err) {
      setError('Không thể tải danh sách đơn hàng.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleUpdateOrder = async (orderId: number, updates: UpdateOrderData) => {
    try {
      await adminOrdersAPI.updateOrder(orderId, updates);
      alert('Cập nhật đơn hàng thành công!');
      setIsModalOpen(false);
      fetchOrders();
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="Tìm kiếm đơn hàng..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
              />
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                options={statusOptions}
              />
              <Select
                value={paymentFilter}
                onChange={(e) => {
                  setPaymentFilter(e.target.value);
                  setPage(1);
                }}
                options={paymentStatusOptions}
              />
              <Button onClick={fetchOrders}>
                <Search className="w-4 h-4 mr-2" />
                Tìm kiếm
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold">
              Danh sách đơn hàng ({total})
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
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Mã đơn</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Khách hàng</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Tổng tiền</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Trạng thái</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Thanh toán</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Ngày đặt</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium">{order.order_number}</td>
                          <td className="px-4 py-3 text-sm">{order.username || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{order.user_email || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm font-medium text-green-600">
                            {formatPrice(order.total_amount)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <Badge variant={statusVariants[order.status]}>
                              {statusOptions.find((s) => s.value === order.status)?.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <Badge variant={order.payment_status === 'paid' ? 'success' : 'warning'}>
                              {paymentStatusOptions.find((s) => s.value === order.payment_status)?.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {formatDate(order.created_at).split(',')[0]}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <button
                              onClick={() => handleViewDetails(order)}
                              className="p-1 hover:bg-gray-100 rounded"
                              title="Chi tiết"
                            >
                              <Eye className="w-4 h-4 text-blue-600" />
                            </button>
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

      {/* Order Details Modal */}
      {selectedOrder && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedOrder(null);
          }}
          title={`Chi tiết đơn hàng #${selectedOrder.order_number}`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Trạng thái đơn hàng</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg"
                  defaultValue={selectedOrder.status}
                  onChange={(e) =>
                    handleUpdateOrder(selectedOrder.id, { status: e.target.value as any })
                  }
                >
                  {statusOptions.slice(1).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Trạng thái thanh toán</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg"
                  defaultValue={selectedOrder.payment_status}
                  onChange={(e) =>
                    handleUpdateOrder(selectedOrder.id, { payment_status: e.target.value as any })
                  }
                >
                  {paymentStatusOptions.slice(1).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Thông tin khách hàng</h4>
              <p className="text-sm text-gray-700">Tên: {selectedOrder.username || 'N/A'}</p>
              <p className="text-sm text-gray-700">Email: {selectedOrder.user_email || 'N/A'}</p>
              <p className="text-sm text-gray-700">Địa chỉ giao hàng: {selectedOrder.shipping_address}</p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Sản phẩm</h4>
              <div className="space-y-2">
                {(selectedOrder.order_items || (selectedOrder as any).items || []).map((item) => (
                  <div key={item.id} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                    <span>
                      {item.product?.product_name || item.product_name || 'Sản phẩm không xác định'}
                      <span className="ml-2 font-bold">x {item.quantity}</span>
                    </span>
                    <span className="font-medium">{formatPrice(item.total_price)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Tổng cộng:</span>
                <span className="text-green-600">{formatPrice(selectedOrder.total_amount)}</span>
              </div>
            </div>

            {selectedOrder.notes && (
              <div className="bg-blue-50 p-3 rounded">
                <p className="text-sm font-medium mb-1">Ghi chú:</p>
                <p className="text-sm text-gray-700">{selectedOrder.notes}</p>
              </div>
            )}

            <div className="text-xs text-gray-500">
              <p>Ngày đặt: {formatDate(selectedOrder.created_at)}</p>
              <p>Cập nhật: {formatDate(selectedOrder.updated_at)}</p>
            </div>
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
}

