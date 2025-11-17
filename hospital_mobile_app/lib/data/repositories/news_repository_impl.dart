import '../../domain/entities/news.dart';
import '../../domain/repositories/news_repository.dart';
import '../datasources/news_remote_data_source.dart';

class NewsRepositoryImpl implements NewsRepository {
  final NewsRemoteDataSource remoteDataSource;

  NewsRepositoryImpl({required this.remoteDataSource});

  @override
  Future<List<News>> getNews({int? limit}) async {
    try {
      final news = await remoteDataSource.getNews(limit: limit);
      return news.map((model) => model.toEntity()).toList();
    } catch (e) {
      rethrow;
    }
  }
}
