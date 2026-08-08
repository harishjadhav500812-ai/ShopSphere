import { apiClient } from './client';
import type { CreateShipmentRequest, Shipping, ShippingStatus, TrackingResponse, UpdateShippingStatusRequest } from '../types';

export const shippingApi = {
  createShipment(orderId: number, request: CreateShipmentRequest): Promise<Shipping> {
    return apiClient.post<Shipping>(`/api/orders/${orderId}/shipment`, request);
  },

  getShipment(orderId: number): Promise<Shipping> {
    return apiClient.get<Shipping>(`/api/orders/${orderId}/shipment`);
  },

  getTracking(orderId: number): Promise<TrackingResponse> {
    return apiClient.get<TrackingResponse>(`/api/orders/${orderId}/tracking`);
  },

  updateShippingStatusByAdmin(orderId: number, status: ShippingStatus): Promise<Shipping> {
    const request: UpdateShippingStatusRequest = { status };
    return apiClient.patch<Shipping>(`/api/admin/orders/${orderId}/shipment-status`, request);
  },
};
