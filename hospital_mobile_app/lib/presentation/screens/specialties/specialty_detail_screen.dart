import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/constants/app_constants.dart';
import '../../../domain/entities/doctor.dart';
import '../../../domain/entities/service.dart';
import '../../../domain/entities/specialty.dart';
import '../../providers/auth_provider.dart';
import '../../providers/doctor_provider.dart';
import '../../providers/service_provider.dart';
import '../../providers/specialty_provider.dart';

class SpecialtyDetailScreen extends StatefulWidget {
  final String specialtyId;

  const SpecialtyDetailScreen({super.key, required this.specialtyId});

  @override
  State<SpecialtyDetailScreen> createState() => _SpecialtyDetailScreenState();
}

class _SpecialtyDetailScreenState extends State<SpecialtyDetailScreen> {
  List<Doctor> _doctors = [];
  List<Service> _services = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  Future<void> _loadData() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    final specialtyProvider = context.read<SpecialtyProvider>();
    final authProvider = context.read<AuthProvider>();
    final doctorProvider = context.read<DoctorProvider>();
    final serviceProvider = context.read<ServiceProvider>();

    if (authProvider.isAuthenticated) {
      await doctorProvider.fetchFavoriteDoctors();
    }

    await specialtyProvider.fetchSpecialtyById(widget.specialtyId);
    final specialty = specialtyProvider.selectedSpecialty;

    if (specialty == null) {
      setState(() {
        _error = specialtyProvider.detailError ?? 'Không tìm thấy chuyên khoa';
        _loading = false;
      });
      return;
    }

    final doctors = await doctorProvider.getDoctorsBySpecialty(widget.specialtyId);
    final services = await serviceProvider.getServicesBySpecialty(widget.specialtyId);

