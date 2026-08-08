import { apiClient } from './client';
import type { Category, CreateCategoryRequest } from '../types';

export const categoryApi = {
  getAllCategories(): Promise<Category[]> {
    return apiClient.get<Category[]>('/api/categories');
  },

  getCategoryById(id: number): Promise<Category> {
    return apiClient.get<Category>(`/api/categories/${id}`);
  },

  createCategory(request: CreateCategoryRequest): Promise<Category> {
    return apiClient.post<Category>('/api/categories', request);
  },

  updateCategory(id: number, request: CreateCategoryRequest): Promise<Category> {
    return apiClient.put<Category>(`/api/categories/${id}`, request);
  },

  deleteCategory(id: number): Promise<void> {
    return apiClient.delete<void>(`/api/categories/${id}`);
  },
};
