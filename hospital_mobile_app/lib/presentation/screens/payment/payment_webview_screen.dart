import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

class PaymentWebViewScreen extends StatefulWidget {
  final String paymentUrl;
  final String? orderId;

  const PaymentWebViewScreen({
    super.key,
    required this.paymentUrl,
    this.orderId,
  });

  @override
  State<PaymentWebViewScreen> createState() => _PaymentWebViewScreenState();
}

class _PaymentWebViewScreenState extends State<PaymentWebViewScreen> {
  late final WebViewController _controller;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _initializeWebView();
  }

  void _initializeWebView() {
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (url) {
            setState(() {
              _isLoading = true;
            });
            _checkPaymentResult(url);
          },
          onPageFinished: (url) {
            setState(() {
              _isLoading = false;
            });
          },
          onNavigationRequest: (request) {
            final url = request.url;
            if (_isMomoDeepLink(url)) {
              _openMomoDeepLink(url);
              return NavigationDecision.prevent;
            }
            _checkPaymentResult(url);
            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.paymentUrl));
  }

  bool _isMomoDeepLink(String url) {
    return url.startsWith('momo://') ||
        url.contains('applinks.momo.vn') ||
        url.contains('test-applinks.momo.vn') ||
        url.contains('action=payWithApp');
  }

  Future<void> _openMomoDeepLink(String url) async {
    try {
      String launchUrl = url;
      
      if (url.contains('test-applinks.momo.vn') || url.contains('applinks.momo.vn')) {
        final uri = Uri.parse(url);
        if (uri.query.isNotEmpty) {
          launchUrl = 'momo://app?${uri.query}';
        }
      }

      final targetUri = Uri.parse(launchUrl);
      if (await canLaunchUrl(targetUri)) {
        await launchUrl(targetUri, mode: LaunchMode.externalApplication);
      }
    } catch (_) {
      // Ignore deep link errors and let WebView continue
    }
  }

  void _checkPaymentResult(String url) {
    // Check if URL contains payment result
    if (url.contains('/payment/momo/result') || url.contains('resultCode')) {
      final uri = Uri.parse(url);
      final resultCode = uri.queryParameters['resultCode'];
      
      if (resultCode == '0') {
        // Payment success
        Navigator.pushReplacementNamed(
          context,
          '/payment-result',
          arguments: {
            'success': true,
            'orderId': widget.orderId,
            'method': 'momo',
          },
        );
      } else {
        // Payment failed
        Navigator.pushReplacementNamed(
          context,
          '/payment-result',
          arguments: {
            'success': false,
            'orderId': widget.orderId,
            'method': 'momo',
          },
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Thanh Toán MoMo'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () {
            showDialog(
              context: context,
              builder: (context) => AlertDialog(
                title: const Text('Hủy thanh toán?'),
                content: const Text('Bạn có chắc muốn hủy giao dịch?'),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text('Tiếp tục thanh toán'),
                  ),
                  ElevatedButton(
                    onPressed: () {
                      Navigator.pop(context);
                      Navigator.pop(context);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.red,
                    ),
                    child: const Text('Hủy'),
                  ),
                ],
              ),
            );
          },
        ),
      ),
      body: Stack(
        children: [
          WebViewWidget(controller: _controller),
          if (_isLoading)
            const Center(
              child: CircularProgressIndicator(),
            ),
        ],
      ),
    );
  }
}
