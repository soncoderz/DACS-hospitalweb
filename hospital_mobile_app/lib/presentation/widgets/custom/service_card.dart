import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/constants/api_constants.dart';
import '../../../domain/entities/service.dart';

class ServiceCard extends StatelessWidget {
  final Service service;
  final VoidCallback onTap;
  final VoidCallback? onBookNow;

  const ServiceCard({
    super.key,
    required this.service,
    required this.onTap,
    this.onBookNow,
  });

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final isSmallScreen = screenWidth < 360;
    final imageUrl = _resolveImage(service.image);
    
    return Card(
      elevation: AppConstants.cardElevation,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppConstants.borderRadius),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppConstants.borderRadius),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image
            ClipRRect(
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(AppConstants.borderRadius),
              ),
              child: CachedNetworkImage(
                imageUrl: imageUrl,
                width: double.infinity,
                height: isSmallScreen ? 120 : 150,
                fit: BoxFit.cover,
                placeholder: (context, url) => Container(
                  color: Colors.grey[200],
                  height: isSmallScreen ? 120 : 150,
                  child: const Center(
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                ),
                errorWidget: (context, url, error) => Container(
                  color: Colors.grey[200],
                  height: isSmallScreen ? 120 : 150,
                  child: const Icon(Icons.medical_services, size: 60),
                ),
              ),
            ),

            // Content
            Padding(
              padding: EdgeInsets.all(isSmallScreen ? 10 : 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    service.name,
                    style: TextStyle(
                      fontSize: isSmallScreen ? 15 : 16,
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    service.description,
                    style: TextStyle(
                      fontSize: isSmallScreen ? 13 : 14,
                      color: Colors.grey[600],
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Flexible(
                        child: Text(
                          '${service.price.toStringAsFixed(0)} VNĐ',
                          style: TextStyle(
                            fontSize: isSmallScreen ? 15 : 16,
                            fontWeight: FontWeight.bold,
                            color: Colors.green[700],
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                      if (onBookNow != null)
                        ElevatedButton(
                          onPressed: onBookNow,
                          style: ElevatedButton.styleFrom(
                            padding: EdgeInsets.symmetric(
                              horizontal: isSmallScreen ? 12 : 16,
                              vertical: isSmallScreen ? 6 : 8,
                            ),
                            minimumSize: Size.zero,
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          ),
                          child: Text(
                            'Đặt ngay',
                            style: TextStyle(
                              fontSize: isSmallScreen ? 12 : 14,
                            ),
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
    );
  }

  String _resolveImage(String? url) {
    if (url == null || url.isEmpty) return AppConstants.defaultServiceImageUrl;
    if (url.startsWith('http')) return url;
    return '${ApiConstants.socketUrl}$url';
  }
}
