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
import { useAuthStore } from '@/lib/store/auth-store';
import { getErrorMessage } from '@/lib/error-handler';

const loginSchema = z.object({
  username_or_email: z.string().min(1, 'Vui lòng nhập email hoặc tên đăng nhập'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setToken } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await authAPI.login(data);
      setToken(response.access_token);

      const user = await authAPI.getCurrentUser();
      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));

      router.push('/');
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
                Đăng Nhập
              </h1>
              <p className="text-gray-600 text-center mt-3 text-base">
                Chào mừng bạn quay trở lại!
              </p>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="error" className="mb-6">
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <Input
                  label="Email hoặc Tên đăng nhập"
                  type="text"
                  placeholder="email@example.com hoặc username"
                  error={errors.username_or_email?.message}
                  {...register('username_or_email')}
                />

                <Input
                  label="Mật khẩu"
                  type="password"
                  placeholder="••••••••"
                  error={errors.password?.message}
                  {...register('password')}
                />

                <Button type="submit" className="w-full mt-6" isLoading={isLoading}>
                  Đăng nhập
                </Button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-gray-600 text-base">
                  Chưa có tài khoản?{' '}
                  <Link
                    href="/auth/register"
                    className="text-green-600 hover:text-green-700 font-semibold hover:underline transition-all"
                  >
                    Đăng ký ngay
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

