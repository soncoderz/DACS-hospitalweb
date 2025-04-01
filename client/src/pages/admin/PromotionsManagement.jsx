import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const PromotionsManagement = () => {
  const { admin } = useAuth();
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: 0,
    maxDiscount: 0,
    minPurchase: 0,
    startDate: '',
    endDate: '',
    isActive: true,
    usageLimit: 0,
    applicableServices: []
  });

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin/promotions');
      if (response.data.success) {
        setPromotions(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching promotions:', error);
      toast.error('Không thể tải danh sách khuyến mãi');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/api/admin/promotions', formData);
      if (response.data.success) {
        toast.success('Khuyến mãi được tạo thành công');
        setShowCreateForm(false);
        setFormData({
          code: '',
          description: '',
          discountType: 'percentage',
          discountValue: 0,
          maxDiscount: 0,
          minPurchase: 0,
          startDate: '',
          endDate: '',
          isActive: true,
          usageLimit: 0,
          applicableServices: []
        });
        fetchPromotions();
      }
    } catch (error) {
      console.error('Error creating promotion:', error);
      toast.error(error.response?.data?.message || 'Không thể tạo khuyến mãi');
    }
  };

  const togglePromotionStatus = async (promotionId, isActive) => {
    try {
      const response = await api.patch(`/api/admin/promotions/${promotionId}/status`, {
        isActive: !isActive
      });

      if (response.data.success) {
        toast.success(`Khuyến mãi đã được ${isActive ? 'vô hiệu hóa' : 'kích hoạt'}`);
        fetchPromotions();
      }
    } catch (error) {
      console.error('Error toggling promotion status:', error);
      toast.error('Không thể cập nhật trạng thái khuyến mãi');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý Khuyến mãi</h1>
        <button 
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Thêm Khuyến mãi
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-md overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mã
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mô tả
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giảm giá
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thời gian
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
              {promotions.map((promotion) => (
                <tr key={promotion._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{promotion.code}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">{promotion.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {promotion.discountType === 'percentage' 
                        ? `${promotion.discountValue}%` 
                        : `${promotion.discountValue.toLocaleString()}đ`}
                    </div>
                    {promotion.maxDiscount > 0 && (
                      <div className="text-xs text-gray-500">
                        Tối đa: {promotion.maxDiscount.toLocaleString()}đ
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(promotion.startDate)} - {formatDate(promotion.endDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${promotion.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {promotion.isActive ? 'Hoạt động' : 'Vô hiệu hóa'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => togglePromotionStatus(promotion._id, promotion.isActive)}
                      className={`text-sm ${promotion.isActive ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'} mx-2`}
                    >
                      {promotion.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                    </button>
                  </td>
                </tr>
              ))}
              {promotions.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
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
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full max-h-screen overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Thêm Khuyến mãi mới</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="code">
                  Mã khuyến mãi
                </label>
                <input
                  id="code"
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                  Mô tả
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  rows="3"
                  required
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="discountType">
                    Loại giảm giá
                  </label>
                  <select
                    id="discountType"
                    name="discountType"
                    value={formData.discountType}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  >
                    <option value="percentage">Phần trăm (%)</option>
                    <option value="fixed">Cố định (VNĐ)</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="discountValue">
                    Giá trị giảm giá
                  </label>
                  <input
                    id="discountValue"
                    type="number"
                    name="discountValue"
                    value={formData.discountValue}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="maxDiscount">
                    Giảm tối đa (VNĐ)
                  </label>
                  <input
                    id="maxDiscount"
                    type="number"
                    name="maxDiscount"
                    value={formData.maxDiscount}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    min="0"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="minPurchase">
                    Giá trị tối thiểu (VNĐ)
                  </label>
                  <input
                    id="minPurchase"
                    type="number"
                    name="minPurchase"
                    value={formData.minPurchase}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="startDate">
                    Ngày bắt đầu
                  </label>
                  <input
                    id="startDate"
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="endDate">
                    Ngày kết thúc
                  </label>
                  <input
                    id="endDate"
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="usageLimit">
                    Giới hạn sử dụng
                  </label>
                  <input
                    id="usageLimit"
                    type="number"
                    name="usageLimit"
                    value={formData.usageLimit}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">0 = Không giới hạn</p>
                </div>
                <div className="mb-4 flex items-center">
                  <input
                    id="isActive"
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-gray-700 text-sm font-bold" htmlFor="isActive">
                    Kích hoạt ngay
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between mt-6">
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
                  Tạo Khuyến mãi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromotionsManagement; 