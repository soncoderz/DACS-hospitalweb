import React, { useState, useEffect } from 'react';
import { FaUserLock, FaUserCheck, FaSearch, FaFilter, FaDownload, FaTimes, FaExclamationCircle } from 'react-icons/fa';
import api from '../../utils/api';
import { toast } from 'react-toastify';


// Replace local import with a constant URL
const DEFAULT_AVATAR = '/avatars/default-avatar.png';

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState({
    status: 'all',
    role: 'all'
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalPages: 1
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const [lockReason, setLockReason] = useState('');
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    fetchData();
  }, [pagination.currentPage, filter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Xử lý tham số trạng thái
      let isLockedParam = undefined;
      if (filter.status === 'locked') {
        isLockedParam = true;
      } else if (filter.status === 'active') {
        isLockedParam = false;
      }
      
      // Xác định loại vai trò cần lấy (chỉ lấy admin hoặc user)
      const roleTypeParam = filter.role === 'admin' ? 'admin' : 
                           filter.role === 'user' ? 'user' : 
                           'user,admin';
      
      console.log(`Tìm người dùng với roleType=${roleTypeParam}, trạng thái=${filter.status}, isLocked=${isLockedParam}`);
      const res = await api.get('/admin/users', {
        params: {
          page: pagination.currentPage,
          limit: pagination.pageSize,
          roleType: roleTypeParam,
          isLocked: isLockedParam,
          search: searchTerm || undefined
        }
      });
      
      console.log('User data response:', res.data);
      
      // Thêm bước lọc bổ sung ở phía client để đảm bảo không có bác sĩ
      if (res.data && res.data.success) {
        const userData = Array.isArray(res.data.data) 
          ? res.data.data.filter(user => user.roleType !== 'doctor') 
          : [];
        
        console.log(`Lọc được ${userData.length} người dùng không phải bác sĩ từ ${res.data.data?.length || 0} bản ghi`);
        
        setUsers(userData);
        setTotalRecords(res.data.total || userData.length);
        setPagination({
          ...pagination,
          totalPages: Math.ceil((res.data.total || userData.length) / pagination.pageSize) || 1
        });
      } else {
        console.error('Không nhận được dữ liệu người dùng hợp lệ:', res.data);
        setUsers([]);
        setTotalRecords(0);
        setPagination(prev => ({...prev, totalPages: 1}));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Không thể tải dữ liệu người dùng');
      setUsers([]);
      setTotalRecords(0);
      setPagination(prev => ({...prev, totalPages: 1}));
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to first page
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to first page
    fetchData();
  };

  const handleSearchReset = () => {
    setSearchTerm('');
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    // Trigger fetchData after state is updated
    setTimeout(() => {
      fetchData();
    }, 0);
  };

  const handleFilterReset = () => {
    setFilter({
      status: 'all',
      role: 'all'
    });
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    // fetchData will be triggered by filter change effect
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const openModal = (type, user = null) => {
    setModalType(type);
    setSelectedUser(user);
    setLockReason('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setModalType('');
    setLockReason('');
  };

  const handleLockUser = async (userId) => {
    try {
      if (!lockReason) {
        toast.error('Vui lòng nhập lý do khóa tài khoản');
        return;
      }
      
      const res = await api.put(`/admin/users/${userId}/lock`, { 
        lockReason: lockReason 
      });
      
      if (res.data.success) {
        toast.success('Đã khóa tài khoản người dùng');
        
        // Cập nhật trạng thái ngay lập tức trong state
        setUsers(users.map(user => {
          if (user._id === userId) {
            return {
              ...user,
              isLocked: true,
              lockReason: lockReason
            };
          }
          return user;
        }));
        
        closeModal();
        
        // Chuyển filter về 'all' nếu đang lọc 'active'
        if (filter.status === 'active') {
          setFilter(prev => ({ ...prev, status: 'all' }));
        } else {
          // Chỉ gọi fetchData nếu không thay đổi filter
          fetchData();
        }
      } else {
        toast.error(res.data?.message || 'Không thể khóa tài khoản người dùng');
      }
    } catch (error) {
      console.error('Error locking user:', error);
      toast.error(error.response?.data?.message || 'Không thể khóa tài khoản người dùng');
    }
  };

  const handleUnlockUser = async (userId) => {
    try {
      const res = await api.put(`/admin/users/${userId}/unlock`);
      if (res.data.success) {
        toast.success('Đã mở khóa tài khoản người dùng');
        
        // Cập nhật trạng thái ngay lập tức trong state
        setUsers(users.map(user => {
          if (user._id === userId) {
            return {
              ...user,
              isLocked: false,
              lockReason: undefined
            };
          }
          return user;
        }));
        
        // Chuyển filter về 'all' nếu đang lọc 'locked'
        if (filter.status === 'locked') {
          setFilter(prev => ({ ...prev, status: 'all' }));
        } else {
          // Chỉ gọi fetchData nếu không thay đổi filter
          fetchData();
        }
      } else {
        toast.error(res.data?.message || 'Không thể mở khóa tài khoản người dùng');
      }
    } catch (error) {
      console.error('Error unlocking user:', error);
      toast.error(error.response?.data?.message || 'Không thể mở khóa tài khoản người dùng');
    }
  };

  const exportData = () => {
    // Xuất dữ liệu dưới dạng CSV
    const fields = ['_id', 'fullName', 'email', 'phoneNumber', 'roleType', 'isLocked', 'createdAt'];
    
    const csvContent = [
      // Header
      fields.join(','),
      // Rows
      ...users.map(item => 
        fields.map(field => {
          return `"${item[field] || ''}"`;
        }).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `users_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { year: 'numeric', month: 'numeric', day: 'numeric' });
  };

  // Handle image error
  const handleImageError = (e) => {
    e.target.src = DEFAULT_AVATAR;
    e.target.onerror = null; // Prevents infinite error loop
  };

  // Render the modal
  const renderModal = () => {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center">
        <div className="relative bg-white rounded-lg max-w-md w-full mx-4 shadow-xl">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-semibold text-gray-800">
              {modalType === 'lock' && 'Khóa tài khoản'}
            </h2>
            <button 
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
              onClick={closeModal}
            >
              <FaTimes className="h-5 w-5" />
            </button>
          </div>
          
          <div className="p-6">
            {modalType === 'lock' && (
              <div>
                <p className="mb-4 text-gray-600">
                  Bạn có chắc chắn muốn khóa tài khoản <span className="font-semibold">{selectedUser?.fullName || 'này'}</span>?
                </p>
                
                <div className="mb-4">
                  <label htmlFor="lockReason" className="block text-sm font-medium text-gray-700 mb-1">
                    Lý do khóa tài khoản:
                  </label>
                  <textarea
                    id="lockReason"
                    name="lockReason"
                    value={lockReason}
                    onChange={(e) => setLockReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Vui lòng nhập lý do khóa tài khoản"
                    rows="3"
                  />
                </div>
                
                <p className="text-sm text-yellow-600 mb-4 flex items-start">
                  <FaExclamationCircle className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                  <span>Tài khoản sẽ không thể đăng nhập cho đến khi được mở khóa.</span>
                </p>
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-lg">
            <button 
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
              onClick={closeModal}
            >
              Hủy
            </button>
            
            {modalType === 'lock' && (
              <button 
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                onClick={() => handleLockUser(selectedUser._id)}
              >
                Khóa tài khoản
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý người dùng</h1>
      </div>

      <div className="p-6 border-b">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Bar */}
          <div className="w-full lg:w-1/3">
            <form onSubmit={handleSearch} className="flex w-full">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Tìm kiếm người dùng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
                {searchTerm && (
                  <button 
                    type="button" 
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                    onClick={handleSearchReset}
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
              <button 
                type="submit" 
                className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
              >
                <FaSearch className="mr-2" />
                Tìm
              </button>
            </form>
          </div>

          {/* Filters */}
          <div className="w-full lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FaFilter className="text-gray-400" />
              </div>
              <select
                name="status"
                value={filter.status}
                onChange={handleFilterChange}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white appearance-none"
                aria-label="Lọc theo trạng thái"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="locked">Đã khóa</option>
              </select>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FaFilter className="text-gray-400" />
              </div>
              <select
                name="role"
                value={filter.role}
                onChange={handleFilterChange}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white appearance-none"
                aria-label="Lọc theo vai trò"
              >
                <option value="all">Tất cả vai trò</option>
                <option value="user">Người dùng</option>
                <option value="admin">Quản trị viên</option>
              </select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mt-4">
          <div className="flex space-x-2">
            {(filter.status !== 'all' || filter.role !== 'all') && (
              <button 
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                onClick={handleFilterReset}
              >
                <FaTimes />
                <span>Xóa bộ lọc</span>
              </button>
            )}
          </div>
          <div className="flex space-x-2">
            <button 
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              onClick={exportData}
            >
              <FaDownload />
              <span>Xuất dữ liệu</span>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-8">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ảnh đại diện</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Họ tên</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số điện thoại</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vai trò</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.length > 0 ? (
                users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100">
                        <img 
                          src={user.avatarUrl || DEFAULT_AVATAR} 
                          alt={user.fullName} 
                          className="w-full h-full object-cover"
                          onError={handleImageError}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{user.phoneNumber || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.roleType === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.roleType === 'admin' ? 'Quản trị viên' : 
                         user.roleType === 'staff' ? 'Nhân viên' : 'Người dùng'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.isLocked 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {user.isLocked ? 'Đã khóa' : 'Hoạt động'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{formatDate(user.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.isLocked ? (
                        <button
                          className="p-2 text-green-600 hover:text-green-900 rounded-full hover:bg-green-50"
                          onClick={() => handleUnlockUser(user._id)}
                          title="Mở khóa tài khoản"
                        >
                          <FaUserCheck className="h-5 w-5" />
                        </button>
                      ) : (
                        <button
                          className="p-2 text-red-600 hover:text-red-900 rounded-full hover:bg-red-50"
                          onClick={() => openModal('lock', user)}
                          title="Khóa tài khoản"
                        >
                          <FaUserLock className="h-5 w-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-10 text-center text-gray-500">
                    Không có dữ liệu người dùng
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 bg-white border-t">
            <div className="flex items-center gap-2">
              <button
                className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handlePageChange(1)}
                disabled={pagination.currentPage === 1}
              >
                &laquo;
              </button>
              <button
                className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
              >
                &lsaquo;
              </button>
            </div>
            
            <div className="text-sm text-gray-700">
              Trang {pagination.currentPage} / {pagination.totalPages} ({totalRecords} bản ghi)
            </div>
            
            <div className="flex items-center gap-2">
              <button
                className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
              >
                &rsaquo;
              </button>
              <button
                className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handlePageChange(pagination.totalPages)}
                disabled={pagination.currentPage === pagination.totalPages}
              >
                &raquo;
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && renderModal()}
    </div>
  );
}

export default Users; 
