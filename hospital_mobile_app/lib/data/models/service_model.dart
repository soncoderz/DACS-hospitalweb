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
    required super.createdAt,
  });

  factory ServiceModel.fromJson(Map<String, dynamic> json) {
    return ServiceModel(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      price: (json['price'] ?? 0).toDouble(),
      image: json['image'],
      specialtyId: json['specialty']?['_id'] ?? json['specialtyId'],
      specialtyName: json['specialty']?['name'] ?? json['specialtyName'],
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
      createdAt: createdAt,
    );
  }
}
