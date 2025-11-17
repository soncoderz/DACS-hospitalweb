import '../../domain/entities/statistics.dart';

class StatisticsModel extends Statistics {
  const StatisticsModel({
    required super.doctorsCount,
    required super.branchesCount,
    required super.reviewsCount,
    required super.appointmentsCount,
  });

  factory StatisticsModel.fromJson(Map<String, dynamic> json) {
    return StatisticsModel(
      doctorsCount: json['doctorsCount'] ?? json['totalDoctors'] ?? 0,
      branchesCount: json['branchesCount'] ?? json['count'] ?? 0,
      reviewsCount: json['reviewsCount'] ?? json['total'] ?? 0,
      appointmentsCount: json['appointmentsCount'] ?? json['totalAppointments'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'doctorsCount': doctorsCount,
      'branchesCount': branchesCount,
      'reviewsCount': reviewsCount,
      'appointmentsCount': appointmentsCount,
    };
  }

  Statistics toEntity() {
    return Statistics(
      doctorsCount: doctorsCount,
      branchesCount: branchesCount,
      reviewsCount: reviewsCount,
      appointmentsCount: appointmentsCount,
    );
  }
}
