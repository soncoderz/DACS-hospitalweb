const cron = require('node-cron');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Hospital = require('../models/Hospital');
const { sendAppointmentReminderEmail } = require('../services/emailService');

/**
 * Khởi tạo các tác vụ cron job
 */
const initCronJobs = () => {
  console.log('Khởi tạo các tác vụ cron job...');

  // Gửi email nhắc nhở lịch hẹn vào 8:00 AM mỗi ngày
  // Tìm tất cả lịch hẹn trong ngày mai và gửi nhắc nhở
  cron.schedule('0 8 * * *', async () => {
    try {
      console.log('Bắt đầu gửi email nhắc nhở lịch hẹn cho ngày mai...');
      
      // Tính toán ngày mai
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
      
      // Tìm tất cả lịch hẹn trong ngày mai
      const appointments = await Appointment.find({
        appointmentDate: {
          $gte: tomorrow,
          $lt: dayAfterTomorrow
        },
        status: { $nin: ['cancelled', 'completed'] }
      })
      .populate('patientId', 'fullName email')
      .populate({
        path: 'doctorId',
        populate: {
          path: 'user',
          select: 'fullName'
        }
      })
      .populate('hospitalId');
      
      console.log(`Tìm thấy ${appointments.length} lịch hẹn cần gửi nhắc nhở cho ngày mai.`);
      
      // Gửi email nhắc nhở cho từng lịch hẹn
      for (const appointment of appointments) {
        try {
          if (!appointment.patientId || !appointment.patientId.email) {
            console.log(`Bỏ qua lịch hẹn ${appointment._id} vì không có thông tin email bệnh nhân`);
            continue;
          }
          
          // Tạo địa chỉ bệnh viện
          let hospitalAddress = '';
          if (appointment.hospitalId && appointment.hospitalId.address) {
            const address = appointment.hospitalId.address;
            const addressParts = [];
            
            if (address.street) addressParts.push(address.street);
            if (address.district) addressParts.push(address.district);
            if (address.city) addressParts.push(address.city);
            if (address.country) addressParts.push(address.country);
            
            hospitalAddress = addressParts.join(', ');
          }
          
          await sendAppointmentReminderEmail(
            appointment.patientId.email,
            appointment.patientId.fullName,
            {
              bookingCode: appointment.bookingCode || appointment._id.toString().substring(0, 8).toUpperCase(),
              doctorName: appointment.doctorId.user.fullName,
              hospitalName: appointment.hospitalId.name,
              appointmentDate: appointment.appointmentDate.toLocaleDateString('vi-VN'),
              startTime: appointment.timeSlot.startTime,
              endTime: appointment.timeSlot.endTime,
              hospitalAddress
            }
          );
          
          console.log(`Đã gửi email nhắc nhở cho lịch hẹn ${appointment._id}`);
        } catch (emailError) {
          console.error(`Lỗi khi gửi email nhắc nhở cho lịch hẹn ${appointment._id}:`, emailError);
        }
      }
      
      console.log('Hoàn thành gửi email nhắc nhở lịch hẹn.');
    } catch (error) {
      console.error('Lỗi khi thực hiện tác vụ gửi email nhắc nhở:', error);
    }
  });

  console.log('Đã khởi tạo tất cả tác vụ cron job.');
};

module.exports = {
  initCronJobs
}; 