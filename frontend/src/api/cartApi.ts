import { apiClient } from './client';
import type { AddToCartRequest, Cart, UpdateCartItemRequest } from '../types';

export const cartApi = {
  getCart(): Promise<Cart> {
    return apiClient.get<Cart>('/api/cart');
  },

  addItem(request: AddToCartRequest): Promise<Cart> {
    return apiClient.post<Cart>('/api/cart/items', request);
  },

  updateItemQuantity(itemId: number, request: UpdateCartItemRequest): Promise<Cart> {
    return apiClient.put<Cart>(`/api/cart/items/${itemId}`, request);
  },

  removeItem(itemId: number): Promise<Cart> {
    return apiClient.delete<Cart>(`/api/cart/items/${itemId}`);
  },

  clearCart(): Promise<void> {
    return apiClient.delete<void>('/api/cart');
  },
};
