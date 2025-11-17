import 'package:flutter/material.dart';
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

  @override
  Widget build(BuildContext context) {
    final color = _getSpecialtyColor(specialty.id.hashCode);
    
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
              // Icon
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
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
              const SizedBox(height: 4),

              // Doctor count
              Text(
                '${specialty.doctorCount} bác sĩ',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[600],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
