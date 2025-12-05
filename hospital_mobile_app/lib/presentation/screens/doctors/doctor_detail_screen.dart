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
      backgroundColor: const Color(0xFFF8FAFC),
      body: Consumer<DoctorProvider>(
        builder: (context, doctorProvider, child) {
          final isLoading =
              doctorProvider.isLoading || doctorProvider.isDetailLoading;
          final error =
              doctorProvider.detailError ?? doctorProvider.errorMessage;

          if (isLoading && doctorProvider.selectedDoctor == null) {
            return const Center(child: CircularProgressIndicator());
          }

          if (error != null && doctorProvider.selectedDoctor == null) {
            return _buildErrorState(error, doctorProvider);
          }

          final doctor = doctorProvider.selectedDoctor;
          if (doctor == null) {
            return _buildErrorState(
                'Không tìm thấy thông tin bác sĩ', doctorProvider);
          }

          final services = doctorProvider.doctorServices;
          final reviews = doctorProvider.doctorReviews;

          return RefreshIndicator(
            onRefresh: _onRefresh,
            child: CustomScrollView(
              slivers: [
                _buildSliverAppBar(doctor, reviews, doctorProvider),
                  SliverToBoxAdapter(
                    child: Padding(
                      padding:
                          const EdgeInsets.all(AppConstants.defaultPadding),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildQuickActions(doctor, doctorProvider),
                          const SizedBox(height: 20),
                          _buildStatsRow(doctor, reviews),
                          const SizedBox(height: 20),
                          _buildInfoSection(
                            icon: Icons.info_outline,
                            title: 'Giới thiệu',
                            child: Text(
                              doctor.bio ??
                                  'Bác sĩ đang cập nhật thông tin giới thiệu.',
                              style: TextStyle(
                                height: 1.6,
                                color: Colors.grey.shade700,
                                fontSize: 15,
                              ),
                            ),
                          ),
                          if (doctor.certifications.isNotEmpty ||
                              doctor.specializations.isNotEmpty) ...[
                            const SizedBox(height: 16),
                            _buildInfoSection(
                              icon: Icons.verified_outlined,
                              title: 'Chuyên môn & Chứng chỉ',
                              child: _buildCertificationsContent(doctor),
                            ),
                          ],
                          if (doctor.education != null &&
                              doctor.education!.isNotEmpty) ...[
                            const SizedBox(height: 16),
                            _buildInfoSection(
                              icon: Icons.school_outlined,
                              title: 'Trình độ học vấn',
                              child: Text(
                                doctor.education!,
                                style: TextStyle(
                                  height: 1.6,
                                  color: Colors.grey.shade700,
                                  fontSize: 15,
                                ),
                              ),
                            ),
                          ],
                          if (doctor.languages.isNotEmpty) ...[
                            const SizedBox(height: 16),
                            _buildInfoSection(
                              icon: Icons.language_outlined,
                              title: 'Ngôn ngữ',
                              child: Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                children: doctor.languages
                                    .map((lang) => Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 14,
                                            vertical: 8,
                                          ),
                                          decoration: BoxDecoration(
                                            color: Colors.grey.shade100,
                                            borderRadius:
                                                BorderRadius.circular(20),
                                          ),
                                          child: Text(
                                            lang,
                                            style: TextStyle(
                                              color: Colors.grey.shade700,
                                              fontWeight: FontWeight.w500,
                                            ),
                                          ),
                                        ))
                                    .toList(),
                              ),
                            ),
                          ],
                          if (doctor.hospitalName != null) ...[
                            const SizedBox(height: 16),
                            _buildInfoSection(
                              icon: Icons.local_hospital_outlined,
                              title: 'Công tác tại',
                              child: _buildHospitalInfo(doctor),
                            ),
                          ],
                          if (services.isNotEmpty) ...[
                            const SizedBox(height: 16),
                            _buildInfoSection(
                              icon: Icons.medical_services_outlined,
                              title: 'Dịch vụ nổi bật',
                              child: Column(
                                children: services
                                    .map((service) => _buildServiceTile(service))
                                    .toList(),
                              ),
                            ),
                          ],
                          if (reviews.isNotEmpty) ...[
                            const SizedBox(height: 16),
                            _buildReviewsSection(reviews, doctor),
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
                  blurRadius: 16,
                  offset: const Offset(0, -4),
                ),
              ],
            ),
            child: SafeArea(
              child: Row(
                children: [
                  Expanded(
                    child: Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            Colors.blue.shade600,
                            Colors.blue.shade800,
                          ],
                        ),
                        borderRadius: BorderRadius.circular(14),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.blue.shade400.withOpacity(0.4),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Material(
                        color: Colors.transparent,
                        child: InkWell(
                          onTap: () {
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
                                  'Đặt lịch khám',
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
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildSliverAppBar(
      Doctor doctor, List<Review> reviews, DoctorProvider doctorProvider) {
    final imageUrl = _resolveImageUrl(
      doctor.avatar,
      AppConstants.defaultDoctorAvatarUrl,
    );
    final averageRating = _calculateAverageRating(doctor, reviews);
    final reviewCount = _calculateReviewCount(doctor, reviews);

    return SliverAppBar(
      expandedHeight: 320,
      pinned: true,
      elevation: 0,
      backgroundColor: Colors.blue.shade700,
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
      actions: [
        Container(
          margin: const EdgeInsets.only(right: 12, top: 8, bottom: 8),
          decoration: BoxDecoration(
            color: Colors.black.withOpacity(0.2),
            shape: BoxShape.circle,
          ),
          child: IconButton(
            icon: Icon(
              doctorProvider.isFavorite(doctor.id)
                  ? Icons.favorite
                  : Icons.favorite_border,
              color: doctorProvider.isFavorite(doctor.id)
                  ? Colors.redAccent
                  : Colors.white,
            ),
            onPressed: () => doctorProvider.toggleFavorite(doctor.id),
          ),
        ),
      ],
      flexibleSpace: LayoutBuilder(
        builder: (context, constraints) {
          final collapsed = constraints.biggest.height <= kToolbarHeight + 60;
          return FlexibleSpaceBar(
            titlePadding: const EdgeInsets.only(left: 56, bottom: 16),
            title: collapsed
                ? Text(
                    'BS. ${doctor.fullName}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                      fontSize: 16,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  )
                : null,
            background: GestureDetector(
              onTap: () => _openFullScreenImage(
                imageUrl,
                doctor.fullName,
                heroTag: 'doctor_image_${widget.doctorId}',
              ),
              child: Stack(
                fit: StackFit.expand,
                children: [
                  // Background Image
                  Hero(
                    tag: 'doctor_image_${widget.doctorId}',
                    child: CachedNetworkImage(
                      imageUrl: imageUrl,
                      fit: BoxFit.cover,
                      errorWidget: (context, url, error) => Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              Colors.blue.shade400,
                              Colors.blue.shade800,
                            ],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                        ),
                        child: const Icon(Icons.person,
                            size: 100, color: Colors.white30),
                      ),
                    ),
                  ),
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
                  // Content at bottom
                  Positioned(
                    left: 20,
                    right: 20,
                    bottom: 20,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Tags row
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            _buildHeaderTag('Bác sĩ', Colors.white24),
                            if (doctor.specialtyName.isNotEmpty)
                              _buildHeaderTag(
                                doctor.specialtyName,
                                Colors.blue.shade400.withOpacity(0.9),
                              ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        // Doctor name
                        Text(
                          'BS. ${doctor.fullName}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 26,
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
                        const SizedBox(height: 8),
                        // Hospital name
                        if (doctor.hospitalName != null)
                          Row(
                            children: [
                              const Icon(Icons.local_hospital,
                                  color: Colors.white70, size: 16),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  doctor.hospitalName!,
                                  style: const TextStyle(
                                    color: Colors.white70,
                                    fontSize: 14,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        const SizedBox(height: 12),
                        // Info chips
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            _buildInfoChip(
                              Icons.star_rounded,
                              '${averageRating.toStringAsFixed(1)} ($reviewCount đánh giá)',
                              Colors.amber,
                            ),
                            _buildInfoChip(
                              Icons.work_outline_rounded,
                              '${doctor.experience} năm KN',
                              Colors.white70,
                            ),
                            _buildInfoChip(
                              Icons.payments_outlined,
                              _formatCurrency(doctor.consultationFee),
                              Colors.greenAccent,
                            ),
                          ],
                        ),
                      ],
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

  Widget _buildHeaderTag(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        text,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _buildInfoChip(IconData icon, String text, Color iconColor) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.15),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white24),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: iconColor, size: 16),
          const SizedBox(width: 6),
          Text(
            text,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActions(Doctor doctor, DoctorProvider provider) {
    final isFavorite = provider.isFavorite(doctor.id);

    return Row(
      children: [
        Expanded(
          child: _buildActionButton(
            icon: Icons.calendar_today_rounded,
            label: 'Đặt lịch khám',
            color: Colors.blue.shade600,
            onTap: () {
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
        const SizedBox(width: 12),
        Expanded(
          child: _buildActionButton(
            icon: isFavorite ? Icons.favorite : Icons.favorite_border,
            label: isFavorite ? 'Đã yêu thích' : 'Yêu thích',
            color: isFavorite ? Colors.red.shade400 : Colors.grey.shade600,
            isOutlined: true,
            onTap: () async {
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
          ),
        ),
      ],
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
    bool isOutlined = false,
  }) {
    return Material(
      color: isOutlined ? Colors.white : color,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: isOutlined ? Border.all(color: color, width: 1.5) : null,
            boxShadow: isOutlined
                ? null
                : [
                    BoxShadow(
                      color: color.withOpacity(0.3),
                      blurRadius: 8,
                      offset: const Offset(0, 3),
                    ),
                  ],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: isOutlined ? color : Colors.white, size: 18),
              const SizedBox(width: 8),
              Text(
                label,
                style: TextStyle(
                  color: isOutlined ? color : Colors.white,
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatsRow(Doctor doctor, List<Review> reviews) {
    final averageRating = _calculateAverageRating(doctor, reviews);
    final reviewCount = _calculateReviewCount(doctor, reviews);

    return Row(
      children: [
        _buildStatCard(
          icon: Icons.star_rounded,
          value: averageRating.toStringAsFixed(1),
          label: '$reviewCount đánh giá',
          color: Colors.amber,
        ),
        const SizedBox(width: 12),
        _buildStatCard(
          icon: Icons.work_outline_rounded,
          value: '${doctor.experience}',
          label: 'Năm kinh nghiệm',
          color: Colors.blue,
        ),
        const SizedBox(width: 12),
        _buildStatCard(
          icon: Icons.payments_outlined,
          value: _formatCurrencyShort(doctor.consultationFee),
          label: 'Phí khám',
          color: Colors.green,
        ),
      ],
    );
  }

  Widget _buildStatCard({
    required IconData icon,
    required String value,
    required String label,
    required Color color,
  }) {
    return Expanded(
      child: Container(
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
            Text(
              value,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                color: Colors.grey.shade600,
              ),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
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
                  color: Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: Colors.blue.shade600, size: 20),
              ),
              const SizedBox(width: 12),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF1E3A5F),
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

  Widget _buildCertificationsContent(Doctor doctor) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (doctor.specializations.isNotEmpty) ...[
          Row(
            children: [
              Icon(Icons.psychology_outlined,
                  color: Colors.blue.shade600, size: 18),
              const SizedBox(width: 8),
              const Text(
                'Lĩnh vực chuyên môn',
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 15,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: doctor.specializations
                .map((item) => Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            Colors.blue.shade50,
                            Colors.blue.shade100.withOpacity(0.5),
                          ],
                        ),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: Colors.blue.shade100),
                      ),
                      child: Text(
                        item,
                        style: TextStyle(
                          color: Colors.blue.shade700,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ))
                .toList(),
          ),
          const SizedBox(height: 20),
        ],
        if (doctor.certifications.isNotEmpty) ...[
          Row(
            children: [
              Icon(Icons.verified_outlined,
                  color: Colors.green.shade600, size: 18),
              const SizedBox(width: 8),
              const Text(
                'Chứng chỉ',
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 15,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...doctor.certifications.map(
            (cert) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: Colors.green.shade50,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(Icons.check,
                        color: Colors.green.shade600, size: 14),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      cert,
                      style: TextStyle(
                        color: Colors.grey.shade700,
                        height: 1.5,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildHospitalInfo(Doctor doctor) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.blue.shade50.withOpacity(0.5),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.blue.shade100),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.blue.shade100.withOpacity(0.5),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child:
                    Icon(Icons.local_hospital, color: Colors.blue.shade600, size: 24),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Text(
                  doctor.hospitalName!,
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 16,
                    color: Color(0xFF1E3A5F),
                  ),
                ),
              ),
            ],
          ),
          if (doctor.hospitalAddress != null) ...[
            const SizedBox(height: 12),
            Row(
              children: [
                Icon(Icons.location_on_outlined,
                    color: Colors.grey.shade600, size: 18),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    doctor.hospitalAddress!,
                    style: TextStyle(
                      color: Colors.grey.shade700,
                      height: 1.4,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildServiceTile(Service service) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
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
                child: Icon(Icons.medical_services_outlined,
                    color: Colors.green.shade600, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  service.name,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 15,
                  ),
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.green.shade50,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  _formatCurrency(service.price),
                  style: TextStyle(
                    color: Colors.green.shade700,
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            service.description.length > 100
                ? '${service.description.substring(0, 100)}...'
                : service.description,
            style: TextStyle(
              color: Colors.grey.shade600,
              height: 1.5,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () {
                    Navigator.pushNamed(
                      context,
                      '/service-detail',
                      arguments: service.id,
                    );
                  },
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.blue.shade600,
                    side: BorderSide(color: Colors.blue.shade300),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 10),
                  ),
                  child: const Text('Xem chi tiết'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () {
                    Navigator.pushNamed(
                      context,
                      '/appointment-booking',
                      arguments: {
                        'serviceId': service.id,
                      },
                    );
                  },
                  icon: const Icon(Icons.calendar_today, size: 16),
                  label: const Text('Đặt dịch vụ'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blue.shade600,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 10),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildReviewsSection(List<Review> reviews, Doctor doctor) {
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
                  color: Colors.amber.shade50,
                  borderRadius: BorderRadius.circular(12),
                ),
                child:
                    Icon(Icons.star_rounded, color: Colors.amber.shade600, size: 20),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Text(
                  'Đánh giá từ bệnh nhân',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF1E3A5F),
                  ),
                ),
              ),
              if (reviews.length > 3)
                TextButton(
                  onPressed: () {
                    // TODO: Navigate to all reviews page
                  },
                  child: Text(
                    'Xem tất cả',
                    style: TextStyle(color: Colors.blue.shade600),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 20),
          // Rating Summary
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.amber.shade50.withOpacity(0.5),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              children: [
                // Overall Rating
                Column(
                  children: [
                    Text(
                      overallRating.toStringAsFixed(1),
                      style: TextStyle(
                        fontSize: 42,
                        fontWeight: FontWeight.bold,
                        color: Colors.amber.shade700,
                      ),
                    ),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: List.generate(
                          5,
                          (i) => Icon(
                                Icons.star_rounded,
                                size: 16,
                                color: i < overallRating.round()
                                    ? Colors.amber
                                    : Colors.grey.shade300,
                              )),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '$displayedReviewCount đánh giá',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey.shade600,
                      ),
                    ),
                  ],
                ),
                const SizedBox(width: 24),
                // Rating Distribution
                Expanded(
                  child: Column(
                    children: List.generate(5, (index) {
                      final starCount = 5 - index;
                      final count = ratingCounts[starCount - 1];
                      final percentage =
                          totalReviews > 0 ? count / totalReviews : 0.0;
                      return Padding(
                        padding: const EdgeInsets.symmetric(vertical: 3),
                        child: Row(
                          children: [
                            Text('$starCount',
                                style: TextStyle(
                                    fontSize: 12, color: Colors.grey.shade700)),
                            const SizedBox(width: 4),
                            Icon(Icons.star_rounded,
                                size: 12, color: Colors.amber.shade400),
                            const SizedBox(width: 8),
                            Expanded(
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(4),
                                child: LinearProgressIndicator(
                                  value: percentage,
                                  backgroundColor: Colors.grey.shade200,
                                  valueColor: AlwaysStoppedAnimation(
                                      Colors.amber.shade400),
                                  minHeight: 6,
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            SizedBox(
                              width: 24,
                              child: Text(
                                '$count',
                                style: TextStyle(
                                    fontSize: 12, color: Colors.grey.shade600),
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
          ),
          const SizedBox(height: 16),
          // Review List
          ...reviews.take(3).toList().asMap().entries.map((entry) {
            final index = entry.key;
            final review = entry.value;
            return _buildReviewTile(review,
                isTopReview: index == 0 && review.rating >= 4);
          }),
        ],
      ),
    );
  }

  Widget _buildReviewTile(Review review, {bool isTopReview = false}) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: Colors.grey.shade100)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (isTopReview)
            Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.amber.shade400, Colors.orange.shade400],
                ),
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.star_rounded, size: 14, color: Colors.white),
                  SizedBox(width: 4),
                  Text(
                    'Đánh giá nổi bật',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.blue.shade100, width: 2),
                ),
                child: CircleAvatar(
                  radius: 22,
                  backgroundImage: review.userAvatar != null
                      ? CachedNetworkImageProvider(
                          _resolveImageUrl(
                              review.userAvatar, AppConstants.defaultAvatarUrl),
                        )
                      : null,
                  backgroundColor: Colors.blue.shade50,
                  child: review.userAvatar == null
                      ? Text(
                          review.userName.isNotEmpty
                              ? review.userName[0].toUpperCase()
                              : '?',
                          style: TextStyle(
                            color: Colors.blue.shade600,
                            fontWeight: FontWeight.bold,
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
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            review.userName,
                            style: const TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 15,
                            ),
                          ),
                        ),
                        Text(
                          '${review.createdAt.day}/${review.createdAt.month}/${review.createdAt.year}',
                          style: TextStyle(
                            color: Colors.grey.shade500,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: List.generate(
                        5,
                        (index) => Icon(
                          index < review.rating
                              ? Icons.star_rounded
                              : Icons.star_outline_rounded,
                          color: Colors.amber,
                          size: 18,
                        ),
                      ),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      review.comment,
                      style: TextStyle(
                        color: Colors.grey.shade700,
                        height: 1.5,
                        fontSize: 14,
                      ),
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

  Widget _buildErrorState(String message, DoctorProvider provider) {
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
              child: Icon(Icons.error_outline,
                  size: 60, color: Colors.red.shade400),
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
              onPressed: () => provider.fetchDoctorDetail(widget.doctorId),
              icon: const Icon(Icons.refresh),
              label: const Text('Thử lại'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blue.shade600,
                foregroundColor: Colors.white,
                padding:
                    const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
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
    if (value == 0) return 'Liên hệ';
    if (value >= 1000000) {
      return '${(value / 1000000).toStringAsFixed(1)}M VNĐ';
    }
    if (value >= 1000) {
      return '${(value / 1000).toStringAsFixed(0)}K VNĐ';
    }
    return '${value.toStringAsFixed(0)} VNĐ';
  }

  String _formatCurrencyShort(double value) {
    if (value == 0) return 'Liên hệ';
    if (value >= 1000000) {
      return '${(value / 1000000).toStringAsFixed(1)}M';
    }
    if (value >= 1000) {
      return '${(value / 1000).toStringAsFixed(0)}K';
    }
    return '${value.toStringAsFixed(0)}đ';
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
