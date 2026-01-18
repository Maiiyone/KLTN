'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { MainLayout } from '@/components/layouts/MainLayout';
import { ChatWindow } from '@/components/chatbot/ChatWindow';
import { Button } from '@/components/ui/Button';

export default function ChatbotPage() {
  const router = useRouter();
  const [isOpen] = useState(true);

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-4">
        <Button
          variant="ghost"
          onClick={() => router.push('/')}
          className="mb-4 hover:bg-green-50"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Về trang chủ
        </Button>
      </div>
      <ChatWindow isOpen={isOpen} onClose={() => router.push('/')} fullPage={true} />
    </MainLayout>
  );
}

