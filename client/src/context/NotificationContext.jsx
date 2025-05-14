import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';
import io from 'socket.io-client';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Connect to socket when user is authenticated
  useEffect(() => {
    if (user && token) {
      const socketInstance = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
        auth: {
          token
        }
      });

      socketInstance.on('connect', () => {
        console.log('Connected to notification socket');
      });

      socketInstance.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
      });

      setSocket(socketInstance);

      // Clean up on unmount
      return () => {
        socketInstance.disconnect();
      };
    }
  }, [user, token]);

  // Listen for notifications
  useEffect(() => {
    if (socket) {
      socket.on('notification', (notification) => {
        // Add to notifications list
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(count => count + 1);
        
        // Show toast notification
        showNotificationToast(notification);
      });

      return () => {
        socket.off('notification');
      };
    }
  }, [socket]);

  // Fetch initial notifications from API when user is authenticated
  useEffect(() => {
    if (user && token) {
      fetchNotifications();
    }
  }, [user, token]);

  // Show toast notification
  const showNotificationToast = (notification) => {
    const handleClick = () => {
      handleNotificationClick(notification);
      toast.dismiss();
    };

    toast.info(
      <div onClick={handleClick} style={{ cursor: 'pointer' }}>
        <strong>{notification.title}</strong>
        <p>{notification.message}</p>
      </div>,
      {
        position: "top-right",
        autoClose: 5000,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        onClick: handleClick
      }
    );
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    // Mark as read
    markAsRead(notification._id);
    
    // Navigate based on notification type
    if (notification.type === 'appointment_create' || 
        notification.type === 'appointment_update' || 
        notification.type === 'appointment_cancel' || 
        notification.type === 'appointment_reminder') {
      if (notification.data && notification.data.appointmentId) {
        navigate(`/appointments/${notification.data.appointmentId}`);
      } else {
        navigate('/appointments');
      }
    } else if (notification.type === 'payment') {
      if (notification.data && notification.data.appointmentId) {
        navigate(`/appointments/${notification.data.appointmentId}`);
      } else if (notification.data && notification.data.paymentId) {
        navigate(`/payments/${notification.data.paymentId}`);
      } else {
        navigate('/payments');
      }
    } else {
      // Default for other types
      navigate('/notifications');
    }
  };

  // Fetch notifications from API
  const fetchNotifications = async (page = 1, limit = 10) => {
    if (!user || !token) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/notifications?page=${page}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const data = await response.json();
      
      if (page === 1) {
        setNotifications(data.notifications);
      } else {
        setNotifications(prev => [...prev, ...data.notifications]);
      }
      
      // Update unread count
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    if (!user || !token) return;
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, isRead: true, readAt: new Date() } 
            : notif
        )
      );
      
      // Update unread count
      setUnreadCount(count => Math.max(0, count - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user || !token) return;
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/notifications/read-all`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true, readAt: new Date() }))
      );
      
      // Reset unread count
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const contextValue = {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    handleNotificationClick
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}; 
