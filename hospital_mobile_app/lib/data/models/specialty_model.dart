import '../../domain/entities/specialty.dart';

class SpecialtyModel extends Specialty {
  const SpecialtyModel({
    required super.id,
    required super.name,
    super.description,
    super.icon,
    super.imageUrl,
    required super.doctorCount,
    required super.serviceCount,
  });

  factory SpecialtyModel.fromJson(Map<String, dynamic> json) {
    // Handle imageUrl - can be String or Object
    String? imageUrlValue;
    final imageField = json['image'];
    if (imageField is String) {
      imageUrlValue = imageField;
    } else if (imageField is Map<String, dynamic>) {
      imageUrlValue = imageField['secureUrl'] ?? imageField['url'];
    }
    imageUrlValue ??= json['imageUrl'];

    final doctorCountValue = json['doctorCount'] ??
        json['doctorsCount'] ??
        (json['doctors'] is List ? (json['doctors'] as List).length : 0);
    final serviceCountValue = json['serviceCount'] ??
        json['servicesCount'] ??
        (json['services'] is List ? (json['services'] as List).length : 0);
    final doctorCount = (doctorCountValue is num) ? doctorCountValue.toInt() : 0;
    final serviceCount = (serviceCountValue is num) ? serviceCountValue.toInt() : 0;

    return SpecialtyModel(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'],
      icon: json['icon'],
      imageUrl: imageUrlValue,
      doctorCount: doctorCount,
      serviceCount: serviceCount,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'description': description,
      'icon': icon,
      'imageUrl': imageUrl,
      'doctorCount': doctorCount,
      'serviceCount': serviceCount,
    };
  }

  Specialty toEntity() => Specialty(
        id: id,
        name: name,
        description: description,
        icon: icon,
        imageUrl: imageUrl,
        doctorCount: doctorCount,
        serviceCount: serviceCount,
      );

  SpecialtyModel copyWith({
    String? id,
    String? name,
    String? description,
    String? icon,
    String? imageUrl,
    int? doctorCount,
    int? serviceCount,
  }) {
    return SpecialtyModel(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      icon: icon ?? this.icon,
      imageUrl: imageUrl ?? this.imageUrl,
      doctorCount: doctorCount ?? this.doctorCount,
      serviceCount: serviceCount ?? this.serviceCount,
    );
  }
}
