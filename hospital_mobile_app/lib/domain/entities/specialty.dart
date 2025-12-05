import 'package:equatable/equatable.dart';

class Specialty extends Equatable {
  final String id;
  final String name;
  final String? description;
  final String? icon;
  final String? imageUrl;
  final int doctorCount;

  const Specialty({
    required this.id,
    required this.name,
    this.description,
    this.icon,
    this.imageUrl,
    required this.doctorCount,
  });

  @override
  List<Object?> get props => [id, name, description, icon, imageUrl, doctorCount];
}
