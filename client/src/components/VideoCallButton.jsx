import React, { useState, useEffect } from 'react';
import { FaVideo, FaSpinner, FaExclamationCircle } from 'react-icons/fa';
import api from '../utils/api';
import VideoRoom from './VideoRoom/VideoRoom';
import { toast } from 'react-toastify';

const VideoCallButton = ({ appointmentId, userRole, appointmentStatus }) => {
  const [showVideoRoom, setShowVideoRoom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [roomInfo, setRoomInfo] = useState(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    // Check if there's an active room for this appointment
    checkExistingRoom();
  }, [appointmentId]);

  const checkExistingRoom = async () => {
    try {
      setChecking(true);
      const response = await api.get(`/video-rooms/appointment/${appointmentId}`);
      if (response.data.success && response.data.data) {
        setRoomInfo(response.data.data);
      }
    } catch (error) {
      console.error('Error checking existing room:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleStartVideoCall = async () => {
    try {
      setLoading(true);
      
      // Create or get existing room
      const response = await api.post('/video-rooms/create', {
        appointmentId
      });

      if (response.data.success) {
        setRoomInfo(response.data.data);
        setShowVideoRoom(true);
      } else {
        toast.error(response.data.message || 'Không thể tạo phòng video');
      }
    } catch (error) {
      console.error('Error starting video call:', error);
      toast.error('Không thể bắt đầu cuộc gọi video');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinVideoCall = () => {
    if (roomInfo && roomInfo._id) {
      setShowVideoRoom(true);
    }
  };

  const handleCloseVideoRoom = () => {
    setShowVideoRoom(false);
    checkExistingRoom(); // Recheck room status after closing
  };

  // Don't show button if appointment is not confirmed or completed
  if (!['confirmed', 'completed'].includes(appointmentStatus)) {
    return null;
  }

  // Show video room if active
  if (showVideoRoom && roomInfo) {
    return (
      <VideoRoom 
        roomId={roomInfo._id}
        onClose={handleCloseVideoRoom}
        userRole={userRole}
      />
    );
  }

  // Loading state
  if (checking) {
    return (
      <button 
        className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed"
        disabled
      >
        <FaSpinner className="animate-spin mr-2" />
        Đang kiểm tra...
      </button>
    );
  }

  // If room exists and is active
  if (roomInfo && ['waiting', 'active'].includes(roomInfo.status)) {
    return (
      <button
        onClick={handleJoinVideoCall}
        className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-md"
        disabled={loading}
      >
        {loading ? (
          <>
            <FaSpinner className="animate-spin mr-2" />
            Đang kết nối...
          </>
        ) : (
          <>
            <FaVideo className="mr-2 animate-pulse" />
            Tham gia cuộc gọi
          </>
        )}
      </button>
    );
  }

  // Button to start new video call
  return (
    <button
      onClick={handleStartVideoCall}
      className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-md"
      disabled={loading}
    >
      {loading ? (
        <>
          <FaSpinner className="animate-spin mr-2" />
          Đang tạo phòng...
        </>
      ) : (
        <>
          <FaVideo className="mr-2" />
          Bắt đầu gọi video
        </>
      )}
    </button>
  );
};

export default VideoCallButton;
