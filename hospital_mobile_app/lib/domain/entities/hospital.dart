import 'package:equatable/equatable.dart';

class Hospital extends Equatable {
  final String id;
  final String name;
  final String? description;
  final String? address;
  final String? phone;
  final String? imageUrl;
  final String? email;
  final String? openingHours;
  final Map<String, dynamic>? workingHours;
  final int? doctorCount;
  final int? serviceCount;
  final int? specialtyCount;
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
    this.email,
    this.openingHours,
    this.workingHours,
    this.doctorCount,
    this.serviceCount,
    this.specialtyCount,
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
        email,
        openingHours,
        workingHours,
        doctorCount,
        serviceCount,
        specialtyCount,
        isActive,
        rating,
        reviewCount,
      ];
}
