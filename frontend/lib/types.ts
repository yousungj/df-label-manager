// TypeScript types for the DF Label Manager application

export interface LabelBatch {
  batch_id: string;
  batch_file_name: string;
  shipping_service: string;
  s3_url: string;
  downloaded_at: string;
  total_orders: number;
  batch_printed_at?: string;
  batch_confirmed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DFOrder {
  order_id: string;
  batch_id: string;
  purchase_order_number: string;
  order_date: string;
  shipping_service: string;
  ship_confirmed_at?: string;
  confirmed_by?: string;
  tracking_number?: string;
  print_priority: 'normal' | 'high' | 'urgent';
  marked_printed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface BatchFilters {
  shipping_service?: string;
  date_from?: string;
  date_to?: string;
  status?: 'unprinted' | 'unconfirmed' | 'all';
}

export interface BulkShipConfirmRequest {
  order_ids: string[];
  confirmed_by?: string;
}

export interface UpdatePriorityRequest {
  priority: 'normal' | 'high' | 'urgent';
}

export interface UpdateTrackingRequest {
  tracking_number: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}
