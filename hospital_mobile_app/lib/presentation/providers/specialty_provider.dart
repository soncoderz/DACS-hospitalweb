import 'package:flutter/foundation.dart';
import '../../core/errors/error_handler.dart';
import '../../domain/entities/specialty.dart';
import '../../domain/repositories/specialty_repository.dart';

class SpecialtyProvider extends ChangeNotifier {
  final SpecialtyRepository _specialtyRepository;

  SpecialtyProvider(this._specialtyRepository);

  List<Specialty> _specialties = [];
  Specialty? _selectedSpecialty;
  bool _isLoading = false;
  bool _isDetailLoading = false;
  String? _errorMessage;
  String? _detailError;

  List<Specialty> get specialties => _specialties;
  Specialty? get selectedSpecialty => _selectedSpecialty;
  bool get isLoading => _isLoading;
  bool get isDetailLoading => _isDetailLoading;
  String? get errorMessage => _errorMessage;
  String? get detailError => _detailError;

  void _setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }

  void _setError(String? message) {
    _errorMessage = message;
    notifyListeners();
  }

  void _setDetailError(String? message) {
    _detailError = message;
    notifyListeners();
  }

  Future<void> fetchSpecialties() async {
    _setLoading(true);
    _setError(null);

    final result = await _specialtyRepository.getSpecialties();

    result.fold(
      (failure) {
        _setError(ErrorHandler.getErrorMessage(failure));
        _setLoading(false);
      },
      (specialties) {
        _specialties = specialties;
        _setLoading(false);
      },
    );
  }

  Future<void> refreshSpecialties() async {
    await fetchSpecialties();
  }

  Future<void> fetchSpecialtyById(String id) async {
    _isDetailLoading = true;
    _setDetailError(null);
    _selectedSpecialty = null;
    notifyListeners();

    final result = await _specialtyRepository.getSpecialtyById(id);

    result.fold(
      (failure) => _setDetailError(ErrorHandler.getErrorMessage(failure)),
      (specialty) {
        _selectedSpecialty = specialty;
        _setDetailError(null);
      },
    );

    _isDetailLoading = false;
    notifyListeners();
  }

  void clearSelected() {
    _selectedSpecialty = null;
    _detailError = null;
    notifyListeners();
  }

  void setSpecialties(List<dynamic> specialtiesData) {
    _specialties = specialtiesData.map((data) {
      return Specialty(
        id: data['_id'] ?? '',
        name: data['name'] ?? '',
        description: data['description'],
        icon: data['icon'],
        imageUrl: data['imageUrl'],
        doctorCount: data['doctorCount'] ?? 0,
        serviceCount: data['serviceCount'] ?? data['servicesCount'] ?? 0,
      );
    }).toList();
    notifyListeners();
  }
}
