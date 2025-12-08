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
    double _parseDouble(dynamic value) {
      if (value is num) return value.toDouble();
      if (value is String) return double.tryParse(value) ?? 0;
      return 0;
    }

    int _parseInt(dynamic value) {
      if (value is int) return value;
      if (value is num) return value.toInt();
      if (value is String) {
        return int.tryParse(value) ?? double.tryParse(value)?.round() ?? 0;
      }
      return 0;
    }

    final ratings = json['ratings'];
    final ratingSources = [
      if (ratings is Map) ratings['average'],
      if (ratings is Map) ratings['avgRating'],
      if (ratings is Map) ratings['averageRating'],
      if (ratings is Map) ratings['avg'],
      if (ratings is Map) ratings['rating'],
      json['averageRating'],
      json['avgRating'],
      json['rating'],
    ];
    final ratingValue = (() {
      for (final source in ratingSources) {
        final value = _parseDouble(source);
        if (value > 0) return value;
      }
      final fallback = ratingSources.firstWhere((value) => value != null, orElse: () => 0);
      return _parseDouble(fallback);
    })();

    final reviewCountSources = [
      if (ratings is Map) ratings['count'],
      if (ratings is Map) ratings['total'],
      if (ratings is Map) ratings['reviews'],
      json['reviewsCount'],
      json['numReviews'],
      json['reviewCount'],
    ];
    final reviewCountValue = (() {
      for (final source in reviewCountSources) {
        final value = _parseInt(source);
        if (value > 0) return value;
      }
      final fallback = reviewCountSources.firstWhere((value) => value != null, orElse: () => 0);
      return _parseInt(fallback);
    })();

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
      rating: ratingValue,
      reviewCount: reviewCountValue,
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
