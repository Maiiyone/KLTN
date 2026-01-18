'use client';

import { useState, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled = false, placeholder = 'Nhập tin nhắn...' }: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled) {
      onSend(trimmedMessage);
      setMessage('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-200 p-4 bg-white">
      <div className="flex items-end gap-2">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none rounded-lg border-2 border-gray-300 bg-gray-50 text-gray-900 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-gray-500"
          style={{ minHeight: '44px', maxHeight: '120px' }}
        />
        <Button
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          size="md"
          className="flex-shrink-0"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>
      <p className="text-xs text-gray-500 mt-1 text-right">
        Nhấn Enter để gửi, Shift+Enter để xuống dòng
      </p>
    </div>
  );
}

