import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../data/models/momo_payment_model.dart';
import '../../providers/payment_provider.dart';
import '../../widgets/common/loading_indicator.dart';

class PaymentProcessingScreen extends StatefulWidget {
  final MomoPaymentModel payment;
  final String appointmentId;

  const PaymentProcessingScreen({
    Key? key,
    required this.payment,
    required this.appointmentId,
  }) : super(key: key);

  @override
  State<PaymentProcessingScreen> createState() =>
      _PaymentProcessingScreenState();
}

class _PaymentProcessingScreenState extends State<PaymentProcessingScreen> {
  bool _isProcessing = false;
  bool _hasOpenedMomo = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _openMomoApp();
    });
  }

  Future<void> _openMomoApp() async {
    if (_hasOpenedMomo) return;

    setState(() {
      _hasOpenedMomo = true;
    });

    try {
      // Try to open MoMo app with deeplink
      final Uri momoUri = Uri.parse(widget.payment.deeplink);
      
      if (await canLaunchUrl(momoUri)) {
        await launchUrl(
          momoUri,
          mode: LaunchMode.externalApplication,
        );
        
        // Start polling payment status
        _startPaymentStatusPolling();
      } else {
        // Fallback to web URL
        final Uri webUri = Uri.parse(widget.payment.payUrl);
        if (await canLaunchUrl(webUri)) {
          await launchUrl(webUri);
          _startPaymentStatusPolling();
        } else {
          if (mounted) {
            _showError('Không thể mở ứng dụng MoMo');
          }
        }
      }
    } catch (e) {
      if (mounted) {
        _showError('Lỗi khi mở ứng dụng MoMo: ${e.toString()}');
      }
    }
  }

  Future<void> _startPaymentStatusPolling() async {
    setState(() {
      _isProcessing = true;
    });

    final paymentProvider = context.read<PaymentProvider>();
    
    // Poll payment status
    final status = await paymentProvider.pollPaymentStatus(
      orderId: widget.payment.orderId,
      maxAttempts: 30,
      interval: const Duration(seconds: 2),
    );

    if (!mounted) return;

    setState(() {
      _isProcessing = false;
    });

    if (status != null) {
      if (status.isSuccess) {
        // Navigate to success screen
        Navigator.pushReplacementNamed(
          context,
          '/payment-success',
          arguments: {
            'appointmentId': widget.appointmentId,
            'orderId': widget.payment.orderId,
            'amount': status.amount,
          },
        );
      } else if (status.isFailed) {
        // Navigate to failure screen
        Navigator.pushReplacementNamed(
          context,
          '/payment-failure',
          arguments: {
            'message': status.message,
            'orderId': widget.payment.orderId,
          },
        );
      }
    } else {
      // Timeout - show manual check option
      _showTimeoutDialog();
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
      ),
    );
  }

  void _showTimeoutDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Text('Không thể xác nhận thanh toán'),
        content: const Text(
          'Chúng tôi không thể xác nhận trạng thái thanh toán của bạn. '
          'Vui lòng kiểm tra lại trong lịch sử thanh toán hoặc liên hệ hỗ trợ.',
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              Navigator.of(context).pop();
              Navigator.of(context).pop();
            },
            child: const Text('Đóng'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.of(context).pop();
              await _startPaymentStatusPolling();
            },
            child: const Text('Thử lại'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: () async {
        if (_isProcessing) {
          final shouldPop = await showDialog<bool>(
            context: context,
            builder: (context) => AlertDialog(
              title: const Text('Hủy thanh toán?'),
              content: const Text(
                'Thanh toán đang được xử lý. Bạn có chắc chắn muốn hủy?',
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context, false),
                  child: const Text('Không'),
                ),
                ElevatedButton(
                  onPressed: () => Navigator.pop(context, true),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.red,
                  ),
                  child: const Text('Hủy'),
                ),
              ],
            ),
          );
          return shouldPop ?? false;
        }
        return true;
      },
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Đang xử lý thanh toán'),
          automaticallyImplyLeading: !_isProcessing,
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const LoadingIndicator(size: 60),
                const SizedBox(height: 32),
                const Text(
                  'Đang xử lý thanh toán',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                Text(
                  _isProcessing
                      ? 'Vui lòng hoàn tất thanh toán trên ứng dụng MoMo.\n'
                          'Chúng tôi đang chờ xác nhận...'
                      : 'Đang mở ứng dụng MoMo...',
                  style: const TextStyle(
                    color: Colors.grey,
                    fontSize: 14,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),
                if (!_isProcessing && _hasOpenedMomo)
                  ElevatedButton(
                    onPressed: _openMomoApp,
                    child: const Text('Mở lại MoMo'),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
