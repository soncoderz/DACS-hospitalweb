import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const AdminsManagement = () => {
  const { admin, isSuperAdmin } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin',
    permissions: []
  });

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin/admins');
      if (response.data.success) {
        setAdmins(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast.error('Không thể tải danh sách admin');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePermissionChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => {
      if (checked) {
        return { ...prev, permissions: [...prev.permissions, value] };
      } else {
        return { ...prev, permissions: prev.permissions.filter(perm => perm !== value) };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/api/admin/create', formData);
      if (response.data.success) {
        toast.success('Admin được tạo thành công');
        setShowCreateForm(false);
        setFormData({
          name: '',
          email: '',
          password: '',
          role: 'admin',
          permissions: []
        });
        fetchAdmins();
      }
    } catch (error) {
      console.error('Error creating admin:', error);
      toast.error(error.response?.data?.message || 'Không thể tạo admin');
    }
  };

  const toggleAdminStatus = async (adminId, isActive) => {
    try {
      const response = await api.patch(`/api/admin/admins/${adminId}/status`, {
        isActive: !isActive
      });

      if (response.data.success) {
        toast.success(`Admin đã được ${isActive ? 'vô hiệu hóa' : 'kích hoạt'}`);
        fetchAdmins();
      }
    } catch (error) {
      console.error('Error toggling admin status:', error);
      toast.error('Không thể cập nhật trạng thái admin');
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý Admin</h1>
        <button 
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Thêm Admin
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vai trò
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {admins.map((admin) => (
                <tr key={admin._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{admin.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{admin.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${admin.role === 'super_admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                      {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${admin.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {admin.isActive ? 'Hoạt động' : 'Vô hiệu hóa'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {admin.role !== 'super_admin' && (
                      <button
                        onClick={() => toggleAdminStatus(admin._id, admin.isActive)}
                        className={`text-sm ${admin.isActive ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'} mx-2`}
                      >
                        {admin.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {admins.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                    Không có dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Thêm Admin mới</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                  Tên
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                  Mật khẩu
                </label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="role">
                  Vai trò
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="admin">Admin</option>
                  {isSuperAdmin() && (
                    <option value="super_admin">Super Admin</option>
                  )}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Quyền
                </label>
                <div className="space-y-2">
                  <div>
                    <input
                      id="manage_users"
                      type="checkbox"
                      name="permissions"
                      value="manage_users"
                      checked={formData.permissions.includes('manage_users')}
                      onChange={handlePermissionChange}
                      className="mr-2"
                    />
                    <label htmlFor="manage_users">Quản lý người dùng</label>
                  </div>
                  <div>
                    <input
                      id="manage_doctors"
                      type="checkbox"
                      name="permissions"
                      value="manage_doctors"
                      checked={formData.permissions.includes('manage_doctors')}
                      onChange={handlePermissionChange}
                      className="mr-2"
                    />
                    <label htmlFor="manage_doctors">Quản lý bác sĩ</label>
                  </div>
                  <div>
                    <input
                      id="manage_hospitals"
                      type="checkbox"
                      name="permissions"
                      value="manage_hospitals"
                      checked={formData.permissions.includes('manage_hospitals')}
                      onChange={handlePermissionChange}
                      className="mr-2"
                    />
                    <label htmlFor="manage_hospitals">Quản lý bệnh viện</label>
                  </div>
                  <div>
                    <input
                      id="manage_appointments"
                      type="checkbox"
                      name="permissions"
                      value="manage_appointments"
                      checked={formData.permissions.includes('manage_appointments')}
                      onChange={handlePermissionChange}
                      className="mr-2"
                    />
                    <label htmlFor="manage_appointments">Quản lý lịch hẹn</label>
                  </div>
                  <div>
                    <input
                      id="manage_services"
                      type="checkbox"
                      name="permissions"
                      value="manage_services"
                      checked={formData.permissions.includes('manage_services')}
                      onChange={handlePermissionChange}
                      className="mr-2"
                    />
                    <label htmlFor="manage_services">Quản lý dịch vụ</label>
                  </div>
                  <div>
                    <input
                      id="manage_promotions"
                      type="checkbox"
                      name="permissions"
                      value="manage_promotions"
                      checked={formData.permissions.includes('manage_promotions')}
                      onChange={handlePermissionChange}
                      className="mr-2"
                    />
                    <label htmlFor="manage_promotions">Quản lý khuyến mãi</label>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Tạo Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminsManagement; 