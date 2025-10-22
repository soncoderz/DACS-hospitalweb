import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaFilter, FaDownload, FaTicketAlt, FaPercentage } from 'react-icons/fa';
import api from '../../utils/api';
import { toast } from 'react-toastify';


const Coupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState({
    status: 'all',
    type: 'all'
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    pageSize: 10
  });
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const [services, setServices] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: 0,
    maxDiscount: 0,
    minPurchase: 0,
    startDate: '',
    endDate: '',
    isActive: true,
    description: '',
    usageLimit: 1,
    usedCount: 0,
    applicableServices: [],
    applicableSpecialties: []
  });
  const [loadingAction, setLoadingAction] = useState(false);
  const [loadingMetadata, setLoadingMetadata] = useState(false);

  useEffect(() => {
    fetchData();
    fetchServices();
    fetchSpecialties();
  }, [pagination.currentPage, filter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/coupons?page=${pagination.currentPage}&limit=${pagination.pageSize}&status=${filter.status}&type=${filter.type}&search=${searchTerm}`);
      if (res.data.success) {
        // Check for nested structure in data.data.coupons
        if (res.data.data && res.data.data.coupons && Array.isArray(res.data.data.coupons)) {
        setCoupons(res.data.data.coupons);
          setPagination({
            ...pagination,
            totalPages: Math.ceil(res.data.data.total / pagination.pageSize) || 1
          });
        } 
        // Check if data array is directly in res.data.data
        else if (res.data.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setCoupons(res.data.data);
          setPagination({
            ...pagination,
            totalPages: Math.ceil(res.data.total / pagination.pageSize) || 1
          });
        } else {
          console.error('No coupons found in response:', res.data);
          setCoupons([]);
          setPagination({
            ...pagination,
            totalPages: 1
          });
        }
      } else {
        console.error('Failed to fetch coupons:', res.data);
        setCoupons([]);
        setPagination({
          ...pagination,
          totalPages: 1
        });
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast.error('Không thể tải dữ liệu mã giảm giá');
      setCoupons([]);
      setPagination({
        ...pagination,
        totalPages: 1
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      setLoadingMetadata(true);
      const res = await api.get('/admin/services');
      if (res.data.success) {
        if (res.data.data && Array.isArray(res.data.data)) {
          setServices(res.data.data);
        } else if (res.data.data && res.data.data.services && Array.isArray(res.data.data.services)) {
          setServices(res.data.data.services);
        } else {
          console.error('No services found in response:', res.data);
          setServices([]);
        }
      } else {
        console.error('Failed to fetch services:', res.data);
        setServices([]);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      setServices([]);
    } finally {
      setLoadingMetadata(false);
    }
  };

  const fetchSpecialties = async () => {
    try {
      setLoadingMetadata(true);
      const res = await api.get('/admin/specialties');
      if (res.data.success) {
        if (res.data.data && Array.isArray(res.data.data)) {
          setSpecialties(res.data.data);
        } else if (res.data.data && res.data.data.specialties && Array.isArray(res.data.data.specialties)) {
          setSpecialties(res.data.data.specialties);
        } else {
          console.error('No specialties found in response:', res.data);
          setSpecialties([]);
        }
      } else {
        console.error('Failed to fetch specialties:', res.data);
        setSpecialties([]);
      }
    } catch (error) {
      console.error('Error fetching specialties:', error);
      setSpecialties([]);
    } finally {
      setLoadingMetadata(false);
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

  const openModal = (type, coupon = null) => {
    setModalType(type);
    setSelectedCoupon(coupon);
    
    if (type === 'add') {
      setFormData({
        code: '',
        discountType: 'percentage',
        discountValue: 0,
        maxDiscount: 0,
        minPurchase: 0,
        startDate: '',
        endDate: '',
        isActive: true,
        description: '',
        usageLimit: 1,
        usedCount: 0,
        applicableServices: [],
        applicableSpecialties: []
      });
      setIsModalOpen(true);
    } else if (type === 'edit' && coupon) {
      // For edit mode, fetch the detailed coupon data first
      fetchCouponDetails(coupon._id);
      // Note: setIsModalOpen(true) is called inside fetchCouponDetails after data is loaded
    } else {
      setIsModalOpen(true);
    }
  };

  const fetchCouponDetails = async (couponId) => {
    try {
      setLoadingAction(true);
      const res = await api.get(`/admin/coupons/${couponId}`);
      
      if (res.data.success && res.data.data) {
        const couponData = res.data.data;
        
        // Format dates properly for input fields
        const formattedStartDate = couponData.startDate ? 
          new Date(couponData.startDate).toISOString().split('T')[0] : '';
        const formattedEndDate = couponData.endDate ? 
          new Date(couponData.endDate).toISOString().split('T')[0] : '';
        
        // Extract IDs from populated service and specialty objects if needed
        const serviceIds = couponData.applicableServices.map(service => 
          typeof service === 'object' ? service._id : service
        );
        
        const specialtyIds = couponData.applicableSpecialties.map(specialty => 
          typeof specialty === 'object' ? specialty._id : specialty
        );
        
        setFormData({
          code: couponData.code || '',
          discountType: couponData.discountType || 'percentage',
          discountValue: couponData.discountValue || 0,
          maxDiscount: couponData.maxDiscount || 0,
          minPurchase: couponData.minPurchase || 0,
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          isActive: couponData.isActive !== undefined ? couponData.isActive : true,
          description: couponData.description || '',
          usageLimit: couponData.usageLimit || 1,
          usedCount: couponData.usedCount || 0,
          applicableServices: serviceIds,
          applicableSpecialties: specialtyIds
        });
        
        setIsModalOpen(true);
      } else {
        // Fallback to using the basic data we already have
        fallbackToBasicData();
        toast.error('Không thể tải chi tiết mã giảm giá');
      }
    } catch (error) {
      console.error('Error fetching coupon details:', error);
      
      // Use the existing selectedCoupon data as fallback
      fallbackToBasicData();
      toast.error('Không thể tải chi tiết mã giảm giá');
    } finally {
      setLoadingAction(false);
    }
  };

  // Helper function to use basic coupon data as fallback
  const fallbackToBasicData = () => {
    if (!selectedCoupon) {
      closeModal();
      return;
    }
    
    // Format dates properly
    const formattedStartDate = selectedCoupon.startDate ? 
      new Date(selectedCoupon.startDate).toISOString().split('T')[0] : '';
    const formattedEndDate = selectedCoupon.endDate ? 
      new Date(selectedCoupon.endDate).toISOString().split('T')[0] : '';
    
    // Extract IDs from populated service and specialty objects if needed
    const serviceIds = selectedCoupon.applicableServices ? 
      selectedCoupon.applicableServices.map(service => 
        typeof service === 'object' ? service._id : service
      ) : [];
    
    const specialtyIds = selectedCoupon.applicableSpecialties ? 
      selectedCoupon.applicableSpecialties.map(specialty => 
        typeof specialty === 'object' ? specialty._id : specialty
      ) : [];
    
    setFormData({
      code: selectedCoupon.code || '',
      discountType: selectedCoupon.discountType || 'percentage',
      discountValue: selectedCoupon.discountValue || 0,
      maxDiscount: selectedCoupon.maxDiscount || 0,
      minPurchase: selectedCoupon.minPurchase || 0,
      startDate: formattedStartDate,
      endDate: formattedEndDate,
      isActive: selectedCoupon.isActive !== undefined ? selectedCoupon.isActive : true,
      description: selectedCoupon.description || '',
      usageLimit: selectedCoupon.usageLimit || 1,
      usedCount: selectedCoupon.usedCount || 0,
      applicableServices: serviceIds,
      applicableSpecialties: specialtyIds
    });
    
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCoupon(null);
    setModalType('');
  };

  const handleDeleteCoupon = async (couponId) => {
    try {
      const res = await api.delete(`/admin/coupons/${couponId}`);
      if (res.data.success) {
        toast.success('Đã xóa mã giảm giá thành công');
        fetchData();
        closeModal();
      }
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast.error('Không thể xóa mã giảm giá');
    }
  };

  const exportData = () => {
    // Xuất dữ liệu dưới dạng CSV
    const fields = ['_id', 'code', 'description', 'discountType', 'discountValue', 'startDate', 'endDate', 'status', 'createdAt'];
    
    const csvContent = [
      // Header
      fields.join(','),
      // Rows
      ...coupons.map(item => 
        fields.map(field => `"${item[field] || ''}"`)
        .join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `coupons_${new Date().toISOString().split('T')[0]}.csv`);
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

  // Format discount value
  const formatDiscountValue = (type, value) => {
    if (type === 'percentage') {
      return `${value}%`;
    } else {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
    }
  };

  // Check if coupon is active
  const isCouponActive = (startDate, endDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    return now >= start && now <= end;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: checked
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleServicesChange = (e) => {
    const options = e.target.options;
    const selectedValues = [];
    
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedValues.push(options[i].value);
      }
    }
    
    setFormData({
      ...formData,
      applicableServices: selectedValues
    });
  };

  const handleSpecialtiesChange = (e) => {
    const options = e.target.options;
    const selectedValues = [];
    
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedValues.push(options[i].value);
      }
    }
    
    setFormData({
      ...formData,
      applicableSpecialties: selectedValues
    });
  };

  const handleSubmit = async () => {
    try {
      setLoadingAction(true);
      
      // Log current form data for debugging
      console.log('Submitting coupon with data:', formData);
      
      // Validation
      if (!formData.code) {
        toast.error('Vui lòng nhập mã giảm giá');
        setLoadingAction(false);
        return;
      }
      
      if (!formData.discountValue || formData.discountValue <= 0) {
        toast.error('Vui lòng nhập giá trị giảm giá hợp lệ');
        setLoadingAction(false);
        return;
      }
      
      if (!formData.startDate || !formData.endDate) {
        toast.error('Vui lòng chọn ngày bắt đầu và kết thúc');
        setLoadingAction(false);
        return;
      }
      
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      
      if (endDate <= startDate) {
        toast.error('Ngày kết thúc phải sau ngày bắt đầu');
        setLoadingAction(false);
        return;
      }
      
      let res;
      if (modalType === 'add') {
        res = await api.post('/admin/coupons', formData);
      } else {
        res = await api.put(`/admin/coupons/${selectedCoupon._id}`, formData);
      }
      
      if (res.data.success) {
        console.log('API response:', res.data);
        toast.success(
          modalType === 'add' 
            ? 'Thêm mã giảm giá mới thành công' 
            : 'Cập nhật mã giảm giá thành công'
        );
        fetchData();
        closeModal();
      } else {
        console.error('API error response:', res.data);
        toast.error(res.data.message || 'Lỗi khi lưu mã giảm giá');
      }
    } catch (error) {
      console.error('Error saving coupon:', error);
      toast.error('Không thể lưu mã giảm giá: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý mã giảm giá</h1>
      </div>

      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div className="w-full md:w-2/3 space-y-4">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm mã giảm giá..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="submit" className="absolute right-3 top-2.5 text-gray-500 hover:text-blue-600">
                  <FaSearch />
                </button>
              </div>
            </form>

            <div className="flex flex-wrap gap-3">
              <div className="flex items-center space-x-2">
                <FaFilter className="text-gray-500" />
                <select
                  name="status"
                  value={filter.status}
                  onChange={handleFilterChange}
                  className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tất cả</option>
                  <option value="active">Đang kích hoạt</option>
                  <option value="inactive">Chưa kích hoạt</option>
                  <option value="expired">Đã hết hạn</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <FaPercentage className="text-gray-500" />
                <select
                  name="type"
                  value={filter.type}
                  onChange={handleFilterChange}
                  className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tất cả</option>
                  <option value="percentage">Theo phần trăm</option>
                  <option value="fixed">Theo số tiền</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex space-x-2 mt-4 md:mt-0">
            <button 
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              onClick={() => openModal('add')}
            >
              <FaPlus className="mr-2" />
              Thêm mã giảm giá
            </button>
            <button 
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              onClick={exportData}
            >
              <FaDownload className="mr-2" />
              Xuất dữ liệu
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="w-12 h-12 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="ml-3 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã giảm giá</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mô tả</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá trị</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giảm tối đa</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đơn tối thiểu</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lượt dùng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đã sử dụng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {coupons.length > 0 ? (
                  coupons.map((coupon) => (
                    <tr key={coupon._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{coupon._id.substring(0, 8)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FaTicketAlt className="mr-2 text-blue-500" />
                          <span className="text-sm font-medium text-gray-900">{coupon.code}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{coupon.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {coupon.discountType === 'percentage' ? 'Phần trăm' : 'Số tiền cố định'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDiscountValue(coupon.discountType, coupon.discountValue)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {coupon.maxDiscount > 0 && coupon.discountType === 'percentage'
                          ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(coupon.maxDiscount)
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {coupon.minPurchase > 0
                          ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(coupon.minPurchase)
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{coupon.usageLimit || 'Không giới hạn'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {coupon.usedCount !== undefined ? coupon.usedCount : 0} 
                        {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          coupon.isActive && isCouponActive(coupon.startDate, coupon.endDate) 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                        }`}>
                          {coupon.isActive && isCouponActive(coupon.startDate, coupon.endDate) ? 'Đang kích hoạt' : 'Không kích hoạt'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-3">
                          <button
                            className="text-blue-600 hover:text-blue-900"
                            onClick={() => openModal('edit', coupon)}
                            title="Chỉnh sửa"
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900"
                            onClick={() => openModal('delete', coupon)}
                            title="Xóa mã giảm giá"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="px-6 py-4 text-center text-sm text-gray-500">
                      Không có dữ liệu mã giảm giá
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  pagination.currentPage === 1 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Trước
              </button>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  pagination.currentPage === pagination.totalPages 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Sau
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Trang <span className="font-medium">{pagination.currentPage}</span> / <span className="font-medium">{pagination.totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={pagination.currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                      pagination.currentPage === 1 
                      ? 'text-gray-300 cursor-not-allowed' 
                      : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    &laquo;
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${
                      pagination.currentPage === 1 
                      ? 'text-gray-300 cursor-not-allowed' 
                      : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    &lsaquo;
                  </button>
                  
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    {pagination.currentPage} / {pagination.totalPages}
                  </span>
                  
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${
                      pagination.currentPage === pagination.totalPages 
                      ? 'text-gray-300 cursor-not-allowed' 
                      : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    &rsaquo;
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.totalPages)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                      pagination.currentPage === pagination.totalPages 
                      ? 'text-gray-300 cursor-not-allowed' 
                      : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    &raquo;
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40"></div>
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-screen overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold text-gray-800">
                  {modalType === 'add' && 'Thêm mã giảm giá mới'}
                  {modalType === 'edit' && 'Chỉnh sửa mã giảm giá'}
                  {modalType === 'delete' && 'Xác nhận xóa mã giảm giá'}
                </h2>
                {modalType === 'edit' && (
                  <div className="flex items-center">
                    {loadingMetadata && (
                      <div className="flex items-center mr-2">
                        <div className="w-4 h-4 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mr-1"></div>
                        <span className="text-xs text-gray-500">Đang tải...</span>
                      </div>
                    )}
                    {formData.applicableServices && formData.applicableServices.length > 0 && 
                      <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full flex items-center">
                        <FaTicketAlt className="mr-1" size={10} />
                        Dịch vụ: {formData.applicableServices.length}
                      </span>
                    }
                    {formData.applicableSpecialties && formData.applicableSpecialties.length > 0 && 
                      <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full flex items-center">
                        <FaPercentage className="mr-1" size={10} />
                        Chuyên khoa: {formData.applicableSpecialties.length}
                      </span>
                    }
                  </div>
                )}
                <button className="text-gray-500 hover:text-gray-700 text-xl" onClick={closeModal}>&times;</button>
              </div>
              
              <div className="p-6">
                {modalType === 'delete' && (
                  <div className="text-center">
                    <p className="mb-4">Bạn có chắc chắn muốn xóa mã giảm giá <strong>{selectedCoupon?.code}</strong>?</p>
                    <p className="text-gray-500">Hành động này không thể hoàn tác.</p>
                  </div>
                )}
                
                {(modalType === 'add' || modalType === 'edit') && (
                  <div className="space-y-6">
                    {loadingAction ? (
                      <div className="flex flex-col items-center justify-center py-8">
                        <div className="w-12 h-12 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
                        <p className="mt-3 text-gray-600">Đang tải dữ liệu...</p>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                              Mã giảm giá <span className="text-red-500">*</span>
                            </label>
                            <input 
                              type="text" 
                              id="code" 
                              name="code" 
                              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              value={formData.code}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                            <textarea 
                              id="description" 
                              name="description" 
                              rows="3" 
                              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              value={formData.description}
                              onChange={handleInputChange}
                            ></textarea>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label htmlFor="discountType" className="block text-sm font-medium text-gray-700 mb-1">Loại giảm giá</label>
                            <select 
                              id="discountType" 
                              name="discountType" 
                              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              value={formData.discountType}
                              onChange={handleInputChange}
                            >
                              <option value="percentage">Theo phần trăm</option>
                              <option value="fixed">Theo số tiền</option>
                            </select>
                          </div>
                          
                          <div>
                            <label htmlFor="discountValue" className="block text-sm font-medium text-gray-700 mb-1">
                              Giá trị giảm giá <span className="text-red-500">*</span>
                            </label>
                            <input 
                              type="number" 
                              id="discountValue" 
                              name="discountValue" 
                              min="0" 
                              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              value={formData.discountValue}
                              onChange={handleInputChange}
                              required
                            />
                            {formData.discountType === 'percentage' && 
                              <p className="mt-1 text-xs text-gray-500">Phần trăm từ 1-100</p>
                            }
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label htmlFor="maxDiscount" className="block text-sm font-medium text-gray-700 mb-1">Giảm tối đa</label>
                            <input 
                              type="number" 
                              id="maxDiscount" 
                              name="maxDiscount" 
                              min="0" 
                              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              value={formData.maxDiscount}
                              onChange={handleInputChange}
                              disabled={formData.discountType !== 'percentage'}
                            />
                            <p className="mt-1 text-xs text-gray-500">Chỉ áp dụng khi giảm theo phần trăm</p>
                          </div>
                          
                          <div>
                            <label htmlFor="minPurchase" className="block text-sm font-medium text-gray-700 mb-1">Đơn tối thiểu</label>
                            <input 
                              type="number" 
                              id="minPurchase" 
                              name="minPurchase" 
                              min="0" 
                              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              value={formData.minPurchase}
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                              Ngày bắt đầu <span className="text-red-500">*</span>
                            </label>
                            <input 
                              type="date" 
                              id="startDate" 
                              name="startDate" 
                              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              value={formData.startDate}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                              Ngày kết thúc <span className="text-red-500">*</span>
                            </label>
                            <input 
                              type="date" 
                              id="endDate" 
                              name="endDate" 
                              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              value={formData.endDate}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label htmlFor="usageLimit" className="block text-sm font-medium text-gray-700 mb-1">Số lần sử dụng tối đa</label>
                            <input 
                              type="number" 
                              id="usageLimit" 
                              name="usageLimit" 
                              min="1" 
                              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              value={formData.usageLimit}
                              onChange={handleInputChange}
                            />
                            {modalType === 'edit' && (
                              <p className="mt-1 text-xs text-gray-500">
                                Đã sử dụng: <span className="font-medium">{formData.usedCount || 0}</span>
                                {formData.usageLimit ? ` / ${formData.usageLimit}` : ''}
                              </p>
                            )}
                          </div>
                          
                          <div>
                            <label htmlFor="isActive" className="block text-sm font-medium text-gray-700 mb-3">Trạng thái</label>
                            <div className="flex items-center">
                              <input 
                                type="checkbox" 
                                id="isActive" 
                                name="isActive" 
                                checked={formData.isActive}
                                onChange={handleInputChange}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                                Kích hoạt
                              </label>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <label htmlFor="applicableServices" className="block text-sm font-medium text-gray-700 mb-1">Dịch vụ áp dụng</label>
                          {formData.applicableServices && formData.applicableServices.length > 0 && (
                            <div className="mb-2 p-2 bg-gray-50 rounded-md">
                              <p className="text-xs text-gray-500 mb-1">Đã chọn {formData.applicableServices.length} dịch vụ:</p>
                              <div className="flex flex-wrap gap-1">
                                {formData.applicableServices.map((serviceId, idx) => {
                                  const service = services.find(s => s._id === serviceId);
                                  const serviceName = service?.name || 'Dịch vụ không xác định';
                                  const servicePrice = service?.price ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(service.price) : '';
                                  
                                  return (
                                    <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      {serviceName} {servicePrice ? `(${servicePrice})` : ''}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          <select 
                            multiple 
                            id="applicableServices" 
                            name="applicableServices" 
                            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm h-32"
                            onChange={handleServicesChange}
                            value={formData.applicableServices}
                          >
                            {services.map(service => (
                              <option key={service._id} value={service._id}>
                                {service.name} - {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(service.price || 0)}
                              </option>
                            ))}
                          </select>
                          <p className="mt-1 text-xs text-gray-500">Giữ phím Ctrl để chọn nhiều dịch vụ. Để trống nếu áp dụng cho tất cả</p>
                        </div>
                        
                        <div>
                          <label htmlFor="applicableSpecialties" className="block text-sm font-medium text-gray-700 mb-1">Chuyên khoa áp dụng</label>
                          {formData.applicableSpecialties && formData.applicableSpecialties.length > 0 && (
                            <div className="mb-2 p-2 bg-gray-50 rounded-md">
                              <p className="text-xs text-gray-500 mb-1">Đã chọn {formData.applicableSpecialties.length} chuyên khoa:</p>
                              <div className="flex flex-wrap gap-1">
                                {formData.applicableSpecialties.map((specialtyId, idx) => {
                                  const specialty = specialties.find(s => s._id === specialtyId);
                                  const specialtyName = specialty?.name || 'Chuyên khoa không xác định';
                                  
                                  return (
                                    <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                      {specialtyName}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          <select 
                            multiple 
                            id="applicableSpecialties" 
                            name="applicableSpecialties" 
                            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm h-32"
                            onChange={handleSpecialtiesChange}
                            value={formData.applicableSpecialties}
                          >
                            {specialties.map(specialty => (
                              <option key={specialty._id} value={specialty._id}>
                                {specialty.name}
                              </option>
                            ))}
                          </select>
                          <p className="mt-1 text-xs text-gray-500">Giữ phím Ctrl để chọn nhiều chuyên khoa. Để trống nếu áp dụng cho tất cả</p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
              
              <div className="px-4 py-3 bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
                <button 
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={closeModal}
                >
                  Hủy
                </button>
                
                {modalType === 'delete' && (
                  <button 
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    onClick={() => handleDeleteCoupon(selectedCoupon._id)}
                  >
                    Xóa
                  </button>
                )}
                
                {(modalType === 'add' || modalType === 'edit') && (
                  <button 
                    className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      loadingAction 
                        ? 'bg-blue-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                    onClick={handleSubmit}
                    disabled={loadingAction}
                  >
                    {loadingAction ? 'Đang lưu...' : 'Lưu'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Coupons; 
