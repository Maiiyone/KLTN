'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { Alert } from '@/components/ui/Alert';
import { PaymentStatusBadge } from '@/components/payment/PaymentStatusBadge';
import { paymentAPI } from '@/lib/api/payment';
import { PaymentHistoryItem, PaymentStatusType } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { getErrorMessage } from '@/lib/error-handler';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Wallet, CreditCard, Banknote, ChevronLeft, ChevronRight } from 'lucide-react';

export default function PaymentHistoryPage() {
  const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<PaymentStatusType | undefined>(undefined);

  const limit = 10;
  const totalPages = Math.ceil(total / limit);

  useEffect(() => {
    fetchPaymentHistory();
  }, [page, statusFilter]);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await paymentAPI.getPaymentHistory(page, limit, statusFilter);
      setPayments(result.payments);
      setTotal(result.total);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'momo':
        return <Wallet className="w-5 h-5 text-pink-600" />;
      case 'vnpay':
        return <CreditCard className="w-5 h-5 text-blue-600" />;
      case 'cod':
        return <Banknote className="w-5 h-5 text-green-600" />;
      default:
        return <Wallet className="w-5 h-5 text-gray-600" />;
    }
  };

  const handleStatusFilter = (status: PaymentStatusType | undefined) => {
    setStatusFilter(status);
    setPage(1); // Reset to first page when filter changes
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Lịch sử thanh toán</h1>

        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-bold">Giao dịch của bạn</h2>
              
              {/* Status Filter */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleStatusFilter(undefined)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    statusFilter === undefined
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Tất cả
                </button>
                <button
                  onClick={() => handleStatusFilter('paid')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    statusFilter === 'paid'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Đã thanh toán
                </button>
                <button
                  onClick={() => handleStatusFilter('pending')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    statusFilter === 'pending'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Chờ thanh toán
                </button>
                <button
                  onClick={() => handleStatusFilter('failed')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    statusFilter === 'failed'
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Thất bại
                </button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loading />
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Chưa có giao dịch nào</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">
                          Mã đơn hàng
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">
                          Phương thức
                        </th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">
                          Số tiền
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">
                          Trạng thái
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">
                          Mã GD
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">
                          Ngày tạo
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr key={payment.payment_id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <span className="font-medium">{payment.order_number}</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {getPaymentMethodIcon(payment.payment_method)}
                              <span className="uppercase text-sm font-medium">
                                {payment.payment_method}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-medium">
                            {formatPrice(payment.amount)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex justify-center">
                              <PaymentStatusBadge status={payment.status} />
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {payment.transaction_id || '-'}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {format(new Date(payment.created_at), 'dd/MM/yyyy HH:mm', {
                              locale: vi,
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  {payments.map((payment) => (
                    <div
                      key={payment.payment_id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-sm text-gray-600">Mã đơn hàng</p>
                          <p className="font-medium">{payment.order_number}</p>
                        </div>
                        <PaymentStatusBadge status={payment.status} />
                      </div>

                      <div className="flex justify-between">
                        <div>
                          <p className="font-semibold text-sm text-gray-600">Phương thức</p>
                          <div className="flex items-center gap-2 mt-1">
                            {getPaymentMethodIcon(payment.payment_method)}
                            <span className="uppercase text-sm font-medium">
                              {payment.payment_method}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm text-gray-600">Số tiền</p>
                          <p className="font-medium text-green-600">
                            {formatPrice(payment.amount)}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-between text-sm">
                        <div>
                          <p className="text-gray-600">Mã GD</p>
                          <p className="font-medium">{payment.transaction_id || '-'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-600">Ngày tạo</p>
                          <p className="font-medium">
                            {format(new Date(payment.created_at), 'dd/MM/yyyy HH:mm', {
                              locale: vi,
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-between items-center mt-6 pt-6 border-t">
                    <p className="text-sm text-gray-600">
                      Hiển thị {(page - 1) * limit + 1} - {Math.min(page * limit, total)} của{' '}
                      {total} giao dịch
                    </p>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (page <= 3) {
                            pageNum = i + 1;
                          } else if (page >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = page - 2 + i;
                          }

                          return (
                            <button
                              key={pageNum}
                              onClick={() => setPage(pageNum)}
                              className={`w-10 h-10 rounded-lg ${
                                page === pageNum
                                  ? 'bg-blue-500 text-white'
                                  : 'border hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

