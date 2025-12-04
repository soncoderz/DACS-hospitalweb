import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_constants.dart';
import '../../../domain/entities/doctor.dart';
import '../../../domain/entities/service.dart';
import '../../providers/doctor_provider.dart';
import '../../providers/service_provider.dart';

class ServiceDetailScreen extends StatefulWidget {
  final String serviceId;

  const ServiceDetailScreen({
    super.key,
    required this.serviceId,
  });

  @override
  State<ServiceDetailScreen> createState() => _ServiceDetailScreenState();
}

class _ServiceDetailScreenState extends State<ServiceDetailScreen> {
  List<Service> _relatedServices = [];
  List<Doctor> _doctors = [];
  bool _extrasLoading = false;
  String? _extrasError;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _fetchServiceDetail();
    });
  }

  Future<void> _fetchServiceDetail() async {
    final serviceProvider = context.read<ServiceProvider>();
    final doctorProvider = context.read<DoctorProvider>();

    setState(() {
      _extrasLoading = true;
      _extrasError = null;
    });

    serviceProvider.clearError();
    await serviceProvider.fetchServiceById(widget.serviceId);
    final service = serviceProvider.selectedService;

    if (service?.specialtyId != null) {
      final related = await serviceProvider.getServicesBySpecialty(service!.specialtyId!);
      final doctors = await doctorProvider.getDoctorsByService(widget.serviceId);

      setState(() {
        _relatedServices = related.where((s) => s.id != service.id).take(4).toList();
        _doctors = doctors;
      });
    }

    setState(() {
      _extrasLoading = false;
      _extrasError = serviceProvider.errorMessage;
    });
  }

  void _handleBookNow(Service service) {
    Navigator.pushNamed(
      context,
      '/appointment-booking',
      arguments: {
        'serviceId': service.id,
        'specialtyId': service.specialtyId,
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Chi tiết dịch vụ'),
      ),
      body: Consumer<ServiceProvider>(
        builder: (context, serviceProvider, child) {
          if (serviceProvider.isLoading && serviceProvider.selectedService == null) {
            return const Center(child: CircularProgressIndicator());
          }

          if (serviceProvider.errorMessage != null && serviceProvider.selectedService == null) {
            return _buildError(serviceProvider.errorMessage!);
          }

          final service = serviceProvider.selectedService;
          if (service == null) {
            return _buildError('Không tìm thấy dịch vụ');
          }

          return RefreshIndicator(
            onRefresh: _fetchServiceDetail,
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(AppConstants.defaultPadding),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildHeader(service),
                  const SizedBox(height: 16),
                  _buildInfoCard(
                    'Mô tả dịch vụ',
                    Text(
                      service.description,
                      style: const TextStyle(height: 1.5),
                    ),
                  ),
                  if (service.instructions != null && service.instructions!.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    _buildInfoCard(
                      'Hướng dẫn chuẩn bị',
                      _buildBullets(service.instructions!),
                    ),
                  ],
                  if (service.preparationGuide != null && service.preparationGuide!.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    _buildInfoCard(
                      'Quy trình chuẩn bị',
                      _buildBullets(service.preparationGuide!),
                    ),
                  ],
                  if (service.aftercareInstructions != null && service.aftercareInstructions!.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    _buildInfoCard(
                      'Chăm sóc sau thực hiện',
                      _buildBullets(service.aftercareInstructions!),
                    ),
                  ],
                  if (service.requiredTests != null && service.requiredTests!.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    _buildInfoCard(
                      'Xét nghiệm yêu cầu',
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: service.requiredTests!
                            .map(
                              (test) => Chip(
                                label: Text(test),
                                backgroundColor: Colors.blue.shade50,
                                labelStyle: const TextStyle(color: Colors.blue),
                              ),
                            )
                            .toList(),
                      ),
                    ),
                  ],
                  if (_extrasLoading) ...[
                    const SizedBox(height: 20),
                    const Center(child: CircularProgressIndicator()),
                  ] else ...[
                    if (_doctors.isNotEmpty) ...[
                      const SizedBox(height: 16),
                      _buildInfoCard(
                        'Bác sĩ thực hiện',
                        Column(
                          children: _doctors
                              .map(
                                (doctor) => ListTile(
                                  contentPadding: EdgeInsets.zero,
                                  leading: CircleAvatar(
                                    backgroundColor: Colors.blue.shade50,
                                    child: const Icon(Icons.person, color: Colors.blue),
                                  ),
                                  title: Text(doctor.fullName),
                                  subtitle: Text(doctor.specialtyName),
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
                    if (_relatedServices.isNotEmpty) ...[
                      const SizedBox(height: 16),
                      _buildInfoCard(
                        'Dịch vụ liên quan',
                        Column(
                          children: _relatedServices
                              .map(
                                (item) => ListTile(
                                  contentPadding: EdgeInsets.zero,
                                  title: Text(item.name),
                                  subtitle: Text(
                                    item.description.length > 80
                                        ? '${item.description.substring(0, 80)}...'
                                        : item.description,
                                  ),
                                  trailing: Text(
                                    _formatCurrency(item.price),
                                    style: const TextStyle(
                                      color: Colors.green,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  onTap: () {
                                    Navigator.pushReplacementNamed(
                                      context,
                                      '/service-detail',
                                      arguments: item.id,
                                    );
                                  },
                                ),
                              )
                              .toList(),
                        ),
                      ),
                    ],
                    if (_extrasError != null) ...[
                      const SizedBox(height: 12),
                      Text(
                        _extrasError!,
                        style: const TextStyle(color: Colors.red),
                      ),
                    ],
                  ],
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () => _handleBookNow(service),
                      icon: const Icon(Icons.calendar_today),
                      label: const Text(
                        'Đặt lịch dịch vụ này',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
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
        },
      ),
    );
  }

  Widget _buildHeader(Service service) {
    return Container(
      width: double.infinity,
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
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.blue.shade50,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.medical_services_outlined, color: Colors.blue),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      service.name,
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    if (service.shortDescription != null && service.shortDescription!.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text(
                          service.shortDescription!,
                          style: TextStyle(color: Colors.grey.shade700),
                        ),
                      ),
                    if (service.specialtyName != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: GestureDetector(
                          onTap: () {
                            if (service.specialtyId != null) {
                              Navigator.pushNamed(
                                context,
                                '/specialty-detail',
                                arguments: service.specialtyId,
                              );
                            }
                          },
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.local_hospital, size: 18, color: Colors.blue),
                              const SizedBox(width: 6),
                              Text(
                                service.specialtyName!,
                                style: const TextStyle(color: Colors.blue, fontWeight: FontWeight.w600),
                              ),
                            ],
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildMetaChip(Icons.attach_money, _formatCurrency(service.price)),
              if (service.duration != null) _buildMetaChip(Icons.timer, '${service.duration} phút'),
              if (service.type != null) _buildMetaChip(Icons.category, service.type!),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMetaChip(IconData icon, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.grey.shade100,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          Icon(icon, size: 18, color: Colors.blue),
          const SizedBox(width: 6),
          Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  Widget _buildInfoCard(String title, Widget child) {
    return Container(
      width: double.infinity,
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

  Widget _buildBullets(String raw) {
    final lines = raw.split('\n').where((e) => e.trim().isNotEmpty).toList();
    return Column(
      children: lines
          .map(
            (line) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.check_circle, color: Colors.green, size: 18),
                  const SizedBox(width: 8),
                  Expanded(child: Text(line)),
                ],
              ),
            ),
          )
          .toList(),
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
            onPressed: _fetchServiceDetail,
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
