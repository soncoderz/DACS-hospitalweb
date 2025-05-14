const nodemailer = require('nodemailer');

// Khởi tạo transporter
let transporter = null;

// Tạo tài khoản test Ethereal để kiểm tra
const createTestAccount = async () => {
  try {
    const testAccount = await nodemailer.createTestAccount();
    console.log('Đã tạo tài khoản test Ethereal:', testAccount);
    return testAccount;
  } catch (error) {
    console.error('Lỗi khi tạo tài khoản test:', error);
    return null;
  }
};

// Khởi tạo email transport (Gmail hoặc Ethereal)
const initializeEmailTransport = async (useEthereal = false) => {
  try {
    if (useEthereal) {
      const testAccount = await createTestAccount();
      if (testAccount) {
        transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
        console.log('Đã khởi tạo transporter Ethereal thành công');
      }
    } else {
      // Sử dụng Gmail
      // Kiểm tra xem biến môi trường đã được đọc chưa
      console.log('Email configuration:');
      console.log('- EMAIL_USER:', process.env.EMAIL_USER || 'Not set');
      console.log('- EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? 'Password is set' : 'Password is not set');
      
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.error('Thiếu thông tin đăng nhập email trong file .env');
        
        // Fallback to test account if no credentials
        console.log('Falling back to Ethereal test email service...');
        const testAccount = await createTestAccount();
        if (testAccount) {
          transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
              user: testAccount.user,
              pass: testAccount.pass
            }
          });
          console.log('Đã khởi tạo transporter Ethereal (fallback) thành công');
        } else {
          throw new Error('Không thể tạo tài khoản test Ethereal');
        }
      } else {
        transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
          }
        });
        console.log('Đã khởi tạo transporter Gmail thành công');
      }
    }

    // Kiểm tra kết nối
    await transporter.verify();
    console.log('Email server sẵn sàng gửi tin nhắn');
    return true;
  } catch (error) {
    console.error('Lỗi khởi tạo email transport:', error);
    throw error;
  }
};

// Khởi tạo transporter khi module được import
// true để sử dụng Ethereal, false để sử dụng Gmail
// Removed automatic initialization - this will be called from server.js

