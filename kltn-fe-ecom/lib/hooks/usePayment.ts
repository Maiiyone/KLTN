'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { paymentAPI } from '../api/payment';
import { PaymentMethod, InitPaymentResponse, PaymentStatus } from '../types';
import { getErrorMessage } from '../error-handler';

interface UsePaymentOptions {
  onSuccess?: (response: InitPaymentResponse) => void;
  onError?: (error: string) => void;
}

export function usePayment(options?: UsePaymentOptions) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ---------- process payment ---------- */
  const processPayment = async (orderId: number, method: PaymentMethod) => {
    setLoading(true);
    setError(null);

    try {
      const returnUrl = `${window.location.origin}/payment/result`;
      const cancelUrl = `${window.location.origin}/payment/cancel`;

      const result = await paymentAPI.initPayment({
        order_id: orderId,
        payment_method: method,
        return_url: returnUrl,
        cancel_url: cancelUrl,
      });

      if (!result.success) {
        throw new Error(result.message || 'Payment initialization failed');
      }

      sessionStorage.setItem('payment_id', result.payment_id.toString());
      sessionStorage.setItem('order_id', orderId.toString());

      if (method === 'cod') {
        options?.onSuccess?.(result);
        router.push(`/orders/${orderId}`);
        return;
      }

      if (!result.payment_url) {
        throw new Error('Payment URL not provided');
      }

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (isMobile && method === 'momo' && result.deep_link) {
        window.location.href = result.deep_link;
        setTimeout(() => {
          if (!document.hidden) {
            window.location.href = result.payment_url!;
          }
        }, 2000);
      } else {
        window.location.href = result.payment_url;
      }

      options?.onSuccess?.(result);
    } catch (err: any) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      options?.onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- check status once ---------- */
  const checkPaymentStatus = async (paymentId: number): Promise<PaymentStatus> => {
    setLoading(true);
    setError(null);

    try {
      return await paymentAPI.getPaymentStatus(paymentId);
    } catch (err: any) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /* ---------- check status with retry ---------- */
  const checkPaymentWithRetry = async (
    paymentId: number,
    maxRetries: number = 5
  ): Promise<PaymentStatus> => {
    setLoading(true);
    setError(null);

    try {
      // ⬅️ QUAN TRỌNG: API này đã đảm bảo return PaymentStatus
      return await paymentAPI.checkPaymentWithRetry(paymentId, maxRetries);
    } catch (err: any) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw err; // chỉ throw lỗi thật
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    processPayment,
    checkPaymentStatus,
    checkPaymentWithRetry,
  };
}
