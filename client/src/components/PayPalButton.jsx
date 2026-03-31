import React, { useEffect, useState, useRef } from 'react';
import { toast } from 'react-toastify';
import api from '../utils/api';

// =============================================================================
// COMPONENT NÚT PAYPAL - PayPalButton.jsx
// =============================================================================
// Component này có 2 CHẾ ĐỘ HOẠT ĐỘNG:
//
// 1. CHẾ ĐỘ THẬT (mặc định):
//    - Tải PayPal SDK từ https://www.paypal.com/sdk/js
//    - Hiển thị nút PayPal thật, mở popup thanh toán PayPal
//    - Người dùng đăng nhập tài khoản PayPal để thanh toán
//
// 2. CHẾ ĐỘ MOCK (cho Selenium):
//    - Kích hoạt khi URL có tham số ?selenium_paypal_mock=1
//    - KHÔNG tải PayPal SDK, KHÔNG mở popup PayPal
//    - Hiển thị panel mock với nút "Xác nhận PayPal mock"
//    - Khi bấm, gọi API backend với cờ seleniumPaypalMock=true
//    - Backend xử lý thanh toán mà không cần PayPal thật
//
// Các data-testid cho Selenium:
//   - 'paypal-mock-panel'    -> Panel mock (chỉ hiển khi ?selenium_paypal_mock=1)
//   - 'paypal-mock-approve'  -> Nút xác nhận thanh toán mock (Selenium bấm)
//   - 'paypal-mock-cancel'   -> Nút hủy (không dùng trong test hiện tại)
//   - 'paypal-sdk-container' -> Container chứa nút PayPal SDK thật (không dùng khi mock)
// =============================================================================
const PayPalButton = ({ 
  amount, 
  appointmentId, 
  billType,
  prescriptionId,
  onSuccess, 
  onError,
  onCancel 
}) => {
  const [sdkReady, setSdkReady] = useState(false);      // SDK PayPal đã tải xong chưa?
  const [mockProcessing, setMockProcessing] = useState(false); // Đang xử lý mock payment?
  const paypalRef = useRef(null);
  const buttonsContainerRef = useRef(null);              // Container để render nút PayPal SDK
  const paymentIdRef = useRef(null);                     // Lưu payment ID (PAY-XXX) từ createOrder
  // [SELENIUM] Kiểm tra URL có tham số selenium_paypal_mock=1 không để bật chế độ mock
  const mockMode = typeof window !== 'undefined'
    && new URLSearchParams(window.location.search).get('selenium_paypal_mock') === '1';

  const buildPayload = () => {
    const payload = {
      appointmentId,
      amount,
      billType,
    };

    if (prescriptionId) {
      payload.prescriptionId = prescriptionId;
    }

    return payload;
  };

  const createPaypalOrder = async (requestConfig) => {
    const response = await api.post('/payments/paypal/create', buildPayload(), requestConfig);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Không thể tạo thanh toán PayPal');
    }

    paymentIdRef.current = response.data.data?.paymentId;
    return response.data.data;
  };

  // [SELENIUM] Hàm xử lý khi Selenium bấm nút "Xác nhận PayPal mock"
  // Gọi API backend 2 lần:
  //   1. POST /payments/paypal/create với seleniumPaypalMock=true -> tạo payment
  //   2. POST /payments/paypal/execute với PayerID='SELENIUM-MOCK-PAYER' -> xác nhận thanh toán
  // Backend nhận ra cờ mock nên không gọi PayPal thật, đánh dấu bill là "paid"
  const handleMockApprove = async () => {
    try {
      setMockProcessing(true);
      // Bước 1: Tạo payment mock
      const created = await api.post('/payments/paypal/create', {
        ...buildPayload(),
        seleniumPaypalMock: true,  // Cờ cho backend biết đây là mock
      });
      if (!created.data.success) {
        throw new Error(created.data.message || 'Không thể tạo thanh toán PayPal');
      }

      // Bước 2: Xác nhận thanh toán mock (không cần PayPal thật)
      const response = await api.post('/payments/paypal/execute', {
        orderId: created.data.data?.approvalToken || created.data.data?.orderId || created.data.data?.paymentId,
        paymentId: created.data.data?.paymentId,
        PayerID: 'SELENIUM-MOCK-PAYER',  // Payer ID giả cho Selenium
        billType,
        seleniumPaypalMock: true,          // Cờ cho backend biết đây là mock
        ...(prescriptionId ? { prescriptionId } : {}),
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Thanh toán PayPal thất bại');
      }

      toast.success('Thanh toán PayPal thành công!');
      if (onSuccess) onSuccess(response.data.data);
    } catch (error) {
      console.error('Error executing mock PayPal payment:', error);
      toast.error(error.response?.data?.message || error.message || 'Thanh toán PayPal thất bại');
      if (onError) onError(error);
    } finally {
      setMockProcessing(false);
    }
  };

  useEffect(() => {
    if (mockMode) {
      setSdkReady(true);
      return undefined;
    }

    // Load PayPal SDK script
    const loadPayPalSDK = async () => {
      try {
        // Get PayPal client ID from server
        const response = await api.get('/payments/paypal/client-id');
        const clientId = response.data.clientId || process.env.REACT_APP_PAYPAL_CLIENT_ID || 'Aetwa0pQjsQVVGxb_NqE5wue5IKBePqpHlGsLwSQ1mmr6uGMGPqs6MtrK-La4SCaRkS0Q0j1Ep-dwkkd';
        const currency = 'USD'; // PayPal uses USD

        // Check if script already loaded
        if (window.paypal) {
          setSdkReady(true);
          return;
        }

        // Create script element
        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}`;
        script.async = true;
        script.onload = () => {
          setSdkReady(true);
        };
        script.onerror = () => {
          console.error('Failed to load PayPal SDK');
          toast.error('Không thể tải PayPal SDK. Vui lòng thử lại.');
          if (onError) onError();
        };
        document.body.appendChild(script);

        return () => {
          // Cleanup on unmount
          const existingScript = document.querySelector(`script[src*="paypal.com/sdk"]`);
          if (existingScript) {
            document.body.removeChild(existingScript);
          }
        };
      } catch (error) {
        console.error('Error loading PayPal SDK:', error);
        toast.error('Không thể tải PayPal SDK');
        if (onError) onError();
      }
    };

    loadPayPalSDK();
  }, [mockMode]);

  useEffect(() => {
    if (mockMode) return;
    if (!sdkReady || !window.paypal || !amount || !appointmentId) return;

    // Clear existing buttons
    if (buttonsContainerRef.current) {
      buttonsContainerRef.current.innerHTML = '';
    }

    // Render PayPal Button
    if (window.paypal.Buttons) {
      window.paypal.Buttons({
        createOrder: async (data, actions) => {
          try {
            // Call your server to create PayPal order
            const payload = {
              appointmentId,
              amount,
              billType
            };
            if (prescriptionId) {
              payload.prescriptionId = prescriptionId;
            }
            const response = await api.post('/payments/paypal/create', payload);

            if (!response.data.success) {
              throw new Error(response.data.message || 'Không thể tạo thanh toán PayPal');
            }

            // Store payment ID for execute (needed for PayPal REST SDK)
            paymentIdRef.current = response.data.data?.paymentId;
            
            // Return order ID (EC-XXX token) from PayPal for SDK
            // Priority: approvalToken > orderId > paymentId
            return response.data.data?.approvalToken || response.data.data?.orderId || response.data.data?.paymentId;
          } catch (error) {
            console.error('Error creating PayPal order:', error);
            toast.error(error.response?.data?.message || error.message || 'Không thể tạo thanh toán PayPal');
            if (onError) onError(error);
            throw error;
          }
        },
        onApprove: async (data, actions) => {
          try {
            // SDK trả về orderID (EC-XXX), nhưng server cần payment ID (PAY-XXX)
            // Gửi cả orderID và paymentId (đã lưu từ createOrder)
            const executePayload = {
              orderId: data.orderID || data.paymentID, // EC-XXX từ SDK
              paymentId: paymentIdRef.current, // PAY-XXX đã lưu khi create
              PayerID: data.payerID,
              billType // Pass billType to server
            };
            if (prescriptionId) {
              executePayload.prescriptionId = prescriptionId;
            }

            const response = await api.post('/payments/paypal/execute', executePayload);

            if (!response.data.success) {
              throw new Error(response.data.message || 'Thanh toán PayPal thất bại');
            }

            toast.success('Thanh toán PayPal thành công!');
            if (onSuccess) onSuccess(response.data.data);
          } catch (error) {
            console.error('Error executing PayPal payment:', error);
            toast.error(error.response?.data?.message || error.message || 'Thanh toán PayPal thất bại');
            if (onError) onError(error);
          }
        },
        onCancel: (data) => {
          console.log('PayPal payment cancelled:', data);
          toast.info('Bạn đã hủy thanh toán PayPal');
          if (onCancel) onCancel(data);
        },
        onError: (err) => {
          console.error('PayPal button error:', err);
          toast.error('Đã xảy ra lỗi trong quá trình thanh toán PayPal');
          if (onError) onError(err);
        },
        style: {
          layout: 'vertical',
          color: 'blue',
          shape: 'rect',
          label: 'paypal'
        }
      }).render(buttonsContainerRef.current);
    }
  }, [sdkReady, amount, appointmentId, billType, onSuccess, onError, onCancel, mockMode, prescriptionId]);

  if (!sdkReady) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Đang tải PayPal...</span>
      </div>
    );
  }

  // [SELENIUM] Chế độ mock: Hiển thị panel giả thay vì nút PayPal thật
  // Panel này chỉ xuất hiện khi URL có ?selenium_paypal_mock=1
  if (mockMode) {
    return (
      <div className="space-y-3" data-testid="paypal-mock-panel">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
          Chế độ PayPal mock cho Selenium đang bật.
        </div>
        {/* [SELENIUM] data-testid="paypal-mock-approve": Selenium bấm nút này để mô phỏng thanh toán thành công */}
        <button
          type="button"
          data-testid="paypal-mock-approve"
          disabled={mockProcessing}
          onClick={handleMockApprove}
          className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400"
        >
          {mockProcessing ? 'Đang xử lý PayPal mock...' : 'Xác nhận PayPal mock'}
        </button>
        {/* [SELENIUM] data-testid="paypal-mock-cancel": Nút hủy mock (không dùng trong test hiện tại) */}
        <button
          type="button"
          data-testid="paypal-mock-cancel"
          disabled={mockProcessing}
          onClick={() => onCancel && onCancel()}
          className="w-full rounded-lg bg-gray-100 px-4 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:bg-gray-100"
        >
          Hủy
        </button>
      </div>
    );
  }

  // Chế độ thật: Hiển thị nút PayPal SDK
  return (
    <div ref={buttonsContainerRef} className="w-full" data-testid="paypal-sdk-container"></div>
  );
};

export default PayPalButton;

