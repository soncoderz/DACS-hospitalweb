import '../../domain/entities/hospital.dart';

class HospitalModel extends Hospital {
  const HospitalModel({
    required super.id,
    required super.name,
    super.description,
    super.address,
    super.phone,
    super.imageUrl,
    super.email,
    super.openingHours,
    super.workingHours,
    super.doctorCount,
    super.serviceCount,
    super.specialtyCount,
    required super.isActive,
    required super.rating,
    required super.reviewCount,
  });

  factory HospitalModel.fromJson(Map<String, dynamic> json) {
    return HospitalModel(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'],
      address: json['address'],
      phone: json['phone'],
      imageUrl: json['imageUrl'] ?? json['image'],
      email: json['email'],
      openingHours: json['openingHours'],
      workingHours: json['workingHours'] as Map<String, dynamic>?,
      doctorCount: json['doctorCount'],
      serviceCount: json['serviceCount'],
      specialtyCount: json['specialtyCount'],
      isActive: json['isActive'] ?? true,
      rating: (json['avgRating'] ?? json['averageRating'] ?? json['rating'] ?? 0).toDouble(),
      reviewCount: json['reviewsCount'] ?? json['numReviews'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'description': description,
      'address': address,
      'phone': phone,
      'imageUrl': imageUrl,
      'email': email,
      'openingHours': openingHours,
      'workingHours': workingHours,
      'doctorCount': doctorCount,
      'serviceCount': serviceCount,
      'specialtyCount': specialtyCount,
      'isActive': isActive,
      'avgRating': rating,
      'reviewsCount': reviewCount,
    };
  }

  Hospital toEntity() {
    return Hospital(
      id: id,
      name: name,
      description: description,
      address: address,
      phone: phone,
      imageUrl: imageUrl,
      email: email,
      openingHours: openingHours,
      workingHours: workingHours,
      doctorCount: doctorCount,
      serviceCount: serviceCount,
      specialtyCount: specialtyCount,
      isActive: isActive,
      rating: rating,
      reviewCount: reviewCount,
    );
  }
}
