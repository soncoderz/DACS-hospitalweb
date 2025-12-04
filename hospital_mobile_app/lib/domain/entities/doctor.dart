import 'package:equatable/equatable.dart';

class Doctor extends Equatable {
  final String id;
  final String fullName;
  final String email;
  final String? avatar;
  final String specialtyId;
  final String specialtyName;
  final String? bio;
  final int experience;
  final String? education;
  final List<String> certifications;
  final List<String> specializations;
  final String? hospitalId;
  final String? hospitalName;
  final String? hospitalAddress;
  final String? hospitalImage;
  final List<String> languages;
  final double rating;
  final int reviewCount;
  final double consultationFee;
  final bool isAvailable;
  final DateTime createdAt;

  const Doctor({
    required this.id,
    required this.fullName,
    required this.email,
    this.avatar,
    required this.specialtyId,
    required this.specialtyName,
    this.bio,
    required this.experience,
    this.education,
    this.certifications = const [],
    this.specializations = const [],
    this.hospitalId,
    this.hospitalName,
    this.hospitalAddress,
    this.hospitalImage,
    required this.languages,
    required this.rating,
    required this.reviewCount,
    required this.consultationFee,
    required this.isAvailable,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [
        id,
        fullName,
        email,
        avatar,
        specialtyId,
        specialtyName,
        bio,
        experience,
        education,
        certifications,
        specializations,
        hospitalId,
        hospitalName,
        hospitalAddress,
        hospitalImage,
        languages,
        rating,
        reviewCount,
        consultationFee,
        isAvailable,
        createdAt,
      ];
}
