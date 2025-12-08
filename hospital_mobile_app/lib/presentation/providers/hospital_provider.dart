import 'package:flutter/material.dart';
import '../../domain/entities/doctor.dart';
import '../../domain/entities/hospital.dart';
import '../../domain/entities/review.dart';
import '../../domain/entities/service.dart';
import '../../domain/entities/specialty.dart';
import '../../domain/repositories/hospital_repository.dart';

class HospitalProvider with ChangeNotifier {
  final HospitalRepository repository;

  HospitalProvider({required this.repository});

  List<Hospital> _hospitals = [];
  Hospital? _selectedHospital;
  List<Specialty> _specialties = [];
  List<Service> _services = [];
  List<Doctor> _doctors = [];
  List<Review> _reviews = [];
  bool _isLoading = false;
  bool _isDetailLoading = false;
  String? _error;
  String? _detailError;

  List<Hospital> get hospitals => _hospitals;
  Hospital? get selectedHospital => _selectedHospital;
  List<Specialty> get specialties => _specialties;
  List<Service> get services => _services;
  List<Doctor> get doctors => _doctors;
  List<Review> get reviews => _reviews;
  bool get isLoading => _isLoading;
  bool get isDetailLoading => _isDetailLoading;
  String? get error => _error;
  String? get detailError => _detailError;

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

  Future<void> fetchHospitalDetail(String id) async {
    _isDetailLoading = true;
    _detailError = null;
    _selectedHospital = null;
    _specialties = [];
    _services = [];
    _doctors = [];
    _reviews = [];
    notifyListeners();

    try {
      final results = await Future.wait([
        repository.getHospitalById(id),
        repository.getHospitalSpecialties(id),
        repository.getHospitalServices(id),
        repository.getHospitalDoctors(id),
        repository.getHospitalReviews(id),
      ]);

      final fetchedHospital = results[0] as Hospital;
      _specialties = results[1] as List<Specialty>;
      _services = results[2] as List<Service>;
      _doctors = results[3] as List<Doctor>;
      _reviews = results[4] as List<Review>;

      final ratingFromReviews = _reviews.isNotEmpty
          ? _reviews.fold<int>(0, (sum, review) => sum + review.rating) / _reviews.length
          : 0.0;

      final updatedHospital = _copyHospitalWith(
        fetchedHospital,
        rating: fetchedHospital.rating > 0 ? fetchedHospital.rating : ratingFromReviews,
        reviewCount: fetchedHospital.reviewCount > 0 ? fetchedHospital.reviewCount : _reviews.length,
      );

      _selectedHospital = updatedHospital;
      _syncHospitalInList(updatedHospital);
      _detailError = null;
    } catch (e) {
      _detailError = e.toString();
    } finally {
      _isDetailLoading = false;
      notifyListeners();
    }
  }

  void clearSelectedHospital() {
    _selectedHospital = null;
    _specialties = [];
    _services = [];
    _doctors = [];
    _reviews = [];
    _detailError = null;
    notifyListeners();
  }

  Hospital _copyHospitalWith(
    Hospital source, {
    double? rating,
    int? reviewCount,
  }) {
    return Hospital(
      id: source.id,
      name: source.name,
      description: source.description,
      address: source.address,
      phone: source.phone,
      imageUrl: source.imageUrl,
      email: source.email,
      openingHours: source.openingHours,
      workingHours: source.workingHours,
      doctorCount: source.doctorCount,
      serviceCount: source.serviceCount,
      specialtyCount: source.specialtyCount,
      isActive: source.isActive,
      rating: rating ?? source.rating,
      reviewCount: reviewCount ?? source.reviewCount,
    );
  }

  void _syncHospitalInList(Hospital hospital) {
    final index = _hospitals.indexWhere((item) => item.id == hospital.id);
    if (index != -1) {
      _hospitals[index] = hospital;
      notifyListeners();
    }
  }
}
