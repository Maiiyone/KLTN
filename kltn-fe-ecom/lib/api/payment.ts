import { apiClient } from '../api-client';
import {
  InitPaymentRequest,
  InitPaymentResponse,
  PaymentStatus,
  PaymentHistoryResponse,
  PaymentStatusType,
} from '../types';

class PaymentService {
  /* ---------- helpers ---------- */
  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /* ---------- payment init ---------- */
  async initPayment(data: InitPaymentRequest): Promise<InitPaymentResponse> {
    const response = await apiClient.post<InitPaymentResponse>(
      '/payments/init',
      data
    );
    return response.data;
  }

  /* ---------- payment status ---------- */
  async getPaymentStatus(paymentId: number): Promise<PaymentStatus> {
    const response = await apiClient.get<PaymentStatus>(
      `/payments/${paymentId}/status`
    );
    return response.data;
  }

  /* ---------- payment history ---------- */
  async getPaymentHistory(
    page: number = 1,
    limit: number = 20,
    status?: PaymentStatusType
  ): Promise<PaymentHistoryResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && { status }),
    });

    const response = await apiClient.get<PaymentHistoryResponse>(
      `/payments/history?${params}`
    );
    return response.data;
  }

  /* ---------- polling with retry ---------- */
  async checkPaymentWithRetry(
  paymentId: number,
  maxRetries = 5,
  delay = 2000
): Promise<PaymentStatus> {
  let lastStatus!: PaymentStatus;

  for (let i = 0; i < maxRetries; i++) {
    const res = await this.getPaymentStatus(paymentId);
    lastStatus = res;

    if (res.status === 'paid' || res.status === 'failed') {
      return res;
    }

    await this.sleep(delay);
  }

  // ⬅️ return FULL PaymentStatus (pending từ backend)
  return lastStatus;
}

}

export const paymentAPI = new PaymentService();
