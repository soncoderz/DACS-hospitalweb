import 'package:flutter/material.dart';
import '../../../core/constants/app_constants.dart';

class SpecialtyCard extends StatelessWidget {
  final Map<String, dynamic> specialty;
  final VoidCallback? onTap;

  const SpecialtyCard({
    super.key,
    required this.specialty,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final name = specialty['name'] ?? 'Chuyên khoa';
    final imageUrl = specialty['imageUrl'];

    return GestureDetector(
      onTap: onTap,
      child: Card(
        elevation: AppConstants.cardElevation,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppConstants.borderRadius),
        ),
        child: Container(
          padding: const EdgeInsets.all(12),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Icon or Image
              if (imageUrl != null)
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.network(
                    imageUrl,
                    width: 60,
                    height: 60,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) {
                      return _buildDefaultIcon();
                    },
                  ),
                )
              else
                _buildDefaultIcon(),
              const SizedBox(height: 12),
              Text(
                name,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDefaultIcon() {
    return Container(
      width: 60,
      height: 60,
      decoration: BoxDecoration(
        color: Colors.blue.shade50,
        borderRadius: BorderRadius.circular(12),
      ),
      child: const Icon(
        Icons.medical_services,
        color: Colors.blue,
        size: 32,
      ),
    );
  }
}
