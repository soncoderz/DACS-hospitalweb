import 'package:equatable/equatable.dart';

/// User entity - domain layer
class User extends Equatable {
  final String id;
  final String email;
  final String fullName;
  final String? phone;
  final String? phoneNumber;
  final String? avatar;
  final String? avatarUrl;
  final String? address;
  final String? gender;
  final String? dateOfBirth;
  final String role;
  final DateTime createdAt;

  const User({
    required this.id,
    required this.email,
    required this.fullName,
    this.phone,
    this.phoneNumber,
    this.avatar,
    this.avatarUrl,
    this.address,
    this.gender,
    this.dateOfBirth,
    required this.role,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [
        id,
        email,
        fullName,
        phone,
        phoneNumber,
        avatar,
        avatarUrl,
        address,
        gender,
        dateOfBirth,
        role,
        createdAt,
      ];
}
