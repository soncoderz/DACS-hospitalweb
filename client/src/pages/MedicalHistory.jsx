import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const MedicalHistory = () => {
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const { user } = useAuth();

  useEffect(() => {
    fetchMedicalHistory();
  }, [user, currentPage, pageSize, activeTab]);

  const fetchMedicalHistory = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await api.get(`/medical-records/history?page=${currentPage}&limit=${pageSize}`);
      
      if (response.data && response.data.records) {
        setMedicalRecords(response.data.records);
        setTotalItems(response.data.pagination.total);
        setTotalPages(response.data.pagination.totalPages);
      } else {
        setMedicalRecords([]);
        setTotalItems(0);
        setTotalPages(1);
      }
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch medical history:", err);
      setError("Không thể tải lịch sử khám bệnh. Vui lòng thử lại sau.");
      setLoading(false);
    }
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Handle page size change
  const handlePageSizeChange = (e) => {
    setPageSize(parseInt(e.target.value));
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const filteredRecords = medicalRecords.filter(record => {
    if (activeTab === 'all') return true;
    return record.status.toLowerCase() === activeTab;
  });

  const getStatusBadge = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status.toLowerCase()) {
      case 'completed':
      case 'hoàn thành':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
      case 'đã đặt lịch':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
      case 'đang khám':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
      case 'đã hủy':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status) => {
    if (!status) return 'Không xác định';
    
    switch (status.toLowerCase()) {
      case 'completed':
        return 'Hoàn thành';
      case 'scheduled':
        return 'Đã đặt lịch';
      case 'in_progress':
        return 'Đang khám';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  // Generate pagination numbers
  const generatePaginationNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always add first page
      pages.push(1);
      
      // Calculate start and end of the middle section
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust if at edges
      if (currentPage <= 2) {
        end = 4;
      } else if (currentPage >= totalPages - 1) {
        start = totalPages - 3;
      }
      
      // Add ellipsis after first page if needed
      if (start > 2) {
        pages.push('...');
      }
      
      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      // Add ellipsis before last page if needed
      if (end < totalPages - 1) {
        pages.push('...');
      }
      
      // Always add last page
      pages.push(totalPages);
    }
    
    return pages;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
            <div className="text-center text-red-500">
              <svg className="w-16 h-16 mx-auto text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-2xl font-semibold mt-4">{error}</h2>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                Tải lại trang
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md overflow-hidden max-w-6xl mx-auto">
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-800">Lịch sử khám bệnh</h1>
            <p className="text-sm text-gray-500 mt-1">Xem tất cả lịch sử khám bệnh của bạn</p>
          </div>

          {/* Filter tabs */}
          <div className="border-b border-gray-200">
            <div className="px-6 flex space-x-4 overflow-x-auto">
              <button
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'all'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => {
                  setActiveTab('all');
                  setCurrentPage(1);
                }}
              >
                Tất cả
              </button>
              <button
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'completed'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => {
                  setActiveTab('completed');
                  setCurrentPage(1);
                }}
              >
                Hoàn thành
              </button>
              <button
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'scheduled'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => {
                  setActiveTab('scheduled');
                  setCurrentPage(1);
                }}
              >
                Đã đặt lịch
              </button>
              <button
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'in_progress'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => {
                  setActiveTab('in_progress');
                  setCurrentPage(1);
                }}
              >
                Đang khám
              </button>
              <button
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'cancelled'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => {
                  setActiveTab('cancelled');
                  setCurrentPage(1);
                }}
              >
                Đã hủy
              </button>
            </div>
          </div>

          {filteredRecords.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Không có lịch sử khám bệnh</h3>
              <p className="mt-1 text-gray-500">
                {activeTab === 'all' 
                  ? 'Bạn chưa có lịch sử khám bệnh nào.' 
                  : `Không có lịch sử khám bệnh nào ở trạng thái "${
                      activeTab === 'completed' ? 'Hoàn thành' : 
                      activeTab === 'scheduled' ? 'Đã đặt lịch' :
                      activeTab === 'in_progress' ? 'Đang khám' : 'Đã hủy'
                    }".`}
              </p>
              <Link 
                to="/appointment" 
                className="mt-5 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark"
              >
                Đặt lịch khám mới
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dịch vụ
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ngày khám
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bác sĩ
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Chuyên khoa
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Chẩn đoán
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Chi tiết
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRecords.map((record) => (
                      <tr key={record._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {record.serviceName || 'Khám bệnh'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(record.appointmentDate || record.createdAt), 'dd/MM/yyyy HH:mm')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {record.doctor ? (
                              <>
                                {record.doctor.avatarUrl ? (
                                  <img 
                                    className="h-8 w-8 rounded-full mr-2" 
                                    src={record.doctor.avatarUrl.startsWith('http') 
                                      ? record.doctor.avatarUrl 
                                      : `${import.meta.env.VITE_API_URL}${record.doctor.avatarUrl}`} 
                                    alt={record.doctor.fullName || 'Doctor'} 
                                  />
                                ) : (
                                  <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center mr-2">
                                    {record.doctor.fullName?.charAt(0) || 'D'}
                                  </div>
                                )}
                                <div className="text-sm text-gray-900">{record.doctor.fullName || 'Chưa xác định'}</div>
                              </>
                            ) : (
                              <div className="text-sm text-gray-900">Chưa xác định</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {(record.specialty && record.specialty.name) || record.specialtyName || 'Chưa xác định'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="max-w-xs truncate">
                            {record.diagnosis || 'Chưa có chẩn đoán'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(record.status)}`}>
                            {formatStatus(record.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {record._id ? (
                            <Link 
                              to={`/medical-record/${record._id}`} 
                              className="text-primary hover:text-primary-dark"
                            >
                              Xem chi tiết
                            </Link>
                          ) : (
                            <span className="text-gray-400">Không có dữ liệu</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center mb-4 sm:mb-0">
                  <span className="text-sm text-gray-700">
                    Hiển thị <span className="font-medium">{filteredRecords.length}</span> / <span className="font-medium">{totalItems}</span> kết quả
                  </span>
                  <div className="ml-4">
                    <label htmlFor="pageSize" className="mr-2 text-sm text-gray-600">Số dòng:</label>
                    <select
                      id="pageSize"
                      name="pageSize"
                      value={pageSize}
                      onChange={handlePageSizeChange}
                      className="text-sm border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center justify-center sm:justify-end space-x-1">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded-md text-sm ${
                      currentPage === 1
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    &laquo;
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded-md text-sm ${
                      currentPage === 1
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    &lsaquo;
                  </button>
                  
                  {/* Page numbers */}
                  {generatePaginationNumbers().map((page, index) => (
                    page === '...' ? (
                      <span key={`ellipsis-${index}`} className="px-3 py-1 text-gray-700">...</span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-1 rounded-md text-sm ${
                          currentPage === page
                            ? 'bg-primary text-white'
                            : 'text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  ))}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded-md text-sm ${
                      currentPage === totalPages
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    &rsaquo;
                  </button>
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded-md text-sm ${
                      currentPage === totalPages
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    &raquo;
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicalHistory; 