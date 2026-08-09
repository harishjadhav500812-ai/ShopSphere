import { apiClient } from './client';
import type { Wishlist, AddWishlistItemRequest } from '../types';

export const wishlistApi = {
  getWishlist(): Promise<Wishlist> {
    return apiClient.get<Wishlist>('/api/wishlist');
  },

  addItem(request: AddWishlistItemRequest): Promise<Wishlist> {
    return apiClient.post<Wishlist>('/api/wishlist/items', request);
  },

  removeItem(itemId: number): Promise<Wishlist> {
    return apiClient.delete<Wishlist>(`/api/wishlist/items/${itemId}`);
  },
};
