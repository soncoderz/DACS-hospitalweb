import React from 'react';
import PropTypes from 'prop-types';
import { FaTimesCircle, FaCalendarAlt, FaClock, FaInfoCircle } from 'react-icons/fa';

const CancelAppointmentModal = ({
  appointment,
  cancellationReason,
  setCancellationReason,
  onCancel,
  onConfirm,
  isProcessing,
  formatDate
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-lg w-full overflow-hidden animate-fade-in-down">
        <div className="bg-gradient-to-r from-red-500 to-red-600 p-4 text-white">
          <div className="flex items-center">
            <FaTimesCircle className="text-xl mr-2" />
            <h2 className="text-lg font-semibold">Xác nhận hủy lịch hẹn</h2>
          </div>
        </div>
        
        <div className="p-6">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 text-sm text-red-700">
            <div className="flex">
              <FaInfoCircle className="flex-shrink-0 mr-2 mt-0.5" />
              <p>Bạn có chắc chắn muốn hủy lịch hẹn này không? Thao tác này không thể hoàn tác.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 bg-gray-50 p-4 rounded-lg">
            {appointment.bookingCode && (
              <div className="col-span-full">
                <div className="text-gray-500 text-sm">Mã đặt lịch:</div>
                <div className="font-medium">{appointment.bookingCode}</div>
              </div>
            )}
            
            <div className="flex items-start">
              <FaCalendarAlt className="text-primary mt-1 mr-2" />
              <div>
                <div className="text-gray-500 text-sm">Ngày hẹn:</div>
                <div className="font-medium">{formatDate(appointment.appointmentDate)}</div>
              </div>
            </div>
            
            <div className="flex items-start">
              <FaClock className="text-primary mt-1 mr-2" />
              <div>
                <div className="text-gray-500 text-sm">Giờ hẹn:</div>
                <div className="font-medium">
                  {appointment.timeSlot.startTime} - {appointment.timeSlot.endTime}
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="cancellationReason" className="block text-sm font-medium text-gray-700 mb-2">
              Lý do hủy lịch:
            </label>
            <textarea
              id="cancellationReason"
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="Vui lòng cho chúng tôi biết lý do bạn hủy lịch hẹn..."
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              rows="3"
            ></textarea>
            {!cancellationReason.trim() && (
              <p className="mt-1 text-sm text-red-600">Vui lòng nhập lý do hủy lịch</p>
            )}
          </div>
        </div>
        
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
          <button
            className="px-4 py-2 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 font-medium transition-colors"
            onClick={onCancel}
            disabled={isProcessing}
          >
            Hủy bỏ
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-medium text-white transition-colors ${
              isProcessing || !cancellationReason.trim() 
                ? 'bg-red-300 cursor-not-allowed' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
            onClick={onConfirm}
            disabled={isProcessing || !cancellationReason.trim()}
          >
            {isProcessing ? (
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Đang xử lý
              </div>
            ) : (
              'Xác nhận hủy'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

CancelAppointmentModal.propTypes = {
  appointment: PropTypes.object.isRequired,
  cancellationReason: PropTypes.string.isRequired,
  setCancellationReason: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  isProcessing: PropTypes.bool.isRequired,
  formatDate: PropTypes.func.isRequired
};

export default CancelAppointmentModal;
