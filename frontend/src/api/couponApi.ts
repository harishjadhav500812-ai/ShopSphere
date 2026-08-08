import { apiClient } from './client';
import type { Coupon, CreateCouponRequest, Page, UpdateCouponRequest } from '../types';

export const couponApi = {
  getAdminCoupons(params?: { page?: number; size?: number }): Promise<Page<Coupon>> {
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.append('page', params.page.toString());
    if (params?.size !== undefined) query.append('size', params.size.toString());
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return apiClient.get<Page<Coupon>>(`/api/admin/coupons${queryString}`);
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
