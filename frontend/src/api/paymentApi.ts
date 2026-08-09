import { apiClient } from './client';
import type { Payment, PaymentStatus } from '../types';

export const paymentApi = {
  /** Processes the simulated payment for an order (deducts stock, confirms the order). */
  processPayment(orderId: number): Promise<Payment> {
    return apiClient.post<Payment>(`/api/orders/${orderId}/payment`);
  },

  getPayment(orderId: number): Promise<Payment> {
    return apiClient.get<Payment>(`/api/orders/${orderId}/payment`);
  },

  updatePaymentStatusByAdmin(orderId: number, status: PaymentStatus): Promise<Payment> {
    return apiClient.patch<Payment>(`/api/admin/orders/${orderId}/payment-status`, { status });
  },
};
