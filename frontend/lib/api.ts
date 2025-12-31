// API client for DF Label Manager

import type {
  LabelBatch,
  DFOrder,
  BatchFilters,
  BulkShipConfirmRequest,
  UpdatePriorityRequest,
  UpdateTrackingRequest,
  ApiResponse,
  PaginatedResponse,
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Batch APIs
export const batchesApi = {
  list: async (filters?: BatchFilters): Promise<PaginatedResponse<LabelBatch>> => {
    const params = new URLSearchParams();
    if (filters?.shipping_service) params.append('shipping_service', filters.shipping_service);
    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);
    if (filters?.status) params.append('status', filters.status);
    
    const query = params.toString();
    return fetchApi<PaginatedResponse<LabelBatch>>(
      `/batches${query ? `?${query}` : ''}`
    );
  },

  get: async (batchId: string): Promise<ApiResponse<LabelBatch>> => {
    return fetchApi<ApiResponse<LabelBatch>>(`/batches/${batchId}`);
  },

  markPrinted: async (batchId: string): Promise<ApiResponse<LabelBatch>> => {
    return fetchApi<ApiResponse<LabelBatch>>(`/batches/${batchId}/mark-printed`, {
      method: 'PATCH',
    });
  },

  shipConfirmAll: async (batchId: string): Promise<ApiResponse<{ confirmed_count: number }>> => {
    return fetchApi<ApiResponse<{ confirmed_count: number }>>(
      `/batches/${batchId}/ship-confirm`,
      {
        method: 'POST',
      }
    );
  },

  getPdfUrl: async (batchId: string): Promise<ApiResponse<{ url: string }>> => {
    return fetchApi<ApiResponse<{ url: string }>>(`/batches/${batchId}/pdf`);
  },
};

// Order APIs
export const ordersApi = {
  listByBatch: async (batchId: string): Promise<PaginatedResponse<DFOrder>> => {
    return fetchApi<PaginatedResponse<DFOrder>>(`/batches/${batchId}/orders`);
  },

  updatePriority: async (
    orderId: string,
    data: UpdatePriorityRequest
  ): Promise<ApiResponse<DFOrder>> => {
    return fetchApi<ApiResponse<DFOrder>>(`/orders/${orderId}/priority`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  shipConfirm: async (orderId: string): Promise<ApiResponse<DFOrder>> => {
    return fetchApi<ApiResponse<DFOrder>>(`/orders/${orderId}/ship-confirm`, {
      method: 'POST',
    });
  },

  bulkShipConfirm: async (
    data: BulkShipConfirmRequest
  ): Promise<ApiResponse<{ confirmed_count: number }>> => {
    return fetchApi<ApiResponse<{ confirmed_count: number }>>(
      '/orders/bulk-ship-confirm',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },

  updateTracking: async (
    orderId: string,
    data: UpdateTrackingRequest
  ): Promise<ApiResponse<DFOrder>> => {
    return fetchApi<ApiResponse<DFOrder>>(`/orders/${orderId}/tracking`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};
