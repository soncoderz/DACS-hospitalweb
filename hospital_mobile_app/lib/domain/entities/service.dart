import 'package:equatable/equatable.dart';

class Service extends Equatable {
  final String id;
  final String name;
  final String description;
  final double price;
  final String? image;
  final String? specialtyId;
  final String? specialtyName;
  final String? shortDescription;
  final int? duration;
  final String? type;
  final String? instructions;
  final String? preparationGuide;
  final String? aftercareInstructions;
  final List<String>? requiredTests;
  final DateTime createdAt;

  const Service({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    this.image,
    this.specialtyId,
    this.specialtyName,
    this.shortDescription,
    this.duration,
    this.type,
    this.instructions,
    this.preparationGuide,
    this.aftercareInstructions,
    this.requiredTests,
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
        shortDescription,
        duration,
        type,
        instructions,
        preparationGuide,
        aftercareInstructions,
        requiredTests,
        createdAt,
      ];
}
