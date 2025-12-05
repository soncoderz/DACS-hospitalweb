import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/constants/app_constants.dart';
import '../../../domain/entities/hospital.dart';
import '../../../domain/entities/review.dart';
import '../../providers/hospital_provider.dart';

class HospitalDetailScreen extends StatefulWidget {
  final String hospitalId;

  const HospitalDetailScreen({super.key, required this.hospitalId});

  @override
  State<HospitalDetailScreen> createState() => _HospitalDetailScreenState();
}

class _HospitalDetailScreenState extends State<HospitalDetailScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadDetail();
    });
  }

  Future<void> _loadDetail() async {
    await context.read<HospitalProvider>().fetchHospitalDetail(widget.hospitalId);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Consumer<HospitalProvider>(
        builder: (context, provider, child) {
          final isLoading = provider.isDetailLoading && provider.selectedHospital == null;
          final error = provider.detailError;

          if (isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if ((error != null && provider.selectedHospital == null) || provider.selectedHospital == null) {
            return _buildError(error ?? 'Không tìm thấy chi nhánh');
          }

          final hospital = provider.selectedHospital!;

          return RefreshIndicator(
            onRefresh: _loadDetail,
            child: CustomScrollView(
              slivers: [
                // Hero Image Header with Gradient
                SliverAppBar(
                  expandedHeight: 280,
                  pinned: true,
                  backgroundColor: Colors.blue.shade700,
                  flexibleSpace: FlexibleSpaceBar(
                    background: Stack(
                      fit: StackFit.expand,
                      children: [
                        // Hospital Image
                        CachedNetworkImage(
                          imageUrl: hospital.imageUrl ?? '',
                          fit: BoxFit.cover,
                          placeholder: (context, url) => Container(
                            color: Colors.blue.shade100,
                            child: const Center(
                              child: CircularProgressIndicator(color: Colors.white),
                            ),
                          ),
                          errorWidget: (context, url, error) => Container(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [Colors.blue.shade400, Colors.blue.shade700],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                            ),
                            child: const Icon(Icons.local_hospital, size: 80, color: Colors.white54),
                          ),
                        ),
                        // Gradient Overlay
                        Container(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                Colors.transparent,
                                Colors.black.withOpacity(0.3),
                                Colors.black.withOpacity(0.7),
                              ],
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                              stops: const [0.3, 0.6, 1.0],
                            ),
                          ),
                        ),
                        // Hospital Info Overlay
                        Positioned(
                          left: 16,
                          right: 16,
                          bottom: 20,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                hospital.name,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 24,
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
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                    decoration: BoxDecoration(
                                      color: Colors.white.withOpacity(0.2),
                                      borderRadius: BorderRadius.circular(20),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        const Icon(Icons.star, color: Colors.amber, size: 18),
                                        const SizedBox(width: 4),
                                        Text(
                                          hospital.rating.toStringAsFixed(1),
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                        const SizedBox(width: 4),
                                        Text(
                                          '(${hospital.reviewCount} đánh giá)',
                                          style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 12),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  if (provider.doctors.isNotEmpty)
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                      decoration: BoxDecoration(
                                        color: Colors.white.withOpacity(0.2),
                                        borderRadius: BorderRadius.circular(20),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          const Icon(Icons.person, color: Colors.white, size: 18),
                                          const SizedBox(width: 4),
                                          Text(
                                            '${provider.doctors.length} bác sĩ',
                                            style: const TextStyle(color: Colors.white, fontSize: 12),
                                          ),
                                        ],
                                      ),
                                    ),
                                ],
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
                        // Statistics Cards
                        _buildStatsRow(hospital, provider),
                        const SizedBox(height: 16),
                        _buildInfoCard(
                          title: 'Giới thiệu',
                          child: Text(
                            hospital.description ?? 'Chi nhánh đang cập nhật giới thiệu.',
                            style: const TextStyle(height: 1.5),
                          ),
                        ),
                        const SizedBox(height: 16),
                        _buildContactCard(hospital),
                        if (provider.specialties.isNotEmpty) ...[
                          const SizedBox(height: 16),
                          _buildInfoCard(
                            title: 'Chuyên khoa',
                            child: Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: provider.specialties
                                  .map(
                                    (s) => ActionChip(
                                      label: Text(s.name),
                                      onPressed: () => Navigator.pushNamed(
                                        context,
                                        '/specialty-detail',
                                        arguments: s.id,
                                      ),
                                    ),
                                  )
                                  .toList(),
                            ),
                          ),
                        ],
                        if (provider.services.isNotEmpty) ...[
                          const SizedBox(height: 16),
                          _buildInfoCard(
                            title: 'Dịch vụ tại chi nhánh',
                            child: Column(
                              children: provider.services
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
                        if (provider.doctors.isNotEmpty) ...[
                          const SizedBox(height: 16),
                          _buildInfoCard(
                            title: 'Đội ngũ bác sĩ',
                            child: Column(
                              children: provider.doctors
                                  .map(
                                    (doctor) => ListTile(
                                      contentPadding: EdgeInsets.zero,
                                      leading: CircleAvatar(
                                        radius: 24,
                                        backgroundColor: Colors.blue.shade50,
                                        backgroundImage: doctor.avatar != null
                                            ? CachedNetworkImageProvider(doctor.avatar!)
                                            : null,
                                        child: doctor.avatar == null
                                            ? const Icon(Icons.person, color: Colors.blue)
                                            : null,
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
                        if (provider.reviews.isNotEmpty) ...[
                          const SizedBox(height: 16),
                          _buildReviewsSection(provider.reviews, hospital),
                        ],
                        // Location Card
                        if (hospital.address != null) ...[
                          const SizedBox(height: 16),
                          _buildLocationCard(hospital),
                        ],
                        const SizedBox(height: 24),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton.icon(
                            onPressed: () => Navigator.pushNamed(
                              context,
                              '/appointment-booking',
                              arguments: {'hospitalId': widget.hospitalId},
                            ),
                            icon: const Icon(Icons.calendar_month),
                            label: const Text(
                              'Đặt lịch khám tại chi nhánh',
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

  Widget _buildStatsRow(Hospital hospital, HospitalProvider provider) {
    return Row(
      children: [
        Expanded(
          child: _buildStatCard(
            icon: Icons.person_search,
            label: 'Bác sĩ',
            value: (provider.doctors.isNotEmpty ? provider.doctors.length : hospital.doctorCount ?? 0).toString(),
            color: Colors.blue,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _buildStatCard(
            icon: Icons.healing,
            label: 'Chuyên khoa',
            value: (provider.specialties.isNotEmpty ? provider.specialties.length : hospital.specialtyCount ?? 0).toString(),
            color: Colors.purple,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _buildStatCard(
            icon: Icons.medical_services,
            label: 'Dịch vụ',
            value: (provider.services.isNotEmpty ? provider.services.length : hospital.serviceCount ?? 0).toString(),
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
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 28),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey.shade700,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContactCard(Hospital hospital) {
    return _buildInfoCard(
      title: 'Liên hệ',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (hospital.phone != null) ...[
            Row(
              children: [
                const Icon(Icons.phone, color: Colors.blue),
                const SizedBox(width: 8),
                Text(hospital.phone!, style: const TextStyle(fontWeight: FontWeight.w600)),
              ],
            ),
            const SizedBox(height: 8),
          ],
          if (hospital.email != null) ...[
            Row(
              children: [
                const Icon(Icons.email, color: Colors.blue),
                const SizedBox(width: 8),
                Text(hospital.email!, style: const TextStyle(fontWeight: FontWeight.w600)),
              ],
            ),
            const SizedBox(height: 8),
          ],
          if (hospital.openingHours != null) ...[
            Row(
              children: [
                const Icon(Icons.schedule, color: Colors.blue),
                const SizedBox(width: 8),
                Expanded(child: Text(hospital.openingHours!)),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildInfoCard({required String title, required Widget child}) {
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

  Widget _buildReviewsSection(List<Review> reviews, Hospital hospital) {
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
          Row(
            children: [
              const Text(
                'Đánh giá nổi bật',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.amber.shade50,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.star, color: Colors.amber, size: 18),
                    const SizedBox(width: 4),
                    Text(
                      hospital.rating.toStringAsFixed(1),
                      style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.amber),
                    ),
                    Text(
                      ' (${hospital.reviewCount})',
                      style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...reviews.take(3).map((review) => _buildReviewTile(review)),
        ],
      ),
    );
  }

  Widget _buildReviewTile(Review review) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: Colors.grey.shade200)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 18,
            backgroundColor: Colors.blue.shade100,
            backgroundImage: review.userAvatar != null ? CachedNetworkImageProvider(review.userAvatar!) : null,
            child: review.userAvatar == null
                ? Text(
                    review.userName.isNotEmpty ? review.userName[0].toUpperCase() : '?',
                    style: const TextStyle(color: Colors.blue, fontWeight: FontWeight.bold),
                  )
                : null,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        review.userName,
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                    ),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: List.generate(
                        5,
                        (index) => Icon(
                          index < review.rating ? Icons.star : Icons.star_border,
                          color: Colors.amber,
                          size: 14,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  review.comment,
                  style: TextStyle(color: Colors.grey.shade700, height: 1.4),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLocationCard(Hospital hospital) {
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
          const Text(
            'Vị trí',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          // Map Placeholder
          Container(
            height: 150,
            decoration: BoxDecoration(
              color: Colors.grey.shade200,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Stack(
              children: [
                Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.map_outlined, size: 48, color: Colors.grey.shade400),
                      const SizedBox(height: 8),
                      Text(
                        'Bản đồ',
                        style: TextStyle(color: Colors.grey.shade500),
                      ),
                    ],
                  ),
                ),
                Positioned.fill(
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      borderRadius: BorderRadius.circular(12),
                      onTap: () {
                        // TODO: Open map with hospital location
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Tính năng bản đồ sẽ sớm có mặt')),
                        );
                      },
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(Icons.location_on, color: Colors.red.shade400, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  hospital.address!,
                  style: TextStyle(color: Colors.grey.shade700, height: 1.4),
                ),
              ),
            ],
          ),
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
            onPressed: _loadDetail,
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
