import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'dart:async';
import '../../providers/billing_provider.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/services/deep_link_service.dart';
import '../../../data/models/momo_payment_model.dart';

/// MoMo Payment Screen - Handles MoMo payment flow
/// Uses WebView to display payment page and intercepts deep links to open MoMo app
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
  bool _isLoading = true;
  bool _isCreatingPayment = true;
  String? _paymentUrl;
  String? _errorMessage;
  late WebViewController _webViewController;
  Timer? _checkTimer;
  int _checkCount = 0;
  final int _maxChecks = 60; // Check for 5 minutes (60 * 5 seconds)

  @override
  void initState() {
    super.initState();
    _registerDeepLinkCallback();
    _createPayment();
  }

  @override
  void dispose() {
    _checkTimer?.cancel();
    DeepLinkService().unregisterPaymentCallback();
    super.dispose();
  }
  
  /// Register callback for deep link payment result
  void _registerDeepLinkCallback() {
    DeepLinkService().registerPaymentCallback((orderId, resultCode, message) {
      debugPrint('🎉 MoMo callback received via deep link!');
      debugPrint('Order ID: $orderId, Result Code: $resultCode');
      
      _checkTimer?.cancel();
      
      if (resultCode == '0') {
        // Payment successful!
        _handlePaymentSuccess();
      } else {
        // Payment failed
        _showFailureDialog(resultCode, message);
      }
    });
  }
  
  /// Handle payment success - refresh bill and show success dialog
  void _handlePaymentSuccess() async {
    try {
      // Refresh bill status from server
      final provider = context.read<BillingProvider>();
      await provider.fetchBill(widget.appointmentId);
    } catch (e) {
      debugPrint('Error refreshing bill: $e');
    }
    
    if (mounted) {
      _showSuccessDialog();
    }
  }

  /// Create MoMo payment and get payment URL
  Future<void> _createPayment() async {
    try {
      final provider = context.read<BillingProvider>();
      
      final momoPayment = await provider.createMomoPayment(
        widget.appointmentId,
        widget.amount,
        widget.billType,
        prescriptionId: widget.prescriptionId,
      );

      if (momoPayment == null) {
        setState(() {
          _isCreatingPayment = false;
          _errorMessage = 'Không thể tạo thanh toán MoMo';
        });
        return;
      }

      final payment = momoPayment as MomoPaymentModel;
      
      // Priority: deeplink > payUrl
      String urlToOpen = payment.deeplink.isNotEmpty 
          ? payment.deeplink 
          : payment.payUrl;

      if (urlToOpen.isEmpty) {
        setState(() {
          _isCreatingPayment = false;
          _errorMessage = 'Không nhận được URL thanh toán từ MoMo';
        });
        return;
      }

      debugPrint('MoMo payment created: orderId=${payment.orderId}');
      debugPrint('MoMo deeplink: ${payment.deeplink}');
      debugPrint('MoMo payUrl: ${payment.payUrl}');

      // Try to open deeplink directly if available
      if (payment.deeplink.isNotEmpty) {
        final launched = await _tryLaunchDeeplink(payment.deeplink);
        if (launched) {
          // Start checking payment status
          _startStatusCheck();
          setState(() {
            _isCreatingPayment = false;
            _paymentUrl = payment.payUrl; // Keep for retry
          });
          return;
        }
      }

      // Fallback: Load payUrl in WebView
      setState(() {
        _isCreatingPayment = false;
        _paymentUrl = payment.payUrl;
      });
      _initWebView(payment.payUrl);
      _startStatusCheck();

    } catch (e) {
      debugPrint('Error creating MoMo payment: $e');
      setState(() {
        _isCreatingPayment = false;
        _errorMessage = 'Lỗi: ${e.toString()}';
      });
    }
  }

  /// Try to launch deeplink directly
  Future<bool> _tryLaunchDeeplink(String deeplink) async {
    try {
      final uri = Uri.parse(deeplink);
      debugPrint('Trying to launch deeplink: $deeplink');
      
      if (await canLaunchUrl(uri)) {
        final launched = await launchUrl(
          uri,
          mode: LaunchMode.externalApplication,
        );
        debugPrint('Deeplink launch result: $launched');
        return launched;
      }
      debugPrint('Cannot launch deeplink');
      return false;
    } catch (e) {
      debugPrint('Error launching deeplink: $e');
      return false;
    }
  }

  /// Initialize WebView with payment URL
  void _initWebView(String url) {
    _webViewController = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(Colors.white)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (url) {
            setState(() => _isLoading = true);
            debugPrint('WebView page started: $url');
          },
          onPageFinished: (url) async {
            setState(() => _isLoading = false);
            debugPrint('WebView page finished: $url');
            
            // Check if MoMo payment completed successfully by injecting JS
            await _checkMomoSuccessPage();
          },
          onNavigationRequest: (request) {
            debugPrint('WebView navigation request: ${request.url}');
            return _handleNavigation(request.url);
          },
          onWebResourceError: (error) {
            debugPrint('WebView error: ${error.description}');
          },
        ),
      )
      ..loadRequest(Uri.parse(url));
  }
  
  /// Check if MoMo page shows success message using JavaScript
  Future<void> _checkMomoSuccessPage() async {
    try {
      // Inject JavaScript to check for success indicators on the page
      final result = await _webViewController.runJavaScriptReturningResult('''
        (function() {
          var body = document.body ? document.body.innerText : '';
          var hasSuccess = body.includes('Thành công') || 
                          body.includes('thành công') || 
                          body.includes('Success') ||
                          body.includes('Thanh toán thành công');
          return hasSuccess ? 'success' : 'pending';
        })();
      ''');
      
      debugPrint('MoMo page check result: $result');
      
      if (result.toString().contains('success')) {
        debugPrint('🎉 MoMo payment success detected on page!');
        // Wait a moment for user to see the success message
        await Future.delayed(const Duration(seconds: 2));
        
        if (mounted) {
          _checkTimer?.cancel();
          _handlePaymentSuccess();
        }
      }
    } catch (e) {
      debugPrint('Error checking MoMo success page: $e');
    }
  }

  /// Handle navigation requests - intercept deep links and result URLs
  NavigationDecision _handleNavigation(String url) {
    // ⭐ Intercept hospitalapp:// deep link from server redirect
    if (url.startsWith('hospitalapp://')) {
      debugPrint('🎉 Intercepted app deep link: $url');
      _handlePaymentResult(url);
      return NavigationDecision.prevent;
    }
    
    // ⭐ QUAN TRỌNG: Bắt URL callback từ MoMo (localhost:3000/payment/result)
    // Điện thoại không thể truy cập localhost, nên ta xử lý kết quả ở đây
    if (url.contains('localhost') && url.contains('payment/result')) {
      debugPrint('🎉 Intercepted MoMo callback URL: $url');
      _handlePaymentResult(url);
      return NavigationDecision.prevent;
    }
    
    // Intercept server mobile redirect endpoint
    if (url.contains('/momo/result/mobile') && url.contains('resultCode')) {
      debugPrint('🎉 Intercepted mobile redirect URL: $url');
      _handlePaymentResult(url);
      return NavigationDecision.prevent;
    }

    // Check if it's a MoMo/ZaloPay deep link
    if (url.startsWith('momo://') || url.startsWith('zalopay://')) {
      _handleDeepLink(url);
      return NavigationDecision.prevent;
    }

    // Check if it's MoMo applinks (web-to-app redirect)
    if (url.contains('applinks.momo') || 
        url.contains('test-applinks.momo') ||
        url.contains('action=payWithApp')) {
      _handleMomoAppLink(url);
      return NavigationDecision.prevent;
    }

    // Check for other payment result patterns
    if (url.contains('resultCode')) {
      _handlePaymentResult(url);
      return NavigationDecision.prevent;
    }

    return NavigationDecision.navigate;
  }

  /// Handle payment result from callback URL
  void _handlePaymentResult(String url) {
    try {
      final uri = Uri.parse(url);
      final resultCode = uri.queryParameters['resultCode'];
      final orderId = uri.queryParameters['orderId'];
      final message = uri.queryParameters['message'];
      
      debugPrint('Payment result: resultCode=$resultCode, orderId=$orderId, message=$message');
      
      _checkTimer?.cancel();
      
      if (resultCode == '0') {
        // Thanh toán thành công!
        _showSuccessDialog();
      } else {
        // Thanh toán thất bại
        _showFailureDialog(resultCode ?? 'unknown', message);
      }
    } catch (e) {
      debugPrint('Error parsing payment result: $e');
    }
  }

  /// Handle MoMo/ZaloPay deep link
  Future<void> _handleDeepLink(String url) async {
    try {
      debugPrint('Handling deep link: $url');
      
      // Extract clean deep link (remove any trailing http/https URLs)
      String cleanUrl = url;
      int httpIndex = url.indexOf('http://', 'momo://'.length);
      int httpsIndex = url.indexOf('https://', 'momo://'.length);
      
      if (httpIndex != -1 && (httpsIndex == -1 || httpIndex < httpsIndex)) {
        cleanUrl = url.substring(0, httpIndex);
      } else if (httpsIndex != -1 && (httpIndex == -1 || httpsIndex < httpIndex)) {
        cleanUrl = url.substring(0, httpsIndex);
      }
      
      debugPrint('Clean deep link: $cleanUrl');
      
      final uri = Uri.parse(cleanUrl);
      
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
        
        // Show message
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Đang chuyển sang ứng dụng MoMo để thanh toán...'),
              duration: Duration(seconds: 3),
            ),
          );
        }
      } else {
        debugPrint('Cannot launch deep link, app may not be installed');
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Vui lòng cài đặt ứng dụng MoMo để thanh toán'),
              backgroundColor: Colors.orange,
              duration: Duration(seconds: 5),
            ),
          );
        }
      }
    } catch (e) {
      debugPrint('Error handling deep link: $e');
    }
  }

  /// Handle MoMo applinks (web-to-app redirect)
  Future<void> _handleMomoAppLink(String url) async {
    try {
      debugPrint('Handling MoMo applink: $url');
      
      // Try to convert to momo:// scheme
      final uri = Uri.parse(url);
      final momoDeeplink = 'momo://app?${uri.query}';
      
      debugPrint('Converted to: $momoDeeplink');
      
      final momoUri = Uri.parse(momoDeeplink);
      
      if (await canLaunchUrl(momoUri)) {
        await launchUrl(momoUri, mode: LaunchMode.externalApplication);
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Đang chuyển sang ứng dụng MoMo để thanh toán...'),
              duration: Duration(seconds: 3),
            ),
          );
        }
      } else {
        // Try original URL
        final originalUri = Uri.parse(url);
        if (await canLaunchUrl(originalUri)) {
          await launchUrl(originalUri, mode: LaunchMode.externalApplication);
        } else {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Vui lòng cài đặt ứng dụng MoMo để thanh toán'),
                backgroundColor: Colors.orange,
                duration: Duration(seconds: 5),
              ),
            );
          }
        }
      }
    } catch (e) {
      debugPrint('Error handling MoMo applink: $e');
    }
  }

  /// Start periodic status check
  void _startStatusCheck() {
    _checkTimer = Timer.periodic(const Duration(seconds: 5), (timer) async {
      _checkCount++;
      
      if (_checkCount >= _maxChecks) {
        timer.cancel();
        _showTimeoutDialog();
        return;
      }

      await _checkBillStatus();
    });
  }

  /// Check bill payment status from server
  Future<void> _checkBillStatus() async {
    try {
      final provider = context.read<BillingProvider>();
      await provider.fetchBill(widget.appointmentId);
      
      final bill = provider.bill;
      if (bill == null) return;

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
      debugPrint('Error checking bill status: $e');
    }
  }

  void _showSuccessDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.check_circle, color: Colors.green, size: 32),
            SizedBox(width: 12),
            Expanded(
              child: Text('Thanh toán thành công'),
            ),
          ],
        ),
        content: const Text('Thanh toán MoMo của bạn đã được xử lý thành công.'),
        actions: [
          ElevatedButton.icon(
            onPressed: () {
              Navigator.of(ctx).pop(); // Close dialog
              // Pop MoMo payment screen and navigate to appointment detail
              Navigator.of(context).pop(true); // Return success to caller
              
              // Navigate to appointment detail screen
              Navigator.of(context).pushReplacementNamed(
                '/appointment-detail',
                arguments: widget.appointmentId,
              );
            },
            icon: const Icon(Icons.visibility, color: Colors.white),
            label: const Text('Xem chi tiết cuộc hẹn', style: TextStyle(color: Colors.white)),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green,
            ),
          ),
        ],
      ),
    );
  }

  void _showFailureDialog(String resultCode, String? message) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.error, color: Colors.red, size: 32),
            SizedBox(width: 12),
            Expanded(
              child: Text('Thanh toán thất bại'),
            ),
          ],
        ),
        content: Text('Mã lỗi: $resultCode\n${message ?? 'Vui lòng thử lại.'}'),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              Navigator.of(context).pop(false);
            },
            child: const Text('Đóng'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop();
              setState(() {
                _isCreatingPayment = true;
                _errorMessage = null;
              });
              _createPayment();
            },
            child: const Text('Thử lại'),
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
          'Chúng tôi không thể xác nhận trạng thái thanh toán. '
          'Vui lòng kiểm tra trong lịch sử thanh toán.',
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              Navigator.of(context).pop(false);
            },
            child: const Text('Đóng'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop();
              _checkCount = 0;
              _startStatusCheck();
            },
            child: const Text('Kiểm tra lại'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Thanh toán MoMo'),
        backgroundColor: const Color(0xFFAE2070),
        foregroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => _showCancelDialog(),
        ),
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    // Creating payment
    if (_isCreatingPayment) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(color: Color(0xFFAE2070)),
            SizedBox(height: 16),
            Text('Đang tạo thanh toán MoMo...'),
          ],
        ),
      );
    }

    // Error state
    if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 64, color: Colors.red),
              const SizedBox(height: 16),
              Text(
                _errorMessage!,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 16),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () {
                  setState(() {
                    _isCreatingPayment = true;
                    _errorMessage = null;
                  });
                  _createPayment();
                },
                child: const Text('Thử lại'),
              ),
              const SizedBox(height: 12),
              TextButton(
                onPressed: () => Navigator.pop(context, false),
                child: const Text('Hủy'),
              ),
            ],
          ),
        ),
      );
    }

    // WebView with payment page
    if (_paymentUrl != null) {
      return Stack(
        children: [
          WebViewWidget(controller: _webViewController),
          if (_isLoading)
            const Center(
              child: CircularProgressIndicator(color: Color(0xFFAE2070)),
            ),
        ],
      );
    }

    // Waiting state (after deep link launched)
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                color: const Color(0xFFAE2070).withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.account_balance_wallet,
                size: 50,
                color: Color(0xFFAE2070),
              ),
            ),
            const SizedBox(height: 24),
            const CircularProgressIndicator(color: Color(0xFFAE2070)),
            const SizedBox(height: 24),
            const Text(
              'Vui lòng hoàn tất thanh toán\ntrên ứng dụng MoMo',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 16),
            ),
            const SizedBox(height: 8),
            Text(
              'Đang chờ xác nhận...',
              style: TextStyle(color: Colors.grey.shade600),
            ),
            const SizedBox(height: 32),
            OutlinedButton.icon(
              onPressed: () {
                if (_paymentUrl != null) {
                  _initWebView(_paymentUrl!);
                  setState(() {});
                }
              },
              icon: const Icon(Icons.refresh),
              label: const Text('Mở lại trang thanh toán'),
            ),
          ],
        ),
      ),
    );
  }

  void _showCancelDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Hủy thanh toán?'),
        content: const Text('Bạn có chắc muốn hủy giao dịch này?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Tiếp tục thanh toán'),
          ),
          ElevatedButton(
            onPressed: () {
              _checkTimer?.cancel();
              Navigator.pop(context);
              Navigator.pop(context, false);
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Hủy', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}
