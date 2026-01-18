import { apiClient } from '../api-client';
import {
  User,
  Product,
  Order,
  PaginatedResponse,
  PublicStats,
  DashboardStats,
  UserStats,
  ProductStats,
  OrderStats,
  SalesAnalytics,
  RecentActivity,
} from '../types';

// Admin Users API
export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: 'customer' | 'admin';
  is_active?: boolean;
}

export interface UpdateUserData {
  full_name?: string;
  phone?: string;
  address?: string;
  role?: 'customer' | 'admin';
  is_active?: boolean;
}

export const adminUsersAPI = {
  getUsers: async (params: GetUsersParams = {}): Promise<PaginatedResponse<User>> => {
    const response = await apiClient.get<PaginatedResponse<User>>('/admin/users', { params });
    return response.data;
  },

  getUser: async (id: number): Promise<User> => {
    const response = await apiClient.get<User>(`/admin/users/${id}`);
    return response.data;
  },

  updateUser: async (id: number, data: UpdateUserData): Promise<User> => {
    const response = await apiClient.put<User>(`/admin/users/${id}`, data);
    return response.data;
  },

  deleteUser: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`/admin/users/${id}`);
    return response.data;
  },
};

// Admin Products API
export interface GetAdminProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: boolean;
  low_stock?: boolean;
}

export interface CreateProductData {
  product_code: string;
  product_id?: string;
  title?: string;
  product_name: string;
  current_price: number;
  current_price_text?: string;
  unit?: string;
  original_price?: number;
  original_price_text?: string;
  discount_percent?: number;
  discount_text?: string;
  product_url?: string;
  image_url?: string;
  image_alt?: string;
  product_position?: number;
  description?: string;
  stock_quantity?: number;
}

export interface UpdateProductData {
  product_name?: string;
  current_price?: number;
  current_price_text?: string;
  original_price?: number;
  original_price_text?: string;
  discount_percent?: number;
  discount_text?: string;
  product_url?: string;
  image_url?: string;
  image_alt?: string;
  product_position?: number;
  description?: string;
  stock_quantity?: number;
  is_active?: boolean;
}

export const adminProductsAPI = {
  getProducts: async (params: GetAdminProductsParams = {}): Promise<PaginatedResponse<Product>> => {
    const response = await apiClient.get<PaginatedResponse<Product>>('/admin/products', { params });
    return response.data;
  },

  getProduct: async (id: number): Promise<Product> => {
    const response = await apiClient.get<Product>(`/admin/products/${id}`);
    return response.data;
  },

  createProduct: async (data: CreateProductData): Promise<Product> => {
    const response = await apiClient.post<Product>('/admin/products', data);
    return response.data;
  },

  updateProduct: async (id: number, data: UpdateProductData): Promise<Product> => {
    const response = await apiClient.put<Product>(`/admin/products/${id}`, data);
    return response.data;
  },

  deleteProduct: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`/admin/products/${id}`);
    return response.data;
  },
};

// Admin Orders API
export interface GetAdminOrdersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled';
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
}

export interface UpdateOrderData {
  status?: 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled';
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
  notes?: string;
}

export const adminOrdersAPI = {
  getOrders: async (params: GetAdminOrdersParams = {}): Promise<PaginatedResponse<Order>> => {
    const response = await apiClient.get<PaginatedResponse<Order>>('/admin/orders', { params });
    return response.data;
  },

  getOrder: async (id: number): Promise<Order> => {
    const response = await apiClient.get<Order>(`/admin/orders/${id}`);
    return response.data;
  },

  updateOrder: async (id: number, data: UpdateOrderData): Promise<Order> => {
    const response = await apiClient.put<Order>(`/admin/orders/${id}`, data);
    return response.data;
  },
};

// Admin Dashboard API
export interface GetRecentActivityParams {
  limit?: number;
}

export interface GetSalesAnalyticsParams {
  days?: number;
}

export const adminDashboardAPI = {
  /**
   * Get public statistics (no auth required)
   * Perfect for displaying stats on homepage or public dashboards
   */
  getPublicStats: async (): Promise<PublicStats> => {
    const response = await apiClient.get<PublicStats>('/admin/dashboard/public-stats');
    return response.data;
  },

  /**
   * Get comprehensive dashboard statistics (admin only)
   * Includes recent orders, top products, and monthly revenue
   */
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get<DashboardStats>('/admin/dashboard/stats');
    return response.data;
  },

  /**
   * Get detailed user statistics (admin only)
   */
  getUserStats: async (): Promise<UserStats> => {
    const response = await apiClient.get<UserStats>('/admin/dashboard/user-stats');
    return response.data;
  },

  /**
   * Get detailed product statistics (admin only)
   */
  getProductStats: async (): Promise<ProductStats> => {
    const response = await apiClient.get<ProductStats>('/admin/dashboard/product-stats');
    return response.data;
  },

  /**
   * Get detailed order statistics (admin only)
   */
  getOrderStats: async (): Promise<OrderStats> => {
    const response = await apiClient.get<OrderStats>('/admin/dashboard/order-stats');
    return response.data;
  },

  /**
   * Get recent activity including orders, users, and reviews (admin only)
   * @param params.limit - Number of activities to return (default: 10, max: 50)
   */
  getRecentActivity: async (params: GetRecentActivityParams = {}): Promise<RecentActivity[]> => {
    const response = await apiClient.get<RecentActivity[]>('/admin/dashboard/recent-activity', { params });
    return response.data;
  },

  /**
   * Get sales analytics for a specified period (admin only)
   * @param params.days - Number of days to analyze (default: 30, min: 7, max: 365)
   */
  getSalesAnalytics: async (params: GetSalesAnalyticsParams = {}): Promise<SalesAnalytics> => {
    const response = await apiClient.get<SalesAnalytics>('/admin/dashboard/sales-analytics', { params });
    return response.data;
  },
};

