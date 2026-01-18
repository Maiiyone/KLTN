import { ReactNode } from 'react';
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlertProps {
  children: ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'error';
  onClose?: () => void;
  className?: string;
}

export function Alert({ children, variant = 'info', onClose, className }: AlertProps) {
  const variants = {
    info: {
      bg: 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-300',
      text: 'text-blue-900',
      iconBg: 'bg-blue-200',
      icon: Info,
    },
    success: {
      bg: 'bg-gradient-to-r from-green-50 to-green-100 border-green-300',
      text: 'text-green-900',
      iconBg: 'bg-green-200',
      icon: CheckCircle,
    },
    warning: {
      bg: 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300',
      text: 'text-yellow-900',
      iconBg: 'bg-yellow-200',
      icon: AlertCircle,
    },
    error: {
      bg: 'bg-gradient-to-r from-red-50 to-red-100 border-red-300',
      text: 'text-red-900',
      iconBg: 'bg-red-200',
      icon: XCircle,
    },
  };

  const { bg, text, iconBg, icon: Icon } = variants[variant];

  return (
    <div className={cn('border-2 rounded-xl p-4 shadow-sm', bg, className)}>
      <div className="flex items-start">
        <div className={cn('p-1.5 rounded-lg mr-3 flex-shrink-0', iconBg)}>
          <Icon className={cn('w-5 h-5', text)} />
        </div>
        <div className={cn('flex-1 text-sm font-medium', text)}>{children}</div>
        {onClose && (
          <button
            onClick={onClose}
            className={cn('ml-3 flex-shrink-0 p-1 rounded-lg hover:bg-white/50 transition-colors', text)}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

