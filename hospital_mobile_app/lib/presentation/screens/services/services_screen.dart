import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_constants.dart';
import '../../providers/service_provider.dart';
import '../../widgets/custom/service_card.dart';

class ServicesScreen extends StatefulWidget {
  const ServicesScreen({super.key});

  @override
  State<ServicesScreen> createState() => _ServicesScreenState();
}

class _ServicesScreenState extends State<ServicesScreen> {
  final _minPriceController = TextEditingController();
  final _maxPriceController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _fetchServices();
    });
  }

  @override
  void dispose() {
    _minPriceController.dispose();
    _maxPriceController.dispose();
    super.dispose();
  }

  Future<void> _fetchServices() async {
    await context.read<ServiceProvider>().fetchServices();
  }

  Future<void> _handleRefresh() async {
    await context.read<ServiceProvider>().refreshServices();
  }

  void _showFilterBottomSheet() {
    final serviceProvider = context.read<ServiceProvider>();
    
    // Set current filter values
    if (serviceProvider.minPrice != null) {
      _minPriceController.text = serviceProvider.minPrice!.toStringAsFixed(0);
    }
    if (serviceProvider.maxPrice != null) {
      _maxPriceController.text = serviceProvider.maxPrice!.toStringAsFixed(0);
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
          left: AppConstants.defaultPadding,
          right: AppConstants.defaultPadding,
          top: AppConstants.defaultPadding,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Lọc theo giá',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _minPriceController,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                labelText: 'Giá tối thiểu (VNĐ)',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(AppConstants.borderRadius),
                ),
                prefixIcon: const Icon(Icons.attach_money),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _maxPriceController,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                labelText: 'Giá tối đa (VNĐ)',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(AppConstants.borderRadius),
                ),
                prefixIcon: const Icon(Icons.attach_money),
              ),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {
                      _minPriceController.clear();
                      _maxPriceController.clear();
                      serviceProvider.clearFilter();
                      Navigator.pop(context);
                    },
                    child: const Text('Xóa bộ lọc'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      final minPrice = _minPriceController.text.trim().isEmpty
                          ? null
                          : double.tryParse(_minPriceController.text.trim());
                      final maxPrice = _maxPriceController.text.trim().isEmpty
                          ? null
                          : double.tryParse(_maxPriceController.text.trim());

                      serviceProvider.filterByPriceRange(minPrice, maxPrice);
                      Navigator.pop(context);
                    },
                    child: const Text('Áp dụng'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  void _handleBookNow(String serviceId) {
    // Navigate to book appointment screen with service pre-selected
    Navigator.pushNamed(
      context,
      '/appointment-booking',
      arguments: {'serviceId': serviceId},
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dịch Vụ Y Tế'),
        centerTitle: true,
        actions: [
          Consumer<ServiceProvider>(
            builder: (context, serviceProvider, child) {
              final hasFilter = serviceProvider.minPrice != null ||
                  serviceProvider.maxPrice != null;
              return Stack(
                children: [
                  IconButton(
                    icon: const Icon(Icons.filter_list),
                    onPressed: _showFilterBottomSheet,
                  ),
                  if (hasFilter)
                    Positioned(
                      right: 8,
                      top: 8,
                      child: Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(
                          color: Colors.red,
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                ],
              );
            },
          ),
        ],
      ),
      body: Consumer<ServiceProvider>(
        builder: (context, serviceProvider, child) {
          if (serviceProvider.isLoading && serviceProvider.services.isEmpty) {
            return const Center(
              child: CircularProgressIndicator(),
            );
          }

          if (serviceProvider.errorMessage != null) {
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
                    serviceProvider.errorMessage!,
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 16),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    onPressed: _fetchServices,
                    icon: const Icon(Icons.refresh),
                    label: const Text('Thử lại'),
                  ),
                ],
              ),
            );
          }

          if (serviceProvider.services.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.medical_services_outlined,
                    size: 80,
                    color: Colors.grey[400],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Không tìm thấy dịch vụ',
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
            child: LayoutBuilder(
              builder: (context, constraints) {
                final screenWidth = constraints.maxWidth;
                final isSmallScreen = screenWidth < 360;
                
                return ListView.builder(
                  padding: EdgeInsets.all(isSmallScreen ? 12 : AppConstants.defaultPadding),
                  itemCount: serviceProvider.services.length,
                  itemBuilder: (context, index) {
                    final service = serviceProvider.services[index];
                    return Padding(
                      padding: EdgeInsets.only(bottom: isSmallScreen ? 12 : 16),
                      child: ServiceCard(
                        service: service,
                        onTap: () {
                          Navigator.pushNamed(
                            context,
                            '/service-detail',
                            arguments: service.id,
                          );
                        },
                        onBookNow: () => _handleBookNow(service.id),
                      ),
                    );
                  },
                );
              },
            ),
          );
        },
      ),
    );
  }
}
