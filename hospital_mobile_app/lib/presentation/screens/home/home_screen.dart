import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../providers/auth_provider.dart';
import '../../providers/doctor_provider.dart';
import '../../providers/specialty_provider.dart';
import '../../providers/hospital_provider.dart';
import '../../providers/news_provider.dart';
import '../../providers/review_provider.dart';
import '../../providers/statistics_provider.dart';
import '../../../domain/entities/doctor.dart';
import '../../../core/constants/app_constants.dart';
import '../news/news_detail_screen.dart';
import 'package:intl/intl.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<DoctorProvider>().fetchDoctors();
      context.read<SpecialtyProvider>().fetchSpecialties();
      context.read<HospitalProvider>().fetchHospitals(limit: 6);
      context.read<NewsProvider>().fetchNews(limit: 3);
      context.read<ReviewProvider>().fetchReviews(limit: 4, sort: '-rating');
      context.read<StatisticsProvider>().fetchStatistics();
    });
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final user = authProvider.user;

    return RefreshIndicator(
      onRefresh: () async {
        await Future.wait([
          context.read<DoctorProvider>().refreshDoctors(),
          context.read<SpecialtyProvider>().refreshSpecialties(),
          context.read<HospitalProvider>().refreshHospitals(),
          context.read<NewsProvider>().refreshNews(),
          context.read<ReviewProvider>().refreshReviews(),
          context.read<StatisticsProvider>().refreshStatistics(),
        ]);
      },
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeroBanner(context, user),
            const SizedBox(height: 24),
            _buildStatistics(context),
            const SizedBox(height: 24),
            _buildSpecialties(context),
            const SizedBox(height: 24),
            _buildFeaturedDoctors(context),
            const SizedBox(height: 24),
            _buildHospitals(context),
            const SizedBox(height: 24),
            _buildNews(context),
            const SizedBox(height: 24),
            _buildReviews(context),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildHeroBanner(BuildContext context, dynamic user) {
    return Container(
      height: 400,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.blue[600]!, Colors.blue[800]!],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Stack(
        children: [
          Positioned.fill(
            child: Image.network(
              'https://img.freepik.com/free-photo/team-young-specialist-doctors-standing-corridor-hospital_1303-21199.jpg',
              fit: BoxFit.cover,
              color: Colors.black.withAlpha(51),
              colorBlendMode: BlendMode.darken,
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.blue.withAlpha(127),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.local_hospital, color: Colors.white, size: 18),
                      SizedBox(width: 8),
                      Text(
                        'Hệ thống y tế chất lượng',
                        style: TextStyle(color: Colors.white, fontSize: 12),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Chăm Sóc Sức Khỏe',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Text(
                  'Chất Lượng Cao',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Đội ngũ y bác sĩ chuyên môn cao, trang thiết bị hiện đại',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 24),
                Row(
                  children: [
                    ElevatedButton.icon(
                      onPressed: () {
                        Navigator.pushNamed(context, '/appointment-booking');
                      },
                      icon: const Icon(Icons.calendar_today),
                      label: const Text('Đặt Lịch Khám'),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatistics(BuildContext context) {
    final statsProvider = context.watch<StatisticsProvider>();
    final stats = statsProvider.statistics;

    if (statsProvider.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (stats == null) {
      return const SizedBox.shrink();
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Chất Lượng Tạo Nên Niềm Tin',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 16,
            crossAxisSpacing: 16,
            childAspectRatio: 1.3,
            children: [
              _buildStatCard(
                icon: Icons.local_hospital,
                count: stats.branchesCount.toString(),
                label: 'Chi Nhánh',
                color: Colors.blue,
              ),
              _buildStatCard(
                icon: Icons.person,
                count: stats.doctorsCount.toString(),
                label: 'Bác Sĩ',
                color: Colors.green,
              ),
              _buildStatCard(
                icon: Icons.star,
                count: stats.reviewsCount.toString(),
                label: 'Đánh Giá',
                color: Colors.orange,
              ),
              _buildStatCard(
                icon: Icons.calendar_today,
                count: stats.appointmentsCount.toString(),
                label: 'Lịch Hẹn',
                color: Colors.purple,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard({
    required IconData icon,
    required String count,
    required String label,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[300]!),
          boxShadow: [
            BoxShadow(
              color: Colors.grey.withAlpha(26),
              spreadRadius: 1,
              blurRadius: 4,
            ),
          ],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withAlpha(26),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(height: 6),
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(
              count,
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(height: 2),
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(
              label,
              style: TextStyle(
                fontSize: 11,
                color: Colors.grey[600],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSpecialties(BuildContext context) {
    final specialtyProvider = context.watch<SpecialtyProvider>();

    if (specialtyProvider.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (specialtyProvider.specialties.isEmpty) {
      return const SizedBox.shrink();
    }

    final specialties = specialtyProvider.specialties;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Chuyên Khoa Nổi Bật',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              TextButton(
                onPressed: () {},
                child: const Text('Xem tất cả'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 120,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: specialties.length,
              itemBuilder: (context, index) {
                final specialty = specialties[index];
                return Container(
                  width: 120,
                  margin: const EdgeInsets.only(right: 12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.grey[300]!),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.medical_services, color: Colors.blue[600], size: 36),
                      const SizedBox(height: 8),
                      Text(
                        specialty.name,
                        textAlign: TextAlign.center,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFeaturedDoctors(BuildContext context) {
    final doctorProvider = context.watch<DoctorProvider>();

    if (doctorProvider.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (doctorProvider.doctors.isEmpty) {
      return const SizedBox.shrink();
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Bác Sĩ Nổi Bật',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              TextButton(
                onPressed: () {
                  Navigator.pushNamed(context, '/doctors');
                },
                child: const Text('Xem tất cả'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 260,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: doctorProvider.doctors.take(6).length,
              itemBuilder: (context, index) {
                final doctor = doctorProvider.doctors[index];
                return Container(
                  width: 180,
                  margin: const EdgeInsets.only(right: 12),
                  child: _buildDoctorCardVertical(
                    context,
                    doctor,
                    doctorProvider.isFavorite(doctor.id),
                    doctorProvider,
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDoctorCardVertical(
    BuildContext context,
    Doctor doctor,
    bool isFavorite,
    DoctorProvider provider,
  ) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: InkWell(
        onTap: () {
          Navigator.pushNamed(
            context,
            '/doctor-detail',
            arguments: doctor.id,
          );
        },
        borderRadius: BorderRadius.circular(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                  child: Image.network(
                    doctor.avatar ?? 'https://img.freepik.com/free-photo/woman-doctor-wearing-lab-coat-with-stethoscope-isolated_1303-29791.jpg',
                    height: 140,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) {
                      return Container(
                        height: 140,
                        color: Colors.grey[300],
                        child: const Icon(Icons.person, size: 60),
                      );
                    },
                  ),
                ),
                Positioned(
                  top: 8,
                  right: 8,
                  child: CircleAvatar(
                    radius: 16,
                    backgroundColor: Colors.white,
                    child: IconButton(
                      icon: Icon(
                        isFavorite ? Icons.favorite : Icons.favorite_border,
                        color: isFavorite ? Colors.red : Colors.grey,
                        size: 16,
                      ),
                      onPressed: () async {
                        await provider.toggleFavorite(doctor.id);
                      },
                      padding: EdgeInsets.zero,
                    ),
                  ),
                ),
              ],
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      doctor.fullName,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      doctor.specialtyName,
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.blue[700],
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        const Icon(Icons.star, color: Colors.amber, size: 14),
                        const SizedBox(width: 2),
                        Text(
                          doctor.rating.toStringAsFixed(1),
                          style: const TextStyle(fontSize: 11),
                        ),
                        Text(
                          ' (${doctor.reviewCount})',
                          style: TextStyle(fontSize: 11, color: Colors.grey[600]),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${doctor.consultationFee.toStringAsFixed(0)} VNĐ',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: Colors.green[700],
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

  Widget _buildHospitals(BuildContext context) {
    final hospitalProvider = context.watch<HospitalProvider>();

    if (hospitalProvider.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (hospitalProvider.hospitals.isEmpty) {
      return const SizedBox.shrink();
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Chi Nhánh',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 200,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: hospitalProvider.hospitals.length,
              itemBuilder: (context, index) {
                final hospital = hospitalProvider.hospitals[index];
                return Container(
                  width: 280,
                  margin: const EdgeInsets.only(right: 12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.grey[300]!),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      ClipRRect(
                        borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                        child: hospital.imageUrl != null
                            ? Image.network(
                                hospital.imageUrl!,
                                height: 100,
                                width: double.infinity,
                                fit: BoxFit.cover,
                                errorBuilder: (context, error, stackTrace) {
                                  return Container(
                                    height: 100,
                                    color: Colors.grey[300],
                                    child: const Icon(Icons.local_hospital, size: 40),
                                  );
                                },
                              )
                            : Container(
                                height: 100,
                                color: Colors.grey[300],
                                child: const Icon(Icons.local_hospital, size: 40),
                              ),
                      ),
                      Padding(
                        padding: const EdgeInsets.all(12.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              hospital.name,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 4),
                            if (hospital.address != null)
                              Row(
                                children: [
                                  Icon(Icons.location_on, size: 14, color: Colors.grey[600]),
                                  const SizedBox(width: 4),
                                  Expanded(
                                    child: Text(
                                      hospital.address!,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: Colors.grey[600],
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                const Icon(Icons.star, color: Colors.amber, size: 16),
                                const SizedBox(width: 4),
                                Text(
                                  hospital.rating.toStringAsFixed(1),
                                  style: const TextStyle(fontSize: 12),
                                ),
                                Text(
                                  ' (${hospital.reviewCount} đánh giá)',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Colors.grey[600],
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNews(BuildContext context) {
    final newsProvider = context.watch<NewsProvider>();
    final screenWidth = MediaQuery.of(context).size.width;
    final isSmallScreen = screenWidth < 360;

    if (newsProvider.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (newsProvider.news.isEmpty) {
      return const SizedBox.shrink();
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Tin Tức Y Tế',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              TextButton(
                onPressed: () {
                  // Switch to news tab (index 4 in MainScreen)
                  if (Navigator.canPop(context)) {
                    Navigator.pop(context);
                  }
                  // You might need to implement a way to change tab in MainScreen
                  // For now, we keep this simple
                },
                child: const Text('Xem tất cả'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Column(
            children: newsProvider.news.map((news) {
              return InkWell(
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => NewsDetailScreen(newsId: news.id),
                    ),
                  );
                },
                child: Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.grey[300]!),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (news.imageUrl != null)
                        ClipRRect(
                          borderRadius: const BorderRadius.horizontal(
                            left: Radius.circular(12),
                          ),
                          child: Image.network(
                            news.imageUrl!,
                            width: isSmallScreen ? 90 : 100,
                            height: isSmallScreen ? 90 : 100,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) {
                              return Container(
                                width: isSmallScreen ? 90 : 100,
                                height: isSmallScreen ? 90 : 100,
                                color: Colors.grey[300],
                                child: const Icon(Icons.article, size: 40),
                              );
                            },
                          ),
                        ),
                      Expanded(
                        child: Padding(
                          padding: EdgeInsets.all(isSmallScreen ? 10.0 : 12.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                news.title,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  fontSize: isSmallScreen ? 13 : 14,
                                  fontWeight: FontWeight.bold,
                                  height: 1.3,
                                ),
                              ),
                              const SizedBox(height: 6),
                              Row(
                                children: [
                                  Icon(
                                    Icons.calendar_today,
                                    size: isSmallScreen ? 11 : 12,
                                    color: Colors.grey[600],
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    DateFormat('dd/MM/yyyy')
                                        .format(news.createdAt),
                                    style: TextStyle(
                                      fontSize: isSmallScreen ? 11 : 12,
                                      color: Colors.grey[600],
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildReviews(BuildContext context) {
    final reviewProvider = context.watch<ReviewProvider>();

    if (reviewProvider.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (reviewProvider.reviews.isEmpty) {
      return const SizedBox.shrink();
    }

    final fiveStarReviews = reviewProvider.reviews.where((r) => r.rating == 5).take(2).toList();
    final displayReviews = fiveStarReviews.isNotEmpty ? fiveStarReviews : reviewProvider.reviews.take(2).toList();

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Đánh Giá Từ Khách Hàng',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          Column(
            children: displayReviews.map((review) {
              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey[300]!),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        _buildAvatar(
                          review.userAvatar,
                          fallbackText: review.userName[0].toUpperCase(),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                review.userName,
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              Row(
                                children: List.generate(5, (index) {
                                  return Icon(
                                    index < review.rating ? Icons.star : Icons.star_border,
                                    color: Colors.amber,
                                    size: 16,
                                  );
                                }),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      review.comment,
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[800],
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
  
  Widget _buildAvatar(String? url, {double size = 40, String? fallbackText}) {
    final imageUrl = (url != null && url.isNotEmpty)
        ? url
        : AppConstants.defaultAvatarUrl;

    Widget placeholder() => Container(
          width: size,
          height: size,
          color: Colors.grey.shade200,
          child: Center(
            child: fallbackText != null
                ? Text(
                    fallbackText,
                    style: TextStyle(
                      fontSize: size / 2,
                      fontWeight: FontWeight.bold,
                      color: Colors.grey.shade700,
                    ),
                  )
                : Icon(Icons.person, size: size / 2, color: Colors.grey.shade500),
          ),
        );

    return ClipOval(
      child: CachedNetworkImage(
        imageUrl: imageUrl,
        width: size,
        height: size,
        fit: BoxFit.cover,
        placeholder: (_, __) => placeholder(),
        errorWidget: (_, __, ___) => placeholder(),
      ),
    );
  }
}
