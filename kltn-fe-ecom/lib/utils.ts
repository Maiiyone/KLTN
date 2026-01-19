import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price);
}

export function formatDate(date: string): string {
  if (!date) return '';
  // Nếu date string k có múi giờ (Z hoặc +...), coi nó là UTC
  const d = new Date(date.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(date) ? date : `${date}Z`);

  return d.toLocaleDateString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatShortDate(date: string): string {
  if (!date) return '';
  const d = new Date(date.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(date) ? date : `${date}Z`);

  return d.toLocaleDateString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

