import '../../domain/entities/news.dart';

class NewsModel extends News {
  const NewsModel({
    required super.id,
    required super.title,
    required super.content,
    super.imageUrl,
    super.category = 'general',
    required super.createdAt,
  });

  factory NewsModel.fromJson(Map<String, dynamic> json) {
    // Parse imageUrl safely - handles both String and Cloudinary object
    String? imageUrl;
    
    // Try imageUrl field first
    final imageUrlField = json['imageUrl'];
    if (imageUrlField != null) {
      if (imageUrlField is String) {
        imageUrl = imageUrlField;
      } else if (imageUrlField is Map) {
        // Cloudinary object: try secureUrl first, then url
        imageUrl = imageUrlField['secureUrl'] ?? imageUrlField['url'];
      }
    }
    
    // Try image field as fallback
    if (imageUrl == null && json['image'] != null) {
      final imageField = json['image'];
      if (imageField is String) {
        imageUrl = imageField;
      } else if (imageField is Map) {
        imageUrl = imageField['secureUrl'] ?? imageField['url'];
      }
    }
    
    return NewsModel(
      id: json['_id'] ?? json['id'] ?? '',
      title: json['title'] ?? '',
      content: json['content'] ?? json['description'] ?? '',
      imageUrl: imageUrl,
      category: json['category'] ?? 'general',
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'].toString())
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'title': title,
      'content': content,
      'imageUrl': imageUrl,
      'category': category,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  News toEntity() {
    return News(
      id: id,
      title: title,
      content: content,
      imageUrl: imageUrl,
      category: category,
      createdAt: createdAt,
    );
  }
}
