import '../../domain/entities/review.dart';

abstract class ReviewRepository {
  Future<List<Review>> getReviews({int? limit, String? sort});
}
