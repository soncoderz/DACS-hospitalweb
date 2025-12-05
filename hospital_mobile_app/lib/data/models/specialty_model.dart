import '../../domain/entities/specialty.dart';

class SpecialtyModel extends Specialty {
  const SpecialtyModel({
    required super.id,
    required super.name,
    super.description,
    super.icon,
    super.imageUrl,
    required super.doctorCount,
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
    
    return SpecialtyModel(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'],
      icon: json['icon'],
      imageUrl: imageUrlValue,
      doctorCount: json['doctorCount'] ?? 0,
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
    };
  }

  Specialty toEntity() => Specialty(
        id: id,
        name: name,
        description: description,
        icon: icon,
        imageUrl: imageUrl,
        doctorCount: doctorCount,
      );
}
