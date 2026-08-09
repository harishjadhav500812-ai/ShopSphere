import { apiClient } from './client';
import type { Coupon, CreateCouponRequest, UpdateCouponRequest } from '../types';

export const couponApi = {
  /** GET /api/admin/coupons returns a plain list from the backend. */
  getAdminCoupons(): Promise<Coupon[]> {
    return apiClient.get<Coupon[]>('/api/admin/coupons');
  },

  getAdminCouponById(id: number): Promise<Coupon> {
    return apiClient.get<Coupon>(`/api/admin/coupons/${id}`);
  },

  createCoupon(request: CreateCouponRequest): Promise<Coupon> {
    return apiClient.post<Coupon>('/api/admin/coupons', request);
  },

  updateCoupon(id: number, request: UpdateCouponRequest): Promise<Coupon> {
    return apiClient.patch<Coupon>(`/api/admin/coupons/${id}`, request);
  },

  deleteCoupon(id: number): Promise<void> {
    return apiClient.delete<void>(`/api/admin/coupons/${id}`);
  },
};
