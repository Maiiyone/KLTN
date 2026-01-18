import axios, { AxiosError } from 'axios';
import { ChatSession, ChatResponse } from '../types';

// Chatbot service runs on port 8001
const CHATBOT_BASE_URL = process.env.NEXT_PUBLIC_CHATBOT_URL || 'http://localhost:8001/api/v1';

// Create separate axios instance for chatbot service
const chatbotClient = axios.create({
  baseURL: CHATBOT_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token (same as main apiClient)
chatbotClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - don't redirect on 401 for chatbot
chatbotClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Let chatbot handle errors, don't auto-redirect
    return Promise.reject(error);
  }
);

class ChatbotService {
  /**
   * Create a new chat session
   * @param userId Optional user ID if authenticated
   */
  async createSession(userId?: number): Promise<ChatSession> {
    const response = await chatbotClient.post<ChatSession>(
      '/chatbot/session',
      userId ? { user_id: userId } : {},
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  }

  /**
   * Send a message to the chatbot
   * @param sessionId Chat session ID
   * @param message User message
   * @param userId Optional user ID if authenticated
   */
  async sendMessage(
    sessionId: string,
    message: string,
    userId?: number
  ): Promise<ChatResponse> {
    const payload: any = {
      session_id: sessionId,
      message,
    };

    if (userId) {
      payload.user_id = userId;
    }

    const response = await chatbotClient.post<ChatResponse>(
      '/chatbot/message',
      payload,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  }
}

export const chatbotAPI = new ChatbotService();

// Session management helpers
export const getChatSession = (): string | null => {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('chatbot_session_id');
  }
  return null;
};

export const setChatSession = (sessionId: string): void => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('chatbot_session_id', sessionId);
  }
};

export const clearChatSession = (): void => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('chatbot_session_id');
    sessionStorage.removeItem('chatbot_messages');
  }
};

export const saveChatMessages = (messages: any[]): void => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('chatbot_messages', JSON.stringify(messages));
  }
};

export const loadChatMessages = (): any[] => {
  if (typeof window !== 'undefined') {
    const stored = sessionStorage.getItem('chatbot_messages');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return [];
      }
    }
  }
  return [];
};

