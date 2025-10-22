import React, { useState, useEffect } from 'react';
import { FaEdit, FaSearch, FaFilter, FaDownload, FaCalendarAlt, FaUserMd, FaUser, FaHospital } from 'react-icons/fa';
import api from '../../utils/api';
import { toast } from 'react-toastify';


const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState({
    status: 'all',
    doctorId: 'all',
    hospitalId: 'all',
    date: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    pageSize: 10
  });
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const [formData, setFormData] = useState({
    status: '',
    notes: ''
  });
  const [loadingAction, setLoadingAction] = useState(false);

  useEffect(() => {
    fetchData();
    fetchDoctors();
    fetchHospitals();
  }, [pagination.currentPage, filter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Create date parameter in format expected by server
      const dateParam = filter.date ? new Date(filter.date).toISOString().split('T')[0] : '';
      
      // Build API URL with proper parameters
      const apiUrl = `/admin/appointments?page=${pagination.currentPage}&limit=${pagination.pageSize}&status=${filter.status}&doctorId=${filter.doctorId}&hospitalId=${filter.hospitalId}&date=${dateParam}&search=${searchTerm}`;
      
      console.log('Fetching appointments with URL:', apiUrl);
      
      const res = await api.get(apiUrl);
      console.log('Appointment response data:', res.data);
      
      if (res.data.success) {
        // The response format from the server has appointments in res.data.data
        if (res.data.data && Array.isArray(res.data.data)) {
          console.log(`Found ${res.data.data.length} appointments in res.data.data array`);
          setAppointments(res.data.data);
          setPagination({
            ...pagination,
            totalPages: Math.ceil(res.data.total / pagination.pageSize) || 1,
            currentPage: res.data.currentPage || 1
          });
        }
        // If no data or empty array
        else {
          console.log('No appointments data to display');
          setAppointments([]);
          setPagination({
            ...pagination,
            totalPages: res.data.totalPages || 1,
            currentPage: res.data.currentPage || 1
          });
        }
      } else {
        console.error('Failed to fetch appointments:', res.data);
        toast.error('Không thể tải dữ liệu lịch hẹn: ' + (res.data.message || 'Lỗi không xác định'));
        setAppointments([]);
        setPagination({
          ...pagination,
          totalPages: 1
        });
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Không thể tải dữ liệu lịch hẹn: ' + (error.message || 'Lỗi kết nối server'));
      setAppointments([]);
      setPagination({
        ...pagination,
        totalPages: 1
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await api.get('/admin/doctors');
      if (res.data.success) {
        if (res.data.data && Array.isArray(res.data.data)) {
          const formattedDoctors = res.data.data.map(doctor => ({
            _id: doctor._id,
            fullName: doctor.user?.fullName || doctor.fullInfo || 'Không xác định',
            specialtyName: doctor.specialtyId?.name,
            hospitalName: doctor.hospitalId?.name
          }));
          setDoctors(formattedDoctors);
        } else {
          console.error('No doctors found in response:', res.data);
          setDoctors([]);
        }
      } else {
        console.error('Failed to fetch doctors:', res.data);
        setDoctors([]);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setDoctors([]);
    }
  };

  const fetchHospitals = async () => {
    try {
      const res = await api.get('/admin/hospitals');
      if (res.data.success) {
        if (res.data.data && res.data.data.hospitals && Array.isArray(res.data.data.hospitals)) {
          const formattedHospitals = res.data.data.hospitals.map(hospital => ({
            _id: hospital._id,
            name: hospital.name,
            address: hospital.address
          }));
          setHospitals(formattedHospitals);
        } else {
          console.error('No hospitals found in response:', res.data);
          setHospitals([]);
        }
      } else {
        console.error('Failed to fetch hospitals:', res.data);
        setHospitals([]);
      }
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      setHospitals([]);
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

  const openModal = (type, appointment = null) => {
    setModalType(type);
    setSelectedAppointment(appointment);
    if (appointment) {
      setFormData({
        status: appointment.status || '',
        notes: appointment.notes || ''
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedAppointment(null);
    setModalType('');
  };

  const exportData = () => {
    // Xuất dữ liệu dưới dạng CSV
    const fields = ['_id', 'patientName', 'doctorId.fullName', 'hospitalId.name', 'appointmentDate', 'appointmentTime', 'status', 'createdAt'];
    
    const csvContent = [
      // Header
      fields.join(','),
      // Rows
      ...appointments.map(item => 
        fields.map(field => {
          // Xử lý trường hợp nested field (doctorId.fullName)
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
    link.setAttribute('download', `appointments_${new Date().toISOString().split('T')[0]}.csv`);
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

  // Format time 
  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleUpdateAppointment = async () => {
    try {
      setLoadingAction(true);
      // Only allow the specified status values
      if (!['no-show', 'completed', 'cancelled'].includes(formData.status)) {
        toast.error('Trạng thái không hợp lệ');
        return;
      }
      
      const res = await api.put(`/admin/appointments/${selectedAppointment._id}`, {
        status: formData.status,
        notes: formData.notes
      });
      
      if (res.data.success) {
        toast.success('Đã cập nhật lịch hẹn thành công');
        fetchData();
        closeModal();
      } else {
        toast.error(res.data.message || 'Không thể cập nhật lịch hẹn');
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast.error('Không thể cập nhật lịch hẹn: ' + (error.response?.data?.message || error.message || 'Lỗi không xác định'));
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý lịch hẹn</h1>
      </div>

      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div className="w-full md:w-2/3 space-y-4">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên bệnh nhân..."
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
                  <option value="pending">Chờ xác nhận</option>
                  <option value="confirmed">Đã xác nhận</option>
                  <option value="completed">Đã hoàn thành</option>
                  <option value="cancelled">Đã hủy</option>
                  <option value="rescheduled">Đổi lịch</option>
                  <option value="no-show">Không đến</option>
                  <option value="rejected">Từ chối</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <FaUserMd className="text-gray-500" />
                <select
                  name="doctorId"
                  value={filter.doctorId}
                  onChange={handleFilterChange}
                  className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tất cả</option>
                  {doctors.map(doctor => (
                    <option key={doctor._id} value={doctor._id}>
                      {doctor.fullName}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <FaHospital className="text-gray-500" />
                <select
                  name="hospitalId"
                  value={filter.hospitalId}
                  onChange={handleFilterChange}
                  className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tất cả</option>
                  {hospitals.map(hospital => (
                    <option key={hospital._id} value={hospital._id}>
                      {hospital.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <FaCalendarAlt className="text-gray-500" />
                <input
                  type="date"
                  name="date"
                  value={filter.date}
                  onChange={handleFilterChange}
                  className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 mt-4 md:mt-0">
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã đặt lịch</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên bệnh nhân</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bác sĩ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cơ sở y tế</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày hẹn</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giờ hẹn</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {appointments.length > 0 ? (
                  appointments.map((appointment) => (
                    <tr key={appointment._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{appointment.bookingCode || appointment._id.substring(0, 8)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{appointment.patientId ? appointment.patientId.fullName : 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{appointment.doctorId && appointment.doctorId.user ? appointment.doctorId.user.fullName : 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{appointment.hospitalId ? appointment.hospitalId.name : 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(appointment.appointmentDate)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {appointment.timeSlot ? 
                          `${appointment.timeSlot.startTime} - ${appointment.timeSlot.endTime}` : 
                          'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                          ${appointment.status === 'confirmed' ? 'bg-blue-100 text-blue-800' : ''}
                          ${appointment.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                          ${appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
                          ${appointment.status === 'rescheduled' ? 'bg-purple-100 text-purple-800' : ''}
                          ${appointment.status === 'no-show' ? 'bg-gray-100 text-gray-800' : ''}
                          ${appointment.status === 'rejected' ? 'bg-red-100 text-red-800' : ''}
                        `}>
                          {appointment.status === 'pending' && 'Chờ xác nhận'}
                          {appointment.status === 'confirmed' && 'Đã xác nhận'}
                          {appointment.status === 'completed' && 'Đã hoàn thành'}
                          {appointment.status === 'cancelled' && 'Đã hủy'}
                          {appointment.status === 'rescheduled' && 'Đổi lịch'}
                          {appointment.status === 'no-show' && 'Không đến'}
                          {appointment.status === 'rejected' && 'Từ chối'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(appointment.createdAt)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          className="text-blue-600 hover:text-blue-900"
                          onClick={() => openModal('edit', appointment)}
                          title="Cập nhật trạng thái"
                        >
                          <FaEdit />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="px-6 py-4 text-center text-sm text-gray-500">
                      Không có dữ liệu lịch hẹn
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
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold text-gray-800">
                  {modalType === 'edit' && 'Cập nhật trạng thái lịch hẹn'}
                </h2>
                <button className="text-gray-500 hover:text-gray-700" onClick={closeModal}>&times;</button>
              </div>
              
              <div className="p-6">
                {modalType === 'edit' && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-md mb-4">
                      <p className="text-sm"><span className="font-medium">Bệnh nhân:</span> {selectedAppointment?.patientId?.fullName}</p>
                      <p className="text-sm"><span className="font-medium">Bác sĩ:</span> {selectedAppointment?.doctorId?.user?.fullName}</p>
                      <p className="text-sm"><span className="font-medium">Ngày hẹn:</span> {formatDate(selectedAppointment?.appointmentDate)}</p>
                      <p className="text-sm"><span className="font-medium">Giờ hẹn:</span> {selectedAppointment?.timeSlot ? 
                          `${selectedAppointment.timeSlot.startTime} - ${selectedAppointment.timeSlot.endTime}` : 
                          'N/A'}</p>
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                      <select 
                        id="status" 
                        name="status" 
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={formData.status}
                        onChange={handleInputChange}
                      >
                        <option value="no-show">Không đến</option>
                        <option value="completed">Đã hoàn thành</option>
                        <option value="cancelled">Đã hủy</option>
                      </select>
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                      <textarea 
                        id="notes" 
                        name="notes" 
                        rows="3" 
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={formData.notes}
                        onChange={handleInputChange}
                        placeholder="Nhập ghi chú về lịch hẹn..."
                      ></textarea>
                    </div>
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
                {modalType === 'edit' && (
                  <button 
                    className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      loadingAction 
                        ? 'bg-blue-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                    onClick={handleUpdateAppointment}
                    disabled={loadingAction}
                  >
                    {loadingAction ? 'Đang cập nhật...' : 'Cập nhật'}
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

export default Appointments; 
