import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_constants.dart';
import '../../providers/specialty_provider.dart';
import '../../widgets/custom/specialty_card.dart';

class SpecialtiesScreen extends StatefulWidget {
  final bool showAppBar;

  const SpecialtiesScreen({
    super.key,
    this.showAppBar = true,
  });

  @override
  State<SpecialtiesScreen> createState() => _SpecialtiesScreenState();
}

class _SpecialtiesScreenState extends State<SpecialtiesScreen> {
  final _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _fetchSpecialties();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _fetchSpecialties() async {
    await context.read<SpecialtyProvider>().fetchSpecialties();
  }

  Future<void> _handleRefresh() async {
    await context.read<SpecialtyProvider>().refreshSpecialties();
  }

  void _handleSearch(String query) {
    setState(() {
      _searchQuery = query.toLowerCase().trim();
    });
  }

  void _navigateToSpecialtyDetail(String specialtyId) {
    Navigator.pushNamed(
      context,
      '/specialty-detail',
      arguments: specialtyId,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: widget.showAppBar
          ? AppBar(
              title: const Text('Chuyên Khoa'),
              centerTitle: true,
            )
          : null,
      body: Column(
        children: [
          // Search bar
          Padding(
            padding: const EdgeInsets.all(AppConstants.defaultPadding),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Tìm kiếm chuyên khoa...',
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
              onChanged: _handleSearch,
            ),
          ),

          // Specialties grid
          Expanded(
            child: Consumer<SpecialtyProvider>(
              builder: (context, specialtyProvider, child) {
                if (specialtyProvider.isLoading &&
                    specialtyProvider.specialties.isEmpty) {
                  return const Center(
                    child: CircularProgressIndicator(),
                  );
                }

                if (specialtyProvider.errorMessage != null) {
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
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 32),
                          child: Text(
                            specialtyProvider.errorMessage!,
                            textAlign: TextAlign.center,
                            style: const TextStyle(fontSize: 16),
                          ),
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton.icon(
                          onPressed: _fetchSpecialties,
                          icon: const Icon(Icons.refresh),
                          label: const Text('Thử lại'),
                        ),
                      ],
                    ),
                  );
                }

                // Filter specialties based on search query
                final filteredSpecialties = _searchQuery.isEmpty
                    ? specialtyProvider.specialties
                    : specialtyProvider.specialties
                        .where((specialty) =>
                            specialty.name.toLowerCase().contains(_searchQuery) ||
                            (specialty.description
                                    ?.toLowerCase()
                                    .contains(_searchQuery) ??
                                false))
                        .toList();

                if (filteredSpecialties.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.search_off,
                          size: 80,
                          color: Colors.grey[400],
                        ),
                        const SizedBox(height: 16),
                        Text(
                          _searchQuery.isEmpty
                              ? 'Không có chuyên khoa nào'
                              : 'Không tìm thấy chuyên khoa',
                          style: TextStyle(
                            fontSize: 18,
                            color: Colors.grey[600],
                          ),
                        ),
                        if (_searchQuery.isNotEmpty) ...[
                          const SizedBox(height: 8),
                          Text(
                            'Thử tìm kiếm với từ khóa khác',
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.grey[500],
                            ),
                          ),
                        ],
                      ],
                    ),
                  );
                }

                return RefreshIndicator(
                  onRefresh: _handleRefresh,
                  child: LayoutBuilder(
                    builder: (context, constraints) {
                      // Responsive grid based on screen width
                      final screenWidth = constraints.maxWidth;
                      final crossAxisCount = screenWidth < 360 ? 2 : 2; // Keep 2 columns for consistency
                      final childAspectRatio = screenWidth < 360 ? 0.75 : 0.85;
                      final spacing = screenWidth < 360 ? 10.0 : 12.0;
                      
                      return GridView.builder(
                        padding: EdgeInsets.all(screenWidth < 360 ? 12 : AppConstants.defaultPadding),
                        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: crossAxisCount,
                          crossAxisSpacing: spacing,
                          mainAxisSpacing: spacing,
                          // Tăng chiều cao item để tránh tràn khi ảnh lớn hơn
                          childAspectRatio: childAspectRatio - 0.1,
                        ),
                        itemCount: filteredSpecialties.length,
                        itemBuilder: (context, index) {
                          final specialty = filteredSpecialties[index];
                          return SpecialtyCard(
                            specialty: specialty,
                            onTap: () => _navigateToSpecialtyDetail(specialty.id),
                          );
                        },
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
