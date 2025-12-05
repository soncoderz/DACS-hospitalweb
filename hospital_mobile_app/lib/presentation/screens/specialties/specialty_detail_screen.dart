import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/constants/app_constants.dart';
import '../../../domain/entities/doctor.dart';
import '../../../domain/entities/service.dart';
import '../../../domain/entities/specialty.dart';
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
    final doctorProvider = context.read<DoctorProvider>();
    final serviceProvider = context.read<ServiceProvider>();

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
                      // Hero Header with Image
                      SliverAppBar(
                        expandedHeight: 220,
                        pinned: true,
                        backgroundColor: Colors.teal.shade600,
                        flexibleSpace: FlexibleSpaceBar(
                          background: Stack(
                            fit: StackFit.expand,
                            children: [
                              // Specialty Image
                              if (specialty?.imageUrl != null)
                                CachedNetworkImage(
                                  imageUrl: _resolveImageUrl(specialty!.imageUrl, AppConstants.defaultServiceImageUrl),
                                  fit: BoxFit.cover,
                                  placeholder: (context, url) => Container(
                                    decoration: BoxDecoration(
                                      gradient: LinearGradient(
                                        colors: [Colors.teal.shade300, Colors.teal.shade600],
                                        begin: Alignment.topLeft,
                                        end: Alignment.bottomRight,
                                      ),
                                    ),
                                    child: const Center(
                                      child: CircularProgressIndicator(color: Colors.white),
                                    ),
                                  ),
                                  errorWidget: (context, url, error) => Container(
                                    decoration: BoxDecoration(
                                      gradient: LinearGradient(
                                        colors: [Colors.teal.shade300, Colors.teal.shade600],
                                        begin: Alignment.topLeft,
                                        end: Alignment.bottomRight,
                                      ),
                                    ),
                                    child: Icon(
                                      Icons.healing,
                                      size: 80,
                                      color: Colors.white.withOpacity(0.5),
                                    ),
                                  ),
                                )
                              else
                                Container(
                                  decoration: BoxDecoration(
                                    gradient: LinearGradient(
                                      colors: [Colors.teal.shade300, Colors.teal.shade700],
                                      begin: Alignment.topLeft,
                                      end: Alignment.bottomRight,
                                    ),
                                  ),
                                  child: Icon(
                                    Icons.healing,
                                    size: 80,
                                    color: Colors.white.withOpacity(0.5),
                                  ),
                                ),
                              // Gradient Overlay
                              Container(
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    colors: [
                                      Colors.transparent,
                                      Colors.black.withOpacity(0.6),
                                    ],
                                    begin: Alignment.topCenter,
                                    end: Alignment.bottomCenter,
                                    stops: const [0.4, 1.0],
                                  ),
                                ),
                              ),
                              // Specialty Info
                              Positioned(
                                left: 16,
                                right: 16,
                                bottom: 16,
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                      decoration: BoxDecoration(
                                        color: Colors.white.withOpacity(0.2),
                                        borderRadius: BorderRadius.circular(20),
                                      ),
                                      child: const Text(
                                        'Chuyên khoa',
                                        style: TextStyle(color: Colors.white, fontSize: 12),
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      specialty?.name ?? '',
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 26,
                                        fontWeight: FontWeight.bold,
                                        shadows: [
                                          Shadow(
                                            offset: Offset(0, 1),
                                            blurRadius: 3,
                                            color: Colors.black45,
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      // Content
                      SliverToBoxAdapter(
                        child: Padding(
                          padding: const EdgeInsets.all(AppConstants.defaultPadding),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (specialty != null) _buildStatsRow(specialty),
                              const SizedBox(height: 16),
                              _buildInfoCard(
                                title: 'Mô tả chuyên khoa',
                                child: Text(
                                  specialty?.description ?? 'Chuyên khoa đang cập nhật mô tả.',
                                  style: const TextStyle(height: 1.5),
                                ),
                              ),
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
      child: InkWell(
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
                  if (doctor.rating > 0) ...[
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.star, size: 14, color: Colors.amber),
                        const SizedBox(width: 4),
                        Text(
                          doctor.rating.toStringAsFixed(1),
                          style: TextStyle(color: Colors.grey.shade700, fontSize: 13),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
            const Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey),
          ],
        ),
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
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.green.shade50,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(Icons.medical_services_outlined, color: Colors.green.shade600, size: 20),
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
              service.description.length > 100
                  ? '${service.description.substring(0, 100)}...'
                  : service.description,
              style: TextStyle(color: Colors.grey.shade700, height: 1.4),
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
            value: _services.length.toString(),
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

  String _resolveImageUrl(String? url, String fallback) {
    if (url == null || url.isEmpty) return fallback;
    if (url.startsWith('http')) return url;
    return '${ApiConstants.socketUrl}$url';
  }
}
