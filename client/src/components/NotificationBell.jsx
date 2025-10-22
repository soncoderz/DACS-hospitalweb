import React, { useState } from 'react';
import { 
  Badge, 
  IconButton, 
  Popover, 
  List, 
  ListItem, 
  ListItemText, 
  Typography, 
  Box, 
  Button, 
  Divider 
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useNotification } from '../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, handleNotificationClick } = useNotification();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationItemClick = (notification) => {
    handleNotificationClick(notification);
    handleClose();
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const formatNotificationTime = (date) => {
    return formatDistanceToNow(new Date(date), { 
      addSuffix: true,
      locale: vi 
    });
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'appointment_create':
        return '🗓️';
      case 'appointment_update':
        return '🔄';
      case 'appointment_cancel':
        return '❌';
      case 'appointment_reminder':
        return '⏰';
      case 'payment':
        return '💰';
      default:
        return '📢';
    }
  };

  const open = Boolean(anchorEl);
  const id = open ? 'notifications-popover' : undefined;

  return (
    <>
      <IconButton 
        aria-describedby={id} 
        onClick={handleClick} 
        color="inherit"
        aria-label="notifications"
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        sx={{ 
          mt: 1,
          '& .MuiPopover-paper': { 
            width: 320,
            maxHeight: 500 
          } 
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Thông báo</Typography>
          {unreadCount > 0 && (
            <Button 
              size="small" 
              onClick={handleMarkAllAsRead}
              color="primary"
            >
              Đánh dấu tất cả đã đọc
            </Button>
          )}
        </Box>
        <Divider />
        {notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="textSecondary">Không có thông báo nào</Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {notifications.map((notification) => (
              <React.Fragment key={notification._id}>
                <ListItem 
                  alignItems="flex-start" 
                  button
                  onClick={() => handleNotificationItemClick(notification)}
                  sx={{
                    backgroundColor: notification.isRead ? 'transparent' : 'rgba(0, 0, 0, 0.04)',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.08)',
                    }
                  }}
                >
                  <Box sx={{ mr: 1, fontSize: '1.5rem' }}>
                    {getNotificationIcon(notification.type)}
                  </Box>
                  <ListItemText
                    primary={
                      <Typography
                        variant="subtitle2"
                        color="textPrimary"
                        sx={{ fontWeight: notification.isRead ? 'normal' : 'bold' }}
                      >
                        {notification.title}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography
                          component="span"
                          variant="body2"
                          color="textPrimary"
                          sx={{ display: 'inline', fontWeight: notification.isRead ? 'normal' : 'medium' }}
                        >
                          {notification.message}
                        </Typography>
                        <Typography
                          component="div"
                          variant="caption"
                          color="textSecondary"
                          sx={{ mt: 0.5 }}
                        >
                          {formatNotificationTime(notification.createdAt)}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        )}
      </Popover>
    </>
  );
};

export default NotificationBell; 