// Gửi email OTP để đặt lại mật khẩu
const sendOtpEmail = async (email, otp) => {
  if (!transporter) {
    console.error('Email transporter chưa được khởi tạo');
    throw new Error('Email transporter chưa được khởi tạo');
  }

  try {
    const mailOptions = {
      from: `"Hệ thống Bệnh viện" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Mã xác nhận đặt lại mật khẩu',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #0066cc;">Đặt lại mật khẩu</h2>
          </div>
          
          <p>Xin chào,</p>
          
          <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu từ bạn. Vui lòng sử dụng mã OTP sau để xác nhận:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="display: inline-block; padding: 15px 30px; background-color: #f5f5f5; border-radius: 5px; font-size: 24px; font-weight: bold; letter-spacing: 5px;">
              ${otp}
            </div>
          </div>
          
          <p>Mã này có hiệu lực trong <strong>2 phút</strong> từ thời điểm nhận được email này.</p>
          
          <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này hoặc liên hệ với chúng tôi ngay lập tức.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="font-size: 12px; color: #666;">
              Đây là email tự động, vui lòng không trả lời. Nếu bạn cần hỗ trợ, vui lòng liên hệ với chúng tôi qua support@benhvien.com hoặc gọi (028) 3822 1234.
            </p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email gửi thành công: %s', info.messageId);
    
    // Khi sử dụng Ethereal, hiển thị URL để xem email đã gửi
    if (info.messageId && transporter.options.host && transporter.options.host.includes('ethereal')) {
      console.log('URL xem email: %s', nodemailer.getTestMessageUrl(info));
    }
    
    return true;
  } catch (error) {
    console.error('Lỗi gửi email:', error);
    throw error;
  }
};

// Gửi email xác thực tài khoản
const sendVerificationEmail = async (email, verificationToken, fullName) => {
  if (!transporter) {
    console.error('Email transporter chưa được khởi tạo');
    throw new Error('Email transporter chưa được khởi tạo');
  }

  try {
    // Tạo link xác thực
    const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    
    const mailOptions = {
      from: `"Hệ thống Bệnh viện" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Xác nhận tài khoản của bạn',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #0066cc;">Xác nhận tài khoản</h2>
          </div>
          
          <p>Xin chào ${fullName},</p>
          
          <p>Cảm ơn bạn đã đăng ký tài khoản tại Hệ thống Bệnh viện của chúng tôi. Để hoàn tất quá trình đăng ký, vui lòng xác nhận địa chỉ email của bạn bằng cách nhấp vào nút bên dưới:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Xác nhận tài khoản
            </a>
          </div>
          
          <p>Hoặc bạn có thể sao chép và dán đường dẫn sau vào trình duyệt:</p>
          <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">${verificationUrl}</p>
          
          <p>Liên kết này chỉ có hiệu lực trong <strong>5 phút</strong>. Nếu quá thời gian, vui lòng yêu cầu gửi lại email xác thực.</p>
          
          <p><strong>Lưu ý:</strong> Mỗi khi bạn yêu cầu gửi lại email xác thực, liên kết cũ sẽ không còn hiệu lực.</p>
          
          <p>Nếu bạn không tạo tài khoản này, vui lòng bỏ qua email này hoặc liên hệ với chúng tôi ngay lập tức.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="font-size: 12px; color: #666;">
              Đây là email tự động, vui lòng không trả lời. Nếu bạn cần hỗ trợ, vui lòng liên hệ với chúng tôi qua support@benhvien.com hoặc gọi (028) 3822 1234.
            </p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email xác thực gửi thành công: %s', info.messageId);
    
    // Khi sử dụng Ethereal, hiển thị URL để xem email đã gửi
    if (info.messageId && transporter.options.host && transporter.options.host.includes('ethereal')) {
      console.log('URL xem email: %s', nodemailer.getTestMessageUrl(info));
    }
    
    return true;
  } catch (error) {
    console.error('Lỗi gửi email xác thực:', error);
    throw error;
  }
};

/**
 * Gửi email xác nhận đặt lịch khám
 * @param {string} email - Email của bệnh nhân
 * @param {string} patientName - Tên bệnh nhân
 * @param {Object} appointmentInfo - Thông tin lịch hẹn
 * @returns {Promise<boolean>} - Trạng thái gửi email
 */
const sendAppointmentConfirmationEmail = async (email, patientName, appointmentInfo = {}) => {
  if (!transporter) {
    console.error('Email transporter chưa được khởi tạo');
    // Attempt to re-initialize
    try {
      console.log('Attempting to re-initialize email transporter...');
      await initializeEmailTransport(false);
      if (!transporter) {
        throw new Error('Không thể khởi tạo lại email transporter');
      }
    } catch (initError) {
      console.error('Re-initialization failed:', initError);
      throw new Error('Email transporter chưa được khởi tạo và không thể khởi tạo lại');
    }
  }

  try {
    console.log(`Preparing to send appointment confirmation email to ${email}`);
    
    // Đảm bảo appointmentInfo không bao giờ là undefined
    const {
      bookingCode = 'N/A',
      doctorName = 'N/A',
      hospitalName = 'N/A',
      appointmentDate = 'N/A',
      startTime = 'N/A',
      endTime = 'N/A',
      roomName = 'N/A',
      specialtyName = '',
      serviceName = ''
    } = appointmentInfo || {};
    
    // Tạo các thông tin bổ sung nếu có
    const specialtyInfo = specialtyName ? `<tr>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Chuyên khoa:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${specialtyName}</td>
      </tr>` : '';
      
    const serviceInfo = serviceName ? `<tr>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Dịch vụ:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${serviceName}</td>
      </tr>` : '';
    
    const mailOptions = {
      from: `"Hệ thống Bệnh viện" <${process.env.EMAIL_USER || 'hospital@example.com'}>`,
      to: email,
      subject: 'Xác nhận đặt lịch khám thành công',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #0066cc;">Xác nhận đặt lịch khám</h2>
          </div>
          
          <p>Xin chào ${patientName},</p>
          
          <p>Cảm ơn bạn đã đặt lịch khám tại Hệ thống Bệnh viện của chúng tôi. Dưới đây là chi tiết lịch hẹn của bạn:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Mã đặt lịch:</td>
              <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${bookingCode}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Bác sĩ:</td>
              <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${doctorName}</td>
            </tr>
            ${specialtyInfo}
            ${serviceInfo}
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Bệnh viện/Chi nhánh:</td>
              <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${hospitalName}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Ngày khám:</td>
              <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${appointmentDate}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Giờ khám:</td>
              <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${startTime} - ${endTime}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Phòng khám:</td>
              <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${roomName}</td>
            </tr>
          </table>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #333;"><strong>Lưu ý:</strong></p>
            <p style="margin: 10px 0 0 0; color: #333;">- Vui lòng đến trước giờ hẹn 15 phút để hoàn tất thủ tục.</p>
            <p style="margin: 5px 0 0 0; color: #333;">- Mang theo CMND/CCCD và thẻ BHYT (nếu có).</p>
            <p style="margin: 5px 0 0 0; color: #333;">- Nếu bạn cần hủy hoặc đổi lịch, vui lòng thông báo trước ít nhất 24 giờ.</p>
          </div>
          
          <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi qua hotline: <strong>(028) 3822 1234</strong>.</p>
          
          <p>Chúc bạn có trải nghiệm khám bệnh tốt!</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="font-size: 12px; color: #666;">
              Đây là email tự động, vui lòng không trả lời. Nếu bạn cần hỗ trợ, vui lòng liên hệ với chúng tôi qua support@benhvien.com.
            </p>
          </div>
        </div>
      `
    };

    console.log(`Sending email to ${email} with subject: ${mailOptions.subject}`);
    const info = await transporter.sendMail(mailOptions);
    console.log('Email gửi thành công: %s', info.messageId);
    
    // Khi sử dụng Ethereal, hiển thị URL để xem email đã gửi
    if (info.messageId && transporter.options.host && transporter.options.host.includes('ethereal')) {
      console.log('URL xem email: %s', nodemailer.getTestMessageUrl(info));
    }
    
    return true;
  } catch (error) {
    console.error('Lỗi chi tiết khi gửi email xác nhận đặt lịch:', error);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    if (error.command) {
      console.error('Error command:', error.command);
    }
    throw error;
  }
};

/**
 * Gửi email nhắc nhở lịch khám
 * @param {string} email - Email của bệnh nhân
 * @param {string} patientName - Tên bệnh nhân
 * @param {Object} appointmentInfo - Thông tin lịch hẹn
 * @returns {Promise<boolean>} - Trạng thái gửi email
 */
const sendAppointmentReminderEmail = async (email, patientName, appointmentInfo) => {
  if (!transporter) {
    console.error('Email transporter chưa được khởi tạo');
    throw new Error('Email transporter chưa được khởi tạo');
  }

  try {
    const { bookingCode, doctorName, hospitalName, appointmentDate, startTime, endTime, hospitalAddress } = appointmentInfo;
    
    const mailOptions = {
      from: `"Hệ thống Bệnh viện" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Nhắc nhở lịch khám sắp tới',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #0066cc;">Nhắc nhở lịch khám</h2>
          </div>
          
          <p>Xin chào ${patientName},</p>
          
          <p>Chúng tôi xin nhắc bạn về lịch khám sắp tới tại Hệ thống Bệnh viện của chúng tôi:</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Mã đặt lịch:</strong> ${bookingCode}</p>
            <p><strong>Bác sĩ:</strong> ${doctorName}</p>
            <p><strong>Bệnh viện:</strong> ${hospitalName}</p>
            <p><strong>Ngày khám:</strong> ${appointmentDate}</p>
            <p><strong>Giờ khám:</strong> ${startTime} - ${endTime}</p>
            ${hospitalAddress ? `<p><strong>Địa chỉ:</strong> ${hospitalAddress}</p>` : ''}
          </div>
          
          <p><strong>Lưu ý quan trọng:</strong></p>
          <ul>
            <li>Vui lòng đến trước 15 phút để hoàn tất thủ tục đăng ký</li>
            <li>Mang theo CMND/CCCD và thẻ BHYT (nếu có)</li>
            <li>Mang theo các kết quả xét nghiệm, hồ sơ bệnh án trước đây (nếu có)</li>
            <li>Nếu bạn cần hủy hoặc đổi lịch, vui lòng thông báo trước ít nhất 24 giờ</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/appointments" style="display: inline-block; padding: 12px 24px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Quản lý lịch hẹn
            </a>
          </div>
          
          <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi qua số điện thoại (028) 3822 1234.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="font-size: 12px; color: #666;">
              Đây là email tự động, vui lòng không trả lời. Nếu bạn cần hỗ trợ, vui lòng liên hệ với chúng tôi qua support@benhvien.com hoặc gọi (028) 3822 1234.
            </p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email nhắc nhở lịch khám gửi thành công: %s', info.messageId);
    
    // Khi sử dụng Ethereal, hiển thị URL để xem email đã gửi
    if (info.messageId && transporter.options.host && transporter.options.host.includes('ethereal')) {
      console.log('URL xem email: %s', nodemailer.getTestMessageUrl(info));
    }
    
    return true;
  } catch (error) {
    console.error('Lỗi gửi email nhắc nhở lịch khám:', error);
    throw error;
  }
};

/**
 * Gửi email thông báo đổi lịch khám
 * @param {string} email - Email của bệnh nhân
 * @param {string} patientName - Tên bệnh nhân
 * @param {Object} appointmentInfo - Thông tin lịch hẹn mới
 * @param {Object} oldAppointmentInfo - Thông tin lịch hẹn cũ
 * @returns {Promise<boolean>} - Trạng thái gửi email
 */
const sendAppointmentRescheduleEmail = async (email, patientName, appointmentInfo, oldAppointmentInfo) => {
  if (!transporter) {
    console.error('Email transporter chưa được khởi tạo');
    throw new Error('Email transporter chưa được khởi tạo');
  }

  try {
    const {
      bookingCode,
      doctorName,
      hospitalName,
      appointmentDate,
      startTime,
      endTime,
      roomName,
      specialtyName,
      serviceName
    } = appointmentInfo;
    
    const {
      appointmentDate: oldDate,
      startTime: oldStartTime,
      endTime: oldEndTime,
      roomName: oldRoomName
    } = oldAppointmentInfo;
    
    // Tạo các thông tin bổ sung nếu có
    const specialtyInfo = specialtyName ? `<tr>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Chuyên khoa:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${specialtyName}</td>
      </tr>` : '';
      
    const serviceInfo = serviceName ? `<tr>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Dịch vụ:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${serviceName}</td>
      </tr>` : '';
    
    const mailOptions = {
      from: `"Hệ thống Bệnh viện" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Thông báo đổi lịch khám',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #0066cc;">Thông báo đổi lịch khám</h2>
          </div>
          
          <p>Xin chào ${patientName},</p>
          
          <p>Chúng tôi xác nhận lịch hẹn của bạn đã được đổi thành công. Dưới đây là chi tiết lịch hẹn mới của bạn:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Mã đặt lịch:</td>
              <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${bookingCode}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Bác sĩ:</td>
              <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${doctorName}</td>
            </tr>
            ${specialtyInfo}
            ${serviceInfo}
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Bệnh viện/Chi nhánh:</td>
              <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${hospitalName}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; font-weight: bold; color: #0066cc;">Ngày khám mới:</td>
              <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; color: #0066cc; font-weight: bold;">${appointmentDate}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; font-weight: bold; color: #0066cc;">Giờ khám mới:</td>
              <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; color: #0066cc; font-weight: bold;">${startTime} - ${endTime}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; font-weight: bold; color: #0066cc;">Phòng khám mới:</td>
              <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; color: #0066cc; font-weight: bold;">${roomName}</td>
            </tr>
          </table>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #333;"><strong>Thông tin lịch hẹn cũ đã bị hủy:</strong></p>
            <p style="margin: 10px 0 0 0; color: #777;">- Ngày khám: ${oldDate}</p>
            <p style="margin: 5px 0 0 0; color: #777;">- Giờ khám: ${oldStartTime} - ${oldEndTime}</p>
            <p style="margin: 5px 0 0 0; color: #777;">- Phòng khám: ${oldRoomName}</p>
          </div>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #333;"><strong>Lưu ý:</strong></p>
            <p style="margin: 10px 0 0 0; color: #333;">- Vui lòng đến trước giờ hẹn 15 phút để hoàn tất thủ tục.</p>
            <p style="margin: 5px 0 0 0; color: #333;">- Mang theo CMND/CCCD và thẻ BHYT (nếu có).</p>
            <p style="margin: 5px 0 0 0; color: #333;">- Mỗi bệnh nhân chỉ được đổi lịch tối đa 2 lần cho một lịch hẹn.</p>
          </div>
          
          <p>Nếu bạn không yêu cầu thay đổi này, hoặc có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi ngay qua hotline: <strong>(028) 3822 1234</strong>.</p>
          
          <p>Chúc bạn có trải nghiệm khám bệnh tốt!</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="font-size: 12px; color: #666;">
              Đây là email tự động, vui lòng không trả lời. Nếu bạn cần hỗ trợ, vui lòng liên hệ với chúng tôi qua support@benhvien.com.
            </p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email thông báo đổi lịch gửi thành công: %s', info.messageId);
    
    // Khi sử dụng Ethereal, hiển thị URL để xem email đã gửi
    if (info.messageId && transporter.options.host && transporter.options.host.includes('ethereal')) {
      console.log('URL xem email: %s', nodemailer.getTestMessageUrl(info));
    }
    
    return true;
  } catch (error) {
    console.error('Lỗi gửi email thông báo đổi lịch:', error);
    throw error;
  }
};

/**
 * Gửi email thông báo lịch hẹn mới cho bác sĩ
 * @param {string} email - Email của bác sĩ
 * @param {string} doctorName - Tên bác sĩ
 * @param {Object} appointmentInfo - Thông tin lịch hẹn
 * @param {Object} patientInfo - Thông tin bệnh nhân
 * @returns {Promise<boolean>} - Trạng thái gửi email
 */
const sendDoctorAppointmentNotificationEmail = async (email, doctorName, appointmentInfo, patientInfo) => {
  if (!transporter) {
    console.error('Email transporter chưa được khởi tạo');
    throw new Error('Email transporter chưa được khởi tạo');
  }

  try {
    const {
      bookingCode,
      hospitalName,
      appointmentDate,
      startTime,
      endTime,
      roomName,
      specialtyName,
      serviceName,
      appointmentType,
      symptoms,
      medicalHistory,
      notes
    } = appointmentInfo;
    
    const {
      patientName,
      patientGender,
      patientAge,
      patientPhone,
      patientEmail
    } = patientInfo;
    
    // Tạo các thông tin bổ sung nếu có
    const specialtyInfo = specialtyName ? `<tr>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Chuyên khoa:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${specialtyName}</td>
      </tr>` : '';
      
    const serviceInfo = serviceName ? `<tr>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Dịch vụ:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${serviceName}</td>
      </tr>` : '';
    
    const symptomsInfo = symptoms ? `<tr>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Triệu chứng:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${symptoms}</td>
      </tr>` : '';
    
    const medicalHistoryInfo = medicalHistory ? `<tr>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Tiền sử bệnh:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${medicalHistory}</td>
      </tr>` : '';
    
    const notesInfo = notes ? `<tr>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Ghi chú:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${notes}</td>
      </tr>` : '';
    
    const mailOptions = {
      from: `"Hệ thống Bệnh viện" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Thông báo có lịch hẹn mới',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #0066cc;">Thông báo lịch hẹn mới</h2>
          </div>
          
          <p>Kính gửi Bác sĩ ${doctorName},</p>
          
          <p>Bạn có một lịch hẹn mới được đặt. Dưới đây là chi tiết lịch hẹn:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Mã đặt lịch:</td>
              <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${bookingCode}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Bệnh viện/Chi nhánh:</td>
              <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${hospitalName}</td>
            </tr>
            ${specialtyInfo}
            ${serviceInfo}
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Ngày khám:</td>
              <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${appointmentDate}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Giờ khám:</td>
              <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${startTime} - ${endTime}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Phòng khám:</td>
              <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${roomName}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Loại khám:</td>
              <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${
                appointmentType === 'first-visit' ? 'Khám lần đầu' : 
                appointmentType === 'follow-up' ? 'Tái khám' : 
                appointmentType === 'consultation' ? 'Tư vấn' : appointmentType
              }</td>
            </tr>
          </table>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #333;"><strong>Thông tin bệnh nhân:</strong></p>
            <p style="margin: 10px 0 0 0; color: #333;">- Họ tên: ${patientName}</p>
            ${patientGender ? `<p style="margin: 5px 0 0 0; color: #333;">- Giới tính: ${patientGender}</p>` : ''}
            ${patientAge ? `<p style="margin: 5px 0 0 0; color: #333;">- Tuổi: ${patientAge}</p>` : ''}
            ${patientPhone ? `<p style="margin: 5px 0 0 0; color: #333;">- Số điện thoại: ${patientPhone}</p>` : ''}
            ${patientEmail ? `<p style="margin: 5px 0 0 0; color: #333;">- Email: ${patientEmail}</p>` : ''}
          </div>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            ${symptomsInfo}
            ${medicalHistoryInfo}
            ${notesInfo}
          </table>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/doctor/appointments" style="display: inline-block; padding: 12px 24px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Xem lịch hẹn
            </a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="font-size: 12px; color: #666;">
              Đây là email tự động, vui lòng không trả lời. Nếu bạn cần hỗ trợ, vui lòng liên hệ với bộ phận quản trị.
            </p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email thông báo lịch hẹn mới cho bác sĩ gửi thành công: %s', info.messageId);
    
    // Khi sử dụng Ethereal, hiển thị URL để xem email đã gửi
    if (info.messageId && transporter.options.host && transporter.options.host.includes('ethereal')) {
      console.log('URL xem email: %s', nodemailer.getTestMessageUrl(info));
    }
    
    return true;
  } catch (error) {
    console.error('Lỗi gửi email thông báo lịch hẹn mới cho bác sĩ:', error);
    throw error;
  }
};

module.exports = {
  sendOtpEmail,
  sendVerificationEmail,
  sendAppointmentConfirmationEmail,
  sendAppointmentReminderEmail,
  sendAppointmentRescheduleEmail,
  sendDoctorAppointmentNotificationEmail,
  initializeEmailTransport
}; 