import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaUserInjured, FaCalendarPlus, FaFileAlt, FaSort, FaFilter, FaUsers, FaAngleRight, FaAngleLeft } from 'react-icons/fa';
import api from '../../utils/api';

const Patients = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('fullName');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPatients();
  }, [currentPage, sortBy, sortOrder]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/doctors/patients?page=${currentPage}&limit=${itemsPerPage}&sort=${sortBy}&order=${sortOrder}`);
      
      if (response.data.success) {
        setPatients(response.data.data || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } else {
        setError(response.data.message || 'Failed to load patients');
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      setError('Could not load patient data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Tạo lịch hẹn mới với bệnh nhân
  const createAppointment = (patientId) => {
    navigate(`/doctor/appointments/create?patientId=${patientId}`);
  };

  // Xem hồ sơ y tế của bệnh nhân
  const viewMedicalRecords = (patientId) => {
    navigate(`/doctor/medical-records/${patientId}`);
  };

  // Sắp xếp bệnh nhân
  const handleSort = (field) => {
    if (sortBy === field) {
      // Nếu đang sắp xếp theo cùng field, đổi thứ tự
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Nếu sắp xếp theo field mới, mặc định là asc
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Lọc bệnh nhân theo search term
  const filteredPatients = patients.filter(
    patient =>
      patient.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phoneNumber?.includes(searchTerm)
  );

  // Format cho ngày sinh
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    }).format(date);
  };

  // Tính tuổi từ ngày sinh
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  // Render biểu tượng sắp xếp
  const renderSortIcon = (field) => {
    if (sortBy === field) {
      return <FaSort className={`sort-icon ${sortOrder === 'asc' ? 'text-green-500' : 'text-red-500'}`} />;
    }
    return <FaSort className="text-gray-400" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-primary/30 border-l-primary rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Đang tải danh sách bệnh nhân...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-6 rounded-lg text-center shadow-sm">
        <div className="text-red-600 text-lg mb-2">Lỗi</div>
        <p className="text-red-700">{error}</p>
        <button 
          onClick={fetchPatients}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-primary-dark to-primary p-4 sm:p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-xl sm:text-2xl font-bold flex items-center">
              <FaUsers className="mr-3" /> Quản lý bệnh nhân
            </h1>
            
            <div className="relative max-w-md w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-white/70" />
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, email, số điện thoại..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/20 border border-white/10 placeholder-white/70 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
          </div>
        </div>
        
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center text-gray-700">
              <span className="bg-primary/10 p-2 rounded-full mr-2">
                <FaUserInjured className="text-primary" />
              </span>
              <span className="font-medium text-sm sm:text-base">Tổng số: {patients.length} bệnh nhân</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="text-gray-500 flex-shrink-0">
                <FaFilter />
              </span>
              <select
                className="bg-white border border-gray-300 text-gray-700 rounded-lg px-2 sm:px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setSortOrder('asc');
                }}
                value={sortBy}
              >
                <option value="fullName">Sắp xếp theo tên</option>
                <option value="dateOfBirth">Sắp xếp theo tuổi</option>
                <option value="lastVisit">Sắp xếp theo lần khám gần đây</option>
                <option value="visitCount">Sắp xếp theo số lần khám</option>
              </select>
              <button
                className="bg-white border border-gray-300 text-gray-700 rounded-lg px-2 sm:px-3 py-1.5 hover:bg-gray-50 text-sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? 'Tăng dần' : 'Giảm dần'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-3 sm:px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('fullName')}>
                  <div className="flex items-center">
                    Họ tên {renderSortIcon('fullName')}
                  </div>
                </th>
                <th scope="col" className="px-3 sm:px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors hidden md:table-cell" onClick={() => handleSort('email')}>
                  <div className="flex items-center">
                    Email {renderSortIcon('email')}
                  </div>
                </th>
                <th scope="col" className="px-3 sm:px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  Số điện thoại
                </th>
                <th scope="col" className="px-3 sm:px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giới tính
                </th>
                <th scope="col" className="px-3 sm:px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors hidden md:table-cell" onClick={() => handleSort('dateOfBirth')}>
                  <div className="flex items-center">
                    Ngày sinh / Tuổi {renderSortIcon('dateOfBirth')}
                  </div>
                </th>
                <th scope="col" className="px-3 sm:px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors hidden lg:table-cell" onClick={() => handleSort('lastVisit')}>
                  <div className="flex items-center">
                    Lần khám gần nhất {renderSortIcon('lastVisit')}
                  </div>
                </th>
                <th scope="col" className="px-3 sm:px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors hidden sm:table-cell" onClick={() => handleSort('visitCount')}>
                  <div className="flex items-center">
                    Số lần khám {renderSortIcon('visitCount')}
                  </div>
                </th>
                <th scope="col" className="px-3 sm:px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPatients.map((patient) => (
                <tr key={patient._id} className="hover:bg-blue-50 transition-all duration-150">
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 transform hover:scale-110 transition-transform duration-300">
                        <img
                          src={patient.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.fullName || 'User')}&background=1AC0FF&color=fff`}
                          alt={patient.fullName}
                          className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover border border-gray-200 hover:border-blue-400"
                          onError={(e) => {
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.fullName || 'User')}&background=1AC0FF&color=fff`;
                          }}
                        />
                      </div>
                      <div className="ml-3 sm:ml-4">
                        <div className="text-sm font-medium text-gray-900">{patient.fullName}</div>
                        <div className="text-xs text-gray-500 sm:hidden">{patient.phoneNumber || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                    <div className="text-sm text-gray-600">{patient.email}</div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                    <div className="text-sm text-gray-600">{patient.phoneNumber || 'N/A'}</div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${patient.gender === 'male' ? 'bg-blue-100 text-blue-800' : 
                        patient.gender === 'female' ? 'bg-pink-100 text-pink-800' : 
                        'bg-gray-100 text-gray-800'}`}>
                      {patient.gender === 'male' ? 'Nam' : 
                       patient.gender === 'female' ? 'Nữ' : 
                       'Khác'}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                    <div className="text-sm text-gray-600">
                      {formatDate(patient.dateOfBirth)}
                      {patient.dateOfBirth && ` (${calculateAge(patient.dateOfBirth)} tuổi)`}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                    <div className="text-sm text-gray-600">
                      {patient.lastVisit ? formatDate(patient.lastVisit) : 'N/A'}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                    <div className="text-sm text-gray-600">
                      {patient.visitCount || 0}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      className="text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 px-2 sm:px-3 py-1.5 rounded-lg mr-2 transition-all duration-200 flex items-center text-xs sm:text-sm"
                      onClick={() => viewMedicalRecords(patient._id)}
                    >
                      <FaFileAlt className="mr-1.5" /> <span className="hidden sm:inline">Hồ sơ</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs sm:text-sm text-gray-700 mb-3 sm:mb-0">
              Trang <span className="font-medium">{currentPage}</span> / <span className="font-medium">{totalPages}</span>
            </div>
            <div className="flex justify-center sm:justify-end space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center px-2.5 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaAngleLeft className="mr-1.5" /> Trước
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage >= totalPages}
                className="inline-flex items-center px-2.5 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau <FaAngleRight className="ml-1.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Patients;
