import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_constants.dart';
import '../../../domain/entities/doctor.dart';
import '../../../domain/entities/review.dart';
import '../../../domain/entities/service.dart';
import '../../providers/doctor_provider.dart';
import '../../widgets/common/custom_button.dart';

class DoctorDetailScreen extends StatefulWidget {
  final String doctorId;

  const DoctorDetailScreen({
    super.key,
    required this.doctorId,
  });

  @override
  State<DoctorDetailScreen> createState() => _DoctorDetailScreenState();
}

class _DoctorDetailScreenState extends State<DoctorDetailScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<DoctorProvider>().fetchDoctorDetail(widget.doctorId);
    });
  }

  Future<void> _onRefresh() async {
    await context.read<DoctorProvider>().fetchDoctorDetail(widget.doctorId);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Consumer<DoctorProvider>(
          builder: (context, doctorProvider, child) {
            final isLoading = doctorProvider.isLoading || doctorProvider.isDetailLoading;
            final error = doctorProvider.detailError ?? doctorProvider.errorMessage;

            if (isLoading && doctorProvider.selectedDoctor == null) {
              return const Center(child: CircularProgressIndicator());
            }

            if (error != null && doctorProvider.selectedDoctor == null) {
              return _buildErrorState(error, doctorProvider);
            }

            final doctor = doctorProvider.selectedDoctor;
            if (doctor == null) {
              return _buildErrorState('Không tìm thấy thông tin bác sĩ', doctorProvider);
            }

            final services = doctorProvider.doctorServices;
            final reviews = doctorProvider.doctorReviews;

            return RefreshIndicator(
              onRefresh: _onRefresh,
              child: CustomScrollView(
                slivers: [
                  SliverAppBar(
                    expandedHeight: 260,
                    pinned: true,
                    backgroundColor: Colors.white,
                    flexibleSpace: FlexibleSpaceBar(
                      background: Stack(
                        fit: StackFit.expand,
                        children: [
                          CachedNetworkImage(
                            imageUrl: doctor.avatar ?? AppConstants.defaultDoctorAvatarUrl,
                            fit: BoxFit.cover,
                            errorWidget: (context, url, error) => Container(
                              color: Colors.blue.shade50,
                              child: const Icon(Icons.person, size: 80, color: Colors.blueGrey),
                            ),
                          ),
                          Container(
                            decoration: const BoxDecoration(
                              gradient: LinearGradient(
                                colors: [Colors.transparent, Colors.black54],
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                              ),
                            ),
                          ),
                          Positioned(
                            left: 16,
                            right: 16,
                            bottom: 24,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                      decoration: BoxDecoration(
                                        color: Colors.white.withOpacity(0.15),
                                        borderRadius: BorderRadius.circular(30),
                                      ),
                                      child: const Text(
                                        'Bác sĩ',
                                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
                                      ),
                                    ),
                                    if (doctor.specialtyName.isNotEmpty) ...[
                                      const SizedBox(width: 8),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                        decoration: BoxDecoration(
                                          color: Colors.blue.withOpacity(0.7),
                                          borderRadius: BorderRadius.circular(30),
                                        ),
                                        child: Text(
                                          doctor.specialtyName,
                                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                                const SizedBox(height: 12),
                                Text(
                                  doctor.fullName,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 26,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                if (doctor.hospitalName != null)
                                  Row(
                                    children: [
                                      const Icon(Icons.local_hospital, color: Colors.white70, size: 18),
                                      const SizedBox(width: 6),
                                      Expanded(
                                        child: Text(
                                          doctor.hospitalName!,
                                          style: const TextStyle(color: Colors.white70),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
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
                    actions: [
                      IconButton(
                        icon: Icon(
                          doctorProvider.isFavorite(doctor.id) ? Icons.favorite : Icons.favorite_border,
                          color: doctorProvider.isFavorite(doctor.id) ? Colors.redAccent : Colors.white,
                        ),
                        onPressed: () => doctorProvider.toggleFavorite(doctor.id),
                      ),
                    ],
                  ),
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.all(AppConstants.defaultPadding),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildStatsSection(doctor),
                          const SizedBox(height: 16),
                          _buildInfoCard(
                            title: 'Giới thiệu',
                            child: Text(
                              doctor.bio ?? 'Bác sĩ đang cập nhật thông tin giới thiệu.',
                              style: const TextStyle(height: 1.5),
                            ),
                          ),
                          if (doctor.certifications.isNotEmpty || doctor.specializations.isNotEmpty) ...[
                            const SizedBox(height: 16),
                            _buildInfoCard(
                              title: 'Chuyên môn & Chứng chỉ',
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  if (doctor.specializations.isNotEmpty) ...[
                                    const Text('Lĩnh vực chuyên môn', style: TextStyle(fontWeight: FontWeight.w600)),
                                    const SizedBox(height: 8),
                                    Wrap(
                                      spacing: 8,
                                      runSpacing: 8,
                                      children: doctor.specializations
                                          .map((item) => Chip(
                                                label: Text(item),
                                                backgroundColor: Colors.blue.shade50,
                                                labelStyle: const TextStyle(color: Colors.blue),
                                              ))
                                          .toList(),
                                    ),
                                    const SizedBox(height: 12),
                                  ],
                                  if (doctor.certifications.isNotEmpty) ...[
                                    const Text('Chứng chỉ', style: TextStyle(fontWeight: FontWeight.w600)),
                                    const SizedBox(height: 8),
                                    ...doctor.certifications.map(
                                      (cert) => Padding(
                                        padding: const EdgeInsets.only(bottom: 6),
                                        child: Row(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            const Icon(Icons.check_circle, color: Colors.green, size: 18),
                                            const SizedBox(width: 8),
                                            Expanded(child: Text(cert)),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ],
                          if (doctor.education != null && doctor.education!.isNotEmpty) ...[
                            const SizedBox(height: 16),
                            _buildInfoCard(
                              title: 'Học vấn',
                              child: Text(
                                doctor.education!,
                                style: const TextStyle(height: 1.5),
                              ),
                            ),
                          ],
                          if (doctor.languages.isNotEmpty) ...[
                            const SizedBox(height: 16),
                            _buildInfoCard(
                              title: 'Ngôn ngữ',
                              child: Wrap(
                                spacing: 10,
                                runSpacing: 10,
                                children: doctor.languages
                                    .map((lang) => Chip(
                                          label: Text(lang),
                                          backgroundColor: Colors.grey.shade100,
                                        ))
                                    .toList(),
                              ),
                            ),
                          ],
                          if (doctor.hospitalName != null) ...[
                            const SizedBox(height: 16),
                            _buildInfoCard(
                              title: 'Công tác tại',
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      const Icon(Icons.local_hospital, color: Colors.blue, size: 20),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Text(
                                          doctor.hospitalName!,
                                          style: const TextStyle(fontWeight: FontWeight.w600),
                                        ),
                                      ),
                                    ],
                                  ),
                                  if (doctor.hospitalAddress != null) ...[
                                    const SizedBox(height: 6),
                                    Row(
                                      children: [
                                        Icon(Icons.location_on, color: Colors.grey.shade600, size: 18),
                                        const SizedBox(width: 6),
                                        Expanded(
                                          child: Text(
                                            doctor.hospitalAddress!,
                                            style: TextStyle(color: Colors.grey.shade700),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ],
                          if (services.isNotEmpty) ...[
                            const SizedBox(height: 16),
                            _buildInfoCard(
                              title: 'Dịch vụ nổi bật',
                              child: Column(
                                children: services.map((service) => _buildServiceTile(service)).toList(),
                              ),
                            ),
                          ],
                          if (reviews.isNotEmpty) ...[
                            const SizedBox(height: 16),
                            _buildInfoCard(
                              title: 'Đánh giá của bệnh nhân',
                              child: Column(
                                children: reviews
                                    .take(3)
                                    .map((review) => _buildReviewTile(review))
                                    .toList(),
                              ),
                            ),
                          ],
                          const SizedBox(height: 24),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ),
      bottomNavigationBar: Consumer<DoctorProvider>(
        builder: (context, doctorProvider, child) {
          final doctor = doctorProvider.selectedDoctor;
          if (doctor == null) return const SizedBox.shrink();

          return Container(
            padding: const EdgeInsets.all(AppConstants.defaultPadding),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.08),
                  blurRadius: 12,
                  offset: const Offset(0, -4),
                ),
              ],
            ),
            child: SafeArea(
              child: CustomButton(
                text: 'Đặt lịch khám với bác sĩ',
                onPressed: () {
                  Navigator.pushNamed(
                    context,
                    '/appointment-booking',
                    arguments: {
                      'doctorId': doctor.id,
                      'specialtyId': doctor.specialtyId,
                      'hospitalId': doctor.hospitalId,
                    },
                  );
                },
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildErrorState(String message, DoctorProvider provider) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, size: 60, color: Colors.red),
          const SizedBox(height: 12),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Text(message, textAlign: TextAlign.center),
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: () => provider.fetchDoctorDetail(widget.doctorId),
            icon: const Icon(Icons.refresh),
            label: const Text('Thử lại'),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsSection(Doctor doctor) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        _buildStatChip(Icons.star, '${doctor.rating.toStringAsFixed(1)}', '${doctor.reviewCount} đánh giá', Colors.amber),
        _buildStatChip(Icons.work_outline, '${doctor.experience} năm', 'Kinh nghiệm', Colors.blue),
        _buildStatChip(Icons.attach_money, _formatCurrency(doctor.consultationFee), 'Phí khám', Colors.green),
      ],
    );
  }

  Widget _buildStatChip(IconData icon, String value, String label, Color color) {
    final Color effectiveTextColor =
        color is MaterialColor ? color.shade700 : color.withOpacity(0.8);

    return Expanded(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 4),
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 10),
        decoration: BoxDecoration(
          color: color.withOpacity(0.08),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(icon, color: color, size: 18),
                const SizedBox(width: 6),
                Flexible(
                  child: Text(
                    value,
                    style: TextStyle(
                      color: effectiveTextColor,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(color: Colors.grey.shade700, fontSize: 12),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoCard({required String title, required Widget child}) {
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
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 10),
          child,
        ],
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.medical_services_outlined, color: Colors.blue),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  service.name,
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
              ),
              Text(
                _formatCurrency(service.price),
                style: const TextStyle(color: Colors.green, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            service.description.length > 120
                ? '${service.description.substring(0, 120)}...'
                : service.description,
            style: TextStyle(color: Colors.grey.shade700),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              OutlinedButton(
                onPressed: () {
                  Navigator.pushNamed(
                    context,
                    '/service-detail',
                    arguments: service.id,
                  );
                },
                child: const Text('Xem chi tiết'),
              ),
              const SizedBox(width: 8),
              ElevatedButton.icon(
                onPressed: () {
                  Navigator.pushNamed(
                    context,
                    '/appointment-booking',
                    arguments: {
                      'serviceId': service.id,
                    },
                  );
                },
                icon: const Icon(Icons.calendar_today, size: 18),
                label: const Text('Đặt dịch vụ'),
              ),
            ],
          ),
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
            backgroundImage: review.userAvatar != null ? NetworkImage(review.userAvatar!) : null,
            backgroundColor: Colors.blue.shade100,
            child: review.userAvatar == null
                ? Text(
                    review.userName.isNotEmpty ? review.userName[0].toUpperCase() : '?',
                    style: const TextStyle(color: Colors.white),
                  )
                : null,
          ),
          const SizedBox(width: 12),
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
                    Text(
                      '${review.createdAt.day}/${review.createdAt.month}/${review.createdAt.year}',
                      style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  children: List.generate(
                    5,
                    (index) => Icon(
                      index < review.rating ? Icons.star : Icons.star_border,
                      color: Colors.amber,
                      size: 18,
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                Text(review.comment),
              ],
            ),
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
