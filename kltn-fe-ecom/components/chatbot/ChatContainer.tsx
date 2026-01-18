'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { FloatingChatButton } from './FloatingChatButton';

export function ChatContainer() {
  const pathname = usePathname();
  const { isAuthenticated, isLoading, initialize } = useAuthStore();

  // Initialize auth on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Don't show chatbot on admin pages or auth pages
  const shouldHide = pathname?.startsWith('/admin') || pathname?.startsWith('/auth');

  // Only show if authenticated (wait for auth to load first)
  if (shouldHide || isLoading || !isAuthenticated) return null;

  return <FloatingChatButton />;
}

