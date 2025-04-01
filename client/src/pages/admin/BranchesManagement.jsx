import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const BranchesManagement = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phoneNumber: '',
    email: '',
    description: '',
    openingHours: '',
    services: [],
    isActive: true
  });

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      // Trong thực tế, gọi API từ server
      // const response = await api.get('/admin/branches');
      // setBranches(response.data);
      
      // Dữ liệu mẫu
      setBranches([
        {
          _id: '1',
          name: 'Bệnh viện Đa khoa Trung ương',
          address: '1 Đường Phạm Ngũ Lão, Quận 1, TP. Hồ Chí Minh',
          phoneNumber: '028 1234 5678',
          email: 'info@bvdktw.com',
          description: 'Bệnh viện đa khoa hàng đầu tại Thành phố Hồ Chí Minh',
          openingHours: 'Thứ 2 - Chủ Nhật: 07:00 - 20:00',
          services: ['Khám tổng quát', 'Nội khoa', 'Ngoại khoa', 'Sản phụ khoa'],
          isActive: true,
          createdAt: '2023-01-01'
        },
        {
          _id: '2',
          name: 'Phòng khám Đa khoa Quốc tế',
          address: '15 Đường Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
          phoneNumber: '028 8765 4321',
          email: 'contact@pkdkqt.com',
          description: 'Phòng khám quốc tế với đội ngũ bác sĩ có trình độ chuyên môn cao',
          openingHours: 'Thứ 2 - Thứ 7: 08:00 - 17:00',
          services: ['Khám tổng quát', 'Da liễu', 'Nội khoa', 'Nhi khoa'],
          isActive: true,
          createdAt: '2023-02-15'
        },
        {
          _id: '3',
          name: 'Bệnh viện Nhi đồng',
          address: '20 Đường Lý Thường Kiệt, Quận 10, TP. Hồ Chí Minh',
          phoneNumber: '028 2468 1357',
          email: 'info@bvnd.com',
          description: 'Bệnh viện chuyên khoa nhi hàng đầu khu vực phía Nam',
          openingHours: 'Thứ 2 - Chủ Nhật: 24/24',
          services: ['Nhi khoa', 'Nhi ngoại', 'Tiêm chủng', 'Dinh dưỡng nhi'],
          isActive: true,
          createdAt: '2023-03-10'
        },
        {
          _id: '4',
          name: 'Phòng khám Chuyên khoa Mắt',
          address: '5 Đường Hai Bà Trưng, Quận 3, TP. Hồ Chí Minh',
          phoneNumber: '028 1357 2468',
          email: 'contact@matcare.com',
          description: 'Phòng khám chuyên khoa mắt với trang thiết bị hiện đại',
          openingHours: 'Thứ 2 - Thứ 6: 08:00 - 17:00, Thứ 7: 08:00 - 12:00',
          services: ['Khám mắt', 'Đo thị lực', 'Điều trị tật khúc xạ', 'Phẫu thuật mắt'],
          isActive: false,
          createdAt: '2023-04-05'
        },
        {
          _id: '5',
          name: 'Bệnh viện Đa khoa Tỉnh',
          address: '10 Đường 30/4, TP. Cần Thơ',
          phoneNumber: '0292 3456 789',
          email: 'info@bvdkct.com',
          description: 'Bệnh viện đa khoa hàng đầu khu vực Đồng bằng sông Cửu Long',
          openingHours: 'Thứ 2 - Chủ Nhật: 24/24',
          services: ['Khám tổng quát', 'Nội khoa', 'Ngoại khoa', 'Tim mạch', 'Sản phụ khoa'],
          isActive: true,
          createdAt: '2023-01-20'
        }
      ]);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching branches:', error);
      setError('Không thể tải danh sách chi nhánh. Vui lòng thử lại sau.');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleServicesChange = (e) => {
    const { value } = e.target;
    // Chuyển giá trị từ chuỗi nhiều dòng thành mảng
    const servicesArray = value.split('\n').filter(service => service.trim() !== '');
    setFormData(prevData => ({
      ...prevData,
      services: servicesArray
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editMode) {
        // Cập nhật chi nhánh hiện có
        // const response = await api.put(`/admin/branches/${selectedBranch._id}`, formData);
        
        // Cập nhật state
        setBranches(prevBranches => prevBranches.map(branch => 
          branch._id === selectedBranch._id ? { ...branch, ...formData } : branch
        ));
      } else {
        // Tạo chi nhánh mới
        // const response = await api.post('/admin/branches', formData);
        
        // Thêm chi nhánh mới vào state với _id giả
        const newBranch = {
          ...formData,
          _id: Date.now().toString(),
          createdAt: new Date().toISOString().split('T')[0]
        };
        setBranches(prevBranches => [...prevBranches, newBranch]);
      }

      // Reset form và ẩn form
      resetForm();
      setShowForm(false);
      setError(null);
    } catch (error) {
      console.error('Error saving branch:', error);
      setError('Không thể lưu thông tin chi nhánh. Vui lòng thử lại sau.');
    }
  };

  const handleEdit = (branch) => {
    setSelectedBranch(branch);
    
    setFormData({
      name: branch.name || '',
      address: branch.address || '',
      phoneNumber: branch.phoneNumber || '',
      email: branch.email || '',
      description: branch.description || '',
      openingHours: branch.openingHours || '',
      services: branch.services || [],
      isActive: branch.isActive !== undefined ? branch.isActive : true
    });
    
    setEditMode(true);
    setShowForm(true);
  };

  const handleDelete = async (branchId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa chi nhánh này?')) {
      return;
    }

    try {
      // Xóa chi nhánh từ API
      // await api.delete(`/admin/branches/${branchId}`);
      
      // Cập nhật state
      setBranches(prevBranches => prevBranches.filter(branch => branch._id !== branchId));
    } catch (error) {
      console.error('Error deleting branch:', error);
      setError('Không thể xóa chi nhánh. Vui lòng thử lại sau.');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      phoneNumber: '',
      email: '',
      description: '',
      openingHours: '',
      services: [],
      isActive: true
    });
    setEditMode(false);
    setSelectedBranch(null);
  };

  const handleAddNew = () => {
    resetForm();
    setShowForm(true);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
    setError(null);
  };

  // Lọc chi nhánh theo từ khóa tìm kiếm
  const filteredBranches = branches.filter(branch => {
    const searchFields = [
      branch.name,
      branch.address,
      branch.phoneNumber,
      branch.email,
      branch.description
    ].map(field => (field || '').toLowerCase());
    
    return searchFields.some(field => field.includes(searchTerm.toLowerCase()));
  });

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <div className="admin-branches-management">
      <div className="admin-section-header">
        <h1>Quản lý chi nhánh</h1>
        <button className="btn btn-primary" onClick={handleAddNew}>
          <i className="fas fa-plus"></i> Thêm chi nhánh mới
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="admin-filter-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Tìm kiếm tên, địa chỉ, số điện thoại..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <i className="fas fa-search"></i>
        </div>
      </div>

      {showForm && (
        <div className="admin-form-card">
          <div className="admin-form-header">
            <h2>{editMode ? 'Cập nhật chi nhánh' : 'Thêm chi nhánh mới'}</h2>
            <button className="btn-icon" onClick={handleCancel}>
              <i className="fas fa-times"></i>
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Tên chi nhánh <span className="required">*</span></label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email <span className="required">*</span></label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phoneNumber">Số điện thoại <span className="required">*</span></label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="openingHours">Giờ mở cửa <span className="required">*</span></label>
                <input
                  type="text"
                  id="openingHours"
                  name="openingHours"
                  value={formData.openingHours}
                  onChange={handleChange}
                  required
                  placeholder="Ví dụ: Thứ 2 - Thứ 6: 08:00 - 17:00"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="address">Địa chỉ <span className="required">*</span></label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Mô tả</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
              ></textarea>
            </div>
            
            <div className="form-group">
              <label htmlFor="services">Dịch vụ (mỗi dịch vụ một dòng)</label>
              <textarea
                id="services"
                name="services"
                value={formData.services.join('\n')}
                onChange={handleServicesChange}
                rows="5"
                placeholder="Nhập mỗi dịch vụ trên một dòng"
              ></textarea>
            </div>
            
            <div className="form-group checkbox-group">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
              />
              <label htmlFor="isActive">Hoạt động</label>
            </div>
            
            <div className="form-actions">
              <button type="button" className="btn btn-outline" onClick={handleCancel}>
                Hủy
              </button>
              <button type="submit" className="btn btn-primary">
                {editMode ? 'Cập nhật' : 'Thêm mới'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading-indicator">Đang tải...</div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Tên chi nhánh</th>
                <th>Địa chỉ</th>
                <th>Số điện thoại</th>
                <th>Email</th>
                <th>Giờ mở cửa</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredBranches.length > 0 ? (
                filteredBranches.map(branch => (
                  <tr key={branch._id}>
                    <td>{branch.name}</td>
                    <td>{branch.address}</td>
                    <td>{branch.phoneNumber}</td>
                    <td>{branch.email}</td>
                    <td>{branch.openingHours}</td>
                    <td>
                      <span className={`status-badge ${branch.isActive ? 'active' : 'inactive'}`}>
                        {branch.isActive ? 'Hoạt động' : 'Không hoạt động'}
                      </span>
                    </td>
                    <td>{formatDate(branch.createdAt)}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-icon btn-edit" 
                          onClick={() => handleEdit(branch)}
                          title="Chỉnh sửa"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button 
                          className="btn-icon btn-delete" 
                          onClick={() => handleDelete(branch._id)}
                          title="Xóa"
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="no-data">
                    Không tìm thấy chi nhánh nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BranchesManagement; 