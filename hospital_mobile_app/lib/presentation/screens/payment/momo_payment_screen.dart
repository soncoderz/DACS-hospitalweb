import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'dart:async';
import '../../providers/billing_provider.dart';
import '../../../core/constants/app_constants.dart';

class MomoPaymentScreen extends StatefulWidget {
  final String appointmentId;
  final double amount;
  final String billType;
  final String? prescriptionId;

  const MomoPaymentScreen({
    Key? key,
    required this.appointmentId,
    required this.amount,
    required this.billType,
    this.prescriptionId,
  }) : super(key: key);

  @override
  State<MomoPaymentScreen> createState() => _MomoPaymentScreenState();
}

class _MomoPaymentScreenState extends State<MomoPaymentScreen> {
  bool _isProcessing = false;
  bool _hasOpenedMomo = false;
  Timer? _checkTimer;
  int _checkCount = 0;
  final int _maxChecks = 60; // Check for 5 minutes (60 * 5 seconds)

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _initiateMomoPayment();
    });
  }

  @override
  void dispose() {
    _checkTimer?.cancel();
    super.dispose();
  }

  Future<void> _initiateMomoPayment() async {
    setState(() {
      _isProcessing = true;
    });

    try {
      final provider = context.read<BillingProvider>();
      
      // Create MoMo payment
      final momoPayment = await provider.createMomoPayment(
        widget.appointmentId,
        widget.amount,
        widget.billType,
        prescriptionId: widget.prescriptionId,
      );

      if (momoPayment != null && momoPayment.payUrl != null) {
        // Open MoMo app or web
        await _openMomoPayment(momoPayment.payUrl!);
        
        setState(() {
          _hasOpenedMomo = true;
        });

        // Start checking payment status
        _startStatusCheck();
      } else {
        _showError('Không thể tạo thanh toán MoMo');
      }
    } catch (e) {
      _showError('Lỗi: ${e.toString()}');
    }
  }

  Future<void> _openMomoPayment(String payUrl) async {
    try {
      final uri = Uri.parse(payUrl);
      
      debugPrint('Opening MoMo payment URL: $payUrl');
      
      // Try to launch MoMo app first using deep link
      bool launched = false;
      
      // First try: Check if MoMo app is installed and try to open it
      final momoScheme = Uri.parse('momo://app');
      if (await canLaunchUrl(momoScheme)) {
        debugPrint('MoMo app is installed, trying to open...');
        try {
          // Try to open the payment URL in MoMo app
          launched = await launchUrl(
            uri,
            mode: LaunchMode.externalApplication,
          );
          debugPrint('Launched in MoMo app: $launched');
        } catch (e) {
          debugPrint('Failed to launch in MoMo app: $e');
        }
      } else {
        debugPrint('MoMo app is not installed');
      }
      
      // Second try: Open in external browser if MoMo app failed
      if (!launched) {
        debugPrint('Trying to open in external browser...');
        try {
          launched = await launchUrl(
            uri,
            mode: LaunchMode.externalApplication,
          );
          debugPrint('Launched in external browser: $launched');
        } catch (e) {
          debugPrint('Failed to launch in external browser: $e');
        }
      }
      
      // Third try: Platform default
      if (!launched) {
        debugPrint('Trying platform default...');
        try {
          launched = await launchUrl(
            uri,
            mode: LaunchMode.platformDefault,
          );
          debugPrint('Launched with platform default: $launched');
        } catch (e) {
          debugPrint('Failed to launch with platform default: $e');
        }
      }
      
      // Fourth try: In-app web view as last resort
      if (!launched) {
        debugPrint('Trying in-app webview...');
        try {
          launched = await launchUrl(
            uri,
            mode: LaunchMode.inAppWebView,
          );
          debugPrint('Launched in webview: $launched');
        } catch (e) {
          debugPrint('Failed to launch in webview: $e');
        }
      }
      
      if (!launched) {
        throw 'Không thể mở trang thanh toán MoMo. Vui lòng cài đặt ứng dụng MoMo hoặc kiểm tra kết nối internet.';
      }
    } catch (e) {
      debugPrint('Error opening MoMo payment: $e');
      _showError('Không thể mở MoMo: ${e.toString()}');
    }
  }

  void _startStatusCheck() {
    _checkTimer = Timer.periodic(const Duration(seconds: 5), (timer) async {
      _checkCount++;

      if (_checkCount >= _maxChecks) {
        timer.cancel();
        _showTimeoutDialog();
        return;
      }

      // Check payment status
      await _checkPaymentStatus();
    });
  }

  Future<void> _checkPaymentStatus() async {
    try {
      final provider = context.read<BillingProvider>();
      
      // Refresh bill to check payment status
      await provider.fetchBill(widget.appointmentId);
      
      final bill = provider.bill;
      if (bill == null) return;

      // Check if payment is completed based on bill type
      bool isCompleted = false;
      
      switch (widget.billType) {
        case 'consultation':
          isCompleted = bill.consultationStatus == 'paid';
          break;
        case 'medication':
          if (widget.prescriptionId != null) {
            final prescription = bill.prescriptions.firstWhere(
              (p) => p.id == widget.prescriptionId,
              orElse: () => bill.prescriptions.first,
            );
            isCompleted = prescription.status == 'paid';
          } else {
            isCompleted = bill.medicationStatus == 'paid';
          }
          break;
        case 'hospitalization':
          isCompleted = bill.hospitalizationStatus == 'paid';
          break;
      }

      if (isCompleted && mounted) {
        _checkTimer?.cancel();
        _showSuccessDialog();
      }
    } catch (e) {
      debugPrint('Error checking payment status: $e');
    }
  }

  void _showSuccessDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.check_circle, color: Colors.green, size: 32),
            SizedBox(width: 12),
            Text('Thanh toán thành công'),
          ],
        ),
        content: const Text(
          'Thanh toán MoMo của bạn đã được xử lý thành công.',
        ),
        actions: [
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop(); // Close dialog
              Navigator.of(context).pop(true); // Return to previous screen
            },
            child: const Text('Đóng'),
          ),
        ],
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
              Navigator.of(context).pop(); // Close dialog
              Navigator.of(context).pop(false); // Return to previous screen
            },
            child: const Text('Đóng'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop(); // Close dialog
              _checkCount = 0;
              _startStatusCheck(); // Retry checking
            },
            child: const Text('Kiểm tra lại'),
          ),
        ],
      ),
    );
  }

  void _showError(String message) {
    if (!mounted) return;
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
      ),
    );

    setState(() {
      _isProcessing = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Thanh toán MoMo'),
        automaticallyImplyLeading: !_isProcessing,
      ),
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(AppConstants.defaultPadding),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // MoMo Logo
                Container(
                  width: 120,
                  height: 120,
                  decoration: BoxDecoration(
                    color: Colors.pink.shade50,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.account_balance_wallet,
                    size: 60,
                    color: Colors.pink.shade700,
                  ),
                ),
                
                const SizedBox(height: 32),
                
                // Loading indicator
                if (_isProcessing)
                  const CircularProgressIndicator(),
                
                const SizedBox(height: 24),
                
                // Status text
                Text(
                  _hasOpenedMomo
                      ? 'Vui lòng hoàn tất thanh toán trên ứng dụng MoMo.\n'
                          'Chúng tôi đang chờ xác nhận...'
                      : 'Đang mở ứng dụng MoMo...',
                  style: const TextStyle(
                    fontSize: 16,
                    color: Colors.grey,
                  ),
                  textAlign: TextAlign.center,
                ),
                
                const SizedBox(height: 32),
                
                // Retry button
                if (_hasOpenedMomo)
                  OutlinedButton.icon(
                    onPressed: () async {
                      final provider = context.read<BillingProvider>();
                      final momoPayment = await provider.createMomoPayment(
                        widget.appointmentId,
                        widget.amount,
                        widget.billType,
                        prescriptionId: widget.prescriptionId,
                      );
                      
                      if (momoPayment?.payUrl != null) {
                        await _openMomoPayment(momoPayment!.payUrl!);
                      }
                    },
                    icon: const Icon(Icons.refresh),
                    label: const Text('Mở lại MoMo'),
                  ),
                
                const SizedBox(height: 16),
                
                // Cancel button
                TextButton(
                  onPressed: () {
                    _checkTimer?.cancel();
                    Navigator.of(context).pop(false);
                  },
                  child: const Text('Hủy'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
