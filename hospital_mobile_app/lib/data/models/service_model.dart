import '../../domain/entities/service.dart';

class ServiceModel extends Service {
  const ServiceModel({
    required super.id,
    required super.name,
    required super.description,
    required super.price,
    super.image,
    super.specialtyId,
    super.specialtyName,
    super.shortDescription,
    super.duration,
    super.type,
    super.instructions,
    super.preparationGuide,
    super.aftercareInstructions,
    super.requiredTests,
    required super.createdAt,
  });

  factory ServiceModel.fromJson(Map<String, dynamic> json) {
    // Handle specialtyId - can be either String or Object
    String? specialtyIdValue;
    String? specialtyNameValue;
    
    final specialtyIdField = json['specialtyId'];
    if (specialtyIdField is String) {
      specialtyIdValue = specialtyIdField;
    } else if (specialtyIdField is Map<String, dynamic>) {
      specialtyIdValue = specialtyIdField['_id'] ?? specialtyIdField['id'];
      specialtyNameValue = specialtyIdField['name'];
    }
    
    // Also check 'specialty' field
    final specialtyField = json['specialty'];
    if (specialtyField is Map<String, dynamic>) {
      specialtyIdValue ??= specialtyField['_id'] ?? specialtyField['id'];
      specialtyNameValue ??= specialtyField['name'];
    }
    
    // Handle image - can be String or Cloudinary Object
    String? imageValue;
    final imageField = json['image'];
    if (imageField is String) {
      imageValue = imageField;
    } else if (imageField is Map<String, dynamic>) {
      imageValue = imageField['secureUrl'] ?? imageField['url'];
    }
    
    // Also check imageUrl field (can also be Cloudinary object)
    if (imageValue == null && json['imageUrl'] != null) {
      final imageUrlField = json['imageUrl'];
      if (imageUrlField is String) {
        imageValue = imageUrlField;
      } else if (imageUrlField is Map) {
        imageValue = imageUrlField['secureUrl'] ?? imageUrlField['url'];
      }
    }
    
    return ServiceModel(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      shortDescription: json['shortDescription'],
      price: (json['price'] ?? 0).toDouble(),
      image: imageValue,
      specialtyId: specialtyIdValue,
      specialtyName: specialtyNameValue,
      duration: json['duration'] != null ? int.tryParse(json['duration'].toString()) : null,
      type: json['type'],
      instructions: json['instructions'],
      preparationGuide: json['preparationGuide'],
      aftercareInstructions: json['aftercareInstructions'],
      requiredTests: json['requiredTests'] != null
          ? List<String>.from(json['requiredTests'].whereType<String>())
          : null,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'description': description,
      'price': price,
      'image': image,
      'specialtyId': specialtyId,
      'specialtyName': specialtyName,
      'shortDescription': shortDescription,
      'duration': duration,
      'type': type,
      'instructions': instructions,
      'preparationGuide': preparationGuide,
      'aftercareInstructions': aftercareInstructions,
      'requiredTests': requiredTests,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  Service toEntity() {
    return Service(
      id: id,
      name: name,
      description: description,
      price: price,
      image: image,
      specialtyId: specialtyId,
      specialtyName: specialtyName,
      shortDescription: shortDescription,
      duration: duration,
      type: type,
      instructions: instructions,
      preparationGuide: preparationGuide,
      aftercareInstructions: aftercareInstructions,
      requiredTests: requiredTests,
      createdAt: createdAt,
    );
  }
}
