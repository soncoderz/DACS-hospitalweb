import 'package:flutter/foundation.dart';
import '../../core/errors/error_handler.dart';
import '../../domain/entities/specialty.dart';
import '../../domain/repositories/specialty_repository.dart';

class SpecialtyProvider extends ChangeNotifier {
  final SpecialtyRepository _specialtyRepository;

  SpecialtyProvider(this._specialtyRepository);

  List<Specialty> _specialties = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<Specialty> get specialties => _specialties;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  void _setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }

  void _setError(String? message) {
    _errorMessage = message;
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
}
