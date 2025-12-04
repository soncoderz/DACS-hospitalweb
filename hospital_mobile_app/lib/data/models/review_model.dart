import '../../domain/entities/review.dart';

class ReviewModel extends Review {
  const ReviewModel({
    required super.id,
    required super.rating,
    required super.comment,
    required super.userName,
    super.userAvatar,
    required super.createdAt,
  });

  factory ReviewModel.fromJson(Map<String, dynamic> json) {
    final user = json['userId'] ?? json['user'] ?? {};
    
    return ReviewModel(
      id: json['_id'] ?? json['id'] ?? '',
      rating: (json['rating'] as num?)?.round() ?? 0,
      comment: json['comment'] ?? json['review'] ?? '',
      userName: user is Map ? (user['fullName'] ?? user['name'] ?? 'Anonymous') : 'Anonymous',
      userAvatar: user is Map ? user['avatarUrl'] ?? user['avatar'] : null,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'].toString())
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'rating': rating,
      'comment': comment,
      'userName': userName,
      'userAvatar': userAvatar,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  Review toEntity() {
    return Review(
      id: id,
      rating: rating,
      comment: comment,
      userName: userName,
      userAvatar: userAvatar,
      createdAt: createdAt,
    );
  }
}
