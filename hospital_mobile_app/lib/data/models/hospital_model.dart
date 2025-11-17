import '../../domain/entities/hospital.dart';

class HospitalModel extends Hospital {
  const HospitalModel({
    required super.id,
    required super.name,
    super.description,
    super.address,
    super.phone,
    super.imageUrl,
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
      isActive: isActive,
      rating: rating,
      reviewCount: reviewCount,
    );
  }
}
