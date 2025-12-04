import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
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
      appBar: AppBar(
        title: const Text('Chi tiết chuyên khoa'),
      ),
      body: RefreshIndicator(
        onRefresh: _loadData,
        child: _loading && specialty == null
            ? const Center(child: CircularProgressIndicator())
            : _error != null && specialty == null
                ? _buildError(_error!)
                : ListView(
                    padding: const EdgeInsets.all(AppConstants.defaultPadding),
                    children: [
                      if (specialty != null) _buildHeaderCard(specialty),
                      const SizedBox(height: 16),
                      _buildInfoCard(
                        title: 'Mô tả chuyên khoa',
                        child: Text(
                          specialty?.description ?? 'Chuyên khoa đang cập nhật mô tả.',
                          style: const TextStyle(height: 1.5),
                        ),
                      ),
                      const SizedBox(height: 16),
                      if (specialty != null) _buildStatsRow(specialty),
                      if (_doctors.isNotEmpty) ...[
                        const SizedBox(height: 16),
                        _buildInfoCard(
                          title: 'Đội ngũ bác sĩ',
                          child: Column(
                            children: _doctors
                                .map(
                                  (doctor) => ListTile(
                                    contentPadding: EdgeInsets.zero,
                                    leading: CircleAvatar(
                                      backgroundColor: Colors.blue.shade50,
                                      child: const Icon(Icons.person, color: Colors.blue),
                                    ),
                                    title: Text(doctor.fullName),
                                    subtitle: Text('${doctor.experience} năm kinh nghiệm'),
                                    trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                                    onTap: () => Navigator.pushNamed(
                                      context,
                                      '/doctor-detail',
                                      arguments: doctor.id,
                                    ),
                                  ),
                                )
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
                                .map(
                                  (service) => ListTile(
                                    contentPadding: EdgeInsets.zero,
                                    title: Text(service.name),
                                    subtitle: Text(
                                      service.description.length > 80
                                          ? '${service.description.substring(0, 80)}...'
                                          : service.description,
                                    ),
                                    trailing: Text(
                                      _formatCurrency(service.price),
                                      style: const TextStyle(
                                        color: Colors.green,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    onTap: () => Navigator.pushNamed(
                                      context,
                                      '/service-detail',
                                      arguments: service.id,
                                    ),
                                  ),
                                )
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
    );
  }

  Widget _buildHeaderCard(Specialty specialty) {
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
      child: Row(
        children: [
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              color: Colors.blue.shade50,
              borderRadius: BorderRadius.circular(14),
            ),
            child: specialty.imageUrl != null
                ? ClipRRect(
                    borderRadius: BorderRadius.circular(14),
                    child: Image.network(
                      specialty.imageUrl!,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) => const Icon(
                        Icons.healing,
                        color: Colors.blue,
                      ),
                    ),
                  )
                : const Icon(Icons.healing, color: Colors.blue),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  specialty.name,
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  specialty.description ?? 'Chuyên khoa đang cập nhật.',
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(color: Colors.grey.shade700),
                ),
              ],
            ),
          ),
        ],
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
}
