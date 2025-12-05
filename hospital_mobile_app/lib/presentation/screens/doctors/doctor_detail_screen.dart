import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/constants/app_constants.dart';
import '../../../domain/entities/doctor.dart';
import '../../../domain/entities/review.dart';
import '../../../domain/entities/service.dart';
import '../../providers/doctor_provider.dart';
import '../../widgets/common/custom_button.dart';
import '../../widgets/common/full_screen_image_viewer.dart';

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

  void _openFullScreenImage(String imageUrl, String title, {String? heroTag}) {
    FullScreenImageViewer.show(
      context,
      imageUrl,
      heroTag: heroTag ?? 'doctor_image_${widget.doctorId}',
      title: title,
    );
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
                      background: GestureDetector(
                        onTap: () => _openFullScreenImage(
                          _resolveImageUrl(
                            doctor.avatar,
                            AppConstants.defaultDoctorAvatarUrl,
                          ),
                          doctor.fullName,
                        ),
                        child: Stack(
                          fit: StackFit.expand,
                          children: [
                            Hero(
                              tag: 'doctor_image_${widget.doctorId}',
                              child: CachedNetworkImage(
                                imageUrl: _resolveImageUrl(
                                  doctor.avatar,
                                  AppConstants.defaultDoctorAvatarUrl,
                                ),
                                fit: BoxFit.cover,
                                errorWidget: (context, url, error) => Container(
                                  color: Colors.blue.shade50,
                                  child: const Icon(Icons.person, size: 80, color: Colors.blueGrey),
                                ),
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
                          _buildProfileHeader(doctor, doctorProvider, doctorProvider.doctorReviews),
                          const SizedBox(height: 16),
                          _buildStatsSection(doctor, doctorProvider.doctorReviews),
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
                            _buildReviewsSection(reviews, doctor),
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

  Widget _buildProfileHeader(Doctor doctor, DoctorProvider provider, List<Review> reviews) {
    final avatarUrl = _resolveImageUrl(
      doctor.avatar,
      AppConstants.defaultDoctorAvatarUrl,
    );
    final isFavorite = provider.isFavorite(doctor.id);
    final averageRating = _calculateAverageRating(doctor, reviews);
    final reviewCount = _calculateReviewCount(doctor, reviews);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              GestureDetector(
                onTap: () => _openFullScreenImage(
                  avatarUrl,
                  doctor.fullName,
                  heroTag: 'doctor_avatar_${doctor.id}',
                ),
                child: Hero(
                  tag: 'doctor_avatar_${doctor.id}',
                  child: ClipOval(
                    child: CachedNetworkImage(
                      imageUrl: avatarUrl,
                      width: 84,
                      height: 84,
                      fit: BoxFit.cover,
                      placeholder: (context, url) => Container(
                        width: 84,
                        height: 84,
                        color: Colors.blue.shade50,
                        child: const Icon(Icons.person, color: Colors.blueGrey),
                      ),
                      errorWidget: (context, url, error) => Container(
                        width: 84,
                        height: 84,
                        color: Colors.blue.shade50,
                        child: const Icon(Icons.person, color: Colors.blueGrey),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'BS. ${doctor.fullName}',
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        if (doctor.specialtyName.isNotEmpty)
                          Chip(
                            label: Text(
                              doctor.specialtyName,
                              style: const TextStyle(
                                color: Colors.blue,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            backgroundColor: Colors.blue.shade50,
                          ),
                        Chip(
                          label: Text('${doctor.experience} năm kinh nghiệm'),
                          backgroundColor: Colors.grey.shade100,
                        ),
                        Chip(
                          label: Text(
                            '${averageRating.toStringAsFixed(1)} ⭐ ($reviewCount đánh giá)',
                          ),
                          backgroundColor: Colors.yellow.shade50,
                        ),
                      ],
                    ),
                    if (doctor.hospitalName != null) ...[
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          const Icon(Icons.local_hospital, size: 18, color: Colors.blue),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              doctor.hospitalName!,
                              style: const TextStyle(color: Colors.black87),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: CustomButton(
                  text: 'Đặt lịch khám',
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
              const SizedBox(width: 10),
              OutlinedButton.icon(
                onPressed: () async {
                  final success = await provider.toggleFavorite(doctor.id);
                  if (!mounted) return;
                  final nowFavorite = provider.isFavorite(doctor.id);
                  final message = success
                      ? (nowFavorite
                          ? 'Đã thêm bác sĩ vào danh sách yêu thích'
                          : 'Đã xóa bác sĩ khỏi danh sách yêu thích')
                      : 'Không thể cập nhật danh sách yêu thích';
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(message)),
                  );
                },
                icon: Icon(
                  isFavorite ? Icons.favorite : Icons.favorite_border,
                  color: isFavorite ? Colors.red : Colors.blueGrey,
                ),
                label: Text(isFavorite ? 'Đã yêu thích' : 'Yêu thích'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatsSection(Doctor doctor, List<Review> reviews) {
    final averageRating = _calculateAverageRating(doctor, reviews);
    final reviewCount = _calculateReviewCount(doctor, reviews);

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        _buildStatChip(Icons.star, averageRating.toStringAsFixed(1), '$reviewCount đánh giá', Colors.amber),
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

  Widget _buildReviewsSection(List<Review> reviews, Doctor doctor) {
    // Calculate rating distribution
    final ratingCounts = List.filled(5, 0);
    for (final review in reviews) {
      if (review.rating >= 1 && review.rating <= 5) {
        ratingCounts[review.rating - 1]++;
      }
    }
    final totalReviews = reviews.length;
    final displayedReviewCount = _calculateReviewCount(doctor, reviews);
    final overallRating = _calculateAverageRating(doctor, reviews);

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
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Đánh giá của bệnh nhân',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
              ),
              if (reviews.length > 3)
                TextButton(
                  onPressed: () {
                    // TODO: Navigate to all reviews page
                  },
                  child: const Text('Xem tất cả'),
                ),
            ],
          ),
          const SizedBox(height: 12),
          // Rating Summary
          Row(
            children: [
              // Overall Rating
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.amber.shade50,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  children: [
                    Text(
                      overallRating.toStringAsFixed(1),
                      style: const TextStyle(
                        fontSize: 36,
                        fontWeight: FontWeight.bold,
                        color: Colors.amber,
                      ),
                    ),
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: List.generate(5, (i) => Icon(
                          Icons.star,
                          size: 14,
                          color: i < overallRating.round() ? Colors.amber : Colors.grey.shade300,
                        )),
                      ),
                    const SizedBox(height: 4),
                    Text(
                      '$displayedReviewCount đánh giá',
                      style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              // Rating Distribution
              Expanded(
                child: Column(
                  children: List.generate(5, (index) {
                    final starCount = 5 - index;
                    final count = ratingCounts[starCount - 1];
                    final percentage = totalReviews > 0 ? count / totalReviews : 0.0;
                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 2),
                      child: Row(
                        children: [
                          Text('$starCount', style: const TextStyle(fontSize: 12)),
                          const Icon(Icons.star, size: 12, color: Colors.amber),
                          const SizedBox(width: 8),
                          Expanded(
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(4),
                              child: LinearProgressIndicator(
                                value: percentage,
                                backgroundColor: Colors.grey.shade200,
                                valueColor: AlwaysStoppedAnimation(Colors.amber.shade400),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          SizedBox(
                            width: 30,
                            child: Text(
                              '$count',
                              style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                            ),
                          ),
                        ],
                      ),
                    );
                  }),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Divider(),
          // Review List
          ...reviews.take(3).toList().asMap().entries.map((entry) {
            final index = entry.key;
            final review = entry.value;
            return _buildReviewTile(review, isTopReview: index == 0 && review.rating >= 4);
          }),
        ],
      ),
    );
  }

  Widget _buildReviewTile(Review review, {bool isTopReview = false}) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: Colors.grey.shade200)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (isTopReview)
            Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.amber.shade400, Colors.orange.shade400],
                ),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.star, size: 14, color: Colors.white),
                  SizedBox(width: 4),
                  Text(
                    'Đánh giá nổi bật',
                    style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CircleAvatar(
                radius: 20,
                backgroundImage: review.userAvatar != null
                    ? CachedNetworkImageProvider(
                        _resolveImageUrl(review.userAvatar, AppConstants.defaultAvatarUrl),
                      )
                    : null,
                backgroundColor: Colors.blue.shade100,
                child: review.userAvatar == null
                    ? Text(
                        review.userName.isNotEmpty ? review.userName[0].toUpperCase() : '?',
                        style: const TextStyle(color: Colors.blue, fontWeight: FontWeight.bold),
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
                          style: TextStyle(color: Colors.grey.shade500, fontSize: 12),
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
                          size: 16,
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      review.comment,
                      style: TextStyle(color: Colors.grey.shade700, height: 1.4),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _formatCurrency(double value) {
    if (value == 0) return 'Liên hệ';
    return '${value.toStringAsFixed(0)} VNĐ';
  }

  double _calculateAverageRating(Doctor doctor, List<Review> reviews) {
    if (doctor.rating > 0) return doctor.rating;
    if (reviews.isEmpty) return 0;
    final total = reviews.fold<int>(0, (sum, r) => sum + r.rating);
    return total / reviews.length;
  }

  int _calculateReviewCount(Doctor doctor, List<Review> reviews) {
    if (doctor.reviewCount > 0) return doctor.reviewCount;
    return reviews.length;
  }

  String _resolveImageUrl(String? url, String fallback) {
    if (url == null || url.isEmpty) return fallback;
    if (url.startsWith('http')) return url;
    return '${ApiConstants.socketUrl}$url';
  }
}
