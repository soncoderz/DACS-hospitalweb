import React, { useEffect, useState } from 'react';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  ControlBar,
  GridLayout,
  ParticipantTile,
  useTracks
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track } from 'livekit-client';
import api from '../../utils/api';
import { FaTimes, FaSpinner } from 'react-icons/fa';
import './VideoRoom.css';

const VideoRoom = ({ roomId, onClose, userRole }) => {
  const [token, setToken] = useState(null);
  const [roomInfo, setRoomInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    joinRoom();
  }, [roomId]);

  const joinRoom = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/video-rooms/join/${roomId}`);
      
      if (response.data.success) {
        setToken(response.data.data.token);
        setRoomInfo(response.data.data);
      } else {
        setError(response.data.message || 'Không thể tham gia phòng');
      }
    } catch (err) {
      console.error('Error joining room:', err);
      setError('Không thể kết nối với phòng video');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnected = () => {
    setConnected(false);
    console.log('Disconnected from room');
  };

  const handleConnected = () => {
    setConnected(true);
    console.log('Connected to room');
  };

  const handleLeave = async () => {
    if (userRole === 'doctor' && roomInfo) {
      // If doctor leaves, optionally end the room
      const confirmEnd = window.confirm('Bạn có muốn kết thúc cuộc gọi cho tất cả người tham gia không?');
      if (confirmEnd) {
        try {
          await api.post(`/video-rooms/${roomId}/end`);
        } catch (error) {
          console.error('Error ending room:', error);
        }
      }
    }
    onClose();
  };

  if (loading) {
    return (
      <div className="video-room-container">
        <div className="video-room-loading">
          <FaSpinner className="animate-spin text-4xl text-blue-500 mb-4" />
          <p className="text-gray-600">Đang kết nối với phòng video...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="video-room-container">
        <div className="video-room-error">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Đóng
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="video-room-container">
      <div className="video-room-header">
        <div className="room-info">
          <h3 className="text-lg font-semibold text-white">Phòng video khám bệnh</h3>
          {roomInfo?.appointmentInfo && (
            <div className="text-sm text-gray-200">
              <span>Bác sĩ: {roomInfo.appointmentInfo.doctorName}</span>
              <span className="mx-2">•</span>
              <span>Bệnh nhân: {roomInfo.appointmentInfo.patientName}</span>
            </div>
          )}
        </div>
        <button 
          onClick={handleLeave}
          className="close-button"
          title="Rời phòng"
        >
          <FaTimes />
        </button>
      </div>

      {token && roomInfo && (
        <LiveKitRoom
          video={true}
          audio={true}
          token={token}
          serverUrl={roomInfo.wsUrl}
          onConnected={handleConnected}
          onDisconnected={handleDisconnected}
          data-lk-theme="default"
          style={{ height: 'calc(100% - 60px)' }}
        >
          <VideoConference />
          <RoomAudioRenderer />
        </LiveKitRoom>
      )}
    </div>
  );
};

export default VideoRoom;
