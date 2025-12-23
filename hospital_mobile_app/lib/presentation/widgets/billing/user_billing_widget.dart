import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../../domain/entities/appointment.dart';
import '../../providers/billing_provider.dart';
import 'payment_method_selector.dart';

class UserBillingWidget extends StatefulWidget {
  final String appointmentId;
  final Appointment? appointment;
  final VoidCallback? onPaymentComplete;

  const UserBillingWidget({
    Key? key,
    required this.appointmentId,
    this.appointment,
    this.onPaymentComplete,
  }) : super(key: key);

  @override
  State<UserBillingWidget> createState() => _UserBillingWidgetState();
}

class _UserBillingWidgetState extends State<UserBillingWidget> {
  String _consultationPaymentMethod = 'momo';
  String _hospitalizationPaymentMethod = 'momo';
  final Map<String, String> _prescriptionPaymentMethods = {};

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadBill();
    });
  }

  Future<void> _loadBill() async {
    final provider = context.read<BillingProvider>();
    await provider.fetchBill(widget.appointmentId);
  }

  String _formatCurrency(double amount) {
    return NumberFormat.currency(
      locale: 'vi',
      symbol: 'đ',
      decimalDigits: 0,
    ).format(amount);
  }

  Future<void> _payConsultation() async {
    final provider = context.read<BillingProvider>();
    final bill = provider.bill;
    
    if (bill == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Không có thông tin hóa đơn'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }
    
    if (_consultationPaymentMethod == 'momo') {
      // Navigate to MoMo payment screen
      final result = await Navigator.pushNamed(
        context,
        '/momo-payment',
        arguments: {
          'appointmentId': widget.appointmentId,
          'amount': bill.consultationAmount,
          'billType': 'consultation',
        },
      );

      if (result == true && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Thanh toán phí khám thành công')),
        );
        if (widget.onPaymentComplete != null) {
          widget.onPaymentComplete!();
        }
      }
      return;
    }

    final success = await provider.payConsultation(
      widget.appointmentId,
      _consultationPaymentMethod,
    );

    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Thanh toán phí khám thành công')),
      );
      if (widget.onPaymentComplete != null) {
        widget.onPaymentComplete!();
      }
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(provider.errorMessage ?? 'Thanh toán thất bại'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _payHospitalization() async {
    final provider = context.read<BillingProvider>();
    final success = await provider.payHospitalization(
      widget.appointmentId,
      _hospitalizationPaymentMethod,
    );

    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Thanh toán phí nội trú thành công')),
      );
      if (widget.onPaymentComplete != null) {
        widget.onPaymentComplete!();
      }
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(provider.errorMessage ?? 'Thanh toán thất bại'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _payPrescription(String prescriptionId) async {
    final method = _prescriptionPaymentMethods[prescriptionId] ?? 'momo';
    final provider = context.read<BillingProvider>();
    final success = await provider.payPrescription(
      prescriptionId,
      method,
    );

    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Thanh toán đơn thuốc thành công')),
      );
      if (widget.onPaymentComplete != null) {
        widget.onPaymentComplete!();
      }
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(provider.errorMessage ?? 'Thanh toán thất bại'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<BillingProvider>(
      builder: (context, provider, child) {
        if (provider.isLoading && provider.bill == null) {
          return const Center(
            child: Padding(
              padding: EdgeInsets.all(32),
              child: CircularProgressIndicator(),
            ),
          );
        }

        final bill = provider.bill;
        if (bill == null) {
          return const Center(
            child: Text('Không có thông tin thanh toán'),
          );
        }

        final isHospitalized = widget.appointment?.status == 'hospitalized';

        return Card(
          margin: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Colors.blue.shade50, Colors.purple.shade50],
                  ),
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(12),
                    topRight: Radius.circular(12),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Thanh Toán Lịch Hẹn',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        _buildStatusBadge(bill.overallStatus),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Mã hóa đơn: ${bill.billNumber}',
                      style: const TextStyle(
                        fontSize: 12,
                        color: Colors.grey,
                      ),
                    ),
                  ],
                ),
              ),

              // Summary Cards
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Expanded(
                      child: _buildSummaryCard(
                        'Tổng hóa đơn',
                        bill.totalAmount,
                        Colors.blue,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _buildSummaryCard(
                        'Đã thanh toán',
                        bill.paidAmount,
                        Colors.green,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _buildSummaryCard(
                        'Còn lại',
                        bill.totalAmount - bill.paidAmount,
                        Colors.red,
                      ),
                    ),
                  ],
                ),
              ),

              const Divider(),

              // Consultation Bill
              if (bill.consultationAmount > 0)
                _buildBillSection(
                  title: 'Phí Khám Bệnh',
                  icon: Icons.medical_services,
                  iconColor: Colors.blue,
                  amount: bill.consultationAmount,
                  status: bill.consultationStatus,
                  paymentMethod: bill.consultationPaymentMethod,
                  paymentDate: bill.consultationPaymentDate,
                  canPay: !isHospitalized && bill.consultationStatus != 'paid',
                  onPaymentMethodChanged: (method) {
                    setState(() {
                      _consultationPaymentMethod = method;
                    });
                  },
                  selectedPaymentMethod: _consultationPaymentMethod,
                  onPay: _payConsultation,
                  isLoading: provider.isLoading,
                ),

              // Medication Bill
              if (bill.medicationAmount > 0 && bill.prescriptions.isNotEmpty)
                _buildMedicationSection(
                  bill: bill,
                  isHospitalized: isHospitalized,
                  provider: provider,
                ),

              // Hospitalization Bill
              if (bill.hospitalizationAmount > 0)
                _buildBillSection(
                  title: 'Phí Nội Trú',
                  icon: Icons.hotel,
                  iconColor: Colors.purple,
                  amount: bill.hospitalizationAmount,
                  status: bill.hospitalizationStatus,
                  paymentMethod: bill.hospitalizationPaymentMethod,
                  paymentDate: bill.hospitalizationPaymentDate,
                  canPay: !isHospitalized && bill.hospitalizationStatus != 'paid',
                  onPaymentMethodChanged: (method) {
                    setState(() {
                      _hospitalizationPaymentMethod = method;
                    });
                  },
                  selectedPaymentMethod: _hospitalizationPaymentMethod,
                  onPay: _payHospitalization,
                  isLoading: provider.isLoading,
                ),

              // Payment Progress
              _buildPaymentProgress(bill),
            ],
          ),
        );
      },
    );
  }

  Widget _buildStatusBadge(String status) {
    Color color;
    String text;

    switch (status) {
      case 'paid':
        color = Colors.green;
        text = 'Đã thanh toán đủ';
        break;
      case 'partial':
        color = Colors.orange;
        text = 'Thanh toán một phần';
        break;
      default:
        color = Colors.red;
        text = 'Chưa thanh toán';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.bold,
          fontSize: 12,
        ),
      ),
    );
  }

  Widget _buildSummaryCard(String label, double amount, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 4,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 11,
              color: Colors.grey,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            _formatCurrency(amount),
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBillSection({
    required String title,
    required IconData icon,
    required Color iconColor,
    required double amount,
    required String status,
    String? paymentMethod,
    DateTime? paymentDate,
    required bool canPay,
    required Function(String) onPaymentMethodChanged,
    required String selectedPaymentMethod,
    required VoidCallback onPay,
    required bool isLoading,
  }) {
    return Container(
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey.shade300),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: iconColor.withOpacity(0.1),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(12),
                topRight: Radius.circular(12),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Icon(icon, color: iconColor),
                    const SizedBox(width: 8),
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                _buildPaymentStatusBadge(status),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _formatCurrency(amount),
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: iconColor,
                  ),
                ),
                if (status == 'paid' && paymentDate != null) ...[
                  const SizedBox(height: 8),
                  Text(
                    'Đã thanh toán: ${DateFormat('dd/MM/yyyy HH:mm').format(paymentDate)}',
                    style: const TextStyle(
                      fontSize: 12,
                      color: Colors.grey,
                    ),
                  ),
                  if (paymentMethod != null)
                    Text(
                      'Phương thức: ${_getPaymentMethodLabel(paymentMethod)}',
                      style: const TextStyle(
                        fontSize: 12,
                        color: Colors.grey,
                      ),
                    ),
                ],
                if (canPay) ...[
                  const SizedBox(height: 16),
                  PaymentMethodSelector(
                    selectedMethod: selectedPaymentMethod,
                    onMethodChanged: onPaymentMethodChanged,
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: isLoading ? null : onPay,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: iconColor,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                      child: isLoading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                              ),
                            )
                          : Text('Thanh toán MoMo (${_formatCurrency(amount)})'),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMedicationSection({
    required dynamic bill,
    required bool isHospitalized,
    required dynamic provider,
  }) {
    return Container(
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey.shade300),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.green.withOpacity(0.1),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(12),
                topRight: Radius.circular(12),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Row(
                  children: [
                    Icon(Icons.medication, color: Colors.green),
                    SizedBox(width: 8),
                    Text(
                      'Tiền Thuốc',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                _buildPaymentStatusBadge(bill.medicationStatus),
              ],
            ),
          ),
          if (isHospitalized)
            Container(
              margin: const EdgeInsets.all(16),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.orange.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.orange.shade200),
              ),
              child: const Row(
                children: [
                  Icon(Icons.info_outline, color: Colors.orange),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Đang nằm viện. Vui lòng đợi xuất viện để thanh toán đơn thuốc.',
                      style: TextStyle(fontSize: 12),
                    ),
                  ),
                ],
              ),
            ),
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            padding: const EdgeInsets.all(16),
            itemCount: bill.prescriptions.length,
            itemBuilder: (context, index) {
              final prescription = bill.prescriptions[index];
              final isPaid = prescription.status == 'paid';
              final canPay = !isPaid && !isHospitalized;

              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.blue.shade100,
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  'Đợt ${prescription.order ?? index + 1}',
                                  style: const TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                              if (isPaid) ...[
                                const SizedBox(width: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 4,
                                  ),
                                  decoration: BoxDecoration(
                                    color: Colors.green.shade100,
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: const Text(
                                    'Đã thanh toán',
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ],
                            ],
                          ),
                          Text(
                            _formatCurrency(prescription.amount),
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Colors.green,
                            ),
                          ),
                        ],
                      ),
                      if (prescription.diagnosis != null) ...[
                        const SizedBox(height: 8),
                        Text(
                          'Chẩn đoán: ${prescription.diagnosis}',
                          style: const TextStyle(fontSize: 12),
                        ),
                      ],
                      if (canPay) ...[
                        const SizedBox(height: 12),
                        PaymentMethodSelector(
                          selectedMethod: _prescriptionPaymentMethods[prescription.id] ?? 'momo',
                          onMethodChanged: (method) {
                            setState(() {
                              _prescriptionPaymentMethods[prescription.id] = method;
                            });
                          },
                        ),
                        const SizedBox(height: 8),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: provider.isLoading
                                ? null
                                : () => _payPrescription(prescription.id),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.green,
                              foregroundColor: Colors.white,
                            ),
                            child: provider.isLoading
                                ? const SizedBox(
                                    height: 20,
                                    width: 20,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                    ),
                                  )
                                : Text('Thanh toán MoMo (${_formatCurrency(prescription.amount)})'),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentProgress(dynamic bill) {
    final progress = bill.totalAmount > 0 ? (bill.paidAmount / bill.totalAmount) : 0.0;

    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Tiến độ thanh toán',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Tổng tiến độ'),
              Text(
                '${(progress * 100).toStringAsFixed(0)}%',
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 16,
              backgroundColor: Colors.grey.shade300,
              valueColor: AlwaysStoppedAnimation<Color>(
                progress == 1.0 ? Colors.green : Colors.blue,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentStatusBadge(String status) {
    Color color;
    IconData icon;
    String text;

    switch (status) {
      case 'paid':
        color = Colors.green;
        icon = Icons.check_circle;
        text = 'Đã thanh toán';
        break;
      case 'cancelled':
        color = Colors.grey;
        icon = Icons.cancel;
        text = 'Đã hủy';
        break;
      default:
        color = Colors.orange;
        icon = Icons.schedule;
        text = 'Chưa thanh toán';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 4),
          Text(
            text,
            style: TextStyle(
              color: color,
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  String _getPaymentMethodLabel(String method) {
    switch (method) {
      case 'momo':
        return 'MoMo';
      case 'paypal':
        return 'PayPal';
      case 'cash':
        return 'Tiền mặt';
      default:
        return method;
    }
  }
}
