import { apiClient } from '../api-client';
import { Order } from '../types';

export interface CreateOrderData {
  shipping_address: string;
  customer_phone: string; // REQUIRED
  customer_email?: string; // Optional
  customer_name?: string; // Optional
  notes?: string;
  items: {
    product_id: number;
    quantity: number;
  }[];
}

export interface GetOrdersParams {
  page?: number;
  limit?: number;
}

export const ordersAPI = {
  createOrder: async (data: CreateOrderData): Promise<Order> => {
    const response = await apiClient.post<Order>('/orders', data);
    return response.data;
  },

  getOrders: async (params: GetOrdersParams = {}): Promise<Order[]> => {
    const response = await apiClient.get<Order[]>('/orders', { params });
    return response.data;
  },

  getOrder: async (id: number): Promise<Order> => {
    const response = await apiClient.get<Order>(`/orders/${id}`);
    return response.data;
  },
};

