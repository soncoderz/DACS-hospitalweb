import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_constants.dart';
import '../../providers/hospital_provider.dart';

class HospitalsScreen extends StatefulWidget {
  const HospitalsScreen({super.key});

  @override
  State<HospitalsScreen> createState() => _HospitalsScreenState();
}

class _HospitalsScreenState extends State<HospitalsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<HospitalProvider>().fetchHospitals();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<HospitalProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading && provider.hospitals.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          if (provider.error != null && provider.hospitals.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 60, color: Colors.red),
                  const SizedBox(height: 16),
                  Text(
                    provider.error!,
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Colors.red),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () {
                      provider.fetchHospitals();
                    },
                    child: const Text('Thử lại'),
                  ),
                ],
              ),
            );
          }

          if (provider.hospitals.isEmpty) {
            return const Center(
              child: Text('Không có chi nhánh nào'),
            );
          }

          return RefreshIndicator(
            onRefresh: () => provider.fetchHospitals(),
            child: ListView.builder(
              padding: const EdgeInsets.all(AppConstants.defaultPadding),
              itemCount: provider.hospitals.length,
              itemBuilder: (context, index) {
                final hospital = provider.hospitals[index];
                
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: ListTile(
                    contentPadding: const EdgeInsets.all(12),
                    leading: Container(
                      width: 60,
                      height: 60,
                      decoration: BoxDecoration(
                        color: Colors.blue.shade50,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: hospital.imageUrl != null 
                        ? ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: Image.network(
                              hospital.imageUrl!,
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) => const Icon(
                                Icons.local_hospital,
                                color: Colors.blue,
                                size: 30,
                              ),
                            ),
                          )
                        : const Icon(
                            Icons.local_hospital,
                            color: Colors.blue,
                            size: 30,
                          ),
                    ),
                    title: Text(
                      hospital.name,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (hospital.address != null) ...[
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Icon(Icons.location_on, size: 16, color: Colors.grey.shade600),
                              const SizedBox(width: 4),
                              Expanded(
                                child: Text(
                                  hospital.address!,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(color: Colors.grey.shade600),
                                ),
                              ),
                            ],
                          ),
                        ],
                        if (hospital.phone != null) ...[
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Icon(Icons.phone, size: 16, color: Colors.grey.shade600),
                              const SizedBox(width: 4),
                              Text(
                                hospital.phone!,
                                style: TextStyle(
                                  color: Colors.blue.shade700,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ],
                    ),
                    trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                    onTap: () {
                      Navigator.pushNamed(
                        context,
                        '/hospital-detail',
                        arguments: hospital.id,
                      );
                    },
                  ),
                );
              },
            ),
          );
        },
      );
  }
}
