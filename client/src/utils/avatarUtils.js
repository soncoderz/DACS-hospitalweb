/**
 * Tiện ích xử lý hiển thị avatar
 */

/**
 * Lấy URL đầy đủ của avatar từ đường dẫn tương đối hoặc tuyệt đối
 * @param {string} avatarUrl - Đường dẫn avatar từ API
 * @param {string} userName - Tên người dùng để tạo avatar từ UI Avatars
 * @returns {string} - URL đầy đủ của avatar
 */
export const getAvatarUrl = (avatarUrl, userName = 'User') => {
  if (!avatarUrl) {
    // Sử dụng UI Avatars thay vì file tĩnh
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=1AC0FF&color=fff`;
  }

  // Nếu là URL tuyệt đối (bắt đầu bằng http hoặc https), trả về nguyên bản
  if (avatarUrl.startsWith('http')) {
    return avatarUrl;
  }

  // Nếu là đường dẫn tương đối, thêm URL gốc
  const apiUrl = import.meta.env.VITE_API_URL || '';
  const baseUrl = apiUrl.replace('/api', '');
  return `${baseUrl}${avatarUrl}`;
};

/**
 * Xử lý sự kiện lỗi khi tải avatar
 * @param {Event} event - Đối tượng sự kiện
 * @param {string} userName - Tên người dùng để tạo avatar
 */
export const handleAvatarError = (event, userName = 'User') => {
  console.log('Avatar load error, falling back to UI Avatars');
  // Sử dụng UI Avatars thay vì file tĩnh
  event.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=1AC0FF&color=fff`;
  event.target.onerror = null; // Ngăn lỗi vô hạn
};

/**
 * Component Avatar đơn giản 
 * (Ví dụ sử dụng với các thư viện như React)
 * @param {Object} props - Props
 * @param {string} props.url - Đường dẫn avatar
 * @param {string} props.alt - Alt text
 * @param {string} props.className - CSS class name
 * @param {string} props.userName - Tên người dùng để tạo avatar
 * @returns {Object} - JSX Element
 */
export const renderAvatar = ({ url, alt = 'Avatar', className = '', userName = 'User' }) => {
  const avatarSrc = getAvatarUrl(url, userName);
  
  return {
    src: avatarSrc,
    alt: alt,
    className: `avatar ${className}`.trim(),
    onError: (e) => handleAvatarError(e, userName)
  };
}; 