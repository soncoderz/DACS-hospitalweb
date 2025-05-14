const Notification = require('../models/Notification');
const { 
  sendNotificationToUser, 
  sendNotificationToUsers, 
  sendNotificationToRole 
} = require('../config/socketConfig');

// Create a notification record in the database and send it via socket
const createNotification = async (data) => {
  try {
    const notification = await Notification.create(data);
    
    // Send real-time notification based on recipient type
    if (data.recipientId) {
      sendNotificationToUser(data.recipientId, notification);
    } else if (data.recipientIds && data.recipientIds.length > 0) {
      sendNotificationToUsers(data.recipientIds, notification);
    } else if (data.recipientRole) {
      sendNotificationToRole(data.recipientRole, notification);
    }
    
    return notification;
  } catch (error) {
    console.error('Notification creation error:', error);
    throw error;
  }
};

// Appointment created notification
const appointmentCreatedNotification = async (appointment, recipientIds) => {
  const { patientId, doctorId, hospitalId, serviceId, scheduledTime } = appointment;
  
  // Format date for display
  const appointmentDate = new Date(scheduledTime).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // Notify all relevant parties (doctor, hospital admin)
  const notifications = [];
  
  try {
    // Get service name if available
    let serviceName = '';
    if (serviceId) {
      const Service = require('../models/Service');
      const service = await Service.findById(serviceId);
      if (service) {
        serviceName = service.name;
      }
    }
    
    // Notify doctor
    if (doctorId) {
      const notificationForDoctor = await createNotification({
        recipientId: doctorId,
        title: 'Lịch hẹn mới',
        message: `Bạn có một lịch hẹn khám mới vào ${appointmentDate}${serviceName ? ` cho dịch vụ ${serviceName}` : ''}`,
        type: 'appointment_create',
        data: {
          appointmentId: appointment._id,
          appointmentDate: scheduledTime
        },
        isRead: false
      });
      notifications.push(notificationForDoctor);
    }
    
    // Notify hospital admin if applicable
    if (hospitalId) {
      // Get hospital admins
      const User = require('../models/User');
      const hospitalAdmins = await User.find({ 
        hospitalId, 
        roleType: 'hospital_admin',
        isActive: true
      }).select('_id');
      
      if (hospitalAdmins && hospitalAdmins.length > 0) {
        const adminIds = hospitalAdmins.map(admin => admin._id);
        
        const notificationForHospital = await createNotification({
          recipientIds: adminIds,
          title: 'Lịch hẹn mới tại bệnh viện',
          message: `Có một lịch hẹn khám mới vào ${appointmentDate}${serviceName ? ` cho dịch vụ ${serviceName}` : ''}`,
          type: 'appointment_create',
          data: {
            appointmentId: appointment._id,
            appointmentDate: scheduledTime
          },
          isRead: false
        });
        notifications.push(notificationForHospital);
      }
    }
    
    return notifications;
  } catch (error) {
    console.error('Appointment created notification error:', error);
    throw error;
  }
};

// Appointment updated notification
const appointmentUpdatedNotification = async (appointment, updatedBy, changes) => {
  try {
    const { patientId, doctorId, hospitalId, scheduledTime } = appointment;
    
    // Format date for display
    const appointmentDate = new Date(scheduledTime).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Determine who should receive the notification (everyone except updater)
    const recipientIds = [patientId, doctorId].filter(id => 
      id && id.toString() !== updatedBy.toString()
    );
    
    // Create appropriate message based on what changed
    let changeDescription = '';
    if (changes.scheduledTime) {
      const oldDate = new Date(changes.scheduledTime.old).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      changeDescription = `Thời gian lịch hẹn đã thay đổi từ ${oldDate} sang ${appointmentDate}`;
    } else if (changes.status) {
      changeDescription = `Trạng thái lịch hẹn đã thay đổi từ ${changes.status.old} sang ${changes.status.new}`;
    } else if (changes.serviceId) {
      // Get service names
      const Service = require('../models/Service');
      const [oldService, newService] = await Promise.all([
        Service.findById(changes.serviceId.old),
        Service.findById(changes.serviceId.new)
      ]);
      
      changeDescription = `Dịch vụ đã thay đổi từ ${oldService?.name || 'không xác định'} sang ${newService?.name || 'không xác định'}`;
    } else {
      changeDescription = 'Thông tin lịch hẹn đã được cập nhật';
    }
    
    // Notify all recipients
    return await createNotification({
      recipientIds,
      title: 'Lịch hẹn đã được cập nhật',
      message: changeDescription,
      type: 'appointment_update',
      data: {
        appointmentId: appointment._id,
        appointmentDate: scheduledTime,
        changes
      },
      isRead: false
    });
  } catch (error) {
    console.error('Appointment updated notification error:', error);
    throw error;
  }
};

