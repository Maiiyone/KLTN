'use client';

import { MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { ChatWindow } from './ChatWindow';

export function FloatingChatButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 md:w-16 md:h-16 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-full shadow-2xl hover:shadow-green-500/50 flex items-center justify-center z-40 transition-all duration-300 hover:scale-110 active:scale-95"
        aria-label="Mở chatbot"
      >
        <MessageCircle className="w-6 h-6 md:w-7 md:h-7" />
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
        )}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Chat Window - Desktop: Floating, Mobile: Full screen */}
      <div className="md:block hidden">
        <ChatWindow isOpen={isOpen} onClose={() => setIsOpen(false)} />
      </div>
      
      {/* Mobile: Full screen overlay */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <ChatWindow isOpen={isOpen} onClose={() => setIsOpen(false)} fullPage={true} />
        </div>
      )}
    </>
  );
}

