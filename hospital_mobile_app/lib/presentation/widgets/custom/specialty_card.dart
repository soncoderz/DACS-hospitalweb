import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/constants/app_constants.dart';
import '../../../domain/entities/specialty.dart';

class SpecialtyCard extends StatelessWidget {
  final Specialty specialty;
  final VoidCallback onTap;

  const SpecialtyCard({
    super.key,
    required this.specialty,
    required this.onTap,
  });

  IconData _getSpecialtyIcon(String? iconName) {
    // Map icon names to Material Icons
    switch (iconName?.toLowerCase()) {
      case 'cardiology':
      case 'tim mạch':
        return Icons.favorite;
      case 'neurology':
      case 'thần kinh':
        return Icons.psychology;
      case 'orthopedics':
      case 'chỉnh hình':
        return Icons.accessibility_new;
      case 'pediatrics':
      case 'nhi khoa':
        return Icons.child_care;
      case 'dermatology':
      case 'da liễu':
        return Icons.face;
      case 'ophthalmology':
      case 'mắt':
        return Icons.visibility;
      case 'dentistry':
      case 'nha khoa':
        return Icons.medical_services;
      case 'ent':
      case 'tai mũi họng':
        return Icons.hearing;
      case 'general':
      case 'tổng quát':
        return Icons.local_hospital;
      default:
        return Icons.medical_information;
    }
  }

  Color _getSpecialtyColor(int index) {
    final colors = [
      Colors.blue,
      Colors.green,
      Colors.orange,
      Colors.purple,
      Colors.teal,
      Colors.pink,
      Colors.indigo,
      Colors.cyan,
    ];
    return colors[index % colors.length];
  }

  String _resolveImageUrl(String? url) {
    if (url == null || url.isEmpty) return '';
    if (url.startsWith('http')) return url;
    return '${ApiConstants.socketUrl}$url';
  }

  @override
  Widget build(BuildContext context) {
    final color = _getSpecialtyColor(specialty.id.hashCode);
    final imageUrl = _resolveImageUrl(specialty.imageUrl);

    return Card(
      elevation: AppConstants.cardElevation,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppConstants.borderRadius),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppConstants.borderRadius),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Image or Icon
              if (imageUrl.isNotEmpty)
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: CachedNetworkImage(
                    imageUrl: imageUrl,
                    width: 70,
                    height: 70,
                    fit: BoxFit.cover,
                    placeholder: (context, url) => Container(
                      width: 70,
                      height: 70,
                      color: color.withAlpha(20),
                      child: Icon(
                        _getSpecialtyIcon(specialty.icon ?? specialty.name),
                        color: color,
                        size: 32,
                      ),
                    ),
                    errorWidget: (context, url, error) => Container(
                      width: 70,
                      height: 70,
                      decoration: BoxDecoration(
                        color: color.withAlpha(26),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        _getSpecialtyIcon(specialty.icon ?? specialty.name),
                        color: color,
                        size: 32,
                      ),
                    ),
                  ),
                )
              else
                Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    color: color.withAlpha(26),
                    borderRadius: BorderRadius.circular(30),
                  ),
                  child: Icon(
                    _getSpecialtyIcon(specialty.icon ?? specialty.name),
                    size: 32,
                    color: color,
                  ),
                ),
              const SizedBox(height: 12),

              // Name
              Text(
                specialty.name,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 8),

              // Doctor & service counts
              Wrap(
                alignment: WrapAlignment.center,
                spacing: 6,
                runSpacing: 6,
                children: [
                  _buildCountChip(
                    icon: Icons.person_search,
                    label: 'bác sĩ',
                    value: specialty.doctorCount,
                    color: color,
                  ),
                  _buildCountChip(
                    icon: Icons.medical_services_outlined,
                    label: 'dịch vụ',
                    value: specialty.serviceCount,
                    color: Colors.green.shade600,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCountChip({
    required IconData icon,
    required String label,
    required int value,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 4),
          Text(
            '$value $label',
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[800],
            ),
          ),
        ],
      ),
    );
  }
}
