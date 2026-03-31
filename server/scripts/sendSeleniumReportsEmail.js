// =============================================================================
// SEND SELENIUM REPORTS EMAIL - Gửi báo cáo kết quả Selenium qua email
// =============================================================================
// Script này được gọi bởi runner Selenium (client/selenium/run.js) SAU KHI
// toàn bộ test suite đã chạy xong. Nó gom các artifact (file report, ảnh chụp
// màn hình lỗi, JSON kết quả) của lần chạy hiện tại rồi gửi qua SendGrid.
//
// Mục đích: Thông báo cho team khi test Selenium thất bại, kèm theo
// report chi tiết và ảnh chụp màn hình để debug nhanh.
//
// Cách sử dụng:
//   node sendSeleniumReportsEmail.js --report <file> --to <email>
//     [--artifact <file1>] [--artifact <file2>] [--artifacts-dir <dir>]
//     [--subject <tiêu đề>]
// =============================================================================

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const sgMail = require('@sendgrid/mail');  // Thư viện gửi email qua SendGrid API

// Nạp biến môi trường từ file .env của server (chứa SENDGRID_API_KEY, EMAIL_USER, v.v.)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Hàm đọc tham số dòng lệnh xuất hiện MỘT LẦN (ví dụ: --report <file>)
function getArg(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1 || index === process.argv.length - 1) {
    return null;
  }
  return process.argv[index + 1];
}

// Hàm đọc tham số dòng lệnh LẶP LẠI NHIỀU LẦN
// (ví dụ: --artifact file1.png --artifact file2.json)
function getArgs(flag) {
  const values = [];

  for (let index = 0; index < process.argv.length; index += 1) {
    if (process.argv[index] === flag && index < process.argv.length - 1) {
      values.push(process.argv[index + 1]);
    }
  }

  return values;
}

// Liệt kê tất cả file artifact hợp lệ trong thư mục artifacts
// Chỉ gửi file có đuôi .txt, .json, .png (report text, kết quả JSON, ảnh chụp lỗi)
function listArtifactFiles(artifactsDir) {
  if (!artifactsDir || !fs.existsSync(artifactsDir)) {
    return [];
  }

  return fs.readdirSync(artifactsDir)
    .map((name) => path.join(artifactsDir, name))
    .filter((filePath) => fs.statSync(filePath).isFile())
    .filter((filePath) => ['.txt', '.json', '.png'].includes(path.extname(filePath).toLowerCase()));
}

// Hàm chính - Gom artifact và gửi email báo cáo qua SendGrid
// Runner Selenium gọi script này sau khi đã tạo report, truyền đường dẫn
// file report và các artifact kèm theo.
async function main() {
  // Đọc các tham số dòng lệnh
  const reportPath = getArg('--report');         // Đường dẫn file report (.txt)
  const artifactsDir = getArg('--artifacts-dir');// Thư mục chứa artifact (tùy chọn)
  const explicitArtifacts = getArgs('--artifact');// Danh sách file artifact cụ thể
  const explicitTo = getArg('--to');             // Email người nhận (tùy chọn)
  const explicitSubject = getArg('--subject');   // Tiêu đề email (tùy chọn)

  // Xác định email người nhận - ưu tiên tham số --to, nếu không có thì dùng TEST_EMAIL từ .env
  const to = explicitTo || process.env.TEST_EMAIL;
  // Email người gửi từ biến môi trường
  const from = process.env.EMAIL_USER;
  // API key của SendGrid
  const apiKey = process.env.SENDGRID_API_KEY;

  // Kiểm tra các thông tin bắt buộc
  if (!to) {
    throw new Error('Missing recipient email. Provide --to or TEST_EMAIL in server/.env.');
  }

  if (!from) {
    throw new Error('Missing EMAIL_USER in server/.env.');
  }

  if (!apiKey) {
    throw new Error('Missing SENDGRID_API_KEY in server/.env.');
  }

  // Gom tất cả file artifact để đính kèm vào email
  const attachments = [];

  // Dùng Set để tránh gửi trùng file
  const artifactFiles = new Set();

  // Thêm file report chính
  if (reportPath) {
    artifactFiles.add(path.resolve(reportPath));
  }

  // Thêm các file artifact được chỉ định rõ qua --artifact
  for (const filePath of explicitArtifacts.map((artifactPath) => path.resolve(artifactPath))) {
    artifactFiles.add(filePath);
  }

  // Nếu không có artifact cụ thể, quét toàn bộ thư mục artifacts
  if (!explicitArtifacts.length) {
    for (const filePath of listArtifactFiles(artifactsDir && path.resolve(artifactsDir))) {
      artifactFiles.add(filePath);
    }
  }

  // Đọc từng file artifact và chuyển thành base64 để đính kèm email
  for (const filePath of artifactFiles) {
    if (!fs.existsSync(filePath)) {
      continue;  // Bỏ qua file không tồn tại
    }

    // Xác định MIME type dựa vào đuôi file
    const ext = path.extname(filePath).toLowerCase();
    const typeByExt = {
      '.png': 'image/png',        // Ảnh chụp màn hình
      '.json': 'application/json', // Kết quả test dạng JSON
      '.txt': 'text/plain',       // Report dạng text
    };

    attachments.push({
      content: fs.readFileSync(filePath).toString('base64'),  // Nội dung file mã hóa base64
      filename: path.basename(filePath),                       // Tên file
      type: typeByExt[ext] || 'application/octet-stream',     // MIME type
      disposition: 'attachment'                                // Đính kèm (không inline)
    });
  }

  // Đọc nội dung file report text để làm body email
  const reportText = reportPath && fs.existsSync(path.resolve(reportPath))
    ? fs.readFileSync(path.resolve(reportPath), 'utf8')
    : 'No report body was provided.';

  // Cấu hình SendGrid với API key
  sgMail.setApiKey(apiKey);

  // Gửi email qua SendGrid
  await sgMail.send({
    to,                                                          // Người nhận
    from: `"Hospital Selenium Reports" <${from}>`,              // Người gửi (hiển thị tên "Hospital Selenium Reports")
    subject: explicitSubject || `Selenium report ${new Date().toISOString()}`,  // Tiêu đề email
    text: reportText,                                            // Nội dung text thuần
    html: `<pre style="font-family: Consolas, monospace; white-space: pre-wrap;">${reportText
      .replace(/&/g, '&amp;')    // Escape ký tự HTML đặc biệt
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')}</pre>`,                           // Nội dung HTML (hiển thị dạng code)
    attachments                                                  // File đính kèm
  });

  // In kết quả gửi email thành công dạng JSON
  console.log(JSON.stringify({
    success: true,
    to,
    attachmentCount: attachments.length
  }));
}

// Chạy hàm chính và xử lý lỗi
main().catch((error) => {
  console.error(error.message);
  process.exit(1);  // Thoát với mã lỗi 1
});
