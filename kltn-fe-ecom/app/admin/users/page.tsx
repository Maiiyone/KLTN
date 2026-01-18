'use client';

import { useEffect, useState } from 'react';
import { Search, Edit, Trash2, UserCheck, UserX } from 'lucide-react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import { Alert } from '@/components/ui/Alert';
import { Modal } from '@/components/ui/Modal';
import { adminUsersAPI, UpdateUserData } from '@/lib/api/admin';
import { User } from '@/lib/types';
import { formatDate, formatPrice } from '@/lib/utils';
import { getErrorMessage } from '@/lib/error-handler';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [page, searchTerm, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminUsersAPI.getUsers({
        page,
        limit: 20,
        search: searchTerm || undefined,
        role: roleFilter as any || undefined,
      });
      setUsers(data.items || []);
      setTotal(data.total);
    } catch (err) {
      setError('Không thể tải danh sách người dùng.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleUpdateUser = async (updates: UpdateUserData) => {
    if (!editingUser) return;

    try {
      await adminUsersAPI.updateUser(editingUser.id, updates);
      alert('Cập nhật người dùng thành công!');
      setIsModalOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      alert(getErrorMessage(err));
    }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Bạn có chắc muốn xóa người dùng ${user.username}?`)) return;

    try {
      await adminUsersAPI.deleteUser(user.id);
      alert('Xóa người dùng thành công!');
      fetchUsers();
    } catch (err: any) {
      alert(getErrorMessage(err));
    }
  };

  const toggleUserStatus = async (user: User) => {
    await handleUpdateUser({ is_active: !user.is_active });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Tìm kiếm theo tên hoặc email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
              />
              <Select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: '', label: 'Tất cả vai trò' },
                  { value: 'customer', label: 'Khách hàng' },
                  { value: 'admin', label: 'Quản trị viên' },
                ]}
              />
              <Button onClick={fetchUsers}>
                <Search className="w-4 h-4 mr-2" />
                Tìm kiếm
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">
                Danh sách người dùng ({total})
              </h2>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loading />
            ) : error ? (
              <Alert variant="error">{error}</Alert>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100 border-b-2 border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">ID</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">Tên đăng nhập</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">Email</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">Vai trò</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">Trạng thái</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">Đơn hàng</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">Chi tiêu</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">Ngày tạo</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{user.id}</td>
                          <td className="px-4 py-3 text-sm font-bold text-gray-900">{user.username}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{user.email}</td>
                          <td className="px-4 py-3 text-sm">
                            <Badge variant={user.role === 'admin' ? 'info' : 'default'}>
                              {user.role === 'admin' ? 'Admin' : 'Khách hàng'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <Badge variant={user.is_active ? 'success' : 'danger'}>
                              {user.is_active ? 'Hoạt động' : 'Vô hiệu hóa'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">{user.total_orders || 0}</td>
                          <td className="px-4 py-3 text-sm text-green-600 font-bold">
                            {user.total_spent ? formatPrice(user.total_spent) : '0đ'}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {formatDate(user.created_at).split(',')[0]}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEdit(user)}
                                className="p-1 hover:bg-gray-100 rounded"
                                title="Chỉnh sửa"
                              >
                                <Edit className="w-4 h-4 text-blue-600" />
                              </button>
                              <button
                                onClick={() => toggleUserStatus(user)}
                                className="p-1 hover:bg-gray-100 rounded"
                                title={user.is_active ? 'Vô hiệu hóa' : 'Kích hoạt'}
                              >
                                {user.is_active ? (
                                  <UserX className="w-4 h-4 text-orange-600" />
                                ) : (
                                  <UserCheck className="w-4 h-4 text-green-600" />
                                )}
                              </button>
                              <button
                                onClick={() => handleDelete(user)}
                                className="p-1 hover:bg-gray-100 rounded"
                                title="Xóa"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Trang trước
                  </Button>
                  <span className="px-4 py-2 text-gray-700">
                    Trang {page} / {Math.ceil(total / 20)}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= Math.ceil(total / 20)}
                  >
                    Trang sau
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingUser(null);
          }}
          title="Chỉnh sửa người dùng"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Vai trò</label>
              <select
                className="w-full px-3 py-2 border rounded-lg"
                defaultValue={editingUser.role}
                onChange={(e) => handleUpdateUser({ role: e.target.value as any })}
              >
                <option value="customer">Khách hàng</option>
                <option value="admin">Quản trị viên</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Trạng thái</label>
              <select
                className="w-full px-3 py-2 border rounded-lg"
                defaultValue={editingUser.is_active ? 'true' : 'false'}
                onChange={(e) => handleUpdateUser({ is_active: e.target.value === 'true' })}
              >
                <option value="true">Hoạt động</option>
                <option value="false">Vô hiệu hóa</option>
              </select>
            </div>
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
}

