'use client';

import { useEffect, useState, useRef } from 'react';
import { X, Bot, RotateCcw } from 'lucide-react';
import { ChatMessage, ChatbotProduct, ChatbotOrder, ChatbotProfile } from '@/lib/types';
import { chatbotAPI, getChatSession, setChatSession, saveChatMessages, loadChatMessages, clearChatSession } from '@/lib/api/chatbot';
import { useAuthStore } from '@/lib/store/auth-store';
import { useCartStore } from '@/lib/store/cart-store';
import { useToast } from '@/components/ui/Toast';
import { ChatMessage as ChatMessageComponent } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { TypingIndicator } from './TypingIndicator';
import { ChatProductCard } from './ProductCard';
import { ChatOrderCard } from './OrderCard';
import { QuickActions } from './QuickActions';
import { Alert } from '@/components/ui/Alert';

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  fullPage?: boolean;
}

export function ChatWindow({ isOpen, onClose, fullPage = false }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated } = useAuthStore();
  const { addItem } = useCartStore();
  const toast = useToast();

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Initialize session
  useEffect(() => {
    if (!isOpen) return;

    const initSession = async () => {
      try {
        setIsInitializing(true);
        setError(null);

        // Try to get existing session
        let existingSessionId = getChatSession();

        if (!existingSessionId) {
          // Create new session
          const session = await chatbotAPI.createSession(
            isAuthenticated ? user?.id : undefined
          );
          existingSessionId = session.session_id;
          setChatSession(existingSessionId);
        }

        setSessionId(existingSessionId);

        // Load saved messages
        const savedMessages = loadChatMessages();
        if (savedMessages.length > 0) {
          setMessages(savedMessages);
        } else {
          // Welcome message
          const welcomeMessage: ChatMessage = {
            id: 'welcome',
            type: 'bot',
            content: 'Xin chào! Tôi là chatbot của Nông Sản Xanh. Tôi có thể giúp bạn:\n\n• Tìm kiếm sản phẩm\n• Xem đơn hàng\n• Tư vấn mua sắm\n• Hỗ trợ thanh toán\n\nBạn cần hỗ trợ gì hôm nay?',
            timestamp: new Date().toISOString(),
          };
          setMessages([welcomeMessage]);
          saveChatMessages([welcomeMessage]);
        }

        setIsInitializing(false);
      } catch (err: any) {
        console.error('Failed to initialize chat session:', err);
        setError('Không thể kết nối với chatbot. Vui lòng thử lại sau.');
        setIsInitializing(false);
      }
    };

    initSession();
  }, [isOpen, isAuthenticated, user?.id]);

  const handleSend = async (messageText: string) => {
    if (!sessionId || isTyping) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    saveChatMessages(updatedMessages);
    setIsTyping(true);
    setError(null);

    try {
      // Send to API
      const response = await chatbotAPI.sendMessage(
        sessionId,
        messageText,
        isAuthenticated ? user?.id : undefined
      );

      // Create bot response message
      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        type: 'bot',
        content: response.reply || 'Xin lỗi, tôi không hiểu câu hỏi của bạn.',
        timestamp: new Date().toISOString(),
      };

      // Handle context from API
      const context = response.context || {};

      // Add products if available
      if (context.products && context.products.length > 0) {
        botMessage.products = context.products;
        botMessage.messageType = 'product';
        // If only products, adjust content
        if (context.products.length > 0 && !response.reply) {
          botMessage.content = `Tôi tìm thấy ${context.products.length} sản phẩm cho bạn:`;
        }
      }

      // Add orders if available
      if (context.orders && context.orders.length > 0) {
        botMessage.orders = context.orders;
        botMessage.messageType = 'order';
        // If only orders, adjust content
        if (context.orders.length > 0 && !response.reply) {
          botMessage.content = `Bạn có ${context.orders.length} đơn hàng:`;
        }
      }

      // Add profile if available
      if (context.profile) {
        botMessage.profile = context.profile;
        botMessage.content = 'Thông tin hồ sơ của bạn:';
        console.log(context.profile)
        console.log(botMessage.content, botMessage.profile)
      }


      const finalMessages = [...updatedMessages, botMessage];
      setMessages(finalMessages);
      saveChatMessages(finalMessages);
    } catch (err: any) {
      console.error('Failed to send message:', err);

      let errorContent = 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.';

      // More specific error messages
      if (err.response?.status === 401) {
        errorContent = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      } else if (err.response?.status === 429) {
        errorContent = 'Bạn đã gửi quá nhiều tin nhắn. Vui lòng đợi một chút rồi thử lại.';
      } else if (err.response?.status >= 500) {
        errorContent = 'Server đang gặp sự cố. Vui lòng thử lại sau.';
      } else if (!err.response) {
        errorContent = 'Không thể kết nối với server. Vui lòng kiểm tra kết nối internet.';
      }

      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        type: 'bot',
        content: errorContent,
        timestamp: new Date().toISOString(),
      };
      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);
      saveChatMessages(finalMessages);
      setError(errorContent);
    } finally {
      setIsTyping(false);
    }
  };

  const handleReset = async () => {
    try {
      setIsInitializing(true);
      setError(null);

      // Clear current session and messages
      clearChatSession();
      setMessages([]);
      setSessionId(null);

      // Create new session
      const session = await chatbotAPI.createSession(
        isAuthenticated ? user?.id : undefined
      );
      setSessionId(session.session_id);
      setChatSession(session.session_id);

      // Show welcome message
      const welcomeMessage: ChatMessage = {
        id: `welcome-${Date.now()}`,
        type: 'bot',
        content: 'Xin chào! Tôi là chatbot của Nông Sản Xanh. Tôi có thể giúp bạn:\n\n• Tìm kiếm sản phẩm\n• Xem đơn hàng\n• Tư vấn mua sắm\n• Hỗ trợ thanh toán\n\nBạn cần hỗ trợ gì hôm nay?',
        timestamp: new Date().toISOString(),
      };
      setMessages([welcomeMessage]);
      saveChatMessages([welcomeMessage]);

      setIsInitializing(false);
      toast.success('Đã bắt đầu cuộc trò chuyện mới', '', 2000);
    } catch (err: any) {
      console.error('Failed to reset chat:', err);
      setError('Không thể tạo cuộc trò chuyện mới. Vui lòng thử lại.');
      setIsInitializing(false);
    }
  };

  const handleAddToCart = async (product: ChatbotProduct) => {
    // Convert ChatbotProduct to Product format for cart
    // Note: ChatbotProduct may not have all fields, so we need to handle gracefully
    if (!product.product_id) {
      toast.error('Không thể thêm sản phẩm này vào giỏ hàng', 'Thiếu thông tin sản phẩm. Vui lòng xem chi tiết sản phẩm để thêm vào giỏ.');
      return;
    }

    const productId = parseInt(product.product_id);
    if (isNaN(productId) || productId <= 0) {
      toast.error('Không thể thêm sản phẩm này vào giỏ hàng', 'ID sản phẩm không hợp lệ');
      return;
    }

    // Use available data to create product for cart
    // If we have product_id, we can fetch full details, but for now use available data
    const productForCart: any = {
      id: productId,
      product_name: product.product_name,
      current_price: product.price,
      unit: product.unit || 'cái',
      image_url: product.image_url || undefined,
      product_code: product.product_code || undefined,
      image_alt: product.product_name,
    };

    try {
      addItem(productForCart, 1);
      toast.success(
        'Đã thêm vào giỏ hàng!',
        `1 ${product.unit || 'cái'} ${product.product_name}`,
        3000
      );
    } catch (err) {
      toast.error('Không thể thêm vào giỏ hàng', 'Vui lòng thử lại sau');
    }
  };

  const getQuickActions = (): Array<{ label: string; action: () => void }> => {
    const actions = [];
    const lastMessage = messages[messages.length - 1];

    // Context-aware suggestions based on last bot message
    if (lastMessage?.type === 'bot') {
      // If bot showed products
      if (lastMessage.products && lastMessage.products.length > 0) {
        actions.push({
          label: 'Tìm sản phẩm khác',
          action: () => handleSend('Tôi muốn tìm sản phẩm khác'),
        });
        actions.push({
          label: 'Sản phẩm giá rẻ',
          action: () => handleSend('Tôi muốn xem sản phẩm giá rẻ'),
        });
      }

      // If bot showed orders
      if (lastMessage.orders && lastMessage.orders.length > 0) {
        actions.push({
          label: 'Theo dõi đơn hàng',
          action: () => handleSend('Tôi muốn theo dõi đơn hàng'),
        });
      }
    }

    // Always show common FAQ actions if no context-specific ones
    if (actions.length === 0) {
      // Nutrition advice FAQ
      actions.push({
        label: '🥗 Tư vấn dinh dưỡng',
        action: () => handleSend('Tư vấn thực phẩm tốt cho sức khỏe'),
      });

      actions.push({
        label: '🥬 Vitamin trong rau củ',
        action: () => handleSend('Vitamin C có trong những loại rau củ nào?'),
      });

      actions.push({
        label: '🍖 Gợi ý món ăn',
        action: () => handleSend('Gợi ý món ăn từ thịt bò'),
      });

      // Product search
      actions.push({
        label: '🛒 Tìm sản phẩm',
        action: () => handleSend('Tôi muốn xem sản phẩm mới'),
      });

      if (isAuthenticated) {
        actions.push({
          label: '📦 Đơn hàng của tôi',
          action: () => handleSend('Xem đơn hàng của tôi'),
        });
      }
    }

    return actions;
  };

  if (!isOpen) return null;

  const containerClass = fullPage
    ? 'fixed inset-0 z-50 bg-white flex flex-col'
    : 'fixed bottom-20 right-4 w-full max-w-md h-[600px] bg-white rounded-2xl shadow-2xl z-50 flex flex-col';

  return (
    <div className={containerClass}>
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-6 h-6" />
          <h3 className="font-extrabold text-lg">Chat với AI</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            disabled={isInitializing || isTyping}
            className="p-1.5 hover:bg-green-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Bắt đầu cuộc trò chuyện mới"
            aria-label="Reset conversation"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          {!fullPage && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-green-800 rounded-lg transition-colors"
              aria-label="Đóng chatbot"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {isInitializing ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Đang kết nối...</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div key={message.id}>
                {message.type === 'bot' && message.products && message.products.length > 0 ? (
                  <div className="mb-4">
                    <ChatMessageComponent message={message} />
                    <div className="mt-2 space-y-2">
                      {message.products.map((product, index) => (
                        <ChatProductCard
                          key={product.product_id || `product-${index}`}
                          product={product}
                          onAddToCart={handleAddToCart}
                        />
                      ))}
                    </div>
                  </div>
                ) : message.type === 'bot' && message.orders && message.orders.length > 0 ? (
                  <div className="mb-4">
                    <ChatMessageComponent message={message} />
                    <div className="mt-2 space-y-2">
                      {message.orders.map((order, index) => (
                        <ChatOrderCard key={order.order_number || `order-${index}`} order={order} />
                      ))}
                    </div>
                  </div>
                )
                  : message.type === 'bot' && message.profile ? (
                    <div className="mb-4">
                      <ChatMessageComponent message={message} />
                      <div className="mt-2 space-y-2 card card-md">
                        <div className='text-md font-bold my-2 ml-2 shadow-sm'>
                          {message?.profile && message.profile.email}
                        </div>
                        <div className='text-md font-bold my-2 ml-2 shadow-sm'>
                          {message?.profile && message.profile.full_name}
                        </div>
                        <div className='text-md font-bold my-2 ml-2 shadow-sm'>
                          {message?.profile && message.profile.phone}
                        </div>
                      </div>
                    </div>
                  )
                    : (
                      <ChatMessageComponent message={message} />
                    )}
              </div>
            ))}

            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="px-4">
          <Alert variant="error" className="mb-2">
            {error}
          </Alert>
        </div>
      )}

      {/* Quick Actions */}
      {!isInitializing && !isTyping && messages.length > 0 && (
        <QuickActions actions={getQuickActions()} />
      )}

      {/* Input */}
      {!isInitializing && (
        <ChatInput onSend={handleSend} disabled={isTyping || !sessionId} />
      )}
    </div>
  );
}

