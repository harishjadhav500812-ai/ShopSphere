import { apiClient } from './client';
import type { Address, CreateAddressRequest, UpdateAddressRequest } from '../types';

export const addressApi = {
  getMyAddresses(): Promise<Address[]> {
    return apiClient.get<Address[]>('/api/addresses');
  },

  getAddressById(id: number): Promise<Address> {
    return apiClient.get<Address>(`/api/addresses/${id}`);
  },

  createAddress(request: CreateAddressRequest): Promise<Address> {
    return apiClient.post<Address>('/api/addresses', request);
  },

  updateAddress(id: number, request: UpdateAddressRequest): Promise<Address> {
    return apiClient.put<Address>(`/api/addresses/${id}`, request);
  },

  deleteAddress(id: number): Promise<void> {
    return apiClient.delete<void>(`/api/addresses/${id}`);
  },
};
