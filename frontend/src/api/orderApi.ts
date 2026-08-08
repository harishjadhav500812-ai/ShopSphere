import { apiClient } from './client';
import type { CreateOrderRequest, Order, OrderStatus, Page } from '../types';

export const orderApi = {
  createOrder(request?: CreateOrderRequest): Promise<Order> {
    return apiClient.post<Order>('/api/orders', request || {});
  },

  getCustomerOrders(params?: { page?: number; size?: number }): Promise<Page<Order>> {
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.append('page', params.page.toString());
    if (params?.size !== undefined) query.append('size', params.size.toString());
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return apiClient.get<Page<Order>>(`/api/orders${queryString}`);
  },

  getOrderById(id: number): Promise<Order> {
    return apiClient.get<Order>(`/api/orders/${id}`);
  },

  cancelOrder(id: number): Promise<Order> {
    return apiClient.post<Order>(`/api/orders/${id}/cancel`);
  },

  // Seller
  getSellerOrders(params?: { page?: number; size?: number }): Promise<Page<Order>> {
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.append('page', params.page.toString());
    if (params?.size !== undefined) query.append('size', params.size.toString());
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return apiClient.get<Page<Order>>(`/api/seller/orders${queryString}`);
  },

  getSellerOrderById(id: number): Promise<Order> {
    return apiClient.get<Order>(`/api/seller/orders/${id}`);
  },

  // Admin
  getAdminOrders(params?: { page?: number; size?: number }): Promise<Page<Order>> {
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.append('page', params.page.toString());
    if (params?.size !== undefined) query.append('size', params.size.toString());
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return apiClient.get<Page<Order>>(`/api/admin/orders${queryString}`);
  },

  getAdminOrderById(id: number): Promise<Order> {
    return apiClient.get<Order>(`/api/admin/orders/${id}`);
  },

  updateOrderStatusByAdmin(id: number, status: OrderStatus): Promise<Order> {
    return apiClient.patch<Order>(`/api/admin/orders/${id}/status`, { status });
  },
};
