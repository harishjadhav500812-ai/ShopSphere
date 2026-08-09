import { apiUrl } from './config';
import type { ApiError } from '../types';

export class ApiRequestError extends Error {
  public status: number;
  public details: ApiError;

  constructor(status: number, details: ApiError) {
    super(details.message || `API error with status ${status}`);
    this.name = 'ApiRequestError';
    this.status = status;
    this.details = details;
  }
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('shopsphere_token');
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = apiUrl(path);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers as Record<string, string> || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');

  if (!response.ok) {
    let errorData: ApiError;
    if (isJson) {
      errorData = await response.json();
    } else {
      const text = await response.text();
      errorData = {
        timestamp: new Date().toISOString(),
        status: response.status,
        error: response.statusText,
        message: text || response.statusText,
        path,
      };
    }

    if (response.status === 401) {
      localStorage.removeItem('shopsphere_token');
      localStorage.removeItem('shopsphere_user');
    }

    throw new ApiRequestError(response.status, errorData);
  }

  if (response.status === 204) {
    return {} as T;
  }

  if (isJson) {
    return await response.json();
  }

  return (await response.text()) as unknown as T;
}

export const apiClient = {
  get<T>(path: string, headers?: Record<string, string>): Promise<T> {
    return request<T>(path, { method: 'GET', headers });
  },

  post<T>(path: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
    return request<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      headers,
    });
  },

  put<T>(path: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
    return request<T>(path, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      headers,
    });
  },

  patch<T>(path: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
    return request<T>(path, {
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      headers,
    });
  },

  delete<T>(path: string, headers?: Record<string, string>): Promise<T> {
    return request<T>(path, { method: 'DELETE', headers });
  },
};
