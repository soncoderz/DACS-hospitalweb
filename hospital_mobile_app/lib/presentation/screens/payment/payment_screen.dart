import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../providers/payment_provider.dart';
import '../../widgets/common/custom_button.dart';
import '../../widgets/common/loading_indicator.dart';

class PaymentScreen extends StatefulWidget {
  final String appointmentId;
  final double amount;
  final String? bookingCode;
  final String? doctorName;
  final DateTime? appointmentDate;
  final String? timeSlot;

  const PaymentScreen({
    Key? key,
    required this.appointmentId,
    required this.amount,
    this.bookingCode,
    this.doctorName,
    this.appointmentDate,
    this.timeSlot,
  }) : super(key: key);

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  String _selectedPaymentMethod = 'momo';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Thanh toán'),
        elevation: 0,
      ),
      body: Consumer<PaymentProvider>(
        builder: (context, paymentProvider, child) {
          if (paymentProvider.isLoading) {
            return const Center(child: LoadingIndicator());
          }

          return SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Order Summary Card
                _buildOrderSummaryCard(),

                const SizedBox(height: 16),

                // Payment Method Selection
                _buildPaymentMethodSection(),

                const SizedBox(height: 16),

                // Terms and Conditions
                _buildTermsSection(),

                const SizedBox(height: 24),

                // Error Message
                if (paymentProvider.errorMessage != null)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.red.shade50,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.red.shade200),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.error_outline, color: Colors.red.shade700),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              paymentProvider.errorMessage!,
                              style: TextStyle(color: Colors.red.shade700),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                const SizedBox(height: 16),

                // Proceed to Payment Button
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: CustomButton(
                    text: 'Tiến hành thanh toán',
                    onPressed: _handlePayment,
                    isLoading: paymentProvider.isLoading,
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildOrderSummaryCard() {
    final currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: '₫');

    return Card(
      margin: const EdgeInsets.all(16),
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Thông tin đặt lịch',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const Divider(height: 24),
            
            if (widget.bookingCode != null) ...[
              _buildInfoRow('Mã đặt lịch', widget.bookingCode!),
              const SizedBox(height: 12),
            ],
            
            if (widget.doctorName != null) ...[
              _buildInfoRow('Bác sĩ', widget.doctorName!),
              const SizedBox(height: 12),
            ],
            
            if (widget.appointmentDate != null) ...[
              _buildInfoRow(
                'Ngày khám',
                DateFormat('dd/MM/yyyy').format(widget.appointmentDate!),
              ),
              const SizedBox(height: 12),
            ],
            
            if (widget.timeSlot != null) ...[
              _buildInfoRow('Giờ khám', widget.timeSlot!),
              const SizedBox(height: 12),
            ],
            
            const Divider(height: 24),
            
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Tổng tiền',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  currencyFormat.format(widget.amount),
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).primaryColor,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 100,
          child: Text(
            label,
            style: const TextStyle(
              color: Colors.grey,
              fontSize: 14,
            ),
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPaymentMethodSection() {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Phương thức thanh toán',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            
            // MoMo Payment Option
            _buildPaymentMethodOption(
              value: 'momo',
              title: 'Ví MoMo',
              subtitle: 'Thanh toán qua ví điện tử MoMo',
              icon: Icons.account_balance_wallet,
              iconColor: Colors.pink,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentMethodOption({
    required String value,
    required String title,
    required String subtitle,
    required IconData icon,
    required Color iconColor,
  }) {
    return RadioListTile<String>(
      value: value,
      groupValue: _selectedPaymentMethod,
      onChanged: (String? newValue) {
        setState(() {
          _selectedPaymentMethod = newValue!;
        });
      },
      title: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: iconColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: iconColor, size: 24),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 16,
                  ),
                ),
                Text(
                  subtitle,
                  style: const TextStyle(
                    color: Colors.grey,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      contentPadding: EdgeInsets.zero,
    );
  }

  Widget _buildTermsSection() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.blue.shade50,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.blue.shade200),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(Icons.info_outline, color: Colors.blue.shade700, size: 20),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                'Bằng việc tiếp tục, bạn đồng ý với điều khoản và điều kiện thanh toán của chúng tôi.',
                style: TextStyle(
                  color: Colors.blue.shade700,
                  fontSize: 12,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _handlePayment() async {
    final paymentProvider = context.read<PaymentProvider>();

    // Create MoMo payment
    final success = await paymentProvider.createMomoPayment(
      appointmentId: widget.appointmentId,
      amount: widget.amount,
    );

    if (success && mounted) {
      // Navigate to MoMo payment processing screen
      Navigator.pushNamed(
        context,
        '/payment-processing',
        arguments: {
          'payment': paymentProvider.currentPayment,
          'appointmentId': widget.appointmentId,
        },
      );
    }
  }
}
