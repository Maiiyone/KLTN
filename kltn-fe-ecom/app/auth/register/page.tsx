'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { authAPI } from '@/lib/api/auth';
import { getErrorMessage } from '@/lib/error-handler';

const registerSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  username: z.string().min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
  confirmPassword: z.string(),
  full_name: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu không khớp',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      const { confirmPassword, ...registerData } = data;
      await authAPI.register(registerData);

      setSuccess(true);
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-16 bg-gradient-to-br from-green-50 via-white to-green-50">
        <div className="max-w-md w-full animate-in fade-in duration-500">
          <Card>
            <CardHeader>
              <div className="text-center mb-2">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white text-3xl mb-4 shadow-lg">
                  🌾
                </div>
              </div>
              <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                Đăng Ký
              </h1>
              <p className="text-gray-600 text-center mt-3 text-base">
                Tạo tài khoản mới để bắt đầu mua sắm
              </p>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="error" className="mb-6">
                  {error}
                </Alert>
              )}

              {success && (
                <Alert variant="success" className="mb-6">
                  Đăng ký thành công! Đang chuyển đến trang đăng nhập...
                </Alert>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <Input
                  label="Email *"
                  type="email"
                  placeholder="email@example.com"
                  error={errors.email?.message}
                  {...register('email')}
                />

                <Input
                  label="Tên đăng nhập *"
                  type="text"
                  placeholder="username"
                  error={errors.username?.message}
                  {...register('username')}
                />

                <Input
                  label="Mật khẩu *"
                  type="password"
                  placeholder="••••••••"
                  error={errors.password?.message}
                  {...register('password')}
                />

                <Input
                  label="Xác nhận mật khẩu *"
                  type="password"
                  placeholder="••••••••"
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword')}
                />

                <Input
                  label="Họ và tên"
                  type="text"
                  placeholder="Nguyễn Văn A"
                  error={errors.full_name?.message}
                  {...register('full_name')}
                />

                <Input
                  label="Số điện thoại"
                  type="tel"
                  placeholder="0123456789"
                  error={errors.phone?.message}
                  {...register('phone')}
                />

                <Input
                  label="Địa chỉ"
                  type="text"
                  placeholder="123 Đường ABC, Quận XYZ, TP.HCM"
                  error={errors.address?.message}
                  {...register('address')}
                />

                <Button type="submit" className="w-full mt-6" isLoading={isLoading}>
                  Đăng ký
                </Button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-gray-600 text-base">
                  Đã có tài khoản?{' '}
                  <Link
                    href="/auth/login"
                    className="text-green-600 hover:text-green-700 font-semibold hover:underline transition-all"
                  >
                    Đăng nhập ngay
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
