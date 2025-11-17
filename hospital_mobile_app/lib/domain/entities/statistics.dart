import 'package:equatable/equatable.dart';

class Statistics extends Equatable {
  final int doctorsCount;
  final int branchesCount;
  final int reviewsCount;
  final int appointmentsCount;

  const Statistics({
    required this.doctorsCount,
    required this.branchesCount,
    required this.reviewsCount,
    required this.appointmentsCount,
  });

  @override
  List<Object?> get props => [
        doctorsCount,
        branchesCount,
        reviewsCount,
        appointmentsCount,
      ];
}
