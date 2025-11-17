import 'package:equatable/equatable.dart';

class Hospital extends Equatable {
  final String id;
  final String name;
  final String? description;
  final String? address;
  final String? phone;
  final String? imageUrl;
  final bool isActive;
  final double rating;
  final int reviewCount;

  const Hospital({
    required this.id,
    required this.name,
    this.description,
    this.address,
    this.phone,
    this.imageUrl,
    required this.isActive,
    required this.rating,
    required this.reviewCount,
  });

  @override
  List<Object?> get props => [
        id,
        name,
        description,
        address,
        phone,
        imageUrl,
        isActive,
        rating,
        reviewCount,
      ];
}
