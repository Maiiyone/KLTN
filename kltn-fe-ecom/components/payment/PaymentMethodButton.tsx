'use client';

import Image from 'next/image';
import { PaymentMethod } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Banknote } from 'lucide-react';

interface PaymentMethodButtonProps {
  method: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
  disabled?: boolean;
  loading?: boolean;
  selected?: boolean;
}

export function PaymentMethodButton({
  method,
  onSelect,
  disabled = false,
  loading = false,
  selected = false,
}: PaymentMethodButtonProps) {
  const methodConfig = {
    momo: {
      name: 'MoMo',
      logo: '/momo_logo.png',
      color: 'bg-pink-50',
      description: 'Ví điện tử MoMo',
      type: 'image' as const,
    },
    vnpay: {
      name: 'VNPay',
      logo: '/vnpay_logo.png',
      color: 'bg-blue-50',
      description: 'Cổng thanh toán VNPay',
      type: 'image' as const,
    },
    cod: {
      name: 'COD',
      icon: Banknote,
      color: 'bg-green-500',
      description: 'Thanh toán khi nhận hàng',
      type: 'icon' as const,
    },
  };

  const config = methodConfig[method];

  return (
    <button
      onClick={() => onSelect(method)}
      disabled={disabled || loading}
      className={`
        w-full p-4 rounded-lg border-2 transition-all
        ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        flex items-center gap-4
      `}
    >
      {config.type === 'image' ? (
        <div className="relative w-16 h-16 flex-shrink-0">
          <Image
            src={config.logo!}
            alt={config.name}
            fill
            className="object-contain"
          />
        </div>
      ) : (
        <div className={`p-3 rounded-lg flex items-center justify-center ${config.color}`}>
          <config.icon className="w-8 h-8 text-white" />
        </div>
      )}
      <div className="flex-1 text-left">
        <h3 className="font-extrabold text-xl text-gray-900">{config.name}</h3>
        <p className="text-sm text-gray-700 font-semibold">{config.description}</p>
      </div>
      {selected && (
        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
    </button>
  );
}

