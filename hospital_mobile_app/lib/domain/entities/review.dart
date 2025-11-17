import 'package:equatable/equatable.dart';

class Review extends Equatable {
  final String id;
  final int rating;
  final String comment;
  final String userName;
  final String? userAvatar;
  final DateTime createdAt;

  const Review({
    required this.id,
    required this.rating,
    required this.comment,
    required this.userName,
    this.userAvatar,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [
        id,
        rating,
        comment,
        userName,
        userAvatar,
        createdAt,
      ];
}
