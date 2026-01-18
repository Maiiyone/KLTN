'use client';

import { useEffect, useState } from 'react';
import { 
  Users, Package, ShoppingBag, DollarSign, AlertCircle, TrendingUp, 
  Star, UserPlus, CheckCircle, XCircle, Clock, UserCheck, 
  PackageX, TrendingDown, Calendar, Activity
} from 'lucide-react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import { Alert } from '@/components/ui/Alert';
import { adminDashboardAPI } from '@/lib/api/admin';
import { 
  DashboardStats, 
  RecentActivity, 
  UserStats, 
  ProductStats, 
  OrderStats,
  SalesAnalytics 
} from '@/lib/types';
import { formatPrice, formatShortDate } from '@/lib/utils';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [productStats, setProductStats] = useState<ProductStats | null>(null);
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
  const [salesAnalytics, setSalesAnalytics] = useState<SalesAnalytics | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      // Gọi tất cả API theo document
      const [
        dashboardData,
        userData,
        productData,
        orderData,
        activityData,
        salesData
      ] = await Promise.all([
        adminDashboardAPI.getDashboardStats(),
        adminDashboardAPI.getUserStats(),
        adminDashboardAPI.getProductStats(),
        adminDashboardAPI.getOrderStats(),
        adminDashboardAPI.getRecentActivity({ limit: 10 }),
        adminDashboardAPI.getSalesAnalytics({ days: 30 })
      ]);

      setStats(dashboardData);
      setUserStats(userData);
      setProductStats(productData);
      setOrderStats(orderData);
      setRecentActivity(activityData);
      setSalesAnalytics(salesData);
    } catch (err) {
      setError('Không thể tải thống kê dashboard.');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <AdminLayout><Loading /></AdminLayout>;
  if (error || !stats) {
    return (
      <AdminLayout>
        <Alert variant="error">{error || 'Không thể tải dữ liệu'}</Alert>
      </AdminLayout>
    );
  }

  const statCards = [
    {
      title: 'Tổng người dùng',
      value: stats.total_users.toLocaleString(),
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: 'Tổng sản phẩm',
      value: stats.total_products.toLocaleString(),
      icon: Package,
      color: 'bg-green-500',
    },
    {
      title: 'Tổng đơn hàng',
      value: stats.total_orders.toLocaleString(),
      icon: ShoppingBag,
      color: 'bg-purple-500',
    },
    {
      title: 'Tổng doanh thu',
      value: formatPrice(stats.total_revenue),
      icon: DollarSign,
      color: 'bg-yellow-500',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Tổng quan hệ thống và thống kê</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            {salesAnalytics && (
              <span>
                {salesAnalytics.start_date} - {salesAnalytics.end_date} (30 ngày)
              </span>
            )}
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1 font-medium">{stat.title}</p>
                      <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <div className={`${stat.color} p-4 rounded-2xl shadow-lg`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* User Statistics */}
        {userStats && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-bold">Thống kê người dùng</h2>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <p className="text-sm font-medium text-blue-900">Tổng người dùng</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">
                    {userStats.total_users.toLocaleString()}
                  </p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                  <div className="flex items-center gap-2 mb-2">
                    <UserCheck className="w-4 h-4 text-green-600" />
                    <p className="text-sm font-medium text-green-900">Đang hoạt động</p>
                  </div>
                  <p className="text-2xl font-bold text-green-900">
                    {userStats.active_users.toLocaleString()}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                  <div className="flex items-center gap-2 mb-2">
                    <UserPlus className="w-4 h-4 text-purple-600" />
                    <p className="text-sm font-medium text-purple-900">Mới tháng này</p>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">
                    {userStats.new_users_this_month.toLocaleString()}
                  </p>
                </div>
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-orange-600" />
                    <p className="text-sm font-medium text-orange-900">Phân loại</p>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="default">👤 {userStats.users_by_role.customer}</Badge>
                    <Badge variant="danger">👑 {userStats.users_by_role.admin}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Product Statistics */}
        {productStats && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-green-600" />
                <h2 className="text-xl font-bold">Thống kê sản phẩm</h2>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4 text-green-600" />
                    <p className="text-sm font-medium text-green-900">Tổng sản phẩm</p>
                  </div>
                  <p className="text-2xl font-bold text-green-900">
                    {productStats.total_products.toLocaleString()}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    <p className="text-sm font-medium text-blue-900">Đang bán</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">
                    {productStats.active_products.toLocaleString()}
                  </p>
                </div>
                <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                  <div className="flex items-center gap-2 mb-2">
                    <PackageX className="w-4 h-4 text-red-600" />
                    <p className="text-sm font-medium text-red-900">Hết hàng</p>
                  </div>
                  <p className="text-2xl font-bold text-red-900">
                    {productStats.out_of_stock.toLocaleString()}
                  </p>
                </div>
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                    <p className="text-sm font-medium text-orange-900">Sắp hết</p>
                  </div>
                  <p className="text-2xl font-bold text-orange-900">
                    {productStats.low_stock.toLocaleString()}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    <p className="text-sm font-medium text-purple-900">Danh mục</p>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">
                    {productStats.total_categories.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order Statistics */}
        {orderStats && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-purple-600" />
                <h2 className="text-xl font-bold">Thống kê đơn hàng</h2>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left column - Order counts */}
                <div className="space-y-3">
                  <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                    <div className="flex items-center gap-2 mb-2">
                      <ShoppingBag className="w-4 h-4 text-purple-600" />
                      <p className="text-sm font-medium text-purple-900">Tổng đơn hàng</p>
                    </div>
                    <p className="text-2xl font-bold text-purple-900">
                      {orderStats.total_orders.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-orange-600" />
                      <p className="text-sm font-medium text-orange-900">Chờ xử lý</p>
                    </div>
                    <p className="text-2xl font-bold text-orange-900">
                      {orderStats.pending_orders.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Middle column - Status */}
                <div className="space-y-3">
                  <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <p className="text-sm font-medium text-green-900">Hoàn thành</p>
                    </div>
                    <p className="text-2xl font-bold text-green-900">
                      {orderStats.completed_orders.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="w-4 h-4 text-red-600" />
                      <p className="text-sm font-medium text-red-900">Đã hủy</p>
                    </div>
                    <p className="text-2xl font-bold text-red-900">
                      {orderStats.cancelled_orders.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Right column - Revenue */}
                <div className="space-y-3">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border-2 border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <p className="text-sm font-medium text-green-900">Tổng doanh thu</p>
                    </div>
                    <p className="text-2xl font-bold text-green-900">
                      {formatPrice(orderStats.total_revenue)}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border-2 border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      <p className="text-sm font-medium text-blue-900">Giá trị TB</p>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">
                      {formatPrice(orderStats.average_order_value)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Alerts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <AlertCircle className="w-6 h-6 text-orange-500" />
                    <h3 className="font-bold text-lg">Đơn hàng chờ xử lý</h3>
                  </div>
                  <p className="text-4xl font-bold text-orange-500">
                    {stats.pending_orders}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">Cần xử lý ngay</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Package className="w-6 h-6 text-red-500" />
                    <h3 className="font-bold text-lg">Sản phẩm sắp hết hàng</h3>
                  </div>
                  <p className="text-4xl font-bold text-red-500">
                    {stats.low_stock_products}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">Cần nhập thêm hàng</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold">Đơn hàng gần đây</h2>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Mã đơn
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Khách hàng
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Tổng tiền
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Trạng thái
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Ngày đặt
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {stats.recent_orders.slice(0, 10).map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        <span className="font-medium">{order.order_number}</span>
                      </td>
                      <td className="px-4 py-3 text-sm">{order.username || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm font-medium text-green-600">
                        {formatPrice(order.total_amount)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Badge
                          variant={
                            order.status === 'delivered'
                              ? 'success'
                              : order.status === 'cancelled'
                              ? 'danger'
                              : 'warning'
                          }
                        >
                          {order.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatShortDate(order.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold">Sản phẩm bán chạy</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.top_products.slice(0, 5).map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{product.product_name}</p>
                      <p className="text-sm text-gray-600">
                        Đã bán: {product.total_sold.toLocaleString()} sản phẩm
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      {formatPrice(product.total_revenue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sales Analytics - 30 days */}
        {salesAnalytics && salesAnalytics.daily_sales.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <h2 className="text-xl font-bold">Phân tích doanh thu 30 ngày</h2>
                </div>
                <Badge variant="success">
                  {salesAnalytics.period_days} ngày
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border-2 border-green-200">
                  <p className="text-sm font-medium text-green-900 mb-1">Tổng doanh thu</p>
                  <p className="text-2xl font-bold text-green-900">
                    {formatPrice(
                      salesAnalytics.daily_sales.reduce((sum, day) => sum + day.revenue, 0)
                    )}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border-2 border-blue-200">
                  <p className="text-sm font-medium text-blue-900 mb-1">Tổng đơn hàng</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {salesAnalytics.daily_sales.reduce((sum, day) => sum + day.orders, 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border-2 border-purple-200">
                  <p className="text-sm font-medium text-purple-900 mb-1">TB/ngày</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {formatPrice(
                      salesAnalytics.daily_sales.reduce((sum, day) => sum + day.revenue, 0) / 
                      salesAnalytics.period_days
                    )}
                  </p>
                </div>
              </div>

              {/* Top Products from Sales Analytics */}
              {salesAnalytics.top_products && salesAnalytics.top_products.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold mb-3">Top sản phẩm trong {salesAnalytics.period_days} ngày</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {salesAnalytics.top_products.slice(0, 4).map((product, index) => (
                      <div
                        key={product.id}
                        className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-white rounded-xl border border-green-100 hover:shadow-md transition-all"
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-md">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">
                            {product.product_name}
                          </p>
                          <p className="text-xs text-gray-600">
                            {product.total_sold.toLocaleString()} sản phẩm
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600 text-sm">
                            {formatPrice(product.total_revenue)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Daily Sales Table */}
              <div>
                <h3 className="text-lg font-bold mb-3">Doanh thu theo ngày (10 ngày gần nhất)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100 border-b-2 border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">Ngày</th>
                        <th className="px-4 py-3 text-right text-sm font-bold text-gray-900">Đơn hàng</th>
                        <th className="px-4 py-3 text-right text-sm font-bold text-gray-900">Doanh thu</th>
                        <th className="px-4 py-3 text-center text-sm font-bold text-gray-900">Xu hướng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {salesAnalytics.daily_sales.slice(0, 10).map((day, index) => {
                        const prevDay = index > 0 ? salesAnalytics.daily_sales[index - 1] : null;
                        const trend = prevDay 
                          ? (day.revenue > prevDay.revenue ? 'up' : day.revenue < prevDay.revenue ? 'down' : 'same')
                          : 'same';
                        
                        return (
                          <tr key={day.date} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {formatShortDate(day.date)}
                            </td>
                            <td className="px-4 py-3 text-sm font-bold text-right text-purple-600">
                              {day.orders.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-sm font-bold text-right text-green-600">
                              {formatPrice(day.revenue)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {trend === 'up' && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-700">
                                  <TrendingUp className="w-3 h-3" />
                                </span>
                              )}
                              {trend === 'down' && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full bg-red-100 text-red-700">
                                  <TrendingDown className="w-3 h-3" />
                                </span>
                              )}
                              {trend === 'same' && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                                  <span className="text-xs">─</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Monthly Revenue & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Revenue */}
          {stats.monthly_revenue && stats.monthly_revenue.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold">Doanh thu theo tháng</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.monthly_revenue.map((item) => (
                    <div
                      key={item.month}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded"
                    >
                      <span className="font-medium">{item.month}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-gray-600">{item.orders} đơn</span>
                        <span className="font-bold text-green-600">
                          {formatPrice(item.revenue)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Activity */}
          {recentActivity.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold">Hoạt động gần đây</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.map((activity) => {
                    const getIcon = () => {
                      switch (activity.type) {
                        case 'order':
                          return <ShoppingBag className="w-4 h-4 text-purple-600" />;
                        case 'review':
                          return <Star className="w-4 h-4 text-yellow-600" />;
                        case 'user':
                          return <UserPlus className="w-4 h-4 text-blue-600" />;
                        default:
                          return <AlertCircle className="w-4 h-4 text-gray-600" />;
                      }
                    };

                    const getColor = () => {
                      switch (activity.type) {
                        case 'order':
                          return 'bg-purple-50 border-purple-200';
                        case 'review':
                          return 'bg-yellow-50 border-yellow-200';
                        case 'user':
                          return 'bg-blue-50 border-blue-200';
                        default:
                          return 'bg-gray-50 border-gray-200';
                      }
                    };

                    return (
                      <div
                        key={`${activity.type}-${activity.id}`}
                        className={`flex items-start gap-3 p-3 rounded-lg border ${getColor()} transition-all hover:shadow-md`}
                      >
                        <div className="mt-0.5">{getIcon()}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {activity.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-gray-600">
                              {formatShortDate(activity.created_at)}
                            </p>
                            {activity.amount && (
                              <span className="text-xs font-semibold text-green-600">
                                {formatPrice(activity.amount)}
                              </span>
                            )}
                            {activity.rating && (
                              <span className="text-xs font-semibold text-yellow-600">
                                ⭐ {activity.rating}/5
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

