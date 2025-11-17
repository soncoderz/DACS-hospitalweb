import 'package:dio/dio.dart';
import '../../core/network/dio_client.dart';
import '../models/statistics_model.dart';

class StatisticsRemoteDataSource {
  final DioClient dioClient;

  StatisticsRemoteDataSource({required this.dioClient});

  Future<StatisticsModel> getStatistics() async {
    try {
      final responses = await Future.wait([
        dioClient.get('/reviews/all'),
        dioClient.get('/statistics/doctors'),
        dioClient.get('/hospitals', queryParameters: {'limit': 100}),
        dioClient.get('/statistics/appointments'),
      ]);

      final reviewsData = responses[0].data;
      final doctorsData = responses[1].data;
      final branchesData = responses[2].data;
      final appointmentsData = responses[3].data;

      int reviewsCount = 0;
      if (reviewsData['data'] != null) {
        reviewsCount = reviewsData['data']['total'] ?? reviewsData['total'] ?? 0;
      }

      int doctorsCount = 0;
      if (doctorsData['data'] != null) {
        doctorsCount = doctorsData['data']['totalDoctors'] ?? doctorsData['totalDoctors'] ?? 0;
      }

      int branchesCount = 0;
      if (branchesData['data'] != null) {
        if (branchesData['data'] is List) {
          branchesCount = branchesData['data'].length;
        } else if (branchesData['data']['hospitals'] != null) {
          branchesCount = branchesData['data']['hospitals'].length;
        } else {
          branchesCount = branchesData['count'] ?? 0;
        }
      }

      int appointmentsCount = 0;
      if (appointmentsData['data'] != null) {
        appointmentsCount = appointmentsData['data']['totalAppointments'] ?? appointmentsData['totalAppointments'] ?? 0;
      }

      return StatisticsModel(
        reviewsCount: reviewsCount,
        doctorsCount: doctorsCount,
        branchesCount: branchesCount,
        appointmentsCount: appointmentsCount,
      );
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Failed to fetch statistics');
    }
  }
}
