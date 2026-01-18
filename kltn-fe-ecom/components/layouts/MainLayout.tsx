'use client';

import { ReactNode, useEffect } from 'react';
import { Navbar } from '../Navbar';
import { Footer } from '../Footer';
import { useAuthStore } from '@/lib/store/auth-store';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

