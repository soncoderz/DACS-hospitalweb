import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'dart:io';
import '../../providers/auth_provider.dart';
import '../../providers/doctor_provider.dart';
import '../../../domain/entities/user.dart';
import '../../../domain/entities/doctor.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/utils/toast_utils.dart';

/// Profile Screen with tabs for Personal Info, Favorite Doctors, and Security
class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isEditing = false;
  bool _isLoading = false;

  // Form controllers
  final _fullNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  DateTime? _selectedDate;
  String? _selectedGender;

  // Password controllers
  final _currentPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _currentPasswordVisible = false;
  bool _newPasswordVisible = false;
  bool _confirmPasswordVisible = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadUserData();
    _tabController.addListener(() {
      if (_tabController.index == 1) {
        // Load favorite doctors when tab is selected
        _loadFavoriteDoctors();
      }
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _fullNameController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  void _loadUserData() {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final user = authProvider.user;
    
    if (user != null) {
      _fullNameController.text = user.fullName ?? '';
      _phoneController.text = user.phoneNumber ?? '';
      _addressController.text = user.address ?? '';
      _selectedGender = user.gender;
      if (user.dateOfBirth != null) {
        _selectedDate = DateTime.parse(user.dateOfBirth!);
      }
    }
  }

  void _loadFavoriteDoctors() {
    final doctorProvider = Provider.of<DoctorProvider>(context, listen: false);
    doctorProvider.fetchFavoriteDoctors();
  }

  Future<void> _handleUpdateProfile() async {
    setState(() => _isLoading = true);

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      
      final success = await authProvider.updateProfile(
        fullName: _fullNameController.text,
        phoneNumber: _phoneController.text,
        address: _addressController.text,
        gender: _selectedGender,
        dateOfBirth: _selectedDate?.toIso8601String(),
      );

      if (success && mounted) {
        AppToast.success('Cập nhật thông tin thành công');
        setState(() => _isEditing = false);
      } else if (mounted) {
        AppToast.error(authProvider.errorMessage ?? 'Cập nhật thất bại');
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _handleChangePassword() async {
    // Validate inputs
    if (_currentPasswordController.text.isEmpty) {
      _showError('Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    if (_newPasswordController.text.isEmpty) {
      _showError('Vui lòng nhập mật khẩu mới');
      return;
    }
    if (_newPasswordController.text.length < 6) {
      _showError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (_newPasswordController.text != _confirmPasswordController.text) {
      _showError('Mật khẩu xác nhận không khớp');
      return;
    }

    setState(() => _isLoading = true);

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      
      final success = await authProvider.changePassword(
        currentPassword: _currentPasswordController.text,
        newPassword: _newPasswordController.text,
      );

      if (success && mounted) {
        AppToast.success('Đổi mật khẩu thành công. Vui lòng đăng nhập lại.');
        
        // Clear password fields
        _currentPasswordController.clear();
        _newPasswordController.clear();
        _confirmPasswordController.clear();

        // Logout after 2 seconds
        await Future.delayed(const Duration(seconds: 2));
        if (mounted) {
          await authProvider.logout();
          Navigator.pushNamedAndRemoveUntil(context, '/login', (route) => false);
        }
      } else if (mounted) {
        _showError(authProvider.errorMessage ?? 'Đổi mật khẩu thất bại');
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _handleAvatarUpload() async {
    final ImagePicker picker = ImagePicker();
    
    try {
      final XFile? image = await picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 800,
        maxHeight: 800,
        imageQuality: 85,
      );

      if (image == null) return;

      setState(() => _isLoading = true);

      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final success = await authProvider.uploadAvatar(File(image.path));

      if (success && mounted) {
        AppToast.success('Cập nhật ảnh đại diện thành công');
      } else if (mounted) {
        _showError(authProvider.errorMessage ?? 'Tải ảnh lên thất bại');
      }
    } catch (e) {
      _showError('Lỗi khi tải ảnh lên: $e');
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _showError(String message) {
    if (mounted) {
      AppToast.error(message);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Hồ sơ'),
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(icon: Icon(Icons.person), text: 'Thông tin'),
            Tab(icon: Icon(Icons.favorite), text: 'Yêu thích'),
            Tab(icon: Icon(Icons.security), text: 'Bảo mật'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildPersonalInfoTab(),
          _buildFavoriteDoctorsTab(),
          _buildSecurityTab(),
        ],
      ),
    );
  }

  Widget _buildPersonalInfoTab() {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        final user = authProvider.user;
        
        if (user == null) {
          return const Center(child: Text('Không tìm thấy thông tin người dùng'));
        }

        return SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              // Avatar section
              _buildAvatarSection(user),
              const SizedBox(height: 24),
              
              // User info or edit form
              if (_isEditing) _buildEditForm() else _buildUserInfo(user),
              
              const SizedBox(height: 24),
              
              // Edit/Save buttons
              if (_isEditing)
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: _isLoading ? null : () {
                          setState(() {
                            _isEditing = false;
                            _loadUserData();
                          });
                        },
                        child: const Text('Hủy'),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _handleUpdateProfile,
                        child: _isLoading
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : const Text('Lưu thay đổi'),
                      ),
                    ),
                  ],
                )
              else
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () => setState(() => _isEditing = true),
                    icon: const Icon(Icons.edit),
                    label: const Text('Chỉnh sửa'),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildAvatarSection(User user) {
    return Column(
      children: [
        Stack(
          children: [
            _buildAvatar(
              user.avatarUrl,
              size: 120,
              fallbackText: _getUserInitial(user.fullName),
              fallbackUrl: AppConstants.defaultAvatarUrl,
            ),
            Positioned(
              bottom: 0,
              right: 0,
              child: Container(
                decoration: BoxDecoration(
                  color: Theme.of(context).primaryColor,
                  shape: BoxShape.circle,
                ),
                child: IconButton(
                  icon: const Icon(Icons.camera_alt, color: Colors.white, size: 20),
                  onPressed: _handleAvatarUpload,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Text(
          user.fullName ?? 'Người dùng',
          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 4),
        Text(
          user.email ?? '',
          style: TextStyle(fontSize: 14, color: Colors.grey[600]),
        ),
      ],
    );
  }

  Widget _buildUserInfo(User user) {
    return Column(
      children: [
        _buildInfoCard('Họ và tên', user.fullName ?? 'Chưa cập nhật'),
        _buildInfoCard('Email', user.email ?? 'Chưa cập nhật'),
        _buildInfoCard('Số điện thoại', user.phoneNumber ?? 'Chưa cập nhật'),
        _buildInfoCard('Ngày sinh', user.dateOfBirth != null 
            ? _formatDate(DateTime.parse(user.dateOfBirth!)) 
            : 'Chưa cập nhật'),
        _buildInfoCard('Giới tính', _getGenderLabel(user.gender)),
        _buildInfoCard('Địa chỉ', user.address ?? 'Chưa cập nhật'),
      ],
    );
  }

  Widget _buildInfoCard(String label, String value) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              width: 100,
              child: Text(
                label,
                style: TextStyle(
                  color: Colors.grey[600],
                  fontSize: 14,
                ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Text(
                value,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEditForm() {
    return Column(
      children: [
        TextFormField(
          controller: _fullNameController,
          decoration: const InputDecoration(
            labelText: 'Họ và tên',
            border: OutlineInputBorder(),
          ),
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: _phoneController,
          decoration: const InputDecoration(
            labelText: 'Số điện thoại',
            border: OutlineInputBorder(),
          ),
          keyboardType: TextInputType.phone,
        ),
        const SizedBox(height: 16),
        InkWell(
          onTap: () async {
            final date = await showDatePicker(
              context: context,
              initialDate: _selectedDate ?? DateTime.now(),
              firstDate: DateTime(1900),
              lastDate: DateTime.now(),
            );
            if (date != null) {
              setState(() => _selectedDate = date);
            }
          },
          child: InputDecorator(
            decoration: const InputDecoration(
              labelText: 'Ngày sinh',
              border: OutlineInputBorder(),
            ),
            child: Text(
              _selectedDate != null ? _formatDate(_selectedDate!) : 'Chọn ngày sinh',
            ),
          ),
        ),
        const SizedBox(height: 16),
        DropdownButtonFormField<String>(
          value: _selectedGender,
          decoration: const InputDecoration(
            labelText: 'Giới tính',
            border: OutlineInputBorder(),
          ),
          items: const [
            DropdownMenuItem(value: 'male', child: Text('Nam')),
            DropdownMenuItem(value: 'female', child: Text('Nữ')),
            DropdownMenuItem(value: 'other', child: Text('Khác')),
          ],
          onChanged: (value) => setState(() => _selectedGender = value),
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: _addressController,
          decoration: const InputDecoration(
            labelText: 'Địa chỉ',
            border: OutlineInputBorder(),
          ),
          maxLines: 3,
        ),
      ],
    );
  }

  Widget _buildFavoriteDoctorsTab() {
    return Consumer<DoctorProvider>(
      builder: (context, doctorProvider, child) {
        if (doctorProvider.isLoading) {
          return const Center(child: CircularProgressIndicator());
        }

        if (doctorProvider.errorMessage != null) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(doctorProvider.errorMessage!),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: _loadFavoriteDoctors,
                  child: const Text('Thử lại'),
                ),
              ],
            ),
          );
        }

        final favoriteDoctors = doctorProvider.favoriteDoctors;

        if (favoriteDoctors.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.favorite_border, size: 80, color: Colors.grey[400]),
                const SizedBox(height: 16),
                const Text(
                  'Bạn chưa có bác sĩ yêu thích nào',
                  style: TextStyle(fontSize: 16, color: Colors.grey),
                ),
                const SizedBox(height: 16),
                ElevatedButton.icon(
                  onPressed: () {
                    Navigator.pushNamed(context, '/doctors');
                  },
                  icon: const Icon(Icons.search),
                  label: const Text('Tìm kiếm bác sĩ'),
                ),
              ],
            ),
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: favoriteDoctors.length,
          itemBuilder: (context, index) {
            final doctor = favoriteDoctors[index];
            return _buildDoctorCard(doctor);
          },
        );
      },
    );
  }

  Widget _buildDoctorCard(Doctor doctor) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: InkWell(
        onTap: () {
          Navigator.pushNamed(context, '/doctor-detail', arguments: doctor.id);
        },
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              _buildAvatar(
                doctor.avatar,
                size: 60,
                fallbackUrl: AppConstants.defaultDoctorAvatarUrl,
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'BS. ${doctor.fullName}',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      doctor.specialtyName,
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[600],
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.star, size: 16, color: Colors.amber),
                        const SizedBox(width: 4),
                        Text(
                      doctor.rating.toStringAsFixed(1),
                          style: const TextStyle(fontSize: 14),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.favorite, color: Colors.red),
                onPressed: () async {
                  final shouldRemove = await showDialog<bool>(
                    context: context,
                    builder: (context) => AlertDialog(
                      title: const Text('Xóa khỏi yêu thích'),
                      content: const Text('Bạn có chắc muốn xóa bác sĩ này khỏi danh sách yêu thích?'),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.pop(context, false),
                          child: const Text('Hủy'),
                        ),
                        ElevatedButton(
                          onPressed: () => Navigator.pop(context, true),
                          style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                          child: const Text('Xóa'),
                        ),
                      ],
                    ),
                  );

                  if (shouldRemove == true && mounted) {
                    final doctorProvider = Provider.of<DoctorProvider>(context, listen: false);
                    await doctorProvider.removeFavorite(doctor.id!);
                    _loadFavoriteDoctors();
                  }
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSecurityTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Đổi mật khẩu',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 24),
          TextFormField(
            controller: _currentPasswordController,
            decoration: InputDecoration(
              labelText: 'Mật khẩu hiện tại',
              border: const OutlineInputBorder(),
              suffixIcon: IconButton(
                icon: Icon(_currentPasswordVisible ? Icons.visibility_off : Icons.visibility),
                onPressed: () => setState(() => _currentPasswordVisible = !_currentPasswordVisible),
              ),
            ),
            obscureText: !_currentPasswordVisible,
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _newPasswordController,
            decoration: InputDecoration(
              labelText: 'Mật khẩu mới',
              border: const OutlineInputBorder(),
              helperText: 'Mật khẩu phải có ít nhất 6 ký tự',
              suffixIcon: IconButton(
                icon: Icon(_newPasswordVisible ? Icons.visibility_off : Icons.visibility),
                onPressed: () => setState(() => _newPasswordVisible = !_newPasswordVisible),
              ),
            ),
            obscureText: !_newPasswordVisible,
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _confirmPasswordController,
            decoration: InputDecoration(
              labelText: 'Xác nhận mật khẩu mới',
              border: const OutlineInputBorder(),
              suffixIcon: IconButton(
                icon: Icon(_confirmPasswordVisible ? Icons.visibility_off : Icons.visibility),
                onPressed: () => setState(() => _confirmPasswordVisible = !_confirmPasswordVisible),
              ),
            ),
            obscureText: !_confirmPasswordVisible,
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _isLoading ? null : _handleChangePassword,
              child: _isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Đổi mật khẩu'),
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }

  String _getGenderLabel(String? gender) {
    switch (gender) {
      case 'male':
        return 'Nam';
      case 'female':
        return 'Nữ';
      case 'other':
        return 'Khác';
      default:
        return 'Chưa cập nhật';
    }
  }

  String _getUserInitial(String? fullName) {
    if (fullName == null) return 'U';
    final trimmed = fullName.trim();
    if (trimmed.isEmpty) return 'U';
    return trimmed.substring(0, 1).toUpperCase();
  }

  Widget _buildAvatar(
    String? url, {
    double size = 60,
    String? fallbackText,
    String? fallbackUrl,
  }) {
    final imageUrl = (url != null && url.isNotEmpty)
        ? url
        : (fallbackUrl ?? AppConstants.defaultAvatarUrl);

    Widget placeholder() => Container(
          width: size,
          height: size,
          color: Colors.grey.shade200,
          child: Center(
            child: fallbackText != null
                ? Text(
                    fallbackText,
                    style: TextStyle(
                      fontSize: size / 2,
                      fontWeight: FontWeight.bold,
                      color: Colors.grey.shade700,
                    ),
                  )
                : Icon(Icons.person, size: size / 2, color: Colors.grey.shade500),
          ),
        );

    return ClipOval(
      child: CachedNetworkImage(
        imageUrl: imageUrl,
        width: size,
        height: size,
        fit: BoxFit.cover,
        placeholder: (_, __) => placeholder(),
        errorWidget: (_, __, ___) => placeholder(),
      ),
    );
  }
}
