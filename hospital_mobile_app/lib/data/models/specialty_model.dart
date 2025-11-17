import '../../domain/entities/specialty.dart';

class SpecialtyModel extends Specialty {
  const SpecialtyModel({
    required super.id,
    required super.name,
    super.description,
    super.icon,
    required super.doctorCount,
  });

  factory SpecialtyModel.fromJson(Map<String, dynamic> json) {
    return SpecialtyModel(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'],
      icon: json['icon'],
      doctorCount: json['doctorCount'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'description': description,
      'icon': icon,
      'doctorCount': doctorCount,
    };
  }

  Specialty toEntity() => Specialty(
        id: id,
        name: name,
        description: description,
        icon: icon,
        doctorCount: doctorCount,
      );
}
