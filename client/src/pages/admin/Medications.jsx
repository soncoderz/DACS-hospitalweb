import React, { useState, useEffect } from 'react';
import { 
  FaMedkit, FaSearch, FaPlus, FaEdit, FaTrash, 
  FaFilter, FaSave, FaTimes, FaExclamationTriangle, FaEye
} from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import api from '../../utils/api';

const Medications = () => {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [categories, setCategories] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [medicationToDelete, setMedicationToDelete] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    defaultDosage: '',
    defaultUsage: '',
    defaultDuration: '',
    sideEffects: '',
    contraindications: '',
    manufacturer: '',
    unitType: 'pill',
    unitTypeDisplay: 'viên',
    stockQuantity: 0,
    lowStockThreshold: 10
  });

  useEffect(() => {
    fetchMedications();
    fetchCategories();
  }, [currentPage, categoryFilter]);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const response = await api.get('/medications/categories');
      if (response.data.success) {
        setCategories(response.data.data);
      } else {
        console.error('Failed to load categories:', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchMedications = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/medications/medications', {
        params: {
          page: currentPage,
          limit: 10,
          search: searchTerm,
          category: categoryFilter
        }
      });
      
      if (response.data.success) {
        setMedications(response.data.data.docs);
        setTotalPages(response.data.data.totalPages);
      } else {
        setError(response.data.message || 'Không thể tải danh sách thuốc');
      }
    } catch (error) {
      console.error('Error fetching medications:', error);
      setError('Đã xảy ra lỗi khi tải danh sách thuốc');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchMedications();
  };

  const resetSearch = () => {
    setSearchTerm('');
    setCurrentPage(1);
    setCategoryFilter('all');
    fetchMedications();
  };

  const openModal = (medication = null) => {
    if (medication) {
      setSelectedMedication(medication);
      setFormData({
        name: medication.name || '',
        description: medication.description || '',
        category: medication.category || '',
        defaultDosage: medication.defaultDosage || '',
        defaultUsage: medication.defaultUsage || '',
        defaultDuration: medication.defaultDuration || '',
        sideEffects: medication.sideEffects || '',
        contraindications: medication.contraindications || '',
        manufacturer: medication.manufacturer || '',
        unitType: medication.unitType || 'pill',
        unitTypeDisplay: medication.unitTypeDisplay || 'viên',
        stockQuantity: medication.stockQuantity || 0,
        lowStockThreshold: medication.lowStockThreshold || 10
      });
    } else {
      setSelectedMedication(null);
      setFormData({
        name: '',
        description: '',
        category: '',
        defaultDosage: '',
        defaultUsage: '',
        defaultDuration: '',
        sideEffects: '',
        contraindications: '',
        manufacturer: '',
        unitType: 'pill',
        unitTypeDisplay: 'viên',
        stockQuantity: 0,
        lowStockThreshold: 10
      });
    }
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name.trim() || !formData.category) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    
    try {
      let response;
      
      if (selectedMedication) {
        // Update existing medication
        response = await api.put(`/admin/medications/${selectedMedication._id}`, formData);
        if (response.data.success) {
          toast.success('Cập nhật thuốc thành công');
          setMedications(medications.map(med => 
            med._id === selectedMedication._id ? response.data.data : med
          ));
        }
      } else {
        // Create new medication
        response = await api.post('/admin/medications', formData);
        if (response.data.success) {
          toast.success('Thêm thuốc mới thành công');
          fetchMedications(); // Refresh the list
        }
      }
      
      setShowModal(false);
    } catch (error) {
      console.error('Error saving medication:', error);
      toast.error(error.response?.data?.message || 'Đã xảy ra lỗi khi lưu thông tin thuốc');
    }
  };

  const confirmDelete = (medication) => {
    setMedicationToDelete(medication);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!medicationToDelete) return;
    
    try {
      const response = await api.delete(`/admin/medications/${medicationToDelete._id}`);
      
      if (response.data.success) {
        toast.success('Xóa thuốc thành công');
        // Remove from local state
        setMedications(medications.filter(med => med._id !== medicationToDelete._id));
        setShowDeleteConfirm(false);
        setMedicationToDelete(null);
      } else {
        toast.error(response.data.message || 'Không thể xóa thuốc');
      }
    } catch (error) {
      console.error('Error deleting medication:', error);
      toast.error(error.response?.data?.message || 'Đã xảy ra lỗi khi xóa thuốc');
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : categoryId;
  };

  const viewMedicationDetails = (medication) => {
    setSelectedMedication(medication);
    setShowViewModal(true);
  };

  // Render functions for UI components
  const renderSearchBar = () => (
    <div className="mb-6">
      <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm theo tên thuốc..."
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
        
        <div className="md:w-64">
          <div className="flex items-center bg-gray-100 rounded-lg px-3">
            <FaFilter className="text-gray-500 mr-2" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="block w-full py-2 bg-transparent border-0 focus:outline-none focus:ring-0"
            >
              <option value="all">Tất cả danh mục</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            <FaSearch className="inline mr-1" /> Tìm kiếm
          </button>
          <button
            type="button"
            onClick={resetSearch}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <FaTimes className="inline mr-1" /> Đặt lại
          </button>
        </div>
      </form>
    </div>
  );

  const renderMedicationTable = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-20">
          <div className="text-center">
            <div className="inline-block w-12 h-12 border-4 border-primary/30 border-l-primary rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600">Đang tải danh sách thuốc...</p>
          </div>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
          <div className="flex items-center">
            <FaExclamationTriangle className="text-lg mr-2" />
            <p>{error}</p>
          </div>
        </div>
      );
    }
    
    if (medications.length === 0) {
      return (
        <div className="bg-gray-50 p-6 rounded-lg text-center">
          <FaMedkit className="text-4xl text-gray-300 mx-auto mb-3" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">Không tìm thấy thuốc nào</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || categoryFilter !== 'all' 
              ? 'Không có kết quả phù hợp với tìm kiếm của bạn' 
              : 'Chưa có thuốc nào trong hệ thống'}
          </p>
          <button
            onClick={() => openModal()}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            <FaPlus className="inline mr-1.5" /> Thêm thuốc mới
          </button>
        </div>
      );
    }
    
    return (
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên thuốc
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Danh mục
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tồn kho
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {medications.map(medication => (
                <tr key={medication._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{medication.name}</div>
                    <div className="text-sm text-gray-500 truncate max-w-[250px]">
                      {medication.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {getCategoryName(medication.category)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        medication.stockQuantity <= 0 ? 'bg-red-500' : 
                        medication.stockQuantity <= medication.lowStockThreshold ? 'bg-yellow-500' : 
                        'bg-green-500'
                      }`}></div>
                      <span className="text-gray-900 font-medium">{medication.stockQuantity}</span>
                      <span className="text-gray-500 ml-1">{medication.unitTypeDisplay}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    <button
                      onClick={() => viewMedicationDetails(medication)}
                      className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none mr-2"
                    >
                      <FaEye className="mr-1" /> Chi tiết
                    </button>
                    <button
                      onClick={() => openModal(medication)}
                      className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none mr-2"
                    >
                      <FaEdit className="mr-1" /> Sửa
                    </button>
                    <button
                      onClick={() => confirmDelete(medication)}
                      className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none"
                    >
                      <FaTrash className="mr-1" /> Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Trang <span className="font-medium">{currentPage}</span> / <span className="font-medium">{totalPages}</span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              <button
                onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMedicationModal = () => {
    if (!showModal) return null;
    
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800">
              {selectedMedication ? 'Cập nhật thông tin thuốc' : 'Thêm thuốc mới'}
            </h3>
            <button
              className="text-gray-400 hover:text-gray-500"
              onClick={() => setShowModal(false)}
            >
              <FaTimes />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="px-6 py-4">
            <div className="mb-6">
              <h4 className="text-lg font-medium text-gray-700 mb-3">Thông tin cơ bản</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Tên thuốc *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>
                
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Danh mục *</label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="manufacturer" className="block text-sm font-medium text-gray-700 mb-1">Nhà sản xuất</label>
                  <input
                    type="text"
                    id="manufacturer"
                    name="manufacturer"
                    value={formData.manufacturer}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <h4 className="text-lg font-medium text-gray-700 mb-3">Quản lý kho</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="unitType" className="block text-sm font-medium text-gray-700 mb-1">Loại đơn vị *</label>
                  <select
                    id="unitType"
                    name="unitType"
                    value={formData.unitType}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  >
                    <option value="pill">Viên</option>
                    <option value="bottle">Chai/Lọ</option>
                    <option value="package">Hộp/Gói</option>
                    <option value="patch">Miếng dán</option>
                    <option value="cream">Tuýp/Kem</option>
                    <option value="inhaler">Ống hít</option>
                    <option value="injection">Ống tiêm</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="unitTypeDisplay" className="block text-sm font-medium text-gray-700 mb-1">Hiển thị đơn vị *</label>
                  <input
                    type="text"
                    id="unitTypeDisplay"
                    name="unitTypeDisplay"
                    value={formData.unitTypeDisplay}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                    placeholder="viên, lọ, hộp..."
                  />
                </div>
                
                <div>
                  <label htmlFor="stockQuantity" className="block text-sm font-medium text-gray-700 mb-1">Số lượng tồn *</label>
                  <input
                    type="number"
                    id="stockQuantity"
                    name="stockQuantity"
                    value={formData.stockQuantity}
                    onChange={handleInputChange}
                    min="0"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>
                
                <div>
                  <label htmlFor="lowStockThreshold" className="block text-sm font-medium text-gray-700 mb-1">Ngưỡng cảnh báo hết</label>
                  <input
                    type="number"
                    id="lowStockThreshold"
                    name="lowStockThreshold"
                    value={formData.lowStockThreshold}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <h4 className="text-lg font-medium text-gray-700 mb-3">Thông tin sử dụng</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="defaultDosage" className="block text-sm font-medium text-gray-700 mb-1">Liều lượng mặc định</label>
                  <input
                    type="text"
                    id="defaultDosage"
                    name="defaultDosage"
                    value={formData.defaultDosage}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>
                
                <div>
                  <label htmlFor="defaultUsage" className="block text-sm font-medium text-gray-700 mb-1">Cách dùng mặc định</label>
                  <input
                    type="text"
                    id="defaultUsage"
                    name="defaultUsage"
                    value={formData.defaultUsage}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>
                
                <div>
                  <label htmlFor="defaultDuration" className="block text-sm font-medium text-gray-700 mb-1">Thời gian dùng mặc định</label>
                  <input
                    type="text"
                    id="defaultDuration"
                    name="defaultDuration"
                    value={formData.defaultDuration}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label htmlFor="sideEffects" className="block text-sm font-medium text-gray-700 mb-1">Tác dụng phụ</label>
                  <textarea
                    id="sideEffects"
                    name="sideEffects"
                    value={formData.sideEffects}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label htmlFor="contraindications" className="block text-sm font-medium text-gray-700 mb-1">Chống chỉ định</label>
                  <textarea
                    id="contraindications"
                    name="contraindications"
                    value={formData.contraindications}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 border-t border-gray-200 pt-4">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
              >
                <FaSave className="inline mr-1.5" /> {selectedMedication ? 'Cập nhật' : 'Thêm mới'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderDeleteConfirmation = () => {
    if (!showDeleteConfirm) return null;
    
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
          <div className="p-6 text-center">
            <FaExclamationTriangle className="mx-auto mb-4 text-5xl text-yellow-400" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">Xác nhận xóa</h3>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn xóa thuốc "<span className="font-medium">{medicationToDelete?.name}</span>"?
              Dữ liệu đã xóa không thể khôi phục.
            </p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderViewModal = () => {
    if (!showViewModal || !selectedMedication) return null;
    
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center">
              <FaMedkit className="mr-2 text-primary" /> Chi tiết thuốc
            </h3>
            <button
              className="text-gray-400 hover:text-gray-500"
              onClick={() => setShowViewModal(false)}
            >
              <FaTimes />
            </button>
          </div>
          
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{selectedMedication.name}</h2>
              <span className="px-3 py-1 inline-flex text-sm font-medium rounded-full bg-blue-100 text-blue-800">
                {getCategoryName(selectedMedication.category)}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="text-sm uppercase tracking-wider text-gray-500 mb-2">Mô tả</h4>
                <p className="text-gray-700">{selectedMedication.description || 'Không có mô tả'}</p>
              </div>
              
              <div>
                <h4 className="text-sm uppercase tracking-wider text-gray-500 mb-2">Nhà sản xuất</h4>
                <p className="text-gray-700">{selectedMedication.manufacturer || 'Không có thông tin'}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm uppercase tracking-wider text-gray-500 mb-2">Liều lượng</h4>
                <p className="text-gray-700">{selectedMedication.defaultDosage || 'Không có thông tin'}</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm uppercase tracking-wider text-gray-500 mb-2">Cách dùng</h4>
                <p className="text-gray-700">{selectedMedication.defaultUsage || 'Không có thông tin'}</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm uppercase tracking-wider text-gray-500 mb-2">Thời gian sử dụng</h4>
                <p className="text-gray-700">{selectedMedication.defaultDuration || 'Không có thông tin'}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <div>
                <h4 className="text-sm uppercase tracking-wider text-gray-500 mb-2">Tác dụng phụ</h4>
                <p className="text-gray-700">{selectedMedication.sideEffects || 'Không có thông tin'}</p>
              </div>
              
              <div>
                <h4 className="text-sm uppercase tracking-wider text-gray-500 mb-2">Chống chỉ định</h4>
                <p className="text-gray-700">{selectedMedication.contraindications || 'Không có thông tin'}</p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end p-6 border-t border-gray-200">
            <button
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors mr-3"
              onClick={() => setShowViewModal(false)}
            >
              Đóng
            </button>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              onClick={() => {
                setShowViewModal(false);
                openModal(selectedMedication);
              }}
            >
              <FaEdit className="inline mr-1" /> Chỉnh sửa
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      
      {/* Header */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <FaMedkit className="mr-2 text-primary" /> Quản lý thuốc
          </h1>
          <button
            onClick={() => openModal()}
            className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors shadow-sm"
          >
            <FaPlus className="mr-1.5" /> Thêm thuốc mới
          </button>
        </div>
      </div>
      
      {/* Search and Filter */}
      {renderSearchBar()}
      
      {/* Table */}
      {renderMedicationTable()}
      
      {/* Modals */}
      {renderMedicationModal()}
      {renderDeleteConfirmation()}
      {renderViewModal()}
    </div>
  );
};

export default Medications; 