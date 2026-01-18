import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    default: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300',
    success: 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300',
    warning: 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-300',
    danger: 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300',
    info: 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

