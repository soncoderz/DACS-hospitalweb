import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
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
  final NumberFormat _currencyFormatter =
      NumberFormat.currency(locale: 'vi_VN', symbol: 'đ', decimalDigits: 0);

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
      _relatedServices = [];
      _doctors = [];
    });

    serviceProvider.clearError();
    serviceProvider.clearSelectedService();
    await serviceProvider.fetchServiceById(widget.serviceId);
    final service = serviceProvider.selectedService;

    if (service?.specialtyId != null) {
      final related =
          await serviceProvider.getServicesBySpecialty(service!.specialtyId!);
      final doctors =
          await doctorProvider.getDoctorsByService(widget.serviceId);

      if (mounted) {
        setState(() {
          _relatedServices =
              related.where((s) => s.id != service.id).take(4).toList();
          _doctors = doctors;
        });
      }
    }

    if (mounted) {
      setState(() {
        _extrasLoading = false;
        _extrasError = serviceProvider.errorMessage;
      });
    }
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
      backgroundColor: const Color(0xFFF8FAFC),
      body: Consumer<ServiceProvider>(
        builder: (context, serviceProvider, child) {
          if (serviceProvider.isLoading &&
              serviceProvider.selectedService == null) {
            return const Center(child: CircularProgressIndicator());
          }

          if (serviceProvider.errorMessage != null &&
              serviceProvider.selectedService == null) {
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
                _buildSliverAppBar(service),
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.all(AppConstants.defaultPadding),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Meta Row - Price, Duration, Specialty
                        _buildMetaRow(service),
                        const SizedBox(height: 20),
                        // Description Section
                        _buildInfoSection(
                          icon: Icons.info_outline_rounded,
                          title: 'Mô tả dịch vụ',
                          child: Text(
                            service.description.isNotEmpty
                                ? service.description
                                : 'Chưa có mô tả cho dịch vụ này.',
                            style: TextStyle(
                              height: 1.6,
                              color: Colors.grey.shade700,
                              fontSize: 15,
                            ),
                          ),
                        ),
                        if (service.instructions != null &&
                            service.instructions!.isNotEmpty) ...[
                          const SizedBox(height: 16),
                          _buildInfoSection(
                            icon: Icons.assignment_outlined,
                            title: 'Hướng dẫn chuẩn bị',
                            child: _buildBulletPoints(service.instructions!),
                          ),
                        ],
                        if (service.preparationGuide != null &&
                            service.preparationGuide!.isNotEmpty) ...[
                          const SizedBox(height: 16),
                          _buildInfoSection(
                            icon: Icons.checklist_rounded,
                            title: 'Quy trình chuẩn bị',
                            child: _buildBulletPoints(service.preparationGuide!),
                          ),
                        ],
                        if (service.aftercareInstructions != null &&
                            service.aftercareInstructions!.isNotEmpty) ...[
                          const SizedBox(height: 16),
                          _buildInfoSection(
                            icon: Icons.health_and_safety_outlined,
                            title: 'Chăm sóc sau thực hiện',
                            child:
                                _buildBulletPoints(service.aftercareInstructions!),
                          ),
                        ],
                        if (service.requiredTests != null &&
                            service.requiredTests!.isNotEmpty) ...[
                          const SizedBox(height: 16),
                          _buildInfoSection(
                            icon: Icons.science_outlined,
                            title: 'Xét nghiệm yêu cầu',
                            child: Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: service.requiredTests!
                                  .map((test) => Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 14,
                                          vertical: 8,
                                        ),
                                        decoration: BoxDecoration(
                                          gradient: LinearGradient(
                                            colors: [
                                              Colors.blue.shade50,
                                              Colors.blue.shade100
                                                  .withOpacity(0.5),
                                            ],
                                          ),
                                          borderRadius: BorderRadius.circular(20),
                                          border:
                                              Border.all(color: Colors.blue.shade100),
                                        ),
                                        child: Text(
                                          test,
                                          style: TextStyle(
                                            color: Colors.blue.shade700,
                                            fontWeight: FontWeight.w500,
                                          ),
                                        ),
                                      ))
                                  .toList(),
                            ),
                          ),
                        ],
                        if (_extrasLoading) ...[
                          const SizedBox(height: 24),
                          const Center(child: CircularProgressIndicator()),
                        ] else ...[
                          if (_doctors.isNotEmpty) ...[
                            const SizedBox(height: 16),
                            _buildInfoSection(
                              icon: Icons.people_outline_rounded,
                              title: 'Bác sĩ thực hiện dịch vụ',
                              child: Column(
                                children: _doctors
                                    .map((doctor) => _buildDoctorCard(doctor))
                                    .toList(),
                              ),
                            ),
                          ],
                          if (_relatedServices.isNotEmpty) ...[
                            const SizedBox(height: 16),
                            _buildInfoSection(
                              icon: Icons.medical_services_outlined,
                              title: 'Dịch vụ liên quan',
                              child: Column(
                                children: _relatedServices
                                    .map((item) => _buildRelatedServiceCard(item))
                                    .toList(),
                              ),
                            ),
                          ],
                          if (_extrasError != null) ...[
                            const SizedBox(height: 12),
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.red.shade50,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Row(
                                children: [
                                  Icon(Icons.error_outline,
                                      color: Colors.red.shade400, size: 20),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      _extrasError!,
                                      style: TextStyle(color: Colors.red.shade700),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ],
                        const SizedBox(height: 100),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
      bottomNavigationBar: Consumer<ServiceProvider>(
        builder: (context, serviceProvider, child) {
          final service = serviceProvider.selectedService;
          if (service == null) return const SizedBox.shrink();

          return Container(
            padding: const EdgeInsets.all(AppConstants.defaultPadding),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.08),
                  blurRadius: 16,
                  offset: const Offset(0, -4),
                ),
              ],
            ),
            child: SafeArea(
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      Colors.green.shade500,
                      Colors.green.shade700,
                    ],
                  ),
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.green.shade400.withOpacity(0.4),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: () => _handleBookNow(service),
                    borderRadius: BorderRadius.circular(14),
                    child: const Padding(
                      padding: EdgeInsets.symmetric(vertical: 16),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.calendar_today_rounded,
                            color: Colors.white,
                            size: 20,
                          ),
                          SizedBox(width: 10),
                          Text(
                            'Đặt lịch dịch vụ này',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildSliverAppBar(Service service) {
    final imageUrl = _buildImageUrl(service.image);

    return SliverAppBar(
      expandedHeight: 260,
      pinned: true,
      elevation: 0,
      backgroundColor: Colors.green.shade600,
      iconTheme: const IconThemeData(color: Colors.white),
      leading: Container(
        margin: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Colors.black.withOpacity(0.2),
          shape: BoxShape.circle,
        ),
        child: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      flexibleSpace: LayoutBuilder(
        builder: (context, constraints) {
          final collapsed = constraints.biggest.height <= kToolbarHeight + 60;
          return FlexibleSpaceBar(
            titlePadding: const EdgeInsets.only(left: 56, bottom: 16),
            title: collapsed
                ? Text(
                    service.name,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                      fontSize: 16,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  )
                : null,
            background: Stack(
              fit: StackFit.expand,
              children: [
                // Service Image or Gradient Background
                if (imageUrl != null)
                  CachedNetworkImage(
                    imageUrl: imageUrl,
                    fit: BoxFit.cover,
                    placeholder: (context, url) => _buildHeaderPlaceholder(),
                    errorWidget: (context, url, error) =>
                        _buildHeaderPlaceholder(),
                  )
                else
                  _buildHeaderPlaceholder(),
                // Gradient Overlay
                Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        Colors.transparent,
                        Colors.black.withOpacity(0.7),
                      ],
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      stops: const [0.3, 1.0],
                    ),
                  ),
                ),
                // Service Info at bottom
                Positioned(
                  left: 20,
                  right: 20,
                  bottom: 20,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Service Type Badge
                      if (service.type != null)
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            _getServiceTypeLabel(service.type!),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      const SizedBox(height: 12),
                      // Service Name
                      Text(
                        service.name,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          shadows: [
                            Shadow(
                              offset: Offset(0, 2),
                              blurRadius: 4,
                              color: Colors.black38,
                            ),
                          ],
                        ),
                      ),
                      if (service.shortDescription != null &&
                          service.shortDescription!.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        Text(
                          service.shortDescription!,
                          style: TextStyle(
                            color: Colors.white.withOpacity(0.9),
                            fontSize: 14,
                            height: 1.4,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildHeaderPlaceholder() {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Colors.green.shade400,
            Colors.green.shade700,
          ],
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
    );
  }

  Widget _buildMetaRow(Service service) {
    final cards = <Widget>[
      _buildMetaCard(
        icon: Icons.payments_outlined,
        value: _formatCurrency(service.price),
        label: 'Giá dịch vụ',
        color: Colors.green,
      ),
    ];

    if (service.duration != null) {
      cards.add(
        _buildMetaCard(
          icon: Icons.timer_outlined,
          value: '${service.duration} phút',
          label: 'Thời gian',
          color: Colors.blue,
        ),
      );
    }

    if (service.specialtyName != null) {
      cards.add(
        GestureDetector(
          onTap: service.specialtyId != null
              ? () => Navigator.pushNamed(context, '/specialty-detail',
                  arguments: service.specialtyId)
              : null,
          child: _buildMetaCard(
            icon: Icons.healing_outlined,
            value: service.specialtyName!,
            label: 'Chuyên khoa',
            color: Colors.purple,
            showArrow: service.specialtyId != null,
          ),
        ),
      );
    }

    final availableWidth =
        MediaQuery.of(context).size.width - (AppConstants.defaultPadding * 2);
    final columns = cards.length == 1
        ? 1
        : (availableWidth > 540 ? 3 : 2);
    final itemWidth =
        (availableWidth - (columns - 1) * 12) / columns;

    return Wrap(
      spacing: 12,
      runSpacing: 12,
      children: cards
          .map(
            (card) => SizedBox(
              width: itemWidth,
              child: card,
            ),
          )
          .toList(),
    );
  }

  Widget _buildMetaCard({
    required IconData icon,
    required String value,
    required String label,
    required Color color,
    bool showArrow = false,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 22),
          ),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Flexible(
                child: Text(
                  value,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  textAlign: TextAlign.center,
                ),
              ),
              if (showArrow) ...[
                const SizedBox(width: 4),
                Icon(Icons.arrow_forward_ios, size: 12, color: color),
              ],
            ],
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              color: Colors.grey.shade600,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildInfoSection({
    required IconData icon,
    required String title,
    required Widget child,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 12,
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
                  color: Colors.green.shade50,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: Colors.green.shade600, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF1E3A5F),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Container(
            width: double.infinity,
            height: 1,
            color: Colors.grey.shade100,
          ),
          const SizedBox(height: 16),
          child,
        ],
      ),
    );
  }

  Widget _buildBulletPoints(String raw) {
    final lines = raw.split('\n').where((e) => e.trim().isNotEmpty).toList();
    return Column(
      children: lines.asMap().entries.map((entry) {
        final index = entry.key;
        final line = entry.value;
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 28,
                height: 28,
                margin: const EdgeInsets.only(top: 2),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      Colors.green.shade400,
                      Colors.green.shade600,
                    ],
                  ),
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.green.shade200,
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Center(
                  child: Text(
                    '${index + 1}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Text(
                  line,
                  style: TextStyle(
                    color: Colors.grey.shade700,
                    height: 1.5,
                    fontSize: 15,
                  ),
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _buildDoctorCard(Doctor doctor) {
    final avatarUrl = _buildImageUrl(doctor.avatar);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: InkWell(
        onTap: () =>
            Navigator.pushNamed(context, '/doctor-detail', arguments: doctor.id),
        borderRadius: BorderRadius.circular(16),
        child: Row(
          children: [
            Container(
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: Colors.blue.shade100, width: 2),
                boxShadow: [
                  BoxShadow(
                    color: Colors.blue.shade50,
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: CircleAvatar(
                radius: 28,
                backgroundColor: Colors.blue.shade100,
                backgroundImage:
                    avatarUrl != null ? CachedNetworkImageProvider(avatarUrl) : null,
                child: avatarUrl == null
                    ? Text(
                        doctor.fullName.isNotEmpty
                            ? doctor.fullName[0].toUpperCase()
                            : 'B',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Colors.blue.shade700,
                          fontSize: 18,
                        ),
                      )
                    : null,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'BS. ${doctor.fullName}',
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 15,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(Icons.healing, size: 14, color: Colors.green.shade600),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          doctor.specialtyName,
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.grey.shade600,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(Icons.star_rounded, size: 14, color: Colors.amber.shade600),
                      const SizedBox(width: 4),
                      Text(
                        '${doctor.rating.toStringAsFixed(1)} • ${doctor.experience} năm KN',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey.shade500,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.blue.shade50,
                borderRadius: BorderRadius.circular(10),
              ),
              child:
                  Icon(Icons.arrow_forward_ios, size: 16, color: Colors.blue.shade600),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRelatedServiceCard(Service service) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: InkWell(
        onTap: () => Navigator.pushReplacementNamed(context, '/service-detail',
            arguments: service.id),
        borderRadius: BorderRadius.circular(16),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Colors.green.shade400,
                    Colors.green.shade600,
                  ],
                ),
                borderRadius: BorderRadius.circular(14),
                boxShadow: [
                  BoxShadow(
                    color: Colors.green.shade200,
                    blurRadius: 6,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: const Icon(Icons.medical_services_outlined,
                  color: Colors.white, size: 24),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    service.name,
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 15,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    service.description.length > 50
                        ? '${service.description.substring(0, 50)}...'
                        : service.description,
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.grey.shade600,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.green.shade50,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    _formatCurrency(service.price),
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: Colors.green.shade700,
                      fontSize: 12,
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                Icon(Icons.arrow_forward_ios, size: 14, color: Colors.grey.shade400),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildError(String message) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.red.shade50,
                shape: BoxShape.circle,
              ),
              child:
                  Icon(Icons.error_outline, size: 60, color: Colors.red.shade400),
            ),
            const SizedBox(height: 20),
            Text(
              message,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey.shade700,
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _fetchServiceDetail,
              icon: const Icon(Icons.refresh),
              label: const Text('Thử lại'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green.shade600,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatCurrency(double value) {
    if (value <= 0) return 'Liên hệ';
    return _currencyFormatter.format(value);
  }

  String? _buildImageUrl(String? url) {
    if (url == null || url.isEmpty) return null;
    if (url.startsWith('http')) return url;
    return '${ApiConstants.socketUrl}$url';
  }

  String _getServiceTypeLabel(String type) {
    const types = {
      'examination': 'Khám bệnh',
      'diagnostic': 'Chẩn đoán',
      'treatment': 'Điều trị',
      'procedure': 'Thủ thuật',
      'surgery': 'Phẫu thuật',
      'consultation': 'Tư vấn',
    };
    return types[type] ?? type;
  }
}
