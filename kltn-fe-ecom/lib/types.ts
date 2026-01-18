// API Response Types based on API Documentation

export interface User {
  id: number;
  email: string;
  username: string;
  full_name?: string;
  phone?: string;
  address?: string;
  role: 'customer' | 'admin';
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  total_orders?: number;
  total_spent?: number;
}

export interface Product {
  id: number;
  product_code: string;
  product_id: string;
  title: string;
  product_name: string;
  current_price: number;
  current_price_text: string;
  unit: string;
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
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  average_rating?: number;
  review_count?: number;
  total_sold?: number;
}

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  product?: Product | null;   
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Order {
  id: number;
  user_id?: number;
  username?: string;
  user_email?: string;
  order_number: string;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  shipping_address: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
}

export interface Review {
  id: number;
  user_id: number;
  username: string;
  product_id: number;
  rating: number;
  comment?: string;
  is_verified_purchase: boolean;
  created_at: string;
}

export interface PaginatedResponse<T> {
  items?: T[];
  reviews?: T[];
  total: number;
  page: number;
  limit: number;
  pages?: number;
  has_next?: boolean;
  has_prev?: boolean;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

// Public Dashboard Stats (no auth required)
export interface PublicStats {
  total_users: number;
  total_products: number;
  total_orders: number;
  total_revenue: number;
}

// Comprehensive Dashboard Stats (admin only)
export interface DashboardStats {
  total_users: number;
  total_products: number;
  total_orders: number;
  total_revenue: number;
  pending_orders: number;
  low_stock_products: number;
  recent_orders: {
    id: number;
    order_number: string;
    username: string;
    total_amount: number;
    status: string;
    created_at: string;
  }[];
  top_products: {
    id: number;
    product_name: string;
    total_sold: number;
    total_revenue: number;
  }[];
  monthly_revenue: {
    month: string;
    revenue: number;
    orders: number;
  }[];
}

// Recent Activity
export interface RecentActivity {
  type: 'order' | 'review' | 'user';
  id: number;
  description: string;
  created_at: string;
  // Order-specific fields
  amount?: number;
  status?: string;
  // Review-specific fields
  rating?: number;
  // User-specific fields
  email?: string;
}

export interface UserStats {
  total_users: number;
  active_users: number;
  new_users_this_month: number;
  users_by_role: {
    customer: number;
    admin: number;
  };
}

export interface ProductStats {
  total_products: number;
  active_products: number;
  out_of_stock: number;
  low_stock: number;
  total_categories: number;
}

export interface OrderStats {
  total_orders: number;
  pending_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  total_revenue: number;
  average_order_value: number;
}

export interface SalesAnalytics {
  period_days: number;
  start_date: string;
  end_date: string;
  daily_sales: {
    date: string;
    orders: number;
    revenue: number;
  }[];
  top_products: {
    id: number;
    product_name: string;
    total_sold: number;
    total_revenue: number;
  }[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

// Payment Types
export type PaymentMethod = 'momo' | 'vnpay' | 'cod';
export type PaymentStatusType = 'pending' | 'paid' | 'failed' | 'refunded';

export interface InitPaymentRequest {
  order_id: number;
  payment_method: PaymentMethod;
  return_url: string;
  cancel_url?: string;
}

export interface InitPaymentResponse {
  success: boolean;
  payment_id: number;
  payment_url?: string;
  deep_link?: string;
  qr_code_url?: string;
  message: string;
}

export interface PaymentStatus {
  payment_id: number;
  order_id: number;
  payment_method: string;
  amount: number;
  status: PaymentStatusType;
  transaction_id?: string;
  created_at: string;
  paid_at?: string;
  failed_reason?: string;
  refund_amount?: number;
  refund_reason?: string;
  refunded_at?: string;
}

export interface PaymentHistoryItem {
  payment_id: number;
  order_id: number;
  order_number: string;
  payment_method: string;
  amount: number;
  status: PaymentStatusType;
  transaction_id?: string;
  created_at: string;
  paid_at?: string;
}

export interface PaymentHistoryResponse {
  total: number;
  page: number;
  limit: number;
  payments: PaymentHistoryItem[];
}

// Chatbot Types
export type ChatMessageType = 'text' | 'product' | 'order' | 'action';

export interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  messageType?: ChatMessageType;
  timestamp: string;
  // For product messages (from chatbot API)
  products?: ChatbotProduct[];
  // For order messages (from chatbot API)
  orders?: ChatbotOrder[];
  // For profile messages (from chatbot API)
  profile?: ChatbotProfile | null;
  // For action messages
  action?: {
    type: string;
    label: string;
    data?: any;
  };
}

export interface ChatSession {
  session_id: string;
}

// Chatbot Product (from API - may have different fields)
export interface ChatbotProduct {
  product_id?: string | null;
  product_code?: string | null;
  product_name: string;
  price: number;
  price_text?: string | null;
  unit?: string | null;
  product_url?: string | null;
  image_url?: string | null;
  discount_percent?: number | null;
  score?: number | null;
}

// Chatbot Order (from API - simplified)
export interface ChatbotOrder {
  order_number: string;
  status: 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled';
  total_amount: number;
}

// Chatbot Profile (from API)
export interface ChatbotProfile {
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
}

// Chatbot Context
export interface ChatbotContext {
  products?: ChatbotProduct[];
  orders?: ChatbotOrder[];
  profile?: ChatbotProfile | null;
}

export interface ChatResponse {
  reply: string;
  session_id: string;
  context: ChatbotContext;
}

