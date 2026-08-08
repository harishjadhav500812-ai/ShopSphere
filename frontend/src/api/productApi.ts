import { apiClient } from './client';
import type { CreateProductRequest, Page, Product, UpdateProductRequest } from '../types';

export const productApi = {
  getProducts(params?: { categoryId?: number; search?: string; page?: number; size?: number }): Promise<Page<Product>> {
    const query = new URLSearchParams();
    if (params?.categoryId) query.append('categoryId', params.categoryId.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.page !== undefined) query.append('page', params.page.toString());
    if (params?.size !== undefined) query.append('size', params.size.toString());

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return apiClient.get<Page<Product>>(`/api/products${queryString}`);
  },

  getProductById(id: number): Promise<Product> {
    return apiClient.get<Product>(`/api/products/${id}`);
  },

  createProduct(request: CreateProductRequest): Promise<Product> {
    return apiClient.post<Product>('/api/products', request);
  },

  updateProduct(id: number, request: UpdateProductRequest): Promise<Product> {
    return apiClient.put<Product>(`/api/products/${id}`, request);
  },

  deleteProduct(id: number): Promise<void> {
    return apiClient.delete<void>(`/api/products/${id}`);
  },
};
