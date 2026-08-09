import { apiClient } from './client';
import type { CreateReviewRequest, Review } from '../types';

export const reviewApi = {
  getProductReviews(productId: number): Promise<Review[]> {
    return apiClient.get<Review[]>(`/api/products/${productId}/reviews`);
  },

  createReview(productId: number, request: CreateReviewRequest): Promise<Review> {
    return apiClient.post<Review>(`/api/products/${productId}/reviews`, request);
  },

  deleteOwnReview(productId: number): Promise<void> {
    return apiClient.delete<void>(`/api/products/${productId}/reviews/me`);
  },
};
