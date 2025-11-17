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
    
    return DoctorModel(
      id: json['_id'] ?? json['id'] ?? '',
      fullName: user['fullName'] ?? json['fullName'] ?? '',
      email: user['email'] ?? json['email'] ?? '',
      avatar: user['avatarUrl'] ?? json['avatar'],
      specialtyId: specialty is Map ? specialty['_id'] ?? specialty['id'] ?? '' : specialty ?? '',
      specialtyName: specialty is Map ? specialty['name'] ?? '' : '',
      bio: json['bio'] ?? json['description'],
      experience: json['experience'] ?? 0,
      education: json['education'],
      languages: json['languages'] != null
          ? List<String>.from(json['languages'])
          : [],
      rating: (json['averageRating'] ?? json['rating'] ?? 0).toDouble(),
      reviewCount: json['reviewCount'] ?? 0,
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
      languages: languages,
      rating: rating,
      reviewCount: reviewCount,
      consultationFee: consultationFee,
      isAvailable: isAvailable,
      createdAt: createdAt,
    );
  }
}
