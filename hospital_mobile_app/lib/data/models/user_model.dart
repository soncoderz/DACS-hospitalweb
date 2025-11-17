import '../../domain/entities/user.dart';

/// User model - data layer with JSON serialization
class UserModel extends User {
  const UserModel({
    required super.id,
    required super.email,
    required super.fullName,
    super.phone,
    super.avatar,
    required super.role,
    required super.createdAt,
  });

  /// Create UserModel from JSON
  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['_id'] ?? json['id'] ?? '',
      email: json['email'] ?? '',
      fullName: json['fullName'] ?? '',
      phone: json['phone'],
      avatar: json['avatar'],
      role: json['role'] ?? 'patient',
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
    );
  }

  /// Convert UserModel to JSON
  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'email': email,
      'fullName': fullName,
      'phone': phone,
      'avatar': avatar,
      'role': role,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  /// Create User entity from UserModel
  User toEntity() {
    return User(
      id: id,
      email: email,
      fullName: fullName,
      phone: phone,
      avatar: avatar,
      role: role,
      createdAt: createdAt,
    );
  }

  /// Create UserModel from User entity
  factory UserModel.fromEntity(User user) {
    return UserModel(
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      avatar: user.avatar,
      role: user.role,
      createdAt: user.createdAt,
    );
  }
}
