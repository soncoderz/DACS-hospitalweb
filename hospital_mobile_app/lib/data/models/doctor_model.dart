import '../../domain/entities/doctor.dart';

class DoctorModel extends Doctor {
  const DoctorModel({
    required super.id,
    required super.fullName,
    required super.email,
    super.avatar,
    required super.specialtyId,
    required super.specialtyName,
    super.bio,
    required super.experience,
    super.education,
    super.certifications = const [],
    super.specializations = const [],
    super.hospitalId,
    super.hospitalName,
    super.hospitalAddress,
    super.hospitalImage,
    required super.languages,
    required super.rating,
    required super.reviewCount,
    required super.consultationFee,
    required super.isAvailable,
    required super.createdAt,
  });

  factory DoctorModel.fromJson(Map<String, dynamic> json) {
    // Handle nested user object from server
    final user = json['user'] ?? json;
    final specialty = json['specialtyId'] ?? json['specialty'];
    final hospital = json['hospitalId'] ?? json['hospital'];
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

    // Handle rating fields with multiple formats
    final ratings = json['ratings'];
    final ratingSources = [
      if (ratings is Map) ratings['average'],
      if (ratings is Map) ratings['avgRating'],
      if (ratings is Map) ratings['averageRating'],
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
      json['reviewCount'],
      json['reviewsCount'],
      json['numReviews'],
    ];
    final reviewCountValue = (() {
      for (final source in reviewCountSources) {
        final value = _parseInt(source);
        if (value > 0) return value;
      }
      final fallback = reviewCountSources.firstWhere((value) => value != null, orElse: () => 0);
      return _parseInt(fallback);
    })();
    
    // Parse avatar - can be String or Cloudinary object
    String? avatarUrl;
    final avatarField = user['avatarUrl'] ?? user['avatar'] ?? json['avatar'] ?? json['avatarUrl'];
    if (avatarField != null) {
      if (avatarField is String) {
        avatarUrl = avatarField;
      } else if (avatarField is Map) {
        avatarUrl = avatarField['secureUrl'] ?? avatarField['url'];
      }
    }
    
    return DoctorModel(
      id: json['_id'] ?? json['id'] ?? '',
      fullName: user['fullName'] ?? json['fullName'] ?? '',
      email: user['email'] ?? json['email'] ?? '',
      avatar: avatarUrl,
      specialtyId: specialty is Map ? specialty['_id'] ?? specialty['id'] ?? '' : specialty ?? '',
      specialtyName: specialty is Map ? specialty['name'] ?? '' : '',
      bio: json['bio'] ?? json['description'],
      experience: json['experience'] ?? 0,
      education: json['education'] is String
          ? json['education']
          : (json['education'] is List
              ? (json['education'] as List)
                  .whereType<String>()
                  .join('\n')
              : null),
      certifications: json['certifications'] != null
          ? List<String>.from(json['certifications'].whereType<String>())
          : const [],
      specializations: json['specializations'] != null
          ? List<String>.from(json['specializations'].whereType<String>())
          : const [],
      hospitalId: hospital is Map ? hospital['_id'] ?? hospital['id'] : hospital,
      hospitalName: hospital is Map ? hospital['name'] : null,
      hospitalAddress: hospital is Map ? hospital['address'] : null,
      hospitalImage: hospital is Map
          ? hospital['imageUrl'] ?? hospital['image']
          : null,
      languages: json['languages'] != null
          ? List<String>.from(json['languages'].whereType<String>())
          : [],
      rating: ratingValue,
      reviewCount: reviewCountValue,
      consultationFee: (json['consultationFee'] ?? 0).toDouble(),
      isAvailable: json['isAvailable'] ?? true,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'].toString())
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'fullName': fullName,
      'email': email,
      'avatar': avatar,
      'specialtyId': specialtyId,
      'specialtyName': specialtyName,
      'bio': bio,
      'experience': experience,
      'education': education,
      'certifications': certifications,
      'specializations': specializations,
      'hospitalId': hospitalId,
      'hospitalName': hospitalName,
      'hospitalAddress': hospitalAddress,
      'hospitalImage': hospitalImage,
      'languages': languages,
      'rating': rating,
      'reviewCount': reviewCount,
      'consultationFee': consultationFee,
      'isAvailable': isAvailable,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  Doctor toEntity() {
    return Doctor(
      id: id,
      fullName: fullName,
      email: email,
      avatar: avatar,
      specialtyId: specialtyId,
      specialtyName: specialtyName,
      bio: bio,
      experience: experience,
      education: education,
      certifications: certifications,
      specializations: specializations,
      hospitalId: hospitalId,
      hospitalName: hospitalName,
      hospitalAddress: hospitalAddress,
      hospitalImage: hospitalImage,
      languages: languages,
      rating: rating,
      reviewCount: reviewCount,
      consultationFee: consultationFee,
      isAvailable: isAvailable,
      createdAt: createdAt,
    );
  }
}
