import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { FaMoneyBillWave, FaCheck, FaClock, FaPills, FaBed, FaStethoscope, FaCreditCard, FaWallet, FaTimes, FaInfoCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import PayPalButton from './PayPalButton';
// =============================================================================
// COMPONENT THANH TOÁN - UserBilling.jsx
// =============================================================================
// Các data-testid trong component này được Selenium sử dụng:
//   - 'user-billing'                       -> Xác nhận phần thanh toán đã hiển thị
//   - 'billing-consultation-method-paypal' -> Nút chọn PayPal
//   - 'billing-consultation-pay-button'    -> Nút "Thanh Toán"
//   - 'billing-consultation-paid-method'   -> Hiển thị phương thức đã thanh toán
//   - 'paypal-modal'                       -> Modal chứa PayPalButton
//   - 'paypal-modal-close'                 -> Nút đóng modal PayPal
// Luồng test: chọn PayPal -> bấm thanh toán -> mock approve -> kiểm tra kết quả
// =============================================================================
const UserBilling = ({ appointmentId, onPaymentComplete, hospitalization, appointment }) => {
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPayPalModal, setShowPayPalModal] = useState(false);
  const [payPalConfig, setPayPalConfig] = useState({ type: null, amount: 0 });
  const [hospitalizationData, setHospitalizationData] = useState(hospitalization || null);
  const [paymentMethods, setPaymentMethods] = useState({
    consultation: 'momo', // Default to momo instead of cash
    hospitalization: 'momo' // Default to momo instead of cash
  });
  const [prescriptionPaymentMethods, setPrescriptionPaymentMethods] = useState({});
  useEffect(() => {
    if (appointmentId) {
      fetchBill();
      if (!hospitalization && bill?.hospitalizationBill?.hospitalizationId) {
        fetchHospitalization(bill.hospitalizationBill.hospitalizationId);
      }
    }
  }, [appointmentId]);
  useEffect(() => {
    if (hospitalization) {
      setHospitalizationData(hospitalization);
    }
  }, [hospitalization]);
  useEffect(() => {
    if (bill?.hospitalizationBill?.hospitalizationId && !hospitalizationData) {
      fetchHospitalization(bill.hospitalizationBill.hospitalizationId);
    }
  }, [bill]);
  const fetchHospitalization = async (hospitalizationId) => {
    try {
      const response = await api.get(`/hospitalizations/${hospitalizationId}`);
      if (response.data.success) {
        setHospitalizationData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching hospitalization:', error);
      toast.error('Không thể tải thông tin nằm viện');
    }
  };
  const fetchBill = async () => {
    try {
      const response = await api.get(`/billing/appointment/${appointmentId}`);
      setBill(response.data.data);
    } catch (error) {
      console.error('Error fetching bill:', error);
      toast.error('Không thể tải thông tin hóa đơn');
    }
  };
  // Helper flags and displayed totals (hide inpatient amount until discharge)
  const isStillHospitalized = appointment?.status === 'hospitalized' || (hospitalizationData && hospitalizationData.status !== 'discharged');
  const hospitalizationAmount = bill?.hospitalizationBill?.amount || 0;
  const displayedConsultation = bill?.consultationBill?.amount || 0;
  const displayedMedication = bill?.medicationBill?.amount || 0;
  const displayedTotalAmount = displayedConsultation + displayedMedication + hospitalizationAmount;
  const medicationPaidAmount = (() => {
    if (!bill?.medicationBill) return 0;
    if (bill.medicationBill.status === 'paid') {
      return displayedMedication;
    }
    if (bill.medicationBill.prescriptionPayments?.length) {
      return bill.medicationBill.prescriptionPayments
        .filter(payment => payment.status === 'paid')
        .reduce((sum, payment) => sum + (payment.amount || 0), 0);
    }
    return 0;
  })();
  const displayedPaidAmount =
    (bill?.consultationBill?.status === 'paid' ? displayedConsultation : 0) +
    medicationPaidAmount +
    (bill?.hospitalizationBill?.status === 'paid' ? hospitalizationAmount : 0);
  const displayedRemainingAmount = Math.max(displayedTotalAmount - displayedPaidAmount, 0);
  const totalAmountLabel = isStillHospitalized ? 'Tổng tạm tính' : 'Tổng hóa đơn';
  const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  const getStatusBadge = (status) => {
    if (status === 'paid') return (
      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm flex items-center gap-1"><FaCheck /> Đã thanh toán</span>
    );
    if (status === 'cancelled') return (
      <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">Đã hủy</span>
    );
    return (
      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm flex items-center gap-1"><FaClock /> Chưa thanh toán</span>
    );
  };
  const getPaymentMethodLabel = (method) => {
    const labels = { cash: 'Tiền mặt', momo: 'MoMo', paypal: 'PayPal' };
    return labels[method] || method;
  };
  const getPaymentMethodIcon = (method) => {
    if (method === 'cash') return <FaWallet className="inline mr-1" />;
    return <FaCreditCard className="inline mr-1" />;
  };
  const payPrescription = async (prescriptionId, method) => {
    if (!bill || !prescriptionId) return;
    if (appointment?.status === 'hospitalized') {
      toast.warning('Không thể thanh toán khi đang nằm viện. Vui lòng đợi xuất viện.');
      return;
    }
    try {
      setLoading(true);
      if (method === 'momo') {
        // Get prescription to get amount
        const prescription = bill.medicationBill.prescriptionIds.find(p => p._id === prescriptionId);
        if (!prescription) {
          toast.error('Không tìm thấy đơn thuốc');
          return;
        }
        const res = await api.post('/payments/momo/create', {
          appointmentId: (bill.appointmentId && bill.appointmentId._id) ? bill.appointmentId._id : bill.appointmentId,
          amount: prescription.totalAmount,
          billType: 'medication',
          prescriptionId
        });
        if (res.data?.payUrl) {
          window.location.href = res.data.payUrl;
          return;
        }
        toast.error('Không thể tạo thanh toán MoMo');
      } else if (method === 'paypal') {
        const prescription = bill.medicationBill.prescriptionIds.find(p => p._id === prescriptionId);
        if (!prescription) {
          toast.error('Không tìm thấy đơn thuốc');
          return;
        }
        setPayPalConfig({ type: 'prescription', prescriptionId, amount: prescription.totalAmount });
        setShowPayPalModal(true);
        setLoading(false);
        return;
      } else {
        // cash payment
        const response = await api.post('/billing/pay-prescription', {
          prescriptionId,
          paymentMethod: method,
          transactionId: `PRES-${Date.now()}`,
          paymentDetails: { method, timestamp: new Date().toISOString() }
        });
        
        if (response.data.success) {
          toast.success('Thanh toán đơn thuốc thành công');
          await fetchBill();
          if (onPaymentComplete) onPaymentComplete();
        } else {
          toast.error(response.data.message || 'Thanh toán thất bại');
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Thanh toán thất bại');
    } finally {
      setLoading(false);
    }
  };
  const pay = async (type) => {
    if (!bill) return;
    if (appointment?.status === 'hospitalized' && (type === 'consultation' || type === 'hospitalization')) {
      toast.warning('Không thể thanh toán khi đang nằm viện. Vui lòng đợi xuất viện.');
      return;
    }
    try {
      setLoading(true);
      const method = paymentMethods[type];
      const amount = type === 'consultation' ? bill.consultationBill.amount
        : bill.hospitalizationBill.amount;
      if (method === 'momo') {
        const res = await api.post('/payments/momo/create', {
          appointmentId: (bill.appointmentId && bill.appointmentId._id) ? bill.appointmentId._id : bill.appointmentId,
          amount,
          billType: type
        });
        if (res.data?.payUrl) {
          window.location.href = res.data.payUrl;
          return;
        }
        toast.error('Không thể tạo thanh toán MoMo');
      } else if (method === 'paypal') {
        // Show PayPal modal with SDK
        setPayPalConfig({ type, amount });
        setShowPayPalModal(true);
        setLoading(false);
        return;
      } else {
        // cash – xác nhận nội bộ ngay
        const endpoint = type === 'consultation'
          ? '/billing/pay-consultation'
          : '/billing/pay-hospitalization';
        const txIdPrefix = type === 'consultation' ? 'CONS' : 'HOSP';
        const payload = {
          billId: bill._id,
          paymentMethod: method,
          transactionId: `${txIdPrefix}-${Date.now()}`,
          paymentDetails: { method, timestamp: new Date().toISOString() }
        };
        const response = await api.post(endpoint, payload);
        toast.success('Thanh toán thành công');
        setBill(response.data.data);
        if (onPaymentComplete) onPaymentComplete();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Thanh toán thất bại');
    } finally {
      setLoading(false);
    }
  };
  if (!bill) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8 text-gray-500">Đang tải thông tin thanh toán...</div>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-lg shadow-md" data-testid="user-billing"> {/* [SELENIUM] Selenium chờ phần tử này để thao tác thanh toán */}
      <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <FaMoneyBillWave /> Thanh Toán Lịch Hẹn
            </h2>
            <p className="text-sm text-gray-600 mt-1">Mã hóa đơn: {bill.billNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Trạng thái tổng</p>
            <span className={`px-4 py-2 rounded-full font-semibold ${
              bill.overallStatus === 'paid' ? 'bg-green-100 text-green-800' :
              bill.overallStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {bill.overallStatus === 'paid' ? 'Đã thanh toán đủ' : bill.overallStatus === 'partial' ? 'Thanh toán một phần' : 'Chưa thanh toán'}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600">{totalAmountLabel}</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(displayedTotalAmount)}</p>
            {isStillHospitalized && (
              <p className="text-xs text-gray-500 mt-1">Số tiền tạm tính, sẽ chốt khi xuất viện</p>
            )}
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600">Đã thanh toán</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(displayedPaidAmount)}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600">Còn lại</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(displayedRemainingAmount)}</p>
          </div>
        </div>
      </div>
      <div className="p-6 space-y-6">
        {bill.consultationBill.amount > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-blue-50 px-6 py-3 border-b flex justify-between items-center">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <FaStethoscope className="text-blue-600" /> Phí Khám Bệnh
              </h3>
              {getStatusBadge(bill.consultationBill.status)}
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  {/* Hiển thị thông tin giảm giá nếu có */}
                  {bill.consultationBill.originalAmount > 0 && bill.consultationBill.originalAmount !== bill.consultationBill.amount && (
                    <div className="mb-3 space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Giá gốc:</span>
                        <span className="text-gray-500 line-through">{formatCurrency(bill.consultationBill.originalAmount)}</span>
                      </div>
                      {bill.consultationBill.discount > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-green-600 font-medium">Giảm giá:</span>
                          <span className="text-green-600 font-medium">-{formatCurrency(bill.consultationBill.discount)}</span>
                        </div>
                      )}
                      {bill.consultationBill.couponId && (
                        <div className="text-xs text-blue-600 mt-1">
                          <FaInfoCircle className="inline mr-1" />
                          Đã áp dụng mã giảm giá
                        </div>
                      )}
                    </div>
                  )}
                  <p className="text-3xl font-bold text-blue-600">{formatCurrency(bill.consultationBill.amount)}</p>
                  {bill.consultationBill.status === 'paid' && bill.consultationBill.paymentDate && (
                    <p className="text-sm text-gray-500 mt-1">
                      Đã thanh toán: {new Date(bill.consultationBill.paymentDate).toLocaleString('vi-VN')}
                    </p>
                  )}
                  {bill.consultationBill.status === 'paid' && bill.consultationBill.paymentMethod && (
                    <p className="text-sm text-gray-500" data-testid="billing-consultation-paid-method"> {/* [SELENIUM] Selenium đọc text này để kiểm tra phương thức thanh toán */}
                      {getPaymentMethodIcon(bill.consultationBill.paymentMethod)}
                      Phương thức: {getPaymentMethodLabel(bill.consultationBill.paymentMethod)}
                    </p>
                  )}
                </div>
              </div>
              {bill.consultationBill.status === 'pending' && (
                <>
                  {appointment?.status === 'hospitalized' && (
                    <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-800">
                        <FaClock className="inline mr-1" /> Đang nằm viện. Vui lòng đợi xuất viện để thanh toán phí khám.
                      </p>
                    </div>
                  )}
                  {appointment?.status !== 'hospitalized' && (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setPaymentMethods({ ...paymentMethods, consultation: 'momo' })}
                          data-testid="billing-consultation-method-momo"
                          className={`px-4 py-2 rounded-lg font-medium transition-all ${
                            paymentMethods.consultation === 'momo'
                              ? 'bg-pink-600 text-white shadow-md'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <FaCreditCard className="inline mr-2" /> MoMo
                        </button>
                        <button
                          onClick={() => setPaymentMethods({ ...paymentMethods, consultation: 'paypal' })}
                          data-testid="billing-consultation-method-paypal" /* [SELENIUM] Selenium bấm nút này để chọn PayPal */
                          className={`px-4 py-2 rounded-lg font-medium transition-all ${
                            paymentMethods.consultation === 'paypal'
                              ? 'bg-blue-500 text-white shadow-md'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <FaCreditCard className="inline mr-2" /> PayPal
                        </button>
                      </div>
                      <button
                        disabled={loading}
                        onClick={() => pay('consultation')}
                        data-testid="billing-consultation-pay-button" /* [SELENIUM] Selenium bấm nút này để mở PayPal modal */
                        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Đang xử lý...</span>
                          </>
                        ) : (
                          <>
                            <FaMoneyBillWave /> Thanh Toán {formatCurrency(bill.consultationBill.amount)}
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
        {bill.medicationBill.amount > 0 && bill.medicationBill.prescriptionIds && bill.medicationBill.prescriptionIds.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-green-50 px-6 py-3 border-b flex justify-between items-center">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <FaPills className="text-green-600" /> Tiền Thuốc
              </h3>
              {getStatusBadge(bill.medicationBill.status)}
            </div>
            <div className="p-6">
              {/* Warning message if hospitalized */}
              {appointment?.status === 'hospitalized' && (
                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2 text-amber-800">
                    <FaClock className="text-lg" />
                    <div>
                      <p className="font-semibold">Đang nằm viện</p>
                      <p className="text-sm">Vui lòng đợi xuất viện để thanh toán đơn thuốc.</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Prescriptions list */}
              <div className="space-y-4 mb-4">
                {bill.medicationBill.prescriptionIds.map((prescription, idx) => {
                  const prescriptionPayment = bill.medicationBill.prescriptionPayments?.find(
                    p => p.prescriptionId?._id?.toString() === prescription._id.toString() || 
                        p.prescriptionId?.toString() === prescription._id.toString()
                  );
                  const isPaid = prescriptionPayment?.status === 'paid' || prescription.status === 'dispensed';
                  const canPay = !isPaid && appointment?.status !== 'hospitalized';
                  
                  return (
                    <div key={prescription._id || idx} className="bg-white border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">
                            Đợt {prescription.prescriptionOrder || idx + 1}
                          </span>
                          {prescription.isHospitalization && (
                            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-semibold">
                              Nội trú
                            </span>
                          )}
                          {isPaid && (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">
                              Đã thanh toán
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">{formatCurrency(prescription.totalAmount)}</p>
                          {isPaid && prescriptionPayment?.paymentDate && (
                            <p className="text-xs text-gray-500 mt-1">
                              Đã thanh toán: {new Date(prescriptionPayment.paymentDate).toLocaleDateString('vi-VN')}
                            </p>
                          )}
                          {isPaid && prescriptionPayment?.paymentMethod && (
                            <p className="text-xs text-gray-500">
                              {getPaymentMethodIcon(prescriptionPayment.paymentMethod)}
                              {getPaymentMethodLabel(prescriptionPayment.paymentMethod)}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {prescription.diagnosis && (
                        <div className="mb-2 text-sm text-gray-600">
                          <span className="font-medium">Chẩn đoán:</span> {prescription.diagnosis}
                        </div>
                      )}
                      
                      {canPay && (
                        <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => setPrescriptionPaymentMethods({ ...prescriptionPaymentMethods, [prescription._id]: 'momo' })}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                prescriptionPaymentMethods[prescription._id] === 'momo'
                                  ? 'bg-pink-600 text-white shadow-md'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              <FaCreditCard className="inline mr-1.5" /> MoMo
                            </button>
                            <button
                              onClick={() => setPrescriptionPaymentMethods({ ...prescriptionPaymentMethods, [prescription._id]: 'paypal' })}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                prescriptionPaymentMethods[prescription._id] === 'paypal'
                                  ? 'bg-blue-500 text-white shadow-md'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              <FaCreditCard className="inline mr-1.5" /> PayPal
                            </button>
                          </div>
                          <button
                            disabled={loading || !prescriptionPaymentMethods[prescription._id]}
                            onClick={() => payPrescription(prescription._id, prescriptionPaymentMethods[prescription._id] || 'momo')}
                            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                          >
                            {loading ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Đang xử lý...</span>
                              </>
                            ) : (
                              <>
                                <FaMoneyBillWave /> Thanh Toán {formatCurrency(prescription.totalAmount)}
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Total medication bill */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700">Tổng tiền thuốc:</span>
                  <span className="text-xl font-bold text-green-600">{formatCurrency(bill.medicationBill.amount)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
        {bill.hospitalizationBill.amount > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-purple-50 px-6 py-3 border-b flex justify-between items-center">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <FaBed className="text-purple-600" /> Phí Nội Trú
              </h3>
              {getStatusBadge(bill.hospitalizationBill.status)}
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  {isStillHospitalized ? (
                    <>
                      <p className="text-3xl font-bold text-purple-600">{formatCurrency(hospitalizationAmount)}</p>
                      <p className="text-sm text-gray-500 mt-1">Số tiền tạm tính, sẽ chốt khi xuất viện</p>
                    </>
                  ) : (
                    <p className="text-3xl font-bold text-purple-600">{formatCurrency(hospitalizationAmount)}</p>
                  )}
                  {bill.hospitalizationBill.status === 'paid' && bill.hospitalizationBill.paymentDate && (
                    <p className="text-sm text-gray-500 mt-1">
                      Đã thanh toán: {new Date(bill.hospitalizationBill.paymentDate).toLocaleString('vi-VN')}
                    </p>
                  )}
                  {bill.hospitalizationBill.status === 'paid' && bill.hospitalizationBill.paymentMethod && (
                    <p className="text-sm text-gray-500">
                      {getPaymentMethodIcon(bill.hospitalizationBill.paymentMethod)}
                      Phương thức: {getPaymentMethodLabel(bill.hospitalizationBill.paymentMethod)}
                    </p>
                  )}
                  {hospitalizationData && (
                    <div className="mt-2 text-sm text-gray-600">
                      {hospitalizationData.totalHours > 0 && (
                        <p>Tổng thời gian: {hospitalizationData.totalHours} giờ</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {/* Room History Details */}
              {hospitalizationData?.roomHistory && hospitalizationData.roomHistory.length > 0 && (
                <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="text-sm font-semibold text-purple-800 mb-3">Chi tiết phòng</div>
                  <div className="space-y-2">
                    {hospitalizationData.roomHistory.map((roomEntry, idx) => (
                      <div key={idx} className="bg-white rounded p-3 border border-purple-100">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium text-gray-800">
                            Phòng {roomEntry.roomNumber || 'N/A'}
                            {roomEntry.roomType && (
                              <span className="ml-2 text-xs text-gray-500">({roomEntry.roomType})</span>
                            )}
                          </div>
                          {roomEntry.amount > 0 && (
                            <div className="text-sm font-semibold text-gray-700">
                              {formatCurrency(roomEntry.amount)}
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                          <div>
                            <span className="font-medium">Vào:</span> {roomEntry.checkInTime ? new Date(roomEntry.checkInTime).toLocaleString('vi-VN') : 'N/A'}
                          </div>
                          <div>
                            <span className="font-medium">Ra:</span> {roomEntry.checkOutTime ? new Date(roomEntry.checkOutTime).toLocaleString('vi-VN') : 'Đang ở'}
                          </div>
                          {roomEntry.hours > 0 && (
                            <div>
                              <span className="font-medium">Thời gian:</span> {roomEntry.hours} giờ
                            </div>
                          )}
                          {roomEntry.hourlyRate > 0 && (
                            <div>
                              <span className="font-medium">Giá/giờ:</span> {formatCurrency(roomEntry.hourlyRate)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {!isStillHospitalized && bill.hospitalizationBill.status === 'pending' && (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setPaymentMethods({ ...paymentMethods, hospitalization: 'momo' })}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        paymentMethods.hospitalization === 'momo'
                          ? 'bg-pink-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <FaCreditCard className="inline mr-2" /> MoMo
                    </button>
                    <button
                      onClick={() => setPaymentMethods({ ...paymentMethods, hospitalization: 'paypal' })}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        paymentMethods.hospitalization === 'paypal'
                          ? 'bg-blue-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <FaCreditCard className="inline mr-2" /> PayPal
                    </button>
                  </div>
                  <button
                    disabled={loading}
                    onClick={() => pay('hospitalization')}
                    className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Đang xử lý...</span>
                      </>
                    ) : (
                      <>
                        <FaMoneyBillWave /> Thanh Toán {formatCurrency(bill.hospitalizationBill.amount)}
                      </>
                    )}
                  </button>
                </div>
              )}
              {isStillHospitalized && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <FaClock className="inline mr-1" /> Chưa thể thanh toán khi đang nằm viện. Vui lòng đợi xuất viện.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Tiến độ thanh toán</h3>
            <div className="flex justify-between text-sm mb-2">
              <span>Tổng tiến độ</span>
              <span className="font-semibold">{bill.totalAmount > 0 ? Math.round((bill.paidAmount / bill.totalAmount) * 100) : 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden mb-4">
              <div className="bg-gradient-to-r from-green-500 to-blue-500 h-4 rounded-full transition-all duration-300" style={{ width: `${bill.totalAmount > 0 ? (bill.paidAmount / bill.totalAmount) * 100 : 0}%` }} />
            </div>
            
            {/* Chi tiết từng loại */}
            <div className="space-y-3">
              {/* Phí khám */}
              {bill.consultationBill.amount > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <FaStethoscope className="text-blue-600" />
                      <span className="text-sm text-gray-700">Phí khám bệnh</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">
                        {formatCurrency(bill.consultationBill.status === 'paid' ? bill.consultationBill.amount : 0)} / {formatCurrency(bill.consultationBill.amount)}
                      </span>
                      {bill.consultationBill.status === 'paid' ? (
                        <FaCheck className="text-green-600" />
                      ) : (
                        <FaClock className="text-yellow-600" />
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        bill.consultationBill.status === 'paid' ? 'bg-green-500' : 'bg-yellow-400'
                      }`}
                      style={{ width: `${bill.consultationBill.status === 'paid' ? 100 : 0}%` }}
                    />
                  </div>
                </div>
              )}
              {/* Đơn thuốc */}
              {bill.medicationBill.amount > 0 && bill.medicationBill.prescriptionIds && bill.medicationBill.prescriptionIds.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <FaPills className="text-green-600" />
                      <span className="text-sm text-gray-700">Tiền thuốc</span>
                      <span className="text-xs text-gray-500">({bill.medicationBill.prescriptionIds.length} đơn)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">
                        {(() => {
                          const paidAmount = bill.medicationBill.prescriptionIds.reduce((sum, pres) => {
                            const prescriptionPayment = bill.medicationBill.prescriptionPayments?.find(
                              p => (p.prescriptionId?._id?.toString() || p.prescriptionId?.toString()) === pres._id.toString()
                            );
                            const isPaid = prescriptionPayment?.status === 'paid' || pres.status === 'dispensed';
                            return sum + (isPaid ? pres.totalAmount : 0);
                          }, 0);
                          return `${formatCurrency(paidAmount)} / ${formatCurrency(bill.medicationBill.amount)}`;
                        })()}
                      </span>
                      {bill.medicationBill.status === 'paid' ? (
                        <FaCheck className="text-green-600" />
                      ) : (
                        <FaClock className="text-yellow-600" />
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        bill.medicationBill.status === 'paid' ? 'bg-green-500' : 'bg-yellow-400'
                      }`}
                      style={{ 
                        width: `${(() => {
                          const paidAmount = bill.medicationBill.prescriptionIds.reduce((sum, pres) => {
                            const prescriptionPayment = bill.medicationBill.prescriptionPayments?.find(
                              p => (p.prescriptionId?._id?.toString() || p.prescriptionId?.toString()) === pres._id.toString()
                            );
                            const isPaid = prescriptionPayment?.status === 'paid' || pres.status === 'dispensed';
                            return sum + (isPaid ? pres.totalAmount : 0);
                          }, 0);
                          return bill.medicationBill.amount > 0 ? (paidAmount / bill.medicationBill.amount) * 100 : 0;
                        })()}%` 
                      }}
                    />
                  </div>
                  {/* Chi tiết từng đơn thuốc */}
                  <div className="mt-2 ml-4 space-y-1">
                    {bill.medicationBill.prescriptionIds.map((prescription, idx) => {
                      const prescriptionPayment = bill.medicationBill.prescriptionPayments?.find(
                        p => (p.prescriptionId?._id?.toString() || p.prescriptionId?.toString()) === prescription._id.toString()
                      );
                      const isPaid = prescriptionPayment?.status === 'paid' || prescription.status === 'dispensed';
                      return (
                        <div key={prescription._id || idx} className="flex justify-between items-center text-xs">
                          <span className="text-gray-600">
                            Đợt {prescription.prescriptionOrder || idx + 1}
                            {prescription.isHospitalization && ' (Nội trú)'}
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500">
                              {formatCurrency(isPaid ? prescription.totalAmount : 0)} / {formatCurrency(prescription.totalAmount)}
                            </span>
                            {isPaid ? (
                              <FaCheck className="text-green-600 text-xs" />
                            ) : (
                              <FaClock className="text-yellow-600 text-xs" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {/* Phí nội trú */}
              {bill.hospitalizationBill.amount > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <FaBed className="text-purple-600" />
                      <span className="text-sm text-gray-700">Phí nội trú</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">
                        {formatCurrency(bill.hospitalizationBill.status === 'paid' ? bill.hospitalizationBill.amount : 0)} / {formatCurrency(bill.hospitalizationBill.amount)}
                      </span>
                      {bill.hospitalizationBill.status === 'paid' ? (
                        <FaCheck className="text-green-600" />
                      ) : (
                        <FaClock className="text-yellow-600" />
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        bill.hospitalizationBill.status === 'paid' ? 'bg-green-500' : 'bg-yellow-400'
                      }`}
                      style={{ width: `${bill.hospitalizationBill.status === 'paid' ? 100 : 0}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* PayPal Modal */}
      {showPayPalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" data-testid="paypal-modal"> {/* [SELENIUM] Selenium chờ modal này xuất hiện */}
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowPayPalModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              data-testid="paypal-modal-close"
            >
              <FaTimes className="text-xl" />
            </button>
            
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Thanh toán PayPal</h3>
              <p className="text-gray-600">
                Số tiền: <span className="font-semibold text-blue-600">{formatCurrency(payPalConfig.amount)}</span>
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {payPalConfig.type === 'consultation' && 'Phí Khám Bệnh'}
                {payPalConfig.type === 'prescription' && 'Đơn Thuốc'}
                {payPalConfig.type === 'hospitalization' && 'Phí Nội Trú'}
              </p>
            </div>
            <div className="border-t pt-4">
              {payPalConfig.type === 'prescription' ? (
                <PayPalButton
                  amount={payPalConfig.amount}
                  appointmentId={(bill.appointmentId && bill.appointmentId._id) ? bill.appointmentId._id : bill.appointmentId}
                  billType="medication"
                  prescriptionId={payPalConfig.prescriptionId}
                  onSuccess={async () => {
                    setShowPayPalModal(false);
                    await fetchBill();
                    if (onPaymentComplete) onPaymentComplete();
                  }}
                  onError={() => {
                    // Keep modal open on error so user can retry
                  }}
                  onCancel={() => {
                    setShowPayPalModal(false);
                  }}
                />
              ) : (
                <PayPalButton
                  amount={payPalConfig.amount}
                  appointmentId={(bill.appointmentId && bill.appointmentId._id) ? bill.appointmentId._id : bill.appointmentId}
                  billType={payPalConfig.type}
                  onSuccess={async () => {
                    setShowPayPalModal(false);
                    await fetchBill();
                    if (onPaymentComplete) onPaymentComplete();
                  }}
                  onError={() => {
                    // Keep modal open on error so user can retry
                  }}
                  onCancel={() => {
                    setShowPayPalModal(false);
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default UserBilling;
