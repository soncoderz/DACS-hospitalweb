import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/constants/app_constants.dart';
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
      context.read<DoctorProvider>().fetchDoctorById(widget.doctorId);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Consumer<DoctorProvider>(
        builder: (context, doctorProvider, child) {
          if (doctorProvider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (doctorProvider.errorMessage != null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 60, color: Colors.red),
                  const SizedBox(height: 16),
                  Text(doctorProvider.errorMessage!),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () {
                      doctorProvider.fetchDoctorById(widget.doctorId);
                    },
                    child: const Text('Thử lại'),
                  ),
                ],
              ),
            );
          }

          final doctor = doctorProvider.selectedDoctor;
          if (doctor == null) {
            return const Center(child: Text('Không tìm thấy thông tin bác sĩ'));
          }

          return CustomScrollView(
            slivers: [
              // App bar with image
              SliverAppBar(
                expandedHeight: 250,
                pinned: true,
                flexibleSpace: FlexibleSpaceBar(
                  background: CachedNetworkImage(
                    imageUrl: doctor.avatar ?? AppConstants.defaultDoctorAvatarUrl,
                    fit: BoxFit.cover,
                    errorWidget: (context, url, error) => Container(
                      color: Colors.grey[200],
                      child: const Icon(Icons.person, size: 100),
                    ),
                  ),
                ),
                actions: [
                  IconButton(
                    icon: Icon(
                      doctorProvider.isFavorite(doctor.id)
                          ? Icons.favorite
                          : Icons.favorite_border,
                      color: doctorProvider.isFavorite(doctor.id)
                          ? Colors.red
                          : Colors.white,
                    ),
                    onPressed: () async {
                      await doctorProvider.toggleFavorite(doctor.id);
                    },
                  ),
                ],
              ),

              // Content
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(AppConstants.defaultPadding),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Name and specialty
                      Text(
                        doctor.fullName,
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        doctor.specialtyName,
                        style: TextStyle(
                          fontSize: 18,
                          color: Colors.blue[700],
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Stats row
                      Row(
                        children: [
                          _buildStatItem(
                            Icons.star,
                            '${doctor.rating.toStringAsFixed(1)}',
                            '${doctor.reviewCount} đánh giá',
                            Colors.amber,
                          ),
                          const SizedBox(width: 24),
                          _buildStatItem(
                            Icons.work_outline,
                            '${doctor.experience}',
                            'năm kinh nghiệm',
                            Colors.blue,
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),

                      // Consultation fee
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.green[50],
                          borderRadius: BorderRadius.circular(
                            AppConstants.borderRadius,
                          ),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Phí khám:',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            Text(
                              '$doctor.consultationFee.toStringAsFixed(0) VNĐ',
                              style: TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: Colors.green[700],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),

                      // About section
                      if (doctor.bio != null) ...[
                        const Text(
                          'Giới thiệu',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          doctor.bio!,
                          style: const TextStyle(
                            fontSize: 14,
                            height: 1.5,
                          ),
                        ),
                        const SizedBox(height: 24),
                      ],

                      // Education
                      if (doctor.education != null) ...[
                        const Text(
                          'Học vấn',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          doctor.education!,
                          style: const TextStyle(fontSize: 14),
                        ),
                        const SizedBox(height: 24),
                      ],

                      // Languages
                      if (doctor.languages.isNotEmpty) ...[
                        const Text(
                          'Ngôn ngữ',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 8,
                          children: doctor.languages
                              .map((lang) => Chip(label: Text(lang)))
                              .toList(),
                        ),
                        const SizedBox(height: 80),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),

      // Book appointment button (sticky)
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
                  color: Colors.black.withAlpha(26),
                  blurRadius: 10,
                  offset: const Offset(0, -5),
                ),
              ],
            ),
            child: CustomButton(
              text: 'Đặt Lịch Khám',
              onPressed: () {
                Navigator.pushNamed(
                  context,
                  '/book-appointment',
                  arguments: doctor.id,
                );
              },
            ),
          );
        },
      ),
    );
  }

  Widget _buildStatItem(
    IconData icon,
    String value,
    String label,
    Color color,
  ) {
    return Column(
      children: [
        Row(
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(width: 4),
            Text(
              value,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey[600],
          ),
        ),
      ],
    );
  }
}
