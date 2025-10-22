import React, { useState, useEffect } from 'react';
import {
  FaVideo, FaClock, FaCalendar, FaUser,
  FaUserMd, FaEye, FaHistory, FaFilter,
  FaFileAlt, FaStethoscope, FaPhone, FaEnvelope
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import moment from 'moment';
import 'moment/locale/vi';

moment.locale('vi');

const VideoCallHistory = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('ended');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 10
  });

  useEffect(() => {
    fetchHistory();
  }, [selectedStatus, pagination.page]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      let url = `/video-rooms/history?page=${pagination.page}&limit=${pagination.limit}`;
      if (selectedStatus && selectedStatus !== 'all') {
        url += `&status=${selectedStatus}`;
      }

      const response = await api.get(url);
      if (response.data.success) {
        console.log('Video call history data:', response.data.data);
        setHistory(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error('Không thể tải lịch sử cuộc gọi');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomDetail = async (roomId) => {
    try {
      const response = await api.get(`/video-rooms/history/${roomId}`);
      if (response.data.success) {
        setSelectedRoom(response.data.data);
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error('Error fetching room detail:', error);
      toast.error('Không thể tải chi tiết cuộc gọi');
    }
  };

  const formatDuration = (minutes) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins} phút`;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      waiting: { color: 'bg-yellow-100 text-yellow-800', text: 'Đang chờ' },
      active: { color: 'bg-green-100 text-green-800', text: 'Đang hoạt động' },
      ended: { color: 'bg-gray-100 text-gray-800', text: 'Đã kết thúc' },
      cancelled: { color: 'bg-red-100 text-red-800', text: 'Đã hủy' }
    };
    const config = statusConfig[status] || statusConfig.ended;
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-md">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <FaHistory className="mr-3 text-blue-600" />
                Lịch sử cuộc gọi Video
              </h2>
              <p className="text-gray-600 mt-1">Xem lịch sử tất cả các cuộc gọi video trong hệ thống</p>
            </div>
            <button
              onClick={fetchHistory}
              className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center"
            >
              <FaFilter className="mr-2" />
              Làm mới
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Trạng thái:</label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPagination({ ...pagination, page: 1 });
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tất cả</option>
              <option value="ended">Đã kết thúc</option>
              <option value="active">Đang hoạt động</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <FaVideo className="mx-auto text-6xl text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">Không có lịch sử cuộc gọi</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((room) => (
                <div key={room._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold text-gray-900">{room.roomName}</h4>
                        {getStatusBadge(room.status)}
                        {room.appointmentId?.bookingCode && (
                          <span className="text-xs text-gray-500">
                            ({room.appointmentId.bookingCode})
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                        <div className="flex items-center text-sm text-gray-600">
                          <FaUserMd className="mr-2 text-blue-600" />
                          <span>
                            Bác sĩ: {room.doctor ? room.doctor.fullName : 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <FaUser className="mr-2 text-green-600" />
                          <span>
                            Bệnh nhân: {room.patient ? room.patient.fullName : 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <FaCalendar className="mr-2 text-purple-600" />
                          <span>
                            {room.startTime 
                              ? moment(room.startTime).format('HH:mm DD/MM/YYYY')
                              : 'Chưa bắt đầu'}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <FaClock className="mr-2 text-orange-600" />
                          <span>Thời lượng: {formatDuration(room.duration)}</span>
                        </div>
                      </div>

                      {room.participants && room.participants.length > 0 && (
                        <div className="mt-3 text-sm text-gray-600">
                          <span className="font-medium">Người tham gia:</span> {room.participants.length} người
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => fetchRoomDetail(room._id)}
                      className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <FaEye className="mr-2" />
                      Chi tiết
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-6">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Trước
              </button>
              <span className="text-gray-700">
                Trang {pagination.page} / {pagination.pages}
              </span>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page === pagination.pages}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Sau
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">Chi tiết cuộc gọi</h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Room Information */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center">
                  <FaVideo className="mr-2 text-blue-600" />
                  Thông tin phòng
                </h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p><span className="font-medium">Tên phòng:</span> {selectedRoom.roomName}</p>
                  <p className="flex items-center">
                    <span className="font-medium mr-2">Trạng thái:</span>
                    {getStatusBadge(selectedRoom.status)}
                  </p>
                  <p><span className="font-medium">Mã lịch hẹn:</span> {selectedRoom.appointmentId?.bookingCode || 'N/A'}</p>
                  <p><span className="font-medium">Số người tham gia:</span> {selectedRoom.participants?.length || 0} người</p>
                </div>
              </div>

              {/* Doctor Information */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center">
                  <FaUserMd className="mr-2 text-blue-600" />
                  Thông tin bác sĩ
                </h4>
                <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                  <p className="flex items-center">
                    <FaUser className="mr-2 text-blue-600" />
                    <span className="font-medium mr-2">Tên:</span>
                    {selectedRoom.doctor?.title && `${selectedRoom.doctor.title} `}
                    {selectedRoom.doctor?.fullName || 'N/A'}
                  </p>
                  <p className="flex items-center">
                    <FaEnvelope className="mr-2 text-blue-600" />
                    <span className="font-medium mr-2">Email:</span>
                    {selectedRoom.doctor?.email || 'N/A'}
                  </p>
                  {selectedRoom.doctor?.phoneNumber && (
                    <p className="flex items-center">
                      <FaPhone className="mr-2 text-blue-600" />
                      <span className="font-medium mr-2">Số điện thoại:</span>
                      {selectedRoom.doctor.phoneNumber}
                    </p>
                  )}
                  {selectedRoom.doctor?.specialty && (
                    <p className="flex items-center">
                      <FaStethoscope className="mr-2 text-blue-600" />
                      <span className="font-medium mr-2">Chuyên khoa:</span>
                      {selectedRoom.doctor.specialty.name}
                    </p>
                  )}
                </div>
              </div>

              {/* Patient Information */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center">
                  <FaUser className="mr-2 text-green-600" />
                  Thông tin bệnh nhân
                </h4>
                <div className="bg-green-50 p-4 rounded-lg space-y-2">
                  <p className="flex items-center">
                    <FaUser className="mr-2 text-green-600" />
                    <span className="font-medium mr-2">Tên:</span>
                    {selectedRoom.patient?.fullName || 'N/A'}
                  </p>
                  <p className="flex items-center">
                    <FaEnvelope className="mr-2 text-green-600" />
                    <span className="font-medium mr-2">Email:</span>
                    {selectedRoom.patient?.email || 'N/A'}
                  </p>
                  {selectedRoom.patient?.phoneNumber && (
                    <p className="flex items-center">
                      <FaPhone className="mr-2 text-green-600" />
                      <span className="font-medium mr-2">Số điện thoại:</span>
                      {selectedRoom.patient.phoneNumber}
                    </p>
                  )}
                </div>
              </div>

              {/* Time Information */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center">
                  <FaClock className="mr-2 text-orange-600" />
                  Thời gian
                </h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p><span className="font-medium">Bắt đầu:</span> {selectedRoom.startTime ? moment(selectedRoom.startTime).format('HH:mm:ss DD/MM/YYYY') : 'N/A'}</p>
                  <p><span className="font-medium">Kết thúc:</span> {selectedRoom.endTime ? moment(selectedRoom.endTime).format('HH:mm:ss DD/MM/YYYY') : 'N/A'}</p>
                  <p><span className="font-medium">Thời lượng:</span> {formatDuration(selectedRoom.duration)}</p>
                </div>
              </div>

              {/* Participants List */}
              {selectedRoom.participants && selectedRoom.participants.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">Danh sách tham gia ({selectedRoom.participants.length})</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    {selectedRoom.participants.map((participant, index) => (
                      <div key={index} className="flex justify-between items-center border-b border-gray-200 pb-2 last:border-0">
                        <div>
                          <p className="font-medium">{participant.userId?.fullName || 'N/A'}</p>
                          <p className="text-sm text-gray-600">Vai trò: {participant.role}</p>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>Tham gia: {moment(participant.joinedAt).format('HH:mm:ss')}</p>
                          {participant.leftAt && (
                            <p>Rời đi: {moment(participant.leftAt).format('HH:mm:ss')}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {selectedRoom.appointmentId && (
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      navigate(`/admin/appointments/${selectedRoom.appointmentId._id || selectedRoom.appointmentId}`);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <FaFileAlt className="mr-2" />
                    Xem Lịch hẹn
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCallHistory;