// Appointment canceled notification
const appointmentCanceledNotification = async (appointment, canceledBy, reason) => {
  try {
    const { patientId, doctorId, hospitalId, scheduledTime, serviceId } = appointment;
    
    // Format date for display
    const appointmentDate = new Date(scheduledTime).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Get service name if available
    let serviceName = '';
    if (serviceId) {
      const Service = require('../models/Service');
      const service = await Service.findById(serviceId);
      if (service) {
        serviceName = service.name;
      }
    }
    
    // Get user who canceled
    const User = require('../models/User');
    const canceledByUser = await User.findById(canceledBy);
    
    // Create message
    const cancelMessage = `Lịch hẹn vào ${appointmentDate}${serviceName ? ` cho dịch vụ ${serviceName}` : ''} đã bị hủy${canceledByUser ? ` bởi ${canceledByUser.fullName || canceledByUser.email}` : ''}${reason ? `. Lý do: ${reason}` : ''}`;
    
    // Determine who should receive the notification (everyone except canceler)
    const recipientIds = [patientId, doctorId].filter(id => 
      id && id.toString() !== canceledBy.toString()
    );
    
    if (recipientIds.length === 0) return null;
    
    // Notify all recipients
    return await createNotification({
      recipientIds,
      title: 'Lịch hẹn đã bị hủy',
      message: cancelMessage,
      type: 'appointment_cancel',
      data: {
        appointmentId: appointment._id,
        appointmentDate: scheduledTime,
        reason
      },
      isRead: false
    });
  } catch (error) {
    console.error('Appointment canceled notification error:', error);
    throw error;
  }
};

// Appointment reminder notification
const appointmentReminderNotification = async (appointment) => {
  try {
    const { patientId, doctorId, scheduledTime, serviceId, hospitalId } = appointment;
    
    // Format date for display
    const appointmentDate = new Date(scheduledTime).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Get service name if available
    let serviceName = '';
    let hospitalName = '';
    
    if (serviceId) {
      const Service = require('../models/Service');
      const service = await Service.findById(serviceId);
      if (service) {
        serviceName = service.name;
      }
    }
    
    if (hospitalId) {
      const Hospital = require('../models/Hospital');
      const hospital = await Hospital.findById(hospitalId);
      if (hospital) {
        hospitalName = hospital.name;
      }
    }
    
    // Notify patient
    const patientMessage = `Nhắc nhở: Bạn có lịch hẹn vào ${appointmentDate}${serviceName ? ` cho dịch vụ ${serviceName}` : ''}${hospitalName ? ` tại ${hospitalName}` : ''}`;
    
    const notificationForPatient = await createNotification({
      recipientId: patientId,
      title: 'Nhắc nhở lịch hẹn',
      message: patientMessage,
      type: 'appointment_reminder',
      data: {
        appointmentId: appointment._id,
        appointmentDate: scheduledTime
      },
      isRead: false
    });
    
    // Notify doctor
    const doctorMessage = `Nhắc nhở: Bạn có lịch hẹn với bệnh nhân vào ${appointmentDate}${serviceName ? ` cho dịch vụ ${serviceName}` : ''}`;
    
    const notificationForDoctor = await createNotification({
      recipientId: doctorId,
      title: 'Nhắc nhở lịch hẹn',
      message: doctorMessage,
      type: 'appointment_reminder',
      data: {
        appointmentId: appointment._id,
        appointmentDate: scheduledTime
      },
      isRead: false
    });
    
    return [notificationForPatient, notificationForDoctor];
  } catch (error) {
    console.error('Appointment reminder notification error:', error);
    throw error;
  }
};

// Payment notification
const paymentNotification = async (payment, userId) => {
  try {
    // Nếu không có userId, tìm user từ payment
    if (!userId && payment.userId) {
      userId = payment.userId;
    }
    
    // Nếu vẫn không có userId, không thực hiện thông báo
    if (!userId) {
      console.log('Payment notification skipped: No recipient ID available');
      return null;
    }
    
    const { appointmentId, amount, paymentStatus, paymentMethod } = payment;
    
    // Get appointment details
    const Appointment = require('../models/Appointment');
    const appointment = await Appointment.findById(appointmentId);
    
    if (!appointment) {
      throw new Error('Appointment not found');
    }
    
    // Create message based on payment status
    let title = '';
    let message = '';
    
    // Chuẩn hóa status để tương thích với cả paymentStatus và status
    const status = paymentStatus || payment.status || 'pending';
    const method = paymentMethod || payment.method || 'cash';
    
    if (status === 'completed' || status === 'paid') {
      title = 'Thanh toán thành công';
      message = `Thanh toán ${amount.toLocaleString('vi-VN')} VNĐ cho lịch hẹn đã được xác nhận. Phương thức: ${method === 'paypal' ? 'PayPal' : method}`;
    } else if (status === 'pending') {
      title = 'Thanh toán đang xử lý';
      message = `Thanh toán ${amount.toLocaleString('vi-VN')} VNĐ cho lịch hẹn đang được xử lý. Phương thức: ${method === 'paypal' ? 'PayPal' : method}`;
    } else if (status === 'failed') {
      title = 'Thanh toán thất bại';
      message = `Thanh toán ${amount.toLocaleString('vi-VN')} VNĐ cho lịch hẹn đã thất bại. Phương thức: ${method === 'paypal' ? 'PayPal' : method}`;
    }
    
    // Notify the user who made the payment
    return await createNotification({
      recipientId: userId,
      title,
      message,
      type: 'payment',
      data: {
        paymentId: payment._id,
        appointmentId: appointment._id,
        amount,
        status
      },
      isRead: false
    });
  } catch (error) {
    console.error('Payment notification error:', error);
    // Không ném lỗi ra ngoài để tránh làm gián đoạn luồng thanh toán chính
    return null;
  }
};

module.exports = {
  createNotification,
  appointmentCreatedNotification,
  appointmentUpdatedNotification,
  appointmentCanceledNotification,
  appointmentReminderNotification,
  paymentNotification
}; 