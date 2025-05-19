import React, { useState, useEffect } from 'react';
import { FaSearch, FaFilter, FaDownload, FaUser, FaCalendarAlt, FaMoneyBillWave, FaCreditCard, FaUserMd, FaTimes, FaInfo, FaEdit } from 'react-icons/fa';
import api from '../../utils/api';
import { toast } from 'react-toastify';


const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState({
    status: 'all',
    method: 'all',
    date: '',
    period: 'all'
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    pageSize: 10
  });
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    failed: 0
  });
  const [editPaymentModal, setEditPaymentModal] = useState(false);
  const [editPaymentStatus, setEditPaymentStatus] = useState('');
  const [editPaymentNotes, setEditPaymentNotes] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Format currency to VND
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'N/A';
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { year: 'numeric', month: 'numeric', day: 'numeric' });
  };

  useEffect(() => {
    fetchData();
    fetchStats();
  }, [pagination.currentPage, filter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Format date parameter if needed
      const dateParam = filter.date ? new Date(filter.date).toISOString().split('T')[0] : '';
      
      // Build API URL with proper parameters
      const apiUrl = `/admin/payments?page=${pagination.currentPage}&limit=${pagination.pageSize}&status=${filter.status}&method=${filter.method}&date=${dateParam}&period=${filter.period}&search=${searchTerm}`;
      
      console.log('Fetching payments with URL:', apiUrl);
      
      const res = await api.get(apiUrl);
      console.log('Payment response data:', res.data);
      
      if (res.data.success) {
        // The correct format from payment controller has payments directly in res.data.payments
        if (res.data.payments && Array.isArray(res.data.payments)) {
          console.log(`Found ${res.data.payments.length} payments in res.data.payments array`);
          setPayments(res.data.payments);
          setPagination({
            ...pagination,
            totalPages: Math.ceil(res.data.total / pagination.pageSize) || 1,
            currentPage: res.data.currentPage || 1
          });
        }
        // If no data or empty array
        else {
          console.log('No payments data to display');
          setPayments([]);
          setPagination({
            ...pagination,
            totalPages: res.data.totalPages || 1,
            currentPage: res.data.currentPage || 1
          });
        }
      } else {
        console.error('Failed to fetch payments:', res.data);
        toast.error('Không thể tải dữ liệu thanh toán: ' + (res.data.message || 'Lỗi không xác định'));
        setPayments([]);
        setPagination({
          ...pagination,
          totalPages: 1
        });
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Không thể tải dữ liệu thanh toán');
      setPayments([]);
      setPagination({
        ...pagination,
        totalPages: 1
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/payments/stats');
      if (res.data.success) {
        setStats(res.data.stats);
      } else {
        console.error('Failed to fetch payment stats:', res.data);
      }
    } catch (error) {
      console.error('Error fetching payment stats:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination({ ...pagination, currentPage: 1 });
    fetchData();
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter({ ...filter, [name]: value });
    setPagination({ ...pagination, currentPage: 1 });
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPagination({ ...pagination, currentPage: newPage });
    }
  };

  const openModal = (payment, type = 'view') => {
    setSelectedPayment(payment);
    setEditPaymentStatus(payment.paymentStatus || payment.status || '');
    setEditPaymentNotes('');
    if (type === 'edit') {
      setEditPaymentModal(true);
    } else {
    setIsModalOpen(true);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPayment(null);
  };

  const handleUpdatePaymentStatus = async () => {
    try {
      setIsSubmittingPayment(true);
      
      const payload = {
        paymentStatus: editPaymentStatus,
        notes: editPaymentNotes.trim() || undefined
      };
      
      const response = await api.put(`/payments/${selectedPayment._id}`, payload);
      
      if (response.data.success) {
        toast.success('Cập nhật trạng thái thanh toán thành công');
        // Update the payment in the current list
        const updatedPayments = payments.map(p => {
          if (p._id === selectedPayment._id) {
            return { ...p, paymentStatus: editPaymentStatus, status: editPaymentStatus };
          }
          return p;
        });
        setPayments(updatedPayments);
        // Close modals
        setEditPaymentModal(false);
        closeModal();
        // Refresh data if needed
        fetchData();
      } else {
        toast.error(response.data.message || 'Không thể cập nhật trạng thái thanh toán');
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error(error.response?.data?.message || 'Không thể cập nhật trạng thái thanh toán');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const closeEditPaymentModal = () => {
    setEditPaymentModal(false);
    setEditPaymentStatus('');
    setEditPaymentNotes('');
  };

  const exportData = () => {
    // Xuất dữ liệu dưới dạng CSV
    const fields = ['_id', 'userId.fullName', 'userId.avatarUrl', 'appointmentId.bookingCode', 'amount', 'paymentMethod', 'paymentStatus', 'createdAt'];
    
    const csvContent = [
      // Header
      fields.join(','),
      // Rows
      ...payments.map(item => 
        fields.map(field => {
          // Xử lý trường hợp nested field (userId.fullName)
          if (field.includes('.')) {
            const [parent, child] = field.split('.');
            return item[parent] ? `"${item[parent][child] || ''}"` : '""';
          }
          return `"${item[field] || ''}"`;
        }).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `payments_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý thanh toán</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              <FaMoneyBillWave className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tổng thanh toán</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              <FaMoneyBillWave className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Thành công</p>
              <p className="text-xl font-bold">{stats.completed}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
              <FaMoneyBillWave className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Đang xử lý</p>
              <p className="text-xl font-bold">{stats.pending}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600 mr-4">
              <FaMoneyBillWave className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Thất bại</p>
              <p className="text-xl font-bold">{stats.failed}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 border-b">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Bar */}
          <div className="w-full lg:w-1/3">
            <form onSubmit={handleSearch} className="flex w-full">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Tìm kiếm thanh toán..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
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
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="completed">Thành công</option>
                <option value="pending">Đang xử lý</option>
                <option value="failed">Thất bại</option>
              </select>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FaFilter className="text-gray-400" />
              </div>
              <select
                name="method"
                value={filter.method}
                onChange={handleFilterChange}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white appearance-none"
              >
                <option value="all">Tất cả phương thức</option>
                <option value="cash">Tiền mặt</option>
                <option value="paypal">PayPal</option>
                <option value="momo">MoMo</option>
                <option value="credit_card">Thẻ tín dụng</option>
              </select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end items-center mt-4">
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
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã thanh toán</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người dùng</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bác sĩ</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã đặt lịch</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số tiền</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phương thức</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày thanh toán</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.length > 0 ? (
                payments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{payment.paymentId || payment._id.substring(0, 8)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                          {payment.userId && (payment.userId.avatarUrl || payment.userId.avatar?.secureUrl || payment.userId.avatar?.url) ? (
                            <img 
                              src={payment.userId.avatarUrl || payment.userId.avatar?.secureUrl || payment.userId.avatar?.url} 
                              alt={payment.userId.fullName || 'User'}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(payment.userId.fullName || 'User')}&background=1AC0FF&color=fff`;
                              }}
                            />
                          ) : (
                          <FaUser className="text-gray-500" />
                          )}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {payment.userId && payment.userId.fullName ? payment.userId.fullName : 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                          {payment.doctorId && payment.doctorId.user && (payment.doctorId.user.avatarUrl || payment.doctorId.user.avatar?.secureUrl || payment.doctorId.user.avatar?.url) ? (
                            <img 
                              src={payment.doctorId.user.avatarUrl || payment.doctorId.user.avatar?.secureUrl || payment.doctorId.user.avatar?.url} 
                              alt={payment.doctorId.user.fullName || 'Doctor'}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(payment.doctorId.user.fullName || 'Doctor')}&background=2563EB&color=fff`;
                              }}
                            />
                          ) : (
                          <FaUserMd className="text-blue-500" />
                          )}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm text-gray-900">
                            {payment.doctorId && payment.doctorId.user ? payment.doctorId.user.fullName : 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {payment.appointmentId && payment.appointmentId.bookingCode ? payment.appointmentId.bookingCode : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{formatCurrency(payment.amount)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {payment.paymentMethod === 'cash' && 'Tiền mặt'}
                        {payment.paymentMethod === 'paypal' && 'PayPal'}
                        {payment.paymentMethod === 'momo' && 'MoMo'}
                        {payment.paymentMethod && !['cash', 'paypal', 'momo'].includes(payment.paymentMethod) && payment.paymentMethod}
                        {!payment.paymentMethod && 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        (payment.paymentStatus || payment.status) === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : (payment.paymentStatus || payment.status) === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {(payment.paymentStatus || payment.status) === 'completed' && 'Thành công'}
                        {(payment.paymentStatus || payment.status) === 'pending' && 'Đang xử lý'}
                        {(payment.paymentStatus || payment.status) === 'failed' && 'Thất bại'}
                        {!payment.paymentStatus && !payment.status && 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(payment.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2">
                      <button 
                        onClick={() => openModal(payment)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                          title="Chi tiết"
                      >
                        <FaInfo className="h-5 w-5" />
                      </button>
                        <button 
                          onClick={() => openModal(payment, 'edit')}
                          className="text-green-600 hover:text-green-900 p-1"
                          title="Sửa trạng thái"
                        >
                          <FaEdit className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="px-6 py-10 text-center text-gray-500">
                    Không có dữ liệu thanh toán
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
              Trang {pagination.currentPage} / {pagination.totalPages}
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

      {/* Payment detail modal */}
      {isModalOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold text-gray-800">
                Chi tiết thanh toán
              </h2>
              <button 
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
                onClick={closeModal}
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-gray-600">Mã thanh toán:</span>
                  <span className="font-medium">{selectedPayment.paymentId || selectedPayment._id.substring(0, 8)}</span>
                </div>
                
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-gray-600">Người dùng:</span>
                  <span className="font-medium">
                    {selectedPayment.userId?.fullName || 'N/A'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-gray-600">Bác sĩ:</span>
                  <span className="font-medium">
                    {selectedPayment.doctorId?.user?.fullName || 'N/A'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-gray-600">Mã đặt lịch:</span>
                  <span className="font-medium">
                    {selectedPayment.appointmentId?.bookingCode || 'N/A'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-gray-600">Ngày hẹn:</span>
                  <span className="font-medium">
                    {selectedPayment.appointmentId?.date ? formatDate(selectedPayment.appointmentId.date) : 'N/A'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-gray-600">Số tiền:</span>
                  <span className="font-medium text-blue-600">
                    {formatCurrency(selectedPayment.amount)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-gray-600">Phương thức:</span>
                  <span className="font-medium">
                    {selectedPayment.paymentMethod === 'cash' && 'Tiền mặt'}
                    {selectedPayment.paymentMethod === 'paypal' && 'PayPal'}
                    {selectedPayment.paymentMethod === 'momo' && 'MoMo'}
                    {selectedPayment.paymentMethod === 'credit_card' && 'Thẻ tín dụng'}
                    {selectedPayment.paymentMethod && !['cash', 'paypal', 'credit_card', 'momo'].includes(selectedPayment.paymentMethod) && selectedPayment.paymentMethod}
                    {!selectedPayment.paymentMethod && 'N/A'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-gray-600">Trạng thái:</span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    (selectedPayment.paymentStatus || selectedPayment.status) === 'completed' 
                      ? 'bg-green-100 text-green-800' 
                      : (selectedPayment.paymentStatus || selectedPayment.status) === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                  }`}>
                    {(selectedPayment.paymentStatus || selectedPayment.status) === 'completed' && 'Thành công'}
                    {(selectedPayment.paymentStatus || selectedPayment.status) === 'pending' && 'Đang xử lý'}
                    {(selectedPayment.paymentStatus || selectedPayment.status) === 'failed' && 'Thất bại'}
                    {!selectedPayment.paymentStatus && !selectedPayment.status && 'N/A'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Ngày thanh toán:</span>
                  <span className="font-medium">
                    {formatDate(selectedPayment.createdAt)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end p-4 border-t bg-gray-50 rounded-b-lg">
              <button 
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                onClick={closeModal}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Payment Status Modal */}
      {editPaymentModal && selectedPayment && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold text-gray-800">
                Cập nhật trạng thái thanh toán
              </h2>
              <button 
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
                onClick={closeEditPaymentModal}
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mã thanh toán
                  </label>
                  <div className="px-3 py-2 border border-gray-200 rounded-md bg-gray-50">
                    {selectedPayment.paymentId || selectedPayment._id.substring(0, 8)}
                  </div>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="paymentStatus" className="block text-sm font-medium text-gray-700 mb-1">
                    Trạng thái thanh toán
                  </label>
                  <select
                    id="paymentStatus"
                    value={editPaymentStatus}
                    onChange={(e) => setEditPaymentStatus(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="pending">Đang xử lý</option>
                    <option value="completed">Thành công</option>
                    <option value="failed">Thất bại</option>
                    <option value="cancelled">Đã hủy</option>
                    <option value="refunded">Hoàn tiền</option>
                  </select>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="paymentNotes" className="block text-sm font-medium text-gray-700 mb-1">
                    Ghi chú (không bắt buộc)
                  </label>
                  <textarea
                    id="paymentNotes"
                    value={editPaymentNotes}
                    onChange={(e) => setEditPaymentNotes(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Nhập ghi chú về việc cập nhật thanh toán..."
                  ></textarea>
                </div>
              </div>
            </div>
            
            <div className="px-4 py-3 bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
              <button 
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={closeEditPaymentModal}
              >
                Hủy
              </button>
              
              <button 
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  isSubmittingPayment 
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
                onClick={handleUpdatePaymentStatus}
                disabled={isSubmittingPayment}
              >
                {isSubmittingPayment ? 'Đang cập nhật...' : 'Cập nhật'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments; 
