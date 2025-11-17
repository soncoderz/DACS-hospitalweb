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
    return NewsModel(
      id: json['_id'] ?? json['id'] ?? '',
      title: json['title'] ?? '',
      content: json['content'] ?? json['description'] ?? '',
      imageUrl: json['imageUrl'] ?? json['image'],
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
