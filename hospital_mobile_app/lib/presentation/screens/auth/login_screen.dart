import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/utils/validators.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/services/google_sign_in_service.dart';
import '../../../core/utils/toast_utils.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/common/custom_button.dart';
import '../../widgets/common/custom_text_field.dart';
import '../../../core/services/facebook_sign_in_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    final authProvider = context.read<AuthProvider>();
    final success = await authProvider.login(
      email: _emailController.text.trim(),
      password: _passwordController.text,
    );

    if (!mounted) return;

    if (success) {
      // Navigate to home
      Navigator.pushReplacementNamed(context, '/home');
      AppToast.success(AppConstants.loginSuccessMessage);
    } else {
      AppToast.error(authProvider.errorMessage ?? 'Đăng nhập thất bại');
    }
  }

  Future<void> _handleGoogleSignIn() async {
    try {
      final googleService = GoogleSignInService();
      final idToken = await googleService.signIn();

      if (idToken == null) {
        return; // User cancelled
      }

      if (!mounted) return;

      final authProvider = context.read<AuthProvider>();
      final success = await authProvider.googleSignIn(idToken);

      if (!mounted) return;

      if (success) {
        // Navigate to home
        Navigator.pushReplacementNamed(context, '/home');
        AppToast.success('Đăng nhập Google thành công');
      } else {
        AppToast.error(authProvider.errorMessage ?? 'Đăng nhập Google thất bại');
      }
    } catch (e) {
      if (!mounted) return;
      AppToast.error('Lỗi: ${e.toString()}');
    }
  }
  Future<void> _handleFacebookSignIn() async {
    try {
      final facebookService = FacebookSignInService();
      final result = await facebookService.signIn();

      if (result == null) {
        return; // User cancelled
      }

      if (!mounted) return;

      final authProvider = context.read<AuthProvider>();
      final success = await authProvider.facebookSignIn(
        accessToken: result['accessToken']!,
        userID: result['userID']!,
      );

      if (!mounted) return;

      if (success) {
        Navigator.pushReplacementNamed(context, '/home');
        AppToast.success('Đăng nhập Facebook thành công');
      } else {
        AppToast.error(authProvider.errorMessage ?? 'Đăng nhập Facebook thất bại');
      }
    } catch (e) {
      if (!mounted) return;
      AppToast.error('Lỗi: ${e.toString()}');
    }
  }
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppConstants.defaultPadding),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 40),
                // Logo or App Name
                const Icon(
                  Icons.local_hospital,
                  size: 80,
                  color: Colors.blue,
                ),
                const SizedBox(height: 16),
                const Text(
                  'Đăng Nhập',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Chào mừng bạn trở lại!',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.grey,
                  ),
                ),
                const SizedBox(height: 40),

                // Email field
                CustomTextField(
                  label: 'Email',
                  hint: 'Nhập email của bạn',
                  controller: _emailController,
                  validator: Validators.validateEmail,
                  keyboardType: TextInputType.emailAddress,
                  prefixIcon: const Icon(Icons.email_outlined),
                ),
                const SizedBox(height: 20),

                // Password field
                CustomTextField(
                  label: 'Mật khẩu',
                  hint: 'Nhập mật khẩu',
                  controller: _passwordController,
                  validator: Validators.validatePassword,
                  obscureText: true,
                  prefixIcon: const Icon(Icons.lock_outline),
                ),
                const SizedBox(height: 12),

                // Forgot password link
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: () {
                      // Navigate to forgot password screen
                      Navigator.pushNamed(context, '/forgot-password');
                    },
                    child: const Text('Quên mật khẩu?'),
                  ),
                ),
                const SizedBox(height: 24),

                // Login button
                Consumer<AuthProvider>(
                  builder: (context, authProvider, child) {
                    return CustomButton(
                      text: 'Đăng Nhập',
                      onPressed: _handleLogin,
                      isLoading: authProvider.isLoading,
                    );
                  },
                ),
                const SizedBox(height: 24),

                // Divider
                Row(
                  children: [
                    const Expanded(child: Divider()),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Text(
                        'Hoặc',
                        style: TextStyle(color: Colors.grey.shade600),
                      ),
                    ),
                    const Expanded(child: Divider()),
                  ],
                ),
                const SizedBox(height: 24),

                // Google Sign In button
                OutlinedButton.icon(
                  onPressed: _handleGoogleSignIn,
                  icon: Image.asset(
                    'assets/images/google_logo.png',
                    height: 24,
                    errorBuilder: (context, error, stackTrace) {
                      return const Icon(Icons.g_mobiledata, size: 24);
                    },
                  ),
                  label: const Text('Đăng nhập với Google'),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(
                        AppConstants.borderRadius,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 12),

                // Facebook Sign In button
                OutlinedButton.icon(
                  onPressed: _handleFacebookSignIn,
                  icon: const Icon(Icons.facebook, size: 24, color: Color(0xFF1877F2)),
                  label: const Text('Đăng nhập với Facebook'),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(
                        AppConstants.borderRadius,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 24),

                // Register link
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text('Chưa có tài khoản? '),
                    TextButton(
                      onPressed: () {
                        // Navigate to register screen
                        Navigator.pushNamed(context, '/register');
                      },
                      child: const Text(
                        'Đăng ký ngay',
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