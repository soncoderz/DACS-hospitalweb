import 'package:equatable/equatable.dart';

class Service extends Equatable {
  final String id;
  final String name;
  final String description;
  final double price;
  final String? image;
  final String? specialtyId;
  final String? specialtyName;
  final DateTime createdAt;

  const Service({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    this.image,
    this.specialtyId,
    this.specialtyName,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [
        id,
        name,
        description,
        price,
        image,
        specialtyId,
        specialtyName,
        createdAt,
      ];
}
