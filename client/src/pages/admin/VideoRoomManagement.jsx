import React, { useState, useEffect } from 'react';
import {
  FaVideo, FaUsers, FaClock, FaCheckCircle,
  FaTimesCircle, FaSpinner, FaSync, FaTrash,
  FaEye, FaUserTimes, FaSignInAlt
} from 'react-icons/fa';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import moment from 'moment';
import 'moment/locale/vi';
import VideoRoom from '../../components/VideoRoom/VideoRoom';

moment.locale('vi');

const VideoRoomManagement = () => {
  const [rooms, setRooms] = useState([]);
  const [activeRooms, setActiveRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('database'); // database or livekit
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0
  });

  // State for video room
  const [showVideoRoom, setShowVideoRoom] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState(null);

  useEffect(() => {
    fetchRooms();
    if (activeTab === 'livekit') {
      fetchActiveLiveKitRooms();
    }
  }, [activeTab, selectedStatus, pagination.page]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      let url = `/video-rooms?page=${pagination.page}&limit=10`;
      if (selectedStatus !== 'all') {
        url += `&status=${selectedStatus}`;
      }
      
      const response = await api.get(url);
      if (response.data.success) {
        setRooms(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast.error('Không thể tải danh sách phòng');
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveLiveKitRooms = async () => {
    try {
      setLoading(true);
      const response = await api.get('/video-rooms/admin/active-rooms');
      if (response.data.success) {
        setActiveRooms(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching active rooms:', error);
      toast.error('Không thể tải danh sách phòng hoạt động');
    } finally {
      setLoading(false);
    }
  };

  const handleEndRoom = async (roomId) => {
    if (!window.confirm('Bạn có chắc chắn muốn kết thúc phòng này?')) {
      return;
    }

    try {
      const response = await api.post(`/video-rooms/${roomId}/end`);
      if (response.data.success) {
        toast.success('Đã kết thúc phòng thành công');
        fetchRooms();
        if (activeTab === 'livekit') {
          fetchActiveLiveKitRooms();
        }
      }
    } catch (error) {
      console.error('Error ending room:', error);
      toast.error('Không thể kết thúc phòng');
    }
  };

  const handleRemoveParticipant = async (roomName, participantIdentity) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa người tham gia này khỏi phòng?')) {
      return;
    }

    try {
      const response = await api.post('/video-rooms/admin/remove-participant', {
        roomName,
        participantIdentity
      });

      if (response.data.success) {
        toast.success('Đã xóa người tham gia');
        fetchActiveLiveKitRooms();
      }
    } catch (error) {
      console.error('Error removing participant:', error);
      toast.error('Không thể xóa người tham gia');
    }
  };

  const handleJoinRoom = (roomId) => {
    setSelectedRoomId(roomId);
    setShowVideoRoom(true);
  };

  const handleJoinLiveKitRoom = async (roomName) => {
    try {
      // First, find the room in database by roomName
      const roomResponse = await api.get(`/video-rooms?page=1&limit=100`);
      if (roomResponse.data.success) {
        const room = roomResponse.data.data.find(r => r.roomName === roomName);
        if (room) {
          handleJoinRoom(room._id);
        } else {
          toast.error('Không tìm thấy phòng trong database');
        }
      }
    } catch (error) {
      console.error('Error finding room:', error);
      toast.error('Không thể tìm phòng');
    }
  };

  const handleCloseVideoRoom = () => {
    setShowVideoRoom(false);
    setSelectedRoomId(null);
    // Refresh rooms after closing
    fetchRooms();
    if (activeTab === 'livekit') {
      fetchActiveLiveKitRooms();
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      waiting: { color: 'bg-yellow-100 text-yellow-800', icon: <FaClock />, label: 'Đang chờ' },
      active: { color: 'bg-green-100 text-green-800', icon: <FaCheckCircle />, label: 'Hoạt động' },
      ended: { color: 'bg-gray-100 text-gray-800', icon: <FaTimesCircle />, label: 'Đã kết thúc' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: <FaTimesCircle />, label: 'Đã hủy' }
    };

    const statusInfo = statusMap[status] || statusMap.ended;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.icon}
        <span className="ml-1">{statusInfo.label}</span>
      </span>
    );
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '0 phút';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours} giờ ${mins} phút`;
    }
    return `${mins} phút`;
  };

  // Show video room if active
  if (showVideoRoom && selectedRoomId) {
    return (
      <VideoRoom
        roomId={selectedRoomId}
        onClose={handleCloseVideoRoom}
        userRole="admin"
      />
    );
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-md">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <FaVideo className="mr-3 text-blue-600" />
                Quản lý phòng Video Call
              </h2>
              <p className="text-gray-600 mt-1">Quản lý và giám sát các phòng video khám bệnh</p>
            </div>
            <button
              onClick={() => activeTab === 'database' ? fetchRooms() : fetchActiveLiveKitRooms()}
              className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center"
            >
              <FaSync className="mr-2" />
              Làm mới
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('database')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'database' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Tất cả phòng
          </button>
          <button
            onClick={() => setActiveTab('livekit')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'livekit' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Phòng đang hoạt động
          </button>
        </div>

        {/* Filters */}
        {activeTab === 'database' && (
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Trạng thái:</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả</option>
                <option value="waiting">Đang chờ</option>
                <option value="active">Hoạt động</option>
                <option value="ended">Đã kết thúc</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <FaSpinner className="animate-spin text-3xl text-blue-500" />
              <span className="ml-3 text-gray-600">Đang tải dữ liệu...</span>
            </div>
          ) : (
            <>
              {activeTab === 'database' ? (
                // Database Rooms Table
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Mã phòng
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Lịch hẹn
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Bác sĩ
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Bệnh nhân
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Trạng thái
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Thời gian
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Hành động
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {rooms.map((room) => (
                        <tr key={room._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {room.roomName.substring(0, 20)}...
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {room.appointmentId?.bookingCode || 'N/A'}
                            <br />
                            <span className="text-xs">
                              {room.appointmentId?.appointmentDate 
                                ? moment(room.appointmentId.appointmentDate).format('DD/MM/YYYY')
                                : ''}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {room.doctorId?.fullName || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {room.patientId?.fullName || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(room.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {room.startTime && (
                              <div>
                                <div className="text-xs">
                                  Bắt đầu: {moment(room.startTime).format('HH:mm DD/MM')}
                                </div>
                                {room.duration > 0 && (
                                  <div className="text-xs text-green-600">
                                    Thời lượng: {formatDuration(room.duration)}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center space-x-2">
                              {room.status === 'active' && (
                                <>
                                  <button
                                    onClick={() => handleJoinRoom(room._id)}
                                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 flex items-center text-xs"
                                    title="Tham gia phòng"
                                  >
                                    <FaSignInAlt className="mr-1" />
                                    Tham gia
                                  </button>
                                  <button
                                    onClick={() => handleEndRoom(room._id)}
                                    className="text-red-600 hover:text-red-900"
                                    title="Kết thúc phòng"
                                  >
                                    <FaTimesCircle />
                                  </button>
                                </>
                              )}
                              <button
                                className="text-blue-600 hover:text-blue-900"
                                title="Xem chi tiết"
                              >
                                <FaEye />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {rooms.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Không có phòng nào
                    </div>
                  )}

                  {/* Pagination */}
                  {pagination.pages > 1 && (
                    <div className="flex justify-between items-center mt-4">
                      <div className="text-sm text-gray-700">
                        Trang {pagination.page} / {pagination.pages} (Tổng: {pagination.total} phòng)
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                          disabled={pagination.page === 1}
                          className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
                        >
                          Trước
                        </button>
                        <button
                          onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                          disabled={pagination.page === pagination.pages}
                          className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
                        >
                          Sau
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // LiveKit Active Rooms
                <div className="space-y-4">
                  {activeRooms.map((room) => (
                    <div key={room.sid} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{room.name}</h4>
                          <p className="text-sm text-gray-500">
                            SID: {room.sid}
                          </p>
                          <p className="text-sm text-gray-500">
                            Tạo lúc: {moment(room.creationTime * 1000).format('HH:mm:ss DD/MM/YYYY')}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            <FaUsers className="mr-1" />
                            {room.numParticipants} người
                          </span>
                          <button
                            onClick={() => handleJoinLiveKitRoom(room.name)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center text-sm"
                            title="Tham gia phòng với quyền Admin"
                          >
                            <FaSignInAlt className="mr-2" />
                            Tham gia
                          </button>
                        </div>
                      </div>

                      {/* Participants */}
                      {room.participants && room.participants.length > 0 && (
                        <div className="border-t border-gray-200 pt-3 mt-3">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Người tham gia:</h5>
                          <div className="space-y-2">
                            {room.participants.map((participant) => (
                              <div key={participant.sid} className="flex justify-between items-center bg-gray-50 rounded p-2">
                                <div>
                                  <span className="font-medium text-sm">{participant.name || 'Unknown'}</span>
                                  <span className="ml-2 text-xs text-gray-500">
                                    (ID: {participant.identity})
                                  </span>
                                  <div className="text-xs text-gray-400">
                                    Tham gia: {moment(participant.joinedAt * 1000).format('HH:mm:ss')}
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleRemoveParticipant(room.name, participant.identity)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Xóa khỏi phòng"
                                >
                                  <FaUserTimes />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {activeRooms.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Không có phòng nào đang hoạt động
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoRoomManagement;
