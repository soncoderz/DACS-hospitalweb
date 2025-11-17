import 'package:flutter/material.dart';
import '../../domain/entities/hospital.dart';
import '../../domain/repositories/hospital_repository.dart';

class HospitalProvider with ChangeNotifier {
  final HospitalRepository repository;

  HospitalProvider({required this.repository});

  List<Hospital> _hospitals = [];
  bool _isLoading = false;
  String? _error;

  List<Hospital> get hospitals => _hospitals;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchHospitals({int? limit, bool? featured}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _hospitals = await repository.getHospitals(
        limit: limit,
        featured: featured,
      );
      _error = null;
    } catch (e) {
      _error = e.toString();
      _hospitals = [];
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> refreshHospitals() async {
    await fetchHospitals(limit: 6);
  }
}
