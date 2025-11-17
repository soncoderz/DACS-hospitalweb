import 'package:dio/dio.dart';
import '../../core/network/dio_client.dart';
import '../models/review_model.dart';

class ReviewRemoteDataSource {
  final DioClient dioClient;

  ReviewRemoteDataSource({required this.dioClient});

  Future<List<ReviewModel>> getReviews({
    int? limit,
    String? sort,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      if (limit != null) queryParams['limit'] = limit;
      if (sort != null) queryParams['sort'] = sort;

      final response = await dioClient.get(
        '/reviews/all',
        queryParameters: queryParams,
      );

      final data = response.data;
      List<dynamic> reviewsJson = [];

      if (data['data'] != null) {
        if (data['data'] is List) {
          reviewsJson = data['data'];
        } else if (data['data']['docs'] != null) {
          reviewsJson = data['data']['docs'];
        } else if (data['data']['reviews'] != null) {
          reviewsJson = data['data']['reviews'];
        }
      } else if (data['reviews'] != null) {
        reviewsJson = data['reviews'];
      }

      return reviewsJson
          .map((json) => ReviewModel.fromJson(json))
          .toList();
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Failed to fetch reviews');
    }
  }
}
