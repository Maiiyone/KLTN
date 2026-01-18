import { apiClient } from '../api-client';
import { Product } from '../types';

export interface GetProductsParams {
  page?: number;
  limit?: number;
  search?: string;
}

export const productsAPI = {
  getProducts: async (params: GetProductsParams = {}): Promise<Product[]> => {
    const response = await apiClient.get<Product[]>('/products', { params });
    return response.data;
  },

  getProduct: async (id: number): Promise<Product> => {
    const response = await apiClient.get<Product>(`/products/${id}`);
    return response.data;
  },
};

