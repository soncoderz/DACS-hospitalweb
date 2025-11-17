import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../widgets/common/custom_button.dart';

class PaymentSuccessScreen extends StatelessWidget {
  final String appointmentId;
  final String orderId;
  final double amount;

  const PaymentSuccessScreen({
    Key? key,
    required this.appointmentId,
    required this.orderId,
    required this.amount,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: '₫');

    return WillPopScope(
      onWillPop: () async {
        _navigateToHome(context);
        return false;
      },
      child: Scaffold(
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Success Icon
                Container(
                  width: 120,
                  height: 120,
                  decoration: BoxDecoration(
                    color: Colors.green.shade50,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.check_circle,
                    size: 80,
                    color: Colors.green.shade600,
                  ),
                ),
                
                const SizedBox(height: 32),
                
                // Success Title
                const Text(
                  'Thanh toán thành công!',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
                
                const SizedBox(height: 16),
                
                // Success Message
                Text(
                  'Bạn đã thanh toán thành công ${currencyFormat.format(amount)}',
                  style: const TextStyle(
                    fontSize: 16,
                    color: Colors.grey,
                  ),
                  textAlign: TextAlign.center,
                ),
                
                const SizedBox(height: 32),
                
                // Payment Details Card
                Card(
                  elevation: 2,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        _buildDetailRow('Mã giao dịch', orderId),
                        const Divider(height: 24),
                        _buildDetailRow(
                          'Số tiền',
                          currencyFormat.format(amount),
                        ),
                        const Divider(height: 24),
                        _buildDetailRow(
                          'Thời gian',
                          DateFormat('dd/MM/yyyy HH:mm').format(DateTime.now()),
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
                    color: Colors.blue.shade50,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.blue.shade200),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.info_outline, color: Colors.blue.shade700),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Lịch hẹn của bạn đã được xác nhận. Vui lòng kiểm tra trong mục "Lịch hẹn của tôi".',
                          style: TextStyle(
                            color: Colors.blue.shade700,
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
                      text: 'Xem lịch hẹn',
                      onPressed: () => _navigateToAppointmentDetail(context),
                    ),
                    const SizedBox(height: 12),
                    OutlinedButton(
                      onPressed: () => _navigateToHome(context),
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size(double.infinity, 50),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: const Text('Về trang chủ'),
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

  Widget _buildDetailRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(
            color: Colors.grey,
            fontSize: 14,
          ),
        ),
        Text(
          value,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  void _navigateToAppointmentDetail(BuildContext context) {
    Navigator.pushNamedAndRemoveUntil(
      context,
      '/appointment-detail',
      (route) => route.isFirst,
      arguments: {'appointmentId': appointmentId},
    );
  }

  void _navigateToHome(BuildContext context) {
    Navigator.pushNamedAndRemoveUntil(
      context,
      '/home',
      (route) => false,
    );
  }
}
