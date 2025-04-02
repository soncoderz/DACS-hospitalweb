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
      console.log('- EMAIL_USER:', process.env.EMAIL_USER);
      console.log('- EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? 'Password is set' : 'Password is missing');
      
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.error('Thiếu thông tin đăng nhập email trong file .env');
        throw new Error('Thiếu thông tin đăng nhập email');
      }
      
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });
      console.log('Đã khởi tạo transporter Gmail thành công');
    }

    // Kiểm tra kết nối
    transporter.verify(function(error, success) {
      if (error) {
        console.log('Lỗi kết nối email server:', error);
      } else {
        console.log('Email server sẵn sàng gửi tin nhắn');
      }
    });
  } catch (error) {
    console.error('Lỗi khởi tạo email transport:', error);
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

module.exports = {
  sendOtpEmail,
  sendVerificationEmail,
  initializeEmailTransport
}; 