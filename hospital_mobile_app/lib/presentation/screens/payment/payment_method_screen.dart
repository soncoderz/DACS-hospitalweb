import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_constants.dart';
import '../../providers/payment_provider.dart';

class PaymentMethodScreen extends StatelessWidget {
  final String appointmentId;
  final double amount;

  const PaymentMethodScreen({
    super.key,
    required this.appointmentId,
    required this.amount,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Chọn Phương Thức Thanh Toán'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(AppConstants.defaultPadding),
        children: [
          // Payment amount
          Card(
            color: Colors.blue.shade50,
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  const Text(
                    'Tổng thanh toán',
                    style: TextStyle(fontSize: 16),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '${amount.toStringAsFixed(0)}đ',
                    style: const TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                      color: Colors.blue,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
          
          const Text(
            'Chọn phương thức',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),

          // MoMo Payment
          _buildPaymentMethodCard(
            context,
            'Ví MoMo',
            'Thanh toán qua ví điện tử MoMo',
            'assets/images/momo_logo.png',
            () => _handleMomoPayment(context),
          ),
          
          // Cash Payment
          _buildPaymentMethodCard(
            context,
            'Tiền mặt',
            'Thanh toán trực tiếp tại phòng khám',
            null,
            () => _handleCashPayment(context),
          ),
        ],
      ),
    );
}

  Widget _buildPaymentMethodCard(
    BuildContext context,
    String title,
    String description,
    String? logoPath,
    VoidCallback onTap,
  ) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        leading: Container(
          width: 60,
          height: 60,
          decoration: BoxDecoration(
            color: Colors.grey.shade100,
            borderRadius: BorderRadius.circular(8),
          ),
          child: logoPath != null
              ? Image.asset(logoPath, errorBuilder: (context, error, stackTrace) {
                  return const Icon(Icons.payment, size: 30);
                })
              : const Icon(Icons.payments, size: 30),
        ),
        title: Text(
          title,
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 16,
          ),
        ),
        subtitle: Text(description),
        trailing: const Icon(Icons.arrow_forward_ios, size: 16),
        onTap: onTap,
      ),
    );
  }

  Future<void> _handleMomoPayment(BuildContext context) async {
    final paymentProvider = context.read<PaymentProvider>();
    
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(child: CircularProgressIndicator()),
    );

    final success = await paymentProvider.createMomoPayment(
      appointmentId: appointmentId,
      amount: amount,
    );

    if (!context.mounted) return;
    Navigator.pop(context); // Close loading

    if (success && paymentProvider.momoPaymentUrl != null) {
      Navigator.pushNamed(
        context,
        '/payment-webview',
        arguments: {
          'url': paymentProvider.momoPaymentUrl,
          'orderId': paymentProvider.currentOrderId,
        },
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(paymentProvider.errorMessage ?? 'Tạo thanh toán thất bại'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _handleCashPayment(BuildContext context) async {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Xác nhận'),
        content: const Text('Bạn sẽ thanh toán bằng tiền mặt tại phòng khám?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Hủy'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.pushReplacementNamed(
                context,
                '/payment-result',
                arguments: {
                  'success': true,
                  'method': 'cash',
                  'appointmentId': appointmentId,
                },
              );
            },
            child: const Text('Xác nhận'),
          ),
        ],
      ),
    );
  }
}
