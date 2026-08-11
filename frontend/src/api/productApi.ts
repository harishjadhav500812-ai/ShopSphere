import { apiClient } from './client';
import type {
  CreateProductRequest,
  Product,
  SearchSuggestionsResponse,
  UpdateProductRequest,
  UpdateProductStatusRequest,
  UpdateStockRequest,
} from '../types';

export const productApi = {
  getProducts(params?: {
    categoryId?: number;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    inStockOnly?: boolean;
    brand?: string;
    sort?: string;
    activeOnly?: boolean;
  }): Promise<Product[]> {
    const query = new URLSearchParams();
    if (params?.categoryId) query.append('categoryId', params.categoryId.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.minPrice !== undefined) query.append('minPrice', params.minPrice.toString());
    if (params?.maxPrice !== undefined) query.append('maxPrice', params.maxPrice.toString());
    if (params?.minRating !== undefined) query.append('minRating', params.minRating.toString());
    if (params?.inStockOnly) query.append('inStockOnly', 'true');
    if (params?.brand) query.append('brand', params.brand);
    if (params?.sort) query.append('sort', params.sort);
    if (params?.activeOnly) query.append('activeOnly', 'true');
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return apiClient.get<Product[]>(`/api/products${queryString}`);
  },

  getSearchSuggestions(query: string): Promise<SearchSuggestionsResponse> {
    return apiClient.get<SearchSuggestionsResponse>(`/api/products/search/suggestions?q=${encodeURIComponent(query)}`);
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

  updateProductStatus(id: number, request: UpdateProductStatusRequest): Promise<Product> {
    return apiClient.patch<Product>(`/api/products/${id}/status`, request);
  },

  updateStock(id: number, request: UpdateStockRequest): Promise<Product> {
    return apiClient.post<Product>(`/api/products/${id}/stock`, request);
  },

  deleteProduct(id: number): Promise<void> {
    return apiClient.delete<void>(`/api/products/${id}`);
  },
};
