import { apiClient } from './client';
import type { Payment } from '../types';

export const paymentApi = {
  simulatePayment(orderId: number): Promise<Payment> {
    return apiClient.post<Payment>(`/api/orders/${orderId}/payment/simulate`);
  },

  getPayment(orderId: number): Promise<Payment> {
    return apiClient.get<Payment>(`/api/orders/${orderId}/payment`);
  },
};
