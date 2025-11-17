import 'package:flutter/material.dart';
import '../../widgets/common/custom_button.dart';

class PaymentFailureScreen extends StatelessWidget {
  final String message;
  final String orderId;

  const PaymentFailureScreen({
    Key? key,
    required this.message,
    required this.orderId,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: () async {
        _navigateBack(context);
        return false;
      },
      child: Scaffold(
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Failure Icon
                Container(
                  width: 120,
                  height: 120,
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.error_outline,
                    size: 80,
                    color: Colors.red.shade600,
                  ),
                ),
                
                const SizedBox(height: 32),
                
                // Failure Title
                const Text(
                  'Thanh toán thất bại',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
                
                const SizedBox(height: 16),
                
                // Error Message
                Text(
                  message.isNotEmpty 
                      ? message 
                      : 'Đã có lỗi xảy ra trong quá trình thanh toán',
                  style: const TextStyle(
                    fontSize: 16,
                    color: Colors.grey,
                  ),
                  textAlign: TextAlign.center,
                ),
                
                const SizedBox(height: 32),
                
                // Order ID Card
                Card(
                  elevation: 2,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Mã giao dịch',
                          style: TextStyle(
                            color: Colors.grey,
                            fontSize: 14,
                          ),
                        ),
                        Text(
                          orderId,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                
                const SizedBox(height: 32),
                
                // Info Message
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.orange.shade50,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.orange.shade200),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.info_outline, color: Colors.orange.shade700),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Nếu số tiền đã bị trừ, vui lòng liên hệ bộ phận hỗ trợ để được hoàn tiền.',
                          style: TextStyle(
                            color: Colors.orange.shade700,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                
                const Spacer(),
                
                // Action Buttons
                Column(
                  children: [
                    CustomButton(
                      text: 'Thử lại',
                      onPressed: () => _retryPayment(context),
                    ),
                    const SizedBox(height: 12),
                    OutlinedButton(
                      onPressed: () => _navigateBack(context),
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size(double.infinity, 50),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: const Text('Quay lại'),
                    ),
                    const SizedBox(height: 12),
                    TextButton(
                      onPressed: () => _contactSupport(context),
                      child: const Text('Liên hệ hỗ trợ'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _retryPayment(BuildContext context) {
    // Go back to payment screen
    Navigator.pop(context);
  }

  void _navigateBack(BuildContext context) {
    // Go back to previous screens
    Navigator.popUntil(context, (route) => route.isFirst);
  }

  void _contactSupport(BuildContext context) {
    // TODO: Implement contact support functionality
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Tính năng liên hệ hỗ trợ đang được phát triển'),
      ),
    );
  }
}
