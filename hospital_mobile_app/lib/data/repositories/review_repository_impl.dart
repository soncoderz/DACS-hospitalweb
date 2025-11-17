import '../../domain/entities/review.dart';
import '../../domain/repositories/review_repository.dart';
import '../datasources/review_remote_data_source.dart';

class ReviewRepositoryImpl implements ReviewRepository {
  final ReviewRemoteDataSource remoteDataSource;

  ReviewRepositoryImpl({required this.remoteDataSource});

  @override
  Future<List<Review>> getReviews({int? limit, String? sort}) async {
    try {
      final reviews = await remoteDataSource.getReviews(
        limit: limit,
        sort: sort,
      );
      return reviews.map((model) => model.toEntity()).toList();
    } catch (e) {
      rethrow;
    }
  }
}
