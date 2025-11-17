import '../../domain/entities/news.dart';

abstract class NewsRepository {
  Future<List<News>> getNews({int? limit});
}
