/**
 * Tiện ích xử lý hiển thị avatar
 */

/**
 * Lấy URL đầy đủ của avatar từ đường dẫn tương đối hoặc tuyệt đối
 * @param {string} avatarUrl - Đường dẫn avatar từ API
 * @param {string} defaultAvatar - Đường dẫn avatar mặc định nếu không có
 * @returns {string} - URL đầy đủ của avatar
 */
export const getAvatarUrl = (avatarUrl, defaultAvatar = '/avatars/default-avatar.png') => {
  if (!avatarUrl) {
    return defaultAvatar;
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
 * @param {string} defaultAvatar - Đường dẫn avatar mặc định
 */
export const handleAvatarError = (event, defaultAvatar = '/avatars/default-avatar.png') => {
  console.error('Avatar load error, falling back to default');
  event.target.src = defaultAvatar;
  event.target.onerror = null; // Ngăn lỗi vô hạn
};

/**
 * Component Avatar đơn giản 
 * (Ví dụ sử dụng với các thư viện như React)
 * @param {Object} props - Props
 * @param {string} props.url - Đường dẫn avatar
 * @param {string} props.alt - Alt text
 * @param {string} props.className - CSS class name
 * @param {string} props.defaultAvatar - Đường dẫn avatar mặc định
 * @returns {Object} - JSX Element
 */
export const renderAvatar = ({ url, alt = 'Avatar', className = '', defaultAvatar = '/avatars/default-avatar.png' }) => {
  const avatarSrc = getAvatarUrl(url, defaultAvatar);
  
  return {
    src: avatarSrc,
    alt: alt,
    className: `avatar ${className}`.trim(),
    onError: (e) => handleAvatarError(e, defaultAvatar)
  };
}; 