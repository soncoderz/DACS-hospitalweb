import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/utils/validators.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/utils/toast_utils.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/common/custom_button.dart';
import '../../widgets/common/custom_text_field.dart';

class OtpVerificationScreen extends StatefulWidget {
  final String email;

  const OtpVerificationScreen({
    super.key,
    required this.email,
  });

  @override
  State<OtpVerificationScreen> createState() => _OtpVerificationScreenState();
}

class _OtpVerificationScreenState extends State<OtpVerificationScreen> {
  final _formKey = GlobalKey<FormState>();
  final _otpController = TextEditingController();

  @override
  void dispose() {
    _otpController.dispose();
    super.dispose();
  }

  Future<void> _handleVerifyOtp() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    final authProvider = context.read<AuthProvider>();
    final success = await authProvider.verifyOtp(
      email: widget.email,
      otp: _otpController.text.trim(),
    );

    if (!mounted) return;

    if (success) {
      AppToast.success('Xác thực OTP thành công');
      // Navigate to reset password screen
      Navigator.pushReplacementNamed(
        context,
        '/reset-password',
        arguments: {
          'email': widget.email,
          'otp': _otpController.text.trim(),
        },
      );
    } else {
      AppToast.error(authProvider.errorMessage ?? 'Xác thực OTP thất bại');
    }
  }

  Future<void> _handleResendOtp() async {
    final authProvider = context.read<AuthProvider>();
    final success = await authProvider.forgotPassword(widget.email);

    if (!mounted) return;

    if (success) {
      AppToast.success('Mã OTP mới đã được gửi');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Xác Thực OTP'),
        centerTitle: true,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppConstants.defaultPadding),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 40),
                const Icon(
                  Icons.verified_user,
                  size: 80,
                  color: Colors.blue,
                ),
                const SizedBox(height: 24),
                const Text(
                  'Nhập mã OTP',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  'Mã OTP đã được gửi đến\n${widget.email}',
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 14,
                    color: Colors.grey,
                  ),
                ),
                const SizedBox(height: 40),

                // OTP field
                CustomTextField(
                  label: 'Mã OTP',
                  hint: 'Nhập mã 6 chữ số',
                  controller: _otpController,
                  validator: Validators.validateOtp,
                  keyboardType: TextInputType.number,
                  prefixIcon: const Icon(Icons.pin_outlined),
                ),
                const SizedBox(height: 32),

                // Verify button
                Consumer<AuthProvider>(
                  builder: (context, authProvider, child) {
                    return CustomButton(
                      text: 'Xác Thực',
                      onPressed: _handleVerifyOtp,
                      isLoading: authProvider.isLoading,
                    );
                  },
                ),
                const SizedBox(height: 24),

                // Resend OTP link
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text('Không nhận được mã? '),
                    TextButton(
                      onPressed: _handleResendOtp,
                      child: const Text(
                        'Gửi lại',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
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
}
