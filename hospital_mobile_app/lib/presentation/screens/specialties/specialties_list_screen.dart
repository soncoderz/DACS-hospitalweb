import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_constants.dart';
import '../../providers/specialty_provider.dart';

class SpecialtiesListScreen extends StatefulWidget {
  const SpecialtiesListScreen({super.key});

  @override
  State<SpecialtiesListScreen> createState() => _SpecialtiesListScreenState();
}

class _SpecialtiesListScreenState extends State<SpecialtiesListScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<SpecialtyProvider>().fetchSpecialties();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<SpecialtyProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading && provider.specialties.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          if (provider.errorMessage != null && provider.specialties.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 60, color: Colors.red),
                  const SizedBox(height: 16),
                  Text(
                    provider.errorMessage!,
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Colors.red),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () {
                      provider.fetchSpecialties();
                    },
                    child: const Text('Thử lại'),
                  ),
                ],
              ),
            );
          }

          if (provider.specialties.isEmpty) {
            return const Center(
              child: Text('Không có chuyên khoa nào'),
            );
          }

          return RefreshIndicator(
            onRefresh: () => provider.fetchSpecialties(),
            child: GridView.builder(
              padding: const EdgeInsets.all(AppConstants.defaultPadding),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 0.9,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
              ),
              itemCount: provider.specialties.length,
              itemBuilder: (context, index) {
                final specialty = provider.specialties[index];
                return Card(
                  elevation: 2,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: InkWell(
                    onTap: () {
                      Navigator.pushNamed(
                        context,
                        '/specialty-detail',
                        arguments: specialty.id,
                      );
                    },
                    borderRadius: BorderRadius.circular(12),
                    child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          // Image
                          Expanded(
                            flex: 3,
                            child: ClipRRect(
                              borderRadius: const BorderRadius.vertical(
                                top: Radius.circular(12),
                              ),
                              child: specialty.imageUrl != null
                                  ? Image.network(
                                      specialty.imageUrl!,
                                      fit: BoxFit.cover,
                                      errorBuilder: (context, error, stackTrace) {
                                        return Container(
                                          color: Colors.blue.shade50,
                                          child: const Icon(
                                            Icons.medical_services,
                                            color: Colors.blue,
                                            size: 40,
                                          ),
                                        );
                                      },
                                    )
                                  : Container(
                                      color: Colors.blue.shade50,
                                      child: const Icon(
                                        Icons.medical_services,
                                        color: Colors.blue,
                                        size: 40,
                                      ),
                                    ),
                            ),
                          ),
                          // Info
                          Expanded(
                            flex: 2,
                            child: Padding(
                              padding: const EdgeInsets.all(12),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(
                                    specialty.name,
                                    textAlign: TextAlign.center,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w600,
                                      fontSize: 14,
                                    ),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    '${specialty.doctorCount} bác sĩ',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: Colors.grey.shade600,
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
              },
            ),
          );
        },
      );
  }
}
