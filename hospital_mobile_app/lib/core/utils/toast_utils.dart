import 'package:bot_toast/bot_toast.dart';
import 'package:flutter/material.dart';

/// Simple wrapper around BotToast to keep a consistent style across the app.
class AppToast {
  static void success(String message) {
    BotToast.showText(
      text: message,
      contentColor: Colors.green.shade600,
      textStyle: const TextStyle(color: Colors.white),
      duration: const Duration(seconds: 2),
    );
  }

  static void error(String message) {
    BotToast.showText(
      text: message,
      contentColor: Colors.red.shade600,
      textStyle: const TextStyle(color: Colors.white),
      duration: const Duration(seconds: 3),
    );
  }

  static void info(String message) {
    BotToast.showText(
      text: message,
      contentColor: Colors.blueGrey.shade700,
      textStyle: const TextStyle(color: Colors.white),
      duration: const Duration(seconds: 2),
    );
  }

  static CancelFunc loading({String message = 'Đang xử lý...'}) {
    return BotToast.showCustomLoading(
      toastBuilder: (_) => _LoadingToast(message: message),
      allowClick: false,
      backButtonBehavior: BackButtonBehavior.ignore,
    );
  }

  static void dismissAll() {
    BotToast.cleanAll();
  }
}

class _LoadingToast extends StatelessWidget {
  final String message;

  const _LoadingToast({required this.message});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.8),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(
            width: 20,
            height: 20,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
            ),
          ),
          const SizedBox(width: 12),
          Text(
            message,
            style: const TextStyle(color: Colors.white),
          ),
        ],
      ),
    );
  }
}


