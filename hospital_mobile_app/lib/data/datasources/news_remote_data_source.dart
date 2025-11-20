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

      List<dynamic> newsJson = [];

      // Handle different API response structures
      if (response.data is List) {
        newsJson = response.data as List<dynamic>;
      } else if (response.data is Map<String, dynamic>) {
        final mapData = response.data as Map<String, dynamic>;
        if (mapData.containsKey('news') && mapData['news'] is List) {
          newsJson = mapData['news'] as List<dynamic>;
        } else if (mapData.containsKey('data') && mapData['data'] is List) {
          newsJson = mapData['data'] as List<dynamic>;
        }
      }

      if (newsJson.isEmpty) {
        return [];
      }

      return newsJson.map((json) {
        if (json is Map<String, dynamic>) {
          return NewsModel.fromJson(json);
        }
        throw Exception('Định dạng dữ liệu tin tức không hợp lệ');
      }).toList();
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Failed to fetch news');
    } catch (e) {
      throw Exception('Lỗi khi lấy danh sách tin tức: ${e.toString()}');
    }
  }
}
