import 'package:flutter/material.dart';
import '../../domain/entities/statistics.dart';
import '../../domain/repositories/statistics_repository.dart';

class StatisticsProvider with ChangeNotifier {
  final StatisticsRepository repository;

  StatisticsProvider({required this.repository});

  Statistics? _statistics;
  bool _isLoading = false;
  String? _error;

  Statistics? get statistics => _statistics;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchStatistics() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _statistics = await repository.getStatistics();
      _error = null;
    } catch (e) {
      _error = e.toString();
      _statistics = null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> refreshStatistics() async {
    await fetchStatistics();
  }
}
