import { apiClient } from '../api-client';
import { Review, PaginatedResponse } from '../types';

export interface CreateReviewData {
  product_id: number;
  rating: number;
  comment?: string;
}

export interface GetReviewsParams {
  page?: number;
  limit?: number;
}

export const reviewsAPI = {
  createReview: async (data: CreateReviewData): Promise<{ message: string; review_id: number }> => {
    const response = await apiClient.post<{ message: string; review_id: number }>('/reviews', data);
    return response.data;
  },

  getProductReviews: async (productId: number, params: GetReviewsParams = {}): Promise<PaginatedResponse<Review>> => {
    const response = await apiClient.get<PaginatedResponse<Review>>(`/reviews/products/${productId}`, { params });
    return response.data;
  },

  getMyReviews: async (params: GetReviewsParams = {}): Promise<PaginatedResponse<Review>> => {
    const response = await apiClient.get<PaginatedResponse<Review>>('/reviews/my-reviews', { params });
    return response.data;
  },
};

