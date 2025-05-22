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
            <h2 style="color: #0066cc;">Lịch hẹn đã được xác nhận</h2>
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
    console.log(`Preparing to send doctor notification email to ${email}`);
    
    // Determine if this is a new appointment or a rescheduled one
    const isRescheduled = appointmentInfo.isRescheduled;
    
    // Adjust subject based on appointment type
    const subject = isRescheduled 
      ? `Thông báo: Bệnh nhân đã đổi lịch hẹn khám - Mã ${appointmentInfo.bookingCode}` 
      : `Thông báo: Có lịch hẹn khám mới - Mã ${appointmentInfo.bookingCode}`;
    
    // Adjust content based on appointment type
    let rescheduledInfoContent = '';
    if (isRescheduled) {
      rescheduledInfoContent = `
        <tr>
          <td style="padding: 10px 0;">
            <p style="font-size: 16px; color: #d32f2f; font-weight: bold;">Thông tin thay đổi:</p>
            <p>Lịch hẹn đã được đổi từ <strong>${appointmentInfo.oldAppointmentDate}</strong> lúc <strong>${appointmentInfo.oldStartTime}</strong> sang <strong>${appointmentInfo.appointmentDate}</strong> lúc <strong>${appointmentInfo.startTime}</strong>.</p>
          </td>
        </tr>
      `;
    }
    
    // Email HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #3f51b5; color: white; padding: 15px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; border: 1px solid #ddd; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
          .info-table { width: 100%; border-collapse: collapse; }
          .info-table td { padding: 8px 0; border-bottom: 1px solid #eee; }
          .highlight { color: #3f51b5; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${isRescheduled ? 'Thông Báo Đổi Lịch Hẹn' : 'Thông Báo Lịch Hẹn Mới'}</h1>
          </div>
          <div class="content">
            <p>Kính gửi <strong>BS. ${doctorName}</strong>,</p>
            
            ${isRescheduled 
              ? `<p>Bệnh nhân <strong>${patientInfo.name}</strong> đã thay đổi lịch hẹn khám với bạn. Dưới đây là thông tin chi tiết về lịch hẹn đã được cập nhật:</p>` 
              : `<p>Bạn vừa nhận được một lịch hẹn khám mới từ bệnh nhân <strong>${patientInfo.name}</strong>. Dưới đây là thông tin chi tiết về lịch hẹn:</p>`}
            
            <table class="info-table">
              <tr>
                <td><strong>Mã đặt lịch:</strong></td>
                <td><span class="highlight">${appointmentInfo.bookingCode || 'N/A'}</span></td>
              </tr>
              <tr>
                <td><strong>Tên bệnh nhân:</strong></td>
                <td>${patientInfo.name}</td>
              </tr>
              <tr>
                <td><strong>Email bệnh nhân:</strong></td>
                <td>${patientInfo.email}</td>
              </tr>
              <tr>
                <td><strong>Số điện thoại:</strong></td>
                <td>${patientInfo.phone || 'Không cung cấp'}</td>
              </tr>
              <tr>
                <td><strong>Ngày khám:</strong></td>
                <td><span class="highlight">${appointmentInfo.appointmentDate}</span></td>
              </tr>
              <tr>
                <td><strong>Giờ khám:</strong></td>
                <td><span class="highlight">${appointmentInfo.startTime} - ${appointmentInfo.endTime}</span></td>
              </tr>
              <tr>
                <td><strong>Bệnh viện:</strong></td>
                <td>${appointmentInfo.hospitalName}</td>
              </tr>
              <tr>
                <td><strong>Phòng khám:</strong></td>
                <td>${appointmentInfo.roomName}</td>
              </tr>
              ${appointmentInfo.specialtyName ? `
              <tr>
                <td><strong>Chuyên khoa:</strong></td>
                <td>${appointmentInfo.specialtyName}</td>
              </tr>` : ''}
              ${appointmentInfo.serviceName ? `
              <tr>
                <td><strong>Dịch vụ:</strong></td>
                <td>${appointmentInfo.serviceName}</td>
              </tr>` : ''}
            </table>
            
            ${rescheduledInfoContent}
            
            <p>Vui lòng kiểm tra lịch và xác nhận lịch hẹn trên hệ thống.</p>
            
            <p>Trân trọng,<br>Hệ thống đặt lịch khám bệnh</p>
          </div>
          <div class="footer">
            <p>Email này được gửi tự động, vui lòng không trả lời.</p>
            <p>&copy; ${new Date().getFullYear()} Hệ thống đặt lịch khám bệnh. Tất cả quyền được bảo lưu.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    // Prepare mail options
    const mailOptions = {
      from: `"Hệ thống đặt lịch khám" <${process.env.EMAIL_USER || 'support@healthcaresystem.com'}>`,
      to: email,
      subject: subject,
      html: htmlContent
    };

    // Send email
    console.log(`Sending doctor notification email to ${email} with subject: ${subject}`);
    const info = await transporter.sendMail(mailOptions);
    console.log('Doctor appointment notification email sent:', info.messageId);
    
    // Khi sử dụng Ethereal, hiển thị URL để xem email đã gửi
    if (info.messageId && transporter.options.host && transporter.options.host.includes('ethereal')) {
      console.log('URL xem email: %s', nodemailer.getTestMessageUrl(info));
    }
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending doctor appointment notification email:', error);
    return { success: false, error: error.message };
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