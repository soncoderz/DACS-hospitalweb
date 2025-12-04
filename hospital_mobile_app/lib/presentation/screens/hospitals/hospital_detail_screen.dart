import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
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
      appBar: AppBar(
        title: const Text('Chi tiết chi nhánh'),
      ),
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
            child: ListView(
              padding: const EdgeInsets.all(AppConstants.defaultPadding),
              children: [
                _buildHeroCard(hospital),
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
                if (provider.reviews.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  _buildInfoCard(
                    title: 'Đánh giá nổi bật',
                    child: Column(
                      children: provider.reviews.take(3).map(_buildReviewTile).toList(),
                    ),
                  ),
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
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildHeroCard(Hospital hospital) {
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
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: hospital.imageUrl != null
                ? Image.network(
                    hospital.imageUrl!,
                    height: 160,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => Container(
                      height: 160,
                      color: Colors.blue.shade50,
                      child: const Icon(Icons.local_hospital, color: Colors.blue, size: 48),
                    ),
                  )
                : Container(
                    height: 160,
                    color: Colors.blue.shade50,
                    child: const Center(
                      child: Icon(Icons.local_hospital, color: Colors.blue, size: 48),
                    ),
                  ),
          ),
          const SizedBox(height: 12),
          Text(
            hospital.name,
            style: const TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              const Icon(Icons.star, color: Colors.amber, size: 18),
              const SizedBox(width: 4),
              Text(hospital.rating.toStringAsFixed(1)),
              const SizedBox(width: 8),
              Text('(${hospital.reviewCount} đánh giá)', style: TextStyle(color: Colors.grey.shade700)),
            ],
          ),
          if (hospital.address != null) ...[
            const SizedBox(height: 6),
            Row(
              children: [
                const Icon(Icons.location_on, size: 18, color: Colors.grey),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    hospital.address!,
                    style: TextStyle(color: Colors.grey.shade800),
                  ),
                ),
              ],
            ),
          ],
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

  Widget _buildReviewTile(Review review) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: Colors.grey.shade200)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.person, color: Colors.blueGrey),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  review.userName,
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
              ),
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
            ],
          ),
          const SizedBox(height: 6),
          Text(
            review.comment,
            style: const TextStyle(height: 1.4),
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