    setState(() {
      _doctors = doctors;
      _services = services;
      _loading = false;
      _error = specialtyProvider.detailError;
    });
  }

  @override
  Widget build(BuildContext context) {
    final specialtyProvider = context.watch<SpecialtyProvider>();
    final specialty = specialtyProvider.selectedSpecialty;

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: _loadData,
        child: _loading && specialty == null
            ? const Center(child: CircularProgressIndicator())
            : _error != null && specialty == null
                ? _buildError(_error!)
                : CustomScrollView(
                    slivers: [
                      // Simple AppBar
                      SliverAppBar(
                        expandedHeight: 0,
                        pinned: true,
                        backgroundColor: Colors.teal.shade600,
                        title: Text(
                          specialty?.name ?? 'Chi tiết chuyên khoa',
                          style: const TextStyle(color: Colors.white),
                        ),
                        iconTheme: const IconThemeData(color: Colors.white),
                      ),
                      // Header with circular image and info (like web)
                      SliverToBoxAdapter(
                        child: Container(
                          margin: const EdgeInsets.all(AppConstants.defaultPadding),
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.08),
                                blurRadius: 15,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: Column(
                            children: [
                              // Circular Image
                              Container(
                                width: 130,
                                height: 130,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: Colors.grey.shade200,
                                    width: 4,
                                  ),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withOpacity(0.1),
                                      blurRadius: 10,
                                      offset: const Offset(0, 4),
                                    ),
                                  ],
                                ),
                                child: ClipOval(
                                  child: specialty?.imageUrl != null && specialty!.imageUrl!.isNotEmpty
                                      ? CachedNetworkImage(
                                          imageUrl: _resolveImageUrl(specialty!.imageUrl, AppConstants.defaultServiceImageUrl),
                                          fit: BoxFit.cover,
                                          placeholder: (context, url) => Container(
                                            color: Colors.teal.shade100,
                                            child: const Center(
                                              child: CircularProgressIndicator(strokeWidth: 2),
                                            ),
                                          ),
                                          errorWidget: (context, url, error) => Container(
                                            color: Colors.teal.shade600,
                                            child: Icon(
                                              Icons.healing,
                                              size: 50,
                                              color: Colors.white.withOpacity(0.8),
                                            ),
                                          ),
                                        )
                                      : Container(
                                          color: Colors.teal.shade600,
                                          child: Icon(
                                            Icons.healing,
                                            size: 50,
                                            color: Colors.white.withOpacity(0.8),
                                          ),
                                        ),
                                ),
                              ),
                              const SizedBox(height: 16),
                              // Specialty Name with Icon
                              Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.medical_services, color: Colors.teal.shade600, size: 28),
                                  const SizedBox(width: 8),
                                  Flexible(
                                    child: Text(
                                      specialty?.name ?? '',
                                      style: const TextStyle(
                                        fontSize: 24,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.black87,
                                      ),
                                      textAlign: TextAlign.center,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              // Description
                              Text(
                                specialty?.description ?? 'Chuyên khoa đang cập nhật mô tả.',
                                style: TextStyle(
                                  fontSize: 15,
                                  color: Colors.grey.shade700,
                                  height: 1.5,
                                ),
                                textAlign: TextAlign.center,
                              ),
                              const SizedBox(height: 20),
                              // Stats Row
                              if (specialty != null) _buildStatsRow(specialty),
                              const SizedBox(height: 16),
                              // Book Appointment Button
                              SizedBox(
                                width: double.infinity,
                                child: ElevatedButton.icon(
                                  onPressed: () {
                                    Navigator.pushNamed(
                                      context,
                                      '/appointment-booking',
                                      arguments: {'specialtyId': widget.specialtyId},
                                    );
                                  },
                                  icon: const Icon(Icons.calendar_month),
                                  label: const Text('Đặt lịch khám'),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.teal.shade600,
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(vertical: 14),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      // Content
                      SliverToBoxAdapter(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: AppConstants.defaultPadding),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (_doctors.isNotEmpty) ...[
                                const SizedBox(height: 16),
                                _buildInfoCard(
                                  title: 'Đội ngũ bác sĩ',
                                  child: Column(
                                    children: _doctors
                                        .map((doctor) => _buildDoctorTile(doctor))
                                        .toList(),
                                  ),
                                ),
                              ],
                              if (_services.isNotEmpty) ...[
                                const SizedBox(height: 16),
                                _buildInfoCard(
                                  title: 'Dịch vụ nổi bật',
                                  child: Column(
                                    children: _services
                                        .map((service) => _buildServiceTile(service))
                                        .toList(),
                                  ),
                                ),
                              ],
                              const SizedBox(height: 24),
                              SizedBox(
                                width: double.infinity,
                                child: ElevatedButton.icon(
                                  onPressed: () {
                                    Navigator.pushNamed(
                                      context,
                                      '/appointment-booking',
                                      arguments: {'specialtyId': widget.specialtyId},
                                    );
                                  },
                                  icon: const Icon(Icons.calendar_month),
                                  label: const Text('Đặt lịch khám chuyên khoa'),
                                  style: ElevatedButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(vertical: 14),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
      ),
    );
  }

  Widget _buildDoctorTile(Doctor doctor) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
        color: Colors.grey.shade50,
      ),
      child: Consumer2<DoctorProvider, AuthProvider>(
        builder: (context, doctorProvider, authProvider, child) {
          final isFavorite = doctorProvider.isFavorite(doctor.id);

          return InkWell(
            onTap: () => Navigator.pushNamed(context, '/doctor-detail', arguments: doctor.id),
            child: Row(
              children: [
                // Doctor Avatar
                CircleAvatar(
                  radius: 28,
                  backgroundColor: Colors.blue.shade100,
                  backgroundImage: doctor.avatar != null
                      ? CachedNetworkImageProvider(doctor.avatar!)
                      : null,
                  child: doctor.avatar == null
                      ? Text(
                          doctor.fullName.isNotEmpty ? doctor.fullName[0].toUpperCase() : 'B',
                          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.blue),
                        )
                      : null,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        doctor.fullName,
                        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(Icons.work_outline, size: 14, color: Colors.grey.shade600),
                          const SizedBox(width: 4),
                          Text(
                            '${doctor.experience} năm kinh nghiệm',
                            style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
                          ),
                        ],
                      ),
                      if (doctor.rating > 0 || doctor.reviewCount > 0) ...[
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            const Icon(Icons.star, size: 14, color: Colors.amber),
                            const SizedBox(width: 4),
                            Text(
                              _resolveDoctorRating(doctor).toStringAsFixed(1),
                              style: TextStyle(color: Colors.grey.shade700, fontSize: 13),
                            ),
                            const SizedBox(width: 6),
                            Text(
                              '(${_resolveDoctorReviewCount(doctor)} đánh giá)',
                              style: TextStyle(color: Colors.grey.shade500, fontSize: 12),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
                if (authProvider.isAuthenticated)
                  IconButton(
                    icon: Icon(
                      isFavorite ? Icons.favorite : Icons.favorite_border,
                      color: isFavorite ? Colors.redAccent : Colors.grey.shade500,
                    ),
                    onPressed: () async {
                      final success = await doctorProvider.toggleFavorite(doctor.id);
                      if (!mounted) return;
                      final nowFavorite = doctorProvider.isFavorite(doctor.id);
                      final message = success
                          ? (nowFavorite
                              ? 'Đã thêm bác sĩ vào danh sách yêu thích'
                              : 'Đã xóa bác sĩ khỏi danh sách yêu thích')
                          : 'Không thể cập nhật danh sách yêu thích';
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text(message)),
                      );
                      setState(() {});
                    },
                  ),
                const Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildServiceTile(Service service) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
        color: Colors.grey.shade50,
      ),
      child: InkWell(
        onTap: () => Navigator.pushNamed(context, '/service-detail', arguments: service.id),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: CachedNetworkImage(
                    imageUrl: _resolveImageUrl(service.image, AppConstants.defaultServiceImageUrl),
                    width: 70,
                    height: 70,
                    fit: BoxFit.cover,
                    placeholder: (context, url) => Container(
                      width: 70,
                      height: 70,
                      color: Colors.green.shade50,
                      child: const Icon(Icons.image, color: Colors.green),
                    ),
                    errorWidget: (context, url, error) => Container(
                      width: 70,
                      height: 70,
                      color: Colors.green.shade50,
                      child: const Icon(Icons.medical_services_outlined, color: Colors.green),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    service.name,
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                ),
                Text(
                  _formatCurrency(service.price),
                  style: TextStyle(
                    color: Colors.green.shade600,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              service.description,
              style: TextStyle(color: Colors.grey.shade700, height: 1.4),
              softWrap: true,
            ),
            if (service.duration != null) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  Icon(Icons.timer_outlined, size: 14, color: Colors.grey.shade500),
                  const SizedBox(width: 4),
                  Text(
                    '${service.duration} phút',
                    style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildStatsRow(Specialty specialty) {
    return Row(
      children: [
        Expanded(
          child: _buildStatCard(
            icon: Icons.person_search,
            label: 'Bác sĩ',
            value: (_doctors.isNotEmpty ? _doctors.length : specialty.doctorCount).toString(),
            color: Colors.blue,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildStatCard(
            icon: Icons.medical_services_outlined,
            label: 'Dịch vụ',
            value: (_services.isNotEmpty ? _services.length : specialty.serviceCount).toString(),
            color: Colors.green,
          ),
        ),
      ],
    );
  }

  Widget _buildStatCard({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) {
    final Color textColor =
        color is MaterialColor ? color.shade700 : color.withOpacity(0.85);

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: color.withOpacity(0.15),
            child: Icon(icon, color: color),
          ),
          const SizedBox(width: 10),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: textColor,
                ),
              ),
              Text(label, style: TextStyle(color: Colors.grey.shade700)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildInfoCard({
    required String title,
    required Widget child,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 10),
          child,
        ],
      ),
    );
  }

  Widget _buildError(String message) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, size: 60, color: Colors.red),
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Text(message, textAlign: TextAlign.center),
          ),
          const SizedBox(height: 12),
          ElevatedButton.icon(
            onPressed: _loadData,
            icon: const Icon(Icons.refresh),
            label: const Text('Thử lại'),
          ),
        ],
      ),
    );
  }

  String _formatCurrency(double value) {
    if (value == 0) return 'Liên hệ';
    return '${value.toStringAsFixed(0)} VNĐ';
  }

  double _resolveDoctorRating(Doctor doctor) {
    if (doctor.rating > 0) return doctor.rating;
    return 0;
  }

  int _resolveDoctorReviewCount(Doctor doctor) {
    if (doctor.reviewCount > 0) return doctor.reviewCount;
    return 0;
  }

  String _resolveImageUrl(String? url, String fallback) {
    if (url == null || url.isEmpty) return fallback;
    if (url.startsWith('http')) return url;
    return '${ApiConstants.socketUrl}$url';
  }
}
