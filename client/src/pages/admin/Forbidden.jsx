import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/admin/Forbidden.css';

const AdminForbidden = () => {
  return (
    <div className="forbidden-container">
      <div className="forbidden-content">
        <h1>403</h1>
        <h2>Truy cập bị từ chối</h2>
        <p>Bạn không có quyền truy cập trang quản trị.</p>
        <p>Vui lòng liên hệ với quản trị viên nếu bạn cần truy cập.</p>
        <div className="forbidden-actions">
          <Link to="/" className="btn-primary">
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminForbidden; 