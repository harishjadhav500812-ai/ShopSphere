import { apiClient } from './client';
import type { Category, CreateCategoryRequest, UpdateCategoryRequest } from '../types';

export const categoryApi = {
  getAllCategories(): Promise<Category[]> {
    return apiClient.get<Category[]>('/api/categories');
  },

  getCategoryById(id: number): Promise<Category> {
    return apiClient.get<Category>(`/api/categories/${id}`);
  },

  getCategoryBySlug(slug: string): Promise<Category> {
    return apiClient.get<Category>(`/api/categories/slug/${slug}`);
  },

  createCategory(request: CreateCategoryRequest): Promise<Category> {
    return apiClient.post<Category>('/api/categories', request);
  },

  updateCategory(id: number, request: UpdateCategoryRequest): Promise<Category> {
    return apiClient.put<Category>(`/api/categories/${id}`, request);
  },

  deleteCategory(id: number): Promise<void> {
    return apiClient.delete<void>(`/api/categories/${id}`);
  },
};
