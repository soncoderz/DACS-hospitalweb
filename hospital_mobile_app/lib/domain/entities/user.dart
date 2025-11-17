import 'package:equatable/equatable.dart';

/// User entity - domain layer
class User extends Equatable {
  final String id;
  final String email;
  final String fullName;
  final String? phone;
  final String? avatar;
  final String role;
  final DateTime createdAt;

  const User({
    required this.id,
    required this.email,
    required this.fullName,
    this.phone,
    this.avatar,
    required this.role,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [id, email, fullName, phone, avatar, role, createdAt];
}
