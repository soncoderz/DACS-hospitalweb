import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle, FaSpinner, FaCalendarAlt } from 'react-icons/fa';
import api from '../../utils/api';


const PaymentStatus = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing'); // 'processing', 'success', 'failed'
  const [message, setMessage] = useState('');
  const [appointmentDetails, setAppointmentDetails] = useState(null);

  useEffect(() => {
    const paymentId = searchParams.get('paymentId');
    const PayerID = searchParams.get('PayerID');
    const path = window.location.pathname;
    
    if (path.includes('/paypal/success') && paymentId && PayerID) {
      // Process successful payment
      executePayPalPayment(paymentId, PayerID);
    } else if (path.includes('/paypal/cancel')) {
      // Handle cancelled payment
      setStatus('failed');
      setMessage('Bạn đã hủy thanh toán PayPal.');
    } else {
      // Invalid route
      navigate('/appointments');
    }
  }, [searchParams, navigate]);
  
  const executePayPalPayment = async (paymentId, PayerID) => {
    try {
      const response = await api.post('/payments/paypal/execute', { 
        paymentId, 
        PayerID 
      });
      
      if (response.data.success) {
        setStatus('success');
        setMessage('Thanh toán PayPal thành công!');
        if (response.data.data && response.data.data.appointmentDetails) {
          setAppointmentDetails(response.data.data.appointmentDetails);
        }
      } else {
        setStatus('failed');
        setMessage(response.data.message || 'Thanh toán PayPal không thành công.');
      }
    } catch (error) {
      console.error('Error executing PayPal payment:', error);
      setStatus('failed');
      setMessage('Đã xảy ra lỗi khi xử lý thanh toán. Vui lòng liên hệ bộ phận hỗ trợ.');
    }
  };

  return (
    <div className="payment-status-container">
      <div className="payment-status-card">
        {status === 'processing' ? (
          <div className="processing-payment">
            <FaSpinner className="spinner" />
            <h2>Đang xử lý thanh toán...</h2>
            <p>Vui lòng không đóng trang này.</p>
          </div>
        ) : status === 'success' ? (
          <div className="success-payment">
            <div className="status-icon success">
              <FaCheckCircle />
            </div>
            <h2>Thanh toán thành công!</h2>
            <p>{message}</p>
            {appointmentDetails && (
              <div className="appointment-summary">
                <h3>Thông tin lịch hẹn</h3>
                <div className="summary-details">
                  <div className="summary-item">
                    <span className="label">Mã lịch hẹn:</span>
                    <span className="value">{appointmentDetails.bookingCode}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Dịch vụ:</span>
                    <span className="value">{appointmentDetails.service}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Bác sĩ:</span>
                    <span className="value">{appointmentDetails.doctor}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Ngày hẹn:</span>
                    <span className="value">{appointmentDetails.date}</span>
                  </div>
                </div>
              </div>
            )}
            <div className="action-buttons">
              <Link to="/appointments" className="btn btn-primary">
                <FaCalendarAlt /> Xem lịch hẹn
              </Link>
            </div>
          </div>
        ) : (
          <div className="failed-payment">
            <div className="status-icon failed">
              <FaTimesCircle />
            </div>
            <h2>Thanh toán không thành công</h2>
            <p>{message}</p>
            <div className="action-buttons">
              <Link to="/appointments" className="btn btn-primary">
                <FaCalendarAlt /> Quay lại lịch hẹn
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentStatus; 
