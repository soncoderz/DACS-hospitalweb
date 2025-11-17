import 'package:dio/dio.dart';
import '../../core/network/dio_client.dart';
import '../models/news_model.dart';

class NewsRemoteDataSource {
  final DioClient dioClient;

  NewsRemoteDataSource({required this.dioClient});

  Future<List<NewsModel>> getNews({
    int? limit,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      if (limit != null) queryParams['limit'] = limit;

      final response = await dioClient.get(
        '/news/all',
        queryParameters: queryParams,
      );

      final data = response.data;
      List<dynamic> newsJson = [];

      if (data['news'] != null) {
        if (data['news'] is List) {
          newsJson = data['news'];
        }
      }

      return newsJson
          .map((json) => NewsModel.fromJson(json))
          .toList();
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Failed to fetch news');
    }
  }
}
