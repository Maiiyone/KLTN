'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, User, LogOut, Package, Star, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import { useCartStore } from '@/lib/store/cart-store';
import { Button } from './ui/Button';

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { getTotalItems } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalItems = mounted ? getTotalItems() : 0;

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50 border-b border-gray-100">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-all">
              <span className="text-2xl">🌾</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
              Nông Sản Xanh
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className={`font-semibold transition-all relative ${
                pathname === '/' 
                  ? 'text-green-600' 
                  : 'text-gray-700 hover:text-green-600'
              }`}
            >
              Trang chủ
              {pathname === '/' && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-green-600 to-green-700 rounded-full"></span>
              )}
            </Link>
            <Link
              href="/products"
              className={`font-semibold transition-all relative ${
                pathname.startsWith('/products') 
                  ? 'text-green-600' 
                  : 'text-gray-700 hover:text-green-600'
              }`}
            >
              Sản phẩm
              {pathname.startsWith('/products') && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-green-600 to-green-700 rounded-full"></span>
              )}
            </Link>
            {mounted && isAuthenticated && (
              <>
                <Link
                  href="/orders"
                  className={`font-semibold transition-all flex items-center gap-2 relative ${
                    pathname.startsWith('/orders') 
                      ? 'text-green-600' 
                      : 'text-gray-700 hover:text-green-600'
                  }`}
                >
                  <Package className="w-5 h-5" />
                  Đơn hàng
                  {pathname.startsWith('/orders') && (
                    <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-green-600 to-green-700 rounded-full"></span>
                  )}
                </Link>
                <Link
                  href="/reviews"
                  className={`font-semibold transition-all flex items-center gap-2 relative ${
                    pathname.startsWith('/reviews') 
                      ? 'text-green-600' 
                      : 'text-gray-700 hover:text-green-600'
                  }`}
                >
                  <Star className="w-5 h-5" />
                  Đánh giá
                  {pathname.startsWith('/reviews') && (
                    <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-green-600 to-green-700 rounded-full"></span>
                  )}
                </Link>
              </>
            )}
            {mounted && user?.role === 'admin' && (
              <Link
                href="/admin"
                className={`font-semibold transition-all flex items-center gap-2 relative ${
                  pathname.startsWith('/admin') 
                    ? 'text-green-600' 
                    : 'text-gray-700 hover:text-green-600'
                }`}
              >
                <LayoutDashboard className="w-5 h-5" />
                Quản trị
                {pathname.startsWith('/admin') && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-green-600 to-green-700 rounded-full"></span>
                )}
              </Link>
            )}
          </div>

          {/* User Actions */}
          <div className="flex items-center gap-4">
            <Link
              href="/cart"
              className="relative p-2.5 text-gray-700 hover:text-green-600 transition-all hover:bg-green-50 rounded-xl"
            >
              <ShoppingCart className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg animate-pulse">
                  {totalItems}
                </span>
              )}
            </Link>

            {!mounted ? (
              <div className="flex items-center gap-2">
                <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ) : isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
                  <User className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-semibold text-gray-700">{user?.username}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Đăng xuất
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/auth/login">
                  <Button variant="outline" size="sm">
                    Đăng nhập
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm">Đăng ký</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

