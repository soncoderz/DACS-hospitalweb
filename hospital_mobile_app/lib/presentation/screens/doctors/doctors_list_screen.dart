import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_constants.dart';
import '../../providers/doctor_provider.dart';
import '../../widgets/custom/doctor_card.dart';

class DoctorsListScreen extends StatefulWidget {
  final String? specialtyId;

  const DoctorsListScreen({
    super.key,
    this.specialtyId,
  });

  @override
  State<DoctorsListScreen> createState() => _DoctorsListScreenState();
}

class _DoctorsListScreenState extends State<DoctorsListScreen> {
  final _searchController = TextEditingController();
  String? _selectedSpecialtyFilter;

  @override
  void initState() {
    super.initState();
    _selectedSpecialtyFilter = widget.specialtyId;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _fetchDoctors();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _fetchDoctors() async {
    await context.read<DoctorProvider>().fetchDoctors(
          specialtyId: _selectedSpecialtyFilter,
          search: _searchController.text.trim().isEmpty
              ? null
              : _searchController.text.trim(),
        );
  }

  Future<void> _handleRefresh() async {
    await context.read<DoctorProvider>().refreshDoctors();
  }

  void _handleSearch(String query) {
    _fetchDoctors();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Danh Sách Bác Sĩ'),
        centerTitle: true,
      ),
      body: Column(
        children: [
          // Search bar
          Padding(
            padding: const EdgeInsets.all(AppConstants.defaultPadding),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Tìm kiếm bác sĩ...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchController.clear();
                          _handleSearch('');
                        },
                      )
                    : null,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(AppConstants.borderRadius),
                ),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
              ),
              onSubmitted: _handleSearch,
            ),
          ),

          // Doctors list
          Expanded(
            child: Consumer<DoctorProvider>(
              builder: (context, doctorProvider, child) {
                if (doctorProvider.isLoading && doctorProvider.doctors.isEmpty) {
                  return const Center(
                    child: CircularProgressIndicator(),
                  );
                }

                if (doctorProvider.errorMessage != null) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          Icons.error_outline,
                          size: 60,
                          color: Colors.red,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          doctorProvider.errorMessage!,
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontSize: 16),
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton.icon(
                          onPressed: _fetchDoctors,
                          icon: const Icon(Icons.refresh),
                          label: const Text('Thử lại'),
                        ),
                      ],
                    ),
                  );
                }

                if (doctorProvider.doctors.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.person_search,
                          size: 80,
                          color: Colors.grey[400],
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Không tìm thấy bác sĩ',
                          style: TextStyle(
                            fontSize: 18,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  );
                }

                return RefreshIndicator(
                  onRefresh: _handleRefresh,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(AppConstants.defaultPadding),
                    itemCount: doctorProvider.doctors.length,
                    itemBuilder: (context, index) {
                      final doctor = doctorProvider.doctors[index];
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: DoctorCard(
                          doctor: doctor,
                          isFavorite: doctorProvider.isFavorite(doctor.id),
                          onTap: () {
                            Navigator.pushNamed(
                              context,
                              '/doctor-detail',
                              arguments: doctor.id,
                            );
                          },
                          onFavoriteToggle: () async {
                            final success = await doctorProvider.toggleFavorite(
                              doctor.id,
                            );
                            if (!mounted) return;
                            if (success) {
                              if (mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(
                                      doctorProvider.isFavorite(doctor.id)
                                          ? 'Đã thêm vào yêu thích'
                                          : 'Đã xóa khỏi yêu thích',
                                    ),
                                    duration: const Duration(seconds: 1),
                                  ),
                                );
                              }
                            }
                          },
                        ),
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
