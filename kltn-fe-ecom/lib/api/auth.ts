import { apiClient } from '../api-client';
import { User, LoginResponse } from '../types';

/**
 * User registration data
 */
export interface RegisterData {
  email: string;
  username: string;
  password: string;
  full_name?: string;
  phone?: string;
  address?: string;
}

/**
 * Login credentials
 * @property username_or_email - Can be either username or email address (API v1.1.0+)
 * @property password - User password
 */
export interface LoginData {
  username_or_email: string;
  password: string;
}

export const authAPI = {
  register: async (data: RegisterData): Promise<User> => {
    const response = await apiClient.post<User>('/auth/register', data);
    return response.data;
  },

  login: async (data: LoginData): Promise<LoginResponse> => {
    // Send JSON body with username_or_email (API v1.1.0+)
    // Supports both username and email login
    const response = await apiClient.post<LoginResponse>('/auth/login', {
      username_or_email: data.username_or_email,
      password: data.password,
    });
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },
};

