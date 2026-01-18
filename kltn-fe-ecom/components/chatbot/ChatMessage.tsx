'use client';

import { Bot, User } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '@/lib/types';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.type === 'user';
  const timestamp = format(new Date(message.timestamp), 'HH:mm', { locale: vi });

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="flex items-start gap-2 max-w-[80%]">
          <div className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-2xl rounded-tr-sm px-4 py-2 shadow-md">
            <p className="text-sm font-medium whitespace-pre-wrap break-words">{message.content}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-4">
      <div className="flex items-start gap-2 max-w-[80%]">
        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
          <Bot className="w-5 h-5 text-gray-700" />
        </div>
        <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-2 shadow-sm">
          <p className="text-sm text-gray-900 whitespace-pre-wrap break-words">{message.content}</p>
          <p className="text-xs text-gray-500 mt-1">{timestamp}</p>
        </div>
      </div>
    </div>
  );
}

