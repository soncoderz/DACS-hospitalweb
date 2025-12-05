import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/constants/api_constants.dart';
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
            child: CustomScrollView(
              slivers: [
                // Hero Image Header
                SliverAppBar(
                  expandedHeight: 200,
                  pinned: true,
                  backgroundColor: Colors.green.shade600,
                  flexibleSpace: FlexibleSpaceBar(
                    background: Stack(
                      fit: StackFit.expand,
                      children: [
                        // Service Image or Gradient Background
                        if (service.image != null && service.image!.isNotEmpty)
                          CachedNetworkImage(
                            imageUrl: _buildImageUrl(service.image, AppConstants.defaultServiceImageUrl),
                            fit: BoxFit.cover,
                            placeholder: (context, url) => Container(
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [Colors.green.shade400, Colors.green.shade700],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                ),
                              ),
                              child: const Center(child: CircularProgressIndicator(color: Colors.white)),
                            ),
                            errorWidget: (context, url, error) => Container(
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [Colors.green.shade400, Colors.green.shade700],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                ),
                              ),
                              child: Center(
                                child: Icon(Icons.medical_services_outlined, size: 80, color: Colors.white.withOpacity(0.3)),
                              ),
                            ),
                          )
                        else
                          Container(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [Colors.green.shade400, Colors.green.shade700],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                            ),
                            child: Center(
                              child: Icon(
                                Icons.medical_services_outlined,
                                size: 80,
                                color: Colors.white.withOpacity(0.3),
                              ),
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
                        // Service Info
                        Positioned(
                          left: 16,
                          right: 16,
                          bottom: 16,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (service.type != null)
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withOpacity(0.2),
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                  child: Text(
                                    service.type!,
                                    style: const TextStyle(color: Colors.white, fontSize: 11),
                                  ),
                                ),
                              const SizedBox(height: 8),
                              Text(
                                service.name,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 22,
                                  fontWeight: FontWeight.bold,
                                  shadows: [
                                    Shadow(offset: Offset(0, 1), blurRadius: 3, color: Colors.black45),
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
                        // Price and Duration Row
                        _buildMetaRow(service),
                        const SizedBox(height: 16),
                        // Description
                        _buildInfoCard(
                          'Mô tả dịch vụ',
                          Text(service.description, style: const TextStyle(height: 1.5)),
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
                                children: _doctors.map((doctor) => _buildDoctorTile(doctor)).toList(),
                              ),
                            ),
                          ],
                          if (_relatedServices.isNotEmpty) ...[
                            const SizedBox(height: 16),
                            _buildInfoCard(
                              'Dịch vụ liên quan',
                              Column(
                                children: _relatedServices.map((item) => _buildServiceTile(item)).toList(),
                              ),
                            ),
                          ],
                          if (_extrasError != null) ...[
                            const SizedBox(height: 12),
                            Text(_extrasError!, style: const TextStyle(color: Colors.red)),
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
                        const SizedBox(height: 16),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildMetaRow(Service service) {
    return Row(
      children: [
        Expanded(
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
            decoration: BoxDecoration(
              color: Colors.green.shade50,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              children: [
                Icon(Icons.attach_money, color: Colors.green.shade600, size: 24),
                const SizedBox(height: 4),
                Text(
                  _formatCurrency(service.price),
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.green.shade700,
                    fontSize: 14,
                  ),
                ),
                const Text('Giá dịch vụ', style: TextStyle(fontSize: 11)),
              ],
            ),
          ),
        ),
        if (service.duration != null) ...[
          const SizedBox(width: 12),
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
              decoration: BoxDecoration(
                color: Colors.blue.shade50,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: [
                  Icon(Icons.timer_outlined, color: Colors.blue.shade600, size: 24),
                  const SizedBox(height: 4),
                  Text(
                    '${service.duration} phút',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: Colors.blue.shade700,
                      fontSize: 14,
                    ),
                  ),
                  const Text('Thời gian', style: TextStyle(fontSize: 11)),
                ],
              ),
            ),
          ),
        ],
        if (service.specialtyName != null) ...[
          const SizedBox(width: 12),
          Expanded(
            child: InkWell(
              onTap: service.specialtyId != null
                  ? () => Navigator.pushNamed(context, '/specialty-detail', arguments: service.specialtyId)
                  : null,
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
                decoration: BoxDecoration(
                  color: Colors.purple.shade50,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  children: [
                    Icon(Icons.healing, color: Colors.purple.shade600, size: 24),
                    const SizedBox(height: 4),
                    Text(
                      service.specialtyName!,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: Colors.purple.shade700,
                        fontSize: 12,
                      ),
                    ),
                    const Text('Chuyên khoa', style: TextStyle(fontSize: 11)),
                  ],
                ),
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildDoctorTile(Doctor doctor) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        onTap: () => Navigator.pushNamed(context, '/doctor-detail', arguments: doctor.id),
        child: Row(
          children: [
            CircleAvatar(
              radius: 24,
              backgroundColor: Colors.blue.shade100,
              backgroundImage: doctor.avatar != null ? CachedNetworkImageProvider(doctor.avatar!) : null,
              child: doctor.avatar == null
                  ? Text(
                      doctor.fullName.isNotEmpty ? doctor.fullName[0].toUpperCase() : 'B',
                      style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.blue),
                    )
                  : null,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(doctor.fullName, style: const TextStyle(fontWeight: FontWeight.w600)),
                  Text(doctor.specialtyName, style: TextStyle(fontSize: 13, color: Colors.grey.shade600)),
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
      margin: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        onTap: () => Navigator.pushReplacementNamed(context, '/service-detail', arguments: service.id),
        child: Row(
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
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(service.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                  Text(
                    service.description.length > 60 ? '${service.description.substring(0, 60)}...' : service.description,
                    style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                  ),
                ],
              ),
            ),
            Text(
              _formatCurrency(service.price),
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.green.shade600, fontSize: 13),
            ),
          ],
        ),
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
          Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
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

  String _buildImageUrl(String? url, String fallback) {
    if (url == null || url.isEmpty) return fallback;
    if (url.startsWith('http')) return url;
    return '${ApiConstants.socketUrl}$url';
  }
}
