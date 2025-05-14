import React, { useState, useEffect } from 'react';
import { FaSearch, FaFilter, FaDownload, FaStar, FaUserMd, FaReply, FaTrash, FaHospital, FaHashtag, FaTimes, FaUser, FaInfoCircle } from 'react-icons/fa';
import api from '../../utils/api';
import { toast } from 'react-toastify';


const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [doctorNameFilter, setDoctorNameFilter] = useState('');
  const [hospitalNameFilter, setHospitalNameFilter] = useState('');
  const [filter, setFilter] = useState({
    rating: 'all',
    doctorId: 'all',
    hospitalId: 'all',
    status: 'all'
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    pageSize: 10
  });
  const [selectedReview, setSelectedReview] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const [replyText, setReplyText] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    averageRating: 0,
    ratingCounts: {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0
    },
    replied: 0,
    notReplied: 0
  });
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);
  const [user, setUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteReplyModal, setDeleteReplyModal] = useState({
    isOpen: false,
    reviewId: null,
    replyId: null
  });

  useEffect(() => {
    fetchData();
    fetchDoctors();
    fetchHospitals();
    fetchStats();
    fetchUser();
  }, [pagination.currentPage, filter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Using new API endpoint for admin to see all reviews
      const res = await api.get(`/reviews/admin/all?page=${pagination.currentPage}&limit=${pagination.pageSize}&rating=${filter.rating}&doctorId=${filter.doctorId}&hospitalId=${filter.hospitalId}&status=${filter.status}&search=${searchTerm}&doctorName=${doctorNameFilter}&hospitalName=${hospitalNameFilter}&includeReplies=true`);
      
      if (res.data.success && res.data.data) {
        // Check for reviews in the data structure
        if (res.data.data.reviews && Array.isArray(res.data.data.reviews)) {
          setReviews(res.data.data.reviews);
          setPagination({
            ...pagination,
            totalPages: Math.ceil(res.data.data.total / pagination.pageSize) || 1
          });
        } 
        // For backward compatibility - check if data array is directly in res.data.data
        else if (Array.isArray(res.data.data)) {
          setReviews(res.data.data);
          setPagination({
            ...pagination,
            totalPages: Math.ceil(res.data.total / pagination.pageSize) || 1
          });
        } else {
          console.error('No reviews found in response:', res.data);
          setReviews([]);
          setPagination({
            ...pagination,
            totalPages: 1
          });
        }
      } else {
        console.error('Failed to fetch reviews:', res.data);
        setReviews([]);
        setPagination({
          ...pagination,
          totalPages: 1
        });
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Không thể tải dữ liệu đánh giá');
      setReviews([]);
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
          setDoctors(res.data.data);
        } else if (res.data.data && res.data.data.doctors && Array.isArray(res.data.data.doctors)) {
          setDoctors(res.data.data.doctors);
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
        if (res.data.data && Array.isArray(res.data.data)) {
          setHospitals(res.data.data);
        } else if (res.data.data && res.data.data.hospitals && Array.isArray(res.data.data.hospitals)) {
          setHospitals(res.data.data.hospitals);
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

  const fetchStats = async () => {
    try {
      const res = await api.get('/reviews/admin/stats');
      if (res.data.success) {
        // Initialize with default values to prevent undefined errors
        const statsData = res.data.data || {
          total: 0,
          averageRating: 0,
          ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          replied: 0,
          notReplied: 0
        };
        
        setStats({
          total: statsData.total || 0,
          averageRating: statsData.averageRating || 0,
          ratingCounts: statsData.ratingCounts || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          replied: statsData.replied || 0,
          notReplied: statsData.notReplied || 0
        });
      } else {
        console.error('Failed to fetch review statistics:', res.data);
      }
    } catch (error) {
      console.error('Error fetching review statistics:', error);
      // Set default values on error to prevent UI crashes
      setStats({
        total: 0,
        averageRating: 0,
        ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        replied: 0,
        notReplied: 0
      });
    }
  };

  const fetchUser = async () => {
    try {
      // Try to get the current authenticated user profile instead
      const res = await api.get('/auth/profile');
      if (res.data.success) {
        setUser(res.data.data);
      } else {
        console.error('Failed to fetch user:', res.data);
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      // Don't show an error to the user, just set default user
      setUser({
        fullName: 'Quản trị viên',
        roleType: 'admin'
      });
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

  const fetchReviewDetails = async (reviewId) => {
    setIsLoadingReplies(true);
    try {
      const res = await api.get(`/reviews/${reviewId}?includeReplies=true`);
      if (res.data.success && res.data.data) {
        setSelectedReview(res.data.data);
      } else {
        toast.error('Không thể tải chi tiết đánh giá');
      }
    } catch (error) {
      console.error('Error fetching review details:', error);
      toast.error('Không thể tải chi tiết đánh giá');
    } finally {
      setIsLoadingReplies(false);
    }
  };

  const openModal = (type, review = null) => {
    setModalType(type);
    setSelectedReview(review);
    if (type === 'reply') {
      setReplyText(review.adminReply || '');
    }
    if (type === 'details' && review) {
      // Fetch complete review details with all replies
      fetchReviewDetails(review._id);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedReview(null);
    setModalType('');
    setReplyText('');
  };

  const handleDeleteReview = async (reviewId) => {

    
    try {
      const res = await api.delete(`/reviews/${reviewId}`);
      if (res.data.success) {
        toast.success('Đã xóa đánh giá thành công');
        fetchData();
        fetchStats(); // Update stats after deleting
        closeModal();
      } else {
        toast.error(res.data.message || 'Không thể xóa đánh giá');
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error(error.response?.data?.message || 'Không thể xóa đánh giá');
    }
  };

  const handleReplySubmit = async () => {
    if (!replyText.trim()) {
      toast.error('Vui lòng nhập nội dung phản hồi');
      return;
    }
    
    try {
      setIsSubmitting(true);
      const res = await api.post(`/reviews/${selectedReview._id}/reply`, { 
        comment: replyText,
        role: 'admin'
      });
      
      if (res.data.success) {
        toast.success('Đã gửi phản hồi thành công');
        fetchData();
        fetchStats(); // Update stats after replying
        closeModal();
      } else {
        toast.error(res.data.message || 'Không thể gửi phản hồi');
      }
    } catch (error) {
      console.error('Error submitting reply:', error);
      toast.error(error.response?.data?.message || 'Không thể gửi phản hồi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportData = () => {
    // Xuất dữ liệu dưới dạng CSV
    const fields = ['_id', 'userId.fullName', 'rating', 'comment', 'adminReply', 'hospitalId.name', 'doctorId.fullName', 'createdAt'];
    
    const csvContent = [
      // Header
      fields.join(','),
      // Rows
      ...reviews.map(item => 
        fields.map(field => {
          // Handle nested fields
          if (field.includes('.')) {
            const [parent, child] = field.split('.');
            return (item[parent] && item[parent][child]) ? `"${item[parent][child]}"` : '""';
          }
          // Handle normal fields
          return item[field] ? `"${item[field]}"` : '""';
        }).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `reviews_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
      year: 'numeric', 
      month: 'numeric', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Render star rating component
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <FaStar 
          key={i} 
          className={`${i <= rating ? 'text-yellow-500' : 'text-gray-300'}`}
        />
      );
    }
    return stars;
  };

  // Determine which entity was reviewed (doctor or hospital)
  const getReviewTarget = (review) => {
    if (review.doctorId) {
      const doctorName = review.doctorId.fullName || review.doctorId.user?.fullName || 'Bác sĩ';
      return {
        type: 'doctor',
        name: doctorName,
        icon: <FaUserMd className="text-blue-500" />,
        image: review.doctorId.user?.avatarUrl || review.doctorId.user?.avatar?.secureUrl || review.doctorId.user?.avatar?.url
      };
    } else if (review.hospitalId) {
      return {
        type: 'hospital',
        name: review.hospitalId.name || 'Cơ sở y tế',
        icon: <FaHospital className="text-blue-500" />,
        image: review.hospitalId.imageUrl || review.hospitalId.logo
      };
    } else {
      return {
        type: 'unknown',
        name: 'Không xác định',
        icon: <FaHashtag className="text-gray-500" />
      };
    }
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setDoctorNameFilter('');
    setHospitalNameFilter('');
    setFilter({
      rating: 'all',
      doctorId: 'all',
      hospitalId: 'all',
      status: 'all'
    });
    setPagination({
      ...pagination,
      currentPage: 1
    });
  };

  // Update the handleDeleteReply function
  const handleDeleteReply = async (reviewId, replyId) => {
    // Open the confirmation modal instead of using window.confirm
    setDeleteReplyModal({
      isOpen: true,
      reviewId,
      replyId
    });
  };

  // Add a new function to actually delete the reply after confirmation
  const confirmDeleteReply = async () => {
    try {
      setIsLoadingReplies(true);
      const res = await api.delete(`/reviews/${deleteReplyModal.reviewId}/replies/${deleteReplyModal.replyId}`);
      
      if (res.data.success) {
        toast.success('Xóa phản hồi thành công');
        // Refresh the selected review to show updated replies
        if (selectedReview && selectedReview._id === deleteReplyModal.reviewId) {
          fetchReviewDetails(deleteReplyModal.reviewId);
        }
        // Also refresh the main list
        fetchData();
      } else {
        toast.error(res.data.message || 'Không thể xóa phản hồi');
      }
    } catch (error) {
      console.error('Error deleting reply:', error);
      toast.error(error.response?.data?.message || 'Không thể xóa phản hồi');
    } finally {
      setIsLoadingReplies(false);
      // Close the modal after operation completes
      setDeleteReplyModal({
        isOpen: false,
        reviewId: null,
        replyId: null
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý đánh giá</h1>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 p-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 col-span-1">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              <FaStar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tổng đánh giá</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 col-span-1">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
              <FaStar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Đánh giá trung bình</p>
              <div className="flex items-center">
                <p className="text-xl font-bold mr-2">{Number(stats.averageRating).toFixed(1)}</p>
                <div className="flex">{renderStars(Math.round(Number(stats.averageRating) || 0))}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 col-span-1">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              <FaReply className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Đã phản hồi</p>
              <p className="text-xl font-bold">{stats.replied}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 col-span-1">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600 mr-4">
              <FaReply className="h-6 w-6 transform rotate-180" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Chưa phản hồi</p>
              <p className="text-xl font-bold">{stats.notReplied}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 col-span-2">
          <p className="text-sm text-gray-500 mb-2">Phân bố đánh giá</p>
          <div className="flex items-center space-x-2">
            {[5, 4, 3, 2, 1].map(rating => (
              <div key={rating} className="flex flex-col items-center">
                <div className="flex text-yellow-500">
                  <FaStar />
                </div>
                <span className="text-xs font-medium">{rating}</span>
                <span className="text-sm font-bold">{stats.ratingCounts[rating]}</span>
              </div>
            ))}
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
                  placeholder="Tìm kiếm đánh giá..."
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
          <div className="w-full lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FaFilter className="text-gray-400" />
              </div>
              <select
                name="rating"
                value={filter.rating}
                onChange={handleFilterChange}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white appearance-none"
              >
                <option value="all">Tất cả sao</option>
                <option value="5">5 sao</option>
                <option value="4">4 sao</option>
                <option value="3">3 sao</option>
                <option value="2">2 sao</option>
                <option value="1">1 sao</option>
              </select>
            </div>

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
                <option value="replied">Đã phản hồi</option>
                <option value="not_replied">Chưa phản hồi</option>
              </select>
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FaFilter className="text-gray-400" />
              </div>
              <select
                name="doctorId"
                value={filter.doctorId}
                onChange={handleFilterChange}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white appearance-none"
              >
                <option value="all">Tất cả bác sĩ</option>
                {doctors.map(doctor => (
                  <option key={doctor._id} value={doctor._id}>
                    {doctor.fullName || doctor.user?.fullName}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FaFilter className="text-gray-400" />
              </div>
              <select
                name="hospitalId"
                value={filter.hospitalId}
                onChange={handleFilterChange}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white appearance-none"
              >
                <option value="all">Tất cả cơ sở y tế</option>
                {hospitals.map(hospital => (
                  <option key={hospital._id} value={hospital._id}>
                    {hospital.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mt-4">
          <div className="flex space-x-2">
            <button 
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              onClick={clearFilters}
            >
              <FaTimes />
              <span>Xóa bộ lọc</span>
            </button>
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
          <div className="p-6 grid grid-cols-1 gap-4">
            {reviews.length > 0 ? (
              reviews.map((review) => {
                const target = getReviewTarget(review);
                return (
                  <div key={review._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          {review.userId?.avatarUrl || review.userId?.avatar?.secureUrl || review.userId?.avatar?.url ? (
                            <img 
                              src={review.userId?.avatarUrl || review.userId?.avatar?.secureUrl || review.userId?.avatar?.url} 
                              alt={review.userId?.fullName} 
                              className="h-10 w-10 rounded-full object-cover"
                              onError={(e) => {
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(review.userId?.fullName || 'User')}&background=1AC0FF&color=fff`;
                              }}
                            />
                          ) : (
                            <FaUser className="text-blue-500" />
                          )}
                        </div>
                        <div className="ml-3">
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-900">
                            {review.userId?.fullName || 'Người dùng ẩn danh'}
                            </span>
                            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                              Bệnh nhân
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDate(review.createdAt)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <div className="flex items-center text-yellow-500 mr-2">
                          {renderStars(review.rating)}
                        </div>
                        <span className="text-sm font-medium">{review.rating}/5</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center mb-3 text-sm text-gray-600">
                      <span className="mr-2">Đánh giá cho:</span>
                      <div className="flex items-center px-2 py-1 bg-blue-50 rounded-full">
                        <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center mr-1">
                          {review.doctorId && (
                            review.doctorId.user?.avatarUrl || review.doctorId.user?.avatar?.secureUrl || review.doctorId.user?.avatar?.url ? (
                              <img 
                                src={review.doctorId.user?.avatarUrl || review.doctorId.user?.avatar?.secureUrl || review.doctorId.user?.avatar?.url} 
                                alt={target.name} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(target.name)}&background=2563EB&color=fff`;
                                }}
                              />
                            ) : (
                              <FaUserMd className="text-blue-500" />
                            )
                          )}
                          
                          {review.hospitalId && (
                            review.hospitalId.imageUrl || review.hospitalId.logo ? (
                              <img 
                                src={review.hospitalId.imageUrl || review.hospitalId.logo} 
                                alt={target.name} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(target.name)}&background=22C55E&color=fff`;
                                }}
                              />
                            ) : (
                              <FaHospital className="text-green-500" />
                            )
                          )}
                        </div>
                        <span className="text-blue-700">{target.name}</span>
                        {review.doctorId?.specialty && (
                          <span className="ml-1 text-xs text-gray-500">({review.doctorId.specialty.name})</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="mb-4 text-gray-700 border-l-4 border-gray-200 pl-3 py-2">
                      {review.comment}
                    </div>
                    
                    {review.replies && review.replies.length > 0 && (
                      <div className="mb-4 space-y-3">
                        <h4 className="text-sm font-semibold text-gray-700">Phản hồi:</h4>
                        {review.replies.map((reply, index) => (
                          <div key={index} className="bg-gray-50 p-3 rounded-lg border-l-4 border-blue-500">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-8 w-8 rounded-full overflow-hidden border-2 border-gray-200 mr-2">
                                  {reply.userId?.avatarUrl || reply.userId?.avatar?.secureUrl || reply.userId?.avatar?.url ? (
                                    <img 
                                      src={reply.userId?.avatarUrl || reply.userId?.avatar?.secureUrl || reply.userId?.avatar?.url} 
                                      alt={reply.userId?.fullName}
                                      className="h-full w-full object-cover" 
                                      onError={(e) => {
                                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(reply.userId?.fullName || 'User')}&background=1AC0FF&color=fff`;
                                      }}
                                    />
                                  ) : (
                                    <div className={`h-full w-full flex items-center justify-center
                                      ${reply.userId?.roleType === 'admin' ? 'bg-blue-500' : 
                                        reply.userId?.roleType === 'doctor' ? 'bg-green-500' : 'bg-gray-500'}`}>
                                      <FaUser className="text-white text-sm" />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center">
                                    <span className="text-sm font-medium text-gray-900">{reply.userId?.fullName || 'Người dùng'}</span>
                                    <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full
                                      ${reply.userId?.roleType === 'admin' ? 'bg-blue-500 text-white' : 
                                        reply.userId?.roleType === 'doctor' ? 'bg-green-100 text-green-800' : 
                                        'bg-gray-100 text-gray-800'}`}>
                                      {reply.userId?.roleType === 'admin' ? 'Admin' : 
                                       reply.userId?.roleType === 'doctor' ? 'Bác sĩ' : 'Người dùng'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center">
                                <span className="text-xs text-gray-500 mr-2">
                                  {formatDate(reply.createdAt)}
                                </span>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteReply(review._id, reply._id);
                                  }}
                                  className="text-red-500 hover:text-red-700"
                                  title="Xóa phản hồi"
                                >
                                  <FaTrash size={14} />
                                </button>
                              </div>
                            </div>
                            <div className="pl-10">
                              <p className="text-gray-700 text-sm">{reply.comment}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {review.adminReply && (
                      <div className="mb-4 bg-gray-50 p-3 rounded-lg border-l-4 border-blue-500">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center mr-2">
                              <FaUser className="text-white text-sm" />
                        </div>
                            <div>
                              <div className="flex items-center">
                                <span className="text-sm font-medium text-gray-900">Quản trị viên</span>
                                <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs font-medium rounded-full">Admin</span>
                              </div>
                            </div>
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatDate(review.updatedAt)}
                          </span>
                        </div>
                        <div className="pl-12">
                        <p className="text-gray-700 text-sm">{review.adminReply}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-end space-x-2">
                      <button 
                        className="flex items-center px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                        onClick={() => openModal('details', review)}
                      >
                        <FaInfoCircle className="mr-1 h-4 w-4" />
                        <span>Chi tiết</span>
                      </button>
                      <button 
                        className="flex items-center px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        onClick={() => openModal('reply', review)}
                      >
                        <FaReply className="mr-1 h-4 w-4" />
                        <span>{review.adminReply ? 'Chỉnh sửa phản hồi' : 'Phản hồi'}</span>
                      </button>
                      <button 
                        className="flex items-center px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                        onClick={() => openModal('delete', review)}
                      >
                        <FaTrash className="mr-1 h-4 w-4" />
                        <span>Xóa</span>
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 text-gray-500">
                Không có dữ liệu đánh giá
              </div>
            )}
          </div>
          
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

      {/* Reply/Delete Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold text-gray-800">
                {modalType === 'reply' && (selectedReview.adminReply ? 'Chỉnh sửa phản hồi' : 'Thêm phản hồi')}
                {modalType === 'delete' && 'Xác nhận xóa đánh giá'}
                {modalType === 'details' && 'Chi tiết đánh giá'}
              </h2>
              <button 
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
                onClick={closeModal}
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              {modalType === 'details' && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-md shadow-sm border border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Thông tin đánh giá</h3>
                        <div className="space-y-2">
                          <div className="flex items-center mb-3">
                            <div className="font-medium text-gray-700 mr-2 w-24">Người đánh giá:</div>
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-full overflow-hidden mr-3 bg-blue-100 flex items-center justify-center">
                                {selectedReview.userId?.avatarUrl || selectedReview.userId?.avatar?.secureUrl || selectedReview.userId?.avatar?.url ? (
                                  <img 
                                    src={selectedReview.userId?.avatarUrl || selectedReview.userId?.avatar?.secureUrl || selectedReview.userId?.avatar?.url} 
                                    alt={selectedReview.userId?.fullName} 
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedReview.userId?.fullName || 'User')}&background=1AC0FF&color=fff`;
                                    }}
                                  />
                                ) : (
                                  <FaUser className="text-blue-500" />
                                )}
                              </div>
                              <div>
                                <div className="text-gray-900 font-medium">
                                  {selectedReview.userId?.fullName || 'Người dùng ẩn danh'}
                                </div>
                                <div className="text-blue-600 text-xs">
                                  Bệnh nhân
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <span className="font-medium text-gray-700 mr-2 w-24">Email:</span>
                            <span className="text-gray-600">{selectedReview.userId?.email || 'N/A'}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="font-medium text-gray-700 mr-2 w-24">Đánh giá:</span>
                            <div className="flex text-yellow-500">
                              {renderStars(selectedReview.rating)}
                            </div>
                          </div>
                          <div className="flex items-center">
                            <span className="font-medium text-gray-700 mr-2 w-24">Thời gian:</span>
                            <span className="text-gray-600">{formatDate(selectedReview.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Đối tượng đánh giá</h3>
                        <div className="space-y-2">
                          {selectedReview.doctorId && (
                            <>
                              <div className="flex items-center mb-3">
                                <div className="font-medium text-gray-700 mr-2 w-24">Bác sĩ:</div>
                                <div className="flex items-center">
                                  <div className="w-10 h-10 rounded-full overflow-hidden mr-3 bg-blue-100 flex items-center justify-center">
                                    {selectedReview.doctorId.user?.avatarUrl || selectedReview.doctorId.user?.avatar?.secureUrl || selectedReview.doctorId.user?.avatar?.url ? (
                                      <img 
                                        src={selectedReview.doctorId.user?.avatarUrl || selectedReview.doctorId.user?.avatar?.secureUrl || selectedReview.doctorId.user?.avatar?.url} 
                                        alt={selectedReview.doctorId.user?.fullName} 
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedReview.doctorId.user?.fullName || 'Doctor')}&background=1AC0FF&color=fff`;
                                        }}
                                      />
                                    ) : (
                                      <FaUserMd className="text-blue-600" />
                                    )}
                                  </div>
                                  <div>
                                    <div className="text-gray-900 font-medium">
                                      {selectedReview.doctorId.fullName || selectedReview.doctorId.user?.fullName || 'N/A'}
                                    </div>
                                    <div className="text-blue-600 text-xs">
                                      Bác sĩ
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center">
                                <span className="font-medium text-gray-700 mr-2 w-24">Chuyên khoa:</span>
                                <span className="text-gray-600">{selectedReview.doctorId.specialty?.name || 'N/A'}</span>
                              </div>
                            </>
                          )}
                          
                          {selectedReview.hospitalId && (
                            <>
                              <div className="flex items-center mb-3">
                                <div className="font-medium text-gray-700 mr-2 w-24">Cơ sở y tế:</div>
                                <div className="flex items-center">
                                  <div className="w-10 h-10 rounded-full overflow-hidden mr-3 bg-green-100 flex items-center justify-center">
                                    {selectedReview.hospitalId.logo || selectedReview.hospitalId.imageUrl ? (
                                      <img 
                                        src={selectedReview.hospitalId.logo || selectedReview.hospitalId.imageUrl} 
                                        alt={selectedReview.hospitalId.name} 
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedReview.hospitalId.name || 'Hospital')}&background=22C55E&color=fff`;
                                        }}
                                      />
                                    ) : (
                                      <FaHospital className="text-green-500" />
                                    )}
                                  </div>
                                  <div>
                                    <div className="text-gray-900 font-medium">
                                      {selectedReview.hospitalId.name || 'N/A'}
                                    </div>
                                    <div className="text-green-600 text-xs">
                                      Cơ sở y tế
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center">
                                <span className="font-medium text-gray-700 mr-2 w-24">Địa chỉ:</span>
                                <span className="text-gray-600">{selectedReview.hospitalId.address || 'N/A'}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Nội dung đánh giá</h3>
                    <p className="text-gray-700 p-3 bg-white border border-gray-200 rounded min-h-[80px]">{selectedReview.comment}</p>
                  </div>
                  
                  {/* Replies section */}
                  <div className="bg-blue-50 p-4 rounded-md">
                    <h3 className="text-sm font-semibold text-blue-500 uppercase tracking-wider mb-2">
                      Tất cả phản hồi ({selectedReview.replies?.length || (selectedReview.adminReply ? 1 : 0)})
                    </h3>
                    
                    {isLoadingReplies ? (
                      <div className="flex justify-center items-center py-8">
                        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
                        <span className="ml-2 text-blue-500">Đang tải phản hồi...</span>
                      </div>
                    ) : (
                      /* Check for new reply structure first */
                      selectedReview.replies && selectedReview.replies.length > 0 ? (
                        <div className="space-y-3 max-h-[300px] overflow-y-auto p-1">
                          {selectedReview.replies.map((reply, index) => (
                            <div key={index} className="bg-white border border-blue-200 rounded p-3">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-start">
                                  <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center mr-3 overflow-hidden border-2
                                    ${reply.userId?.roleType === 'admin' ? 'border-blue-300 bg-blue-50' : 
                                      reply.userId?.roleType === 'doctor' ? 'border-green-300 bg-green-50' : 
                                      reply.userId?.roleType === 'staff' ? 'border-purple-300 bg-purple-50' : 'border-gray-300 bg-gray-50'}`}>
                                    {reply.userId?.avatarUrl || reply.userId?.avatar?.secureUrl || reply.userId?.avatar?.url ? (
                                      <img 
                                        src={reply.userId?.avatarUrl || reply.userId?.avatar?.secureUrl || reply.userId?.avatar?.url}
                                        alt={reply.userId?.fullName || 'User'}
                                        className="h-full w-full object-cover"
                                        onError={(e) => {
                                          const role = reply.userId?.roleType || reply.role || 'user';
                                          const bgColor = role === 'admin' ? '2563EB' : 
                                                        role === 'doctor' ? '22C55E' : '6B7280';
                                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(reply.userId?.fullName || role)}&background=${bgColor}&color=fff`;
                                        }}
                                      />
                                    ) : (
                                      <div className="h-full w-full flex items-center justify-center">
                                        {reply.userId?.roleType === 'doctor' || reply.role === 'doctor' ? (
                                          <FaUserMd className={`${['admin', 'doctor', 'staff'].includes(reply.userId?.roleType || reply.role) ? 'text-green-500' : 'text-blue-500'}`} />
                                        ) : (
                                          <FaUser className={`${
                                            reply.userId?.roleType === 'admin' || reply.role === 'admin' ? 'text-blue-500' : 
                                            reply.userId?.roleType === 'staff' || reply.role === 'staff' ? 'text-purple-500' : 'text-gray-500'}`} />
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <div className="flex items-center flex-wrap">
                                      <span className="font-medium text-gray-900">
                                        {reply.userId?.fullName || (
                                          reply.userId?.roleType === 'admin' || reply.role === 'admin' ? 'Quản trị viên' : 
                                          reply.userId?.roleType === 'doctor' || reply.role === 'doctor' ? 'Bác sĩ' : 
                                          reply.userId?.roleType === 'staff' || reply.role === 'staff' ? 'Nhân viên' : 'Người dùng'
                                        )}
                                      </span>
                                      <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full
                                        ${reply.userId?.roleType === 'admin' || reply.role === 'admin' ? 'bg-blue-100 text-blue-800' : 
                                          reply.userId?.roleType === 'doctor' || reply.role === 'doctor' ? 'bg-green-100 text-green-800' : 
                                          reply.userId?.roleType === 'staff' || reply.role === 'staff' ? 'bg-purple-100 text-purple-800' : 
                                          'bg-gray-100 text-gray-800'}`}>
                                        {reply.userId?.roleType === 'admin' || reply.role === 'admin' ? 'Admin' : 
                                         reply.userId?.roleType === 'doctor' || reply.role === 'doctor' ? 'Bác sĩ' : 
                                         reply.userId?.roleType === 'staff' || reply.role === 'staff' ? 'Nhân viên' : 'Người dùng'}
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {formatDate(reply.createdAt)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="flex">
                                <button 
                                  onClick={() => handleDeleteReply(selectedReview._id, reply._id)}
                                  className="text-red-500 hover:text-red-700 p-1.5 rounded-full hover:bg-red-50"
                                  title="Xóa phản hồi"
                                >
                                  <FaTrash size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        // Fallback for old structure with just adminReply
                        selectedReview.adminReply ? (
                          <div className="bg-white border border-blue-200 rounded p-3">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-start">
                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center mr-3">
                                  <FaUser className="text-white" />
                                </div>
                                <div>
                                  <div className="flex items-center flex-wrap">
                                    <span className="font-medium text-gray-900">Quản trị viên</span>
                                    <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                      Admin
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {formatDate(selectedReview.updatedAt)}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="pl-12">
                              <p className="text-gray-700">{selectedReview.adminReply}</p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-center text-gray-500 py-3">Chưa có phản hồi nào</p>
                        )
                      )
                    )}
                  </div>
                  
                  <div className="flex justify-end mt-4">
                    <button
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mr-2"
                      onClick={() => {
                        closeModal();
                        openModal('reply', selectedReview);
                      }}
                    >
                      {selectedReview.adminReply ? 'Chỉnh sửa phản hồi' : 'Phản hồi'}
                    </button>
                    <button 
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                      onClick={closeModal}
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              )}
                
              {modalType === 'delete' && (
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded-md">
                    <div className="flex">
                      <FaTrash className="h-5 w-5 text-red-500 mr-2" />
                      <p className="text-sm text-red-700">
                        Bạn có chắc chắn muốn xóa đánh giá này? Hành động này không thể hoàn tác.
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <span className="font-medium text-gray-700 mr-2">Người đánh giá:</span>
                        <span className="text-gray-600">{selectedReview.userId?.fullName || 'Người dùng ẩn danh'}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium text-gray-700 mr-2">Đánh giá:</span>
                        <div className="flex text-yellow-500">
                          {renderStars(selectedReview.rating)}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 block mb-1">Nội dung:</span>
                        <p className="text-gray-600 p-2 bg-white border border-gray-200 rounded">{selectedReview.comment}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {modalType === 'reply' && (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded-md">
                    <div className="flex">
                      <FaReply className="h-5 w-5 text-blue-500 mr-2" />
                      <p className="text-sm text-blue-700">
                        {selectedReview.adminReply 
                          ? 'Chỉnh sửa phản hồi của bạn cho đánh giá này.' 
                          : 'Viết phản hồi của bạn cho đánh giá này.'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
                    <h3 className="font-medium text-lg mb-4">
                      {selectedReview.adminReply ? 'Chỉnh sửa phản hồi' : 'Phản hồi đánh giá'}
                    </h3>
                    
                    <div className="bg-gray-50 p-4 rounded-md mb-4">
                    <div className="flex items-center mb-2">
                      <span className="font-medium text-gray-700 mr-2">Đánh giá của người dùng:</span>
                      <div className="flex text-yellow-500">
                        {renderStars(selectedReview.rating)}
                      </div>
                    </div>
                    <p className="text-gray-600 p-2 bg-white border border-gray-200 rounded">{selectedReview.comment}</p>
                  </div>
                  
                    <div className="flex items-start mb-4">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden mr-3 bg-blue-500 flex items-center justify-center">
                        {user?.avatarUrl || user?.avatar?.secureUrl || user?.avatar?.url ? (
                          <img 
                            src={user?.avatarUrl || user?.avatar?.secureUrl || user?.avatar?.url} 
                            alt={user?.fullName || 'Admin'}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Admin')}&background=2563EB&color=fff`;
                            }}
                          />
                        ) : (
                          <FaUser className="text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="mb-1 flex items-center">
                          <span className="font-medium text-gray-900">
                            {user?.fullName || 'Quản trị viên'}
                          </span>
                          <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                            Admin
                          </span>
                        </div>
                    <textarea
                          className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="Nhập nội dung phản hồi..."
                      rows="4"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                        ></textarea>
                  </div>
                </div>
                    
                    <div className="flex justify-end space-x-3">
                      <button 
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        onClick={closeModal}
                      >
                        Hủy
                      </button>
                      <button 
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300"
                        onClick={handleReplySubmit}
                        disabled={!replyText.trim() || isSubmitting}
                      >
                        {isSubmitting ? (
                          <div className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Đang xử lý...
                          </div>
                        ) : (
                          selectedReview.adminReply ? 'Cập nhật phản hồi' : 'Gửi phản hồi'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-lg">
              <button 
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                onClick={closeModal}
              >
                Hủy
              </button>
              
              {modalType === 'delete' && (
                <button 
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  onClick={() => handleDeleteReview(selectedReview._id)}
                >
                  Xóa
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {deleteReplyModal.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg max-w-md w-full mx-4 shadow-xl">
            <div className="p-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <FaTrash className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-2">Xóa phản hồi</h3>
                <p className="text-sm text-gray-500 mb-5">
                  Bạn có chắc chắn muốn xóa phản hồi này? Hành động này không thể hoàn tác.
                </p>
                <div className="mt-4 flex justify-center space-x-3">
                <button 
                    type="button"
                    className="inline-flex justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={() => setDeleteReplyModal({ isOpen: false, reviewId: null, replyId: null })}
                  >
                    Hủy
                </button>
                  <button
                    type="button"
                    className="inline-flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    onClick={confirmDeleteReply}
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reviews; 
