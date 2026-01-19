'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MainLayout } from '@/components/layouts/MainLayout';
import { PaymentResult } from '@/components/payment/PaymentResult';
import { PaymentLoading } from '@/components/payment/PaymentLoading';
import { Alert } from '@/components/ui/Alert';
import { usePayment } from '@/lib/hooks/usePayment';
import { paymentAPI } from '@/lib/api/payment';
import { PaymentStatus } from '@/lib/types';

function PaymentResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { checkPaymentWithRetry } = usePayment();

  const hasCheckedRef = useRef(false);

  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'pending'>('loading');
  const [paymentData, setPaymentData] = useState<PaymentStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    const checkPayment = async () => {
      try {
        // ✅ LẤY payment_id
        const paymentId =
          sessionStorage.getItem('payment_id') ||
          searchParams.get('payment_id');

        if (!paymentId) {
          router.replace('/');
          return;
        }

        // ✅ CHECK LOGIN
        const token = localStorage.getItem('access_token');
        if (!token) {
          setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          setStatus('failed');

          setTimeout(() => {
            router.replace(`/auth/login?redirect=/payment/result&payment_id=${paymentId}`);
          }, 3000);
          return;
        }

        // ✅ CHECK VNPay Return
        if (searchParams.get('vnp_ResponseCode')) {
          try {
            // Convert searchParams to simple object
            const params: Record<string, string> = {};
            searchParams.forEach((value, key) => {
              params[key] = value;
            });
            // Call Backend to verify signature & update DB
            await paymentAPI.verifyVNPayReturn(params);
          } catch (verifyErr) {
            console.error("VNPay verify error:", verifyErr);
            // Continue to check status normally (maybe IPN updated it)
          }
        }

        // ✅ CHECK STATUS
        const result = await checkPaymentWithRetry(Number(paymentId));
        setPaymentData(result);

        if (result.status === 'paid') {
          setStatus('success');

          // ✅ cleanup nhưng KHÔNG redirect
          sessionStorage.removeItem('payment_id');
          sessionStorage.removeItem('order_id');
          return;
        }

        if (result.status === 'failed') {
          setStatus('failed');
          return;
        }

        setStatus('pending');
      } catch (err: any) {
        console.error(err);

        if (err.message?.includes('timeout')) {
          setStatus('pending');
          setError(
            'Thanh toán đang được xử lý. Vui lòng đợi hoặc kiểm tra lại sau.'
          );
          return;
        }

        setError('Không thể kiểm tra trạng thái thanh toán.');
        setStatus('failed');
      }
    };

    checkPayment();
  }, []); // ❌ KHÔNG DEPEND searchParams

  const handleViewOrder = () => {
    router.push('/orders');
  };

  const handleRetry = () => {
    router.push('/checkout');
  };

  const handleBackToHome = () => {
    router.push('/');
  };

  return (
    <div className="container mx-auto px-4 py-16">
      {error && (
        <Alert variant="error" className="mb-6 max-w-2xl mx-auto">
          {error}
        </Alert>
      )}

      {status === 'loading' ? (
        <PaymentLoading message="Đang kiểm tra trạng thái thanh toán..." />
      ) : (
        <PaymentResult
          status={status}
          paymentData={paymentData || undefined}
          onViewOrder={handleViewOrder}
          onRetry={handleRetry}
          onBackToHome={handleBackToHome}
        />
      )}
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <MainLayout>
      <Suspense fallback={<PaymentLoading message="Đang tải..." />}>
        <PaymentResultContent />
      </Suspense>
    </MainLayout>
  );
}
