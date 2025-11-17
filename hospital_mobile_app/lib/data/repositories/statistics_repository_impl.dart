import '../../domain/entities/statistics.dart';
import '../../domain/repositories/statistics_repository.dart';
import '../datasources/statistics_remote_data_source.dart';

class StatisticsRepositoryImpl implements StatisticsRepository {
  final StatisticsRemoteDataSource remoteDataSource;

  StatisticsRepositoryImpl({required this.remoteDataSource});

  @override
  Future<Statistics> getStatistics() async {
    try {
      final statistics = await remoteDataSource.getStatistics();
      return statistics.toEntity();
    } catch (e) {
      rethrow;
    }
  }
}
