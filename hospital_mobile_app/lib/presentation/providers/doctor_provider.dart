import 'package:flutter/foundation.dart';
import '../../core/errors/error_handler.dart';
import '../../domain/entities/doctor.dart';
import '../../domain/repositories/doctor_repository.dart';

class DoctorProvider extends ChangeNotifier {
  final DoctorRepository _doctorRepository;

  DoctorProvider(this._doctorRepository);

  List<Doctor> _doctors = [];
  List<Doctor> _favoriteDoctors = [];
  Doctor? _selectedDoctor;
  bool _isLoading = false;
  String? _errorMessage;
  String? _currentSpecialtyFilter;
  String? _currentSearchQuery;

  List<Doctor> get doctors => _doctors;
  List<Doctor> get favoriteDoctors => _favoriteDoctors;
  Doctor? get selectedDoctor => _selectedDoctor;
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

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }

  Future<void> fetchDoctors({String? specialtyId, String? search}) async {
    _setLoading(true);
    _setError(null);
    _currentSpecialtyFilter = specialtyId;
    _currentSearchQuery = search;

    final result = await _doctorRepository.getDoctors(
      specialtyId: specialtyId,
      search: search,
    );

    result.fold(
      (failure) {
        _setError(ErrorHandler.getErrorMessage(failure));
        _setLoading(false);
      },
      (doctors) {
        _doctors = doctors;
        _setLoading(false);
      },
    );
  }

  Future<void> fetchDoctorById(String id) async {
    _setLoading(true);
    _setError(null);

    final result = await _doctorRepository.getDoctorById(id);

    result.fold(
      (failure) {
        _setError(ErrorHandler.getErrorMessage(failure));
        _setLoading(false);
      },
      (doctor) {
        _selectedDoctor = doctor;
        _setLoading(false);
      },
    );
  }

  Future<void> fetchFavoriteDoctors() async {
    _setLoading(true);
    _setError(null);

    final result = await _doctorRepository.getFavoriteDoctors();

    result.fold(
      (failure) {
        _setError(ErrorHandler.getErrorMessage(failure));
        _setLoading(false);
      },
      (doctors) {
        _favoriteDoctors = doctors;
        _setLoading(false);
      },
    );
  }

  Future<bool> toggleFavorite(String doctorId) async {
    final isFavorite = _favoriteDoctors.any((d) => d.id == doctorId);

    final result = isFavorite
        ? await _doctorRepository.removeFromFavorites(doctorId)
        : await _doctorRepository.addToFavorites(doctorId);

    return result.fold(
      (failure) {
        _setError(ErrorHandler.getErrorMessage(failure));
        return false;
      },
      (_) {
        if (isFavorite) {
          _favoriteDoctors.removeWhere((d) => d.id == doctorId);
        } else {
          final doctor = _doctors.firstWhere((d) => d.id == doctorId);
          _favoriteDoctors.add(doctor);
        }
        notifyListeners();
        return true;
      },
    );
  }

  bool isFavorite(String doctorId) {
    return _favoriteDoctors.any((d) => d.id == doctorId);
  }

  void clearSelectedDoctor() {
    _selectedDoctor = null;
    notifyListeners();
  }

  Future<bool> removeFavorite(String doctorId) async {
    final result = await _doctorRepository.removeFromFavorites(doctorId);
    
    return result.fold(
      (failure) {
        _setError(ErrorHandler.getErrorMessage(failure));
        return false;
      },
      (_) {
        _favoriteDoctors.removeWhere((d) => d.id == doctorId);
        notifyListeners();
        return true;
      },
    );
  }

  Future<void> refreshDoctors() async {

    await fetchDoctors(
      specialtyId: _currentSpecialtyFilter,
      search: _currentSearchQuery,
    );
  }

  void setDoctors(List<dynamic> doctorsData) {
    try {
      _doctors = doctorsData.map((data) {
        print('[DEBUG] Parsing doctor data: $data');
        
        // Handle user object - API populates user field
        String fullName = '';
        String email = '';
        String? avatarUrl;
        
        if (data['user'] != null && data['user'] is Map) {
          fullName = data['user']['fullName'] ?? '';
          email = data['user']['email'] ?? '';
          avatarUrl = data['user']['avatarUrl'];
        } else {
          // Fallback to direct fields
          fullName = data['fullName'] ?? '';
          email = data['email'] ?? '';
        }
        
        // Handle specialtyId - can be string or object
        String specialtyId = '';
        String specialtyName = '';
        
        if (data['specialtyId'] != null) {
          if (data['specialtyId'] is String) {
            specialtyId = data['specialtyId'];
          } else if (data['specialtyId'] is Map) {
            specialtyId = data['specialtyId']['_id'] ?? '';
            specialtyName = data['specialtyId']['name'] ?? '';
          }
        }
        
        // If specialtyName is still empty, try to get it from specialtyName field
        if (specialtyName.isEmpty && data['specialtyName'] != null) {
          if (data['specialtyName'] is String) {
            specialtyName = data['specialtyName'];
          } else if (data['specialtyName'] is Map) {
            specialtyName = data['specialtyName']['name'] ?? '';
          }
        }

        // Handle avatar - can be string, object, or null
        if (avatarUrl == null && data['avatar'] != null) {
          if (data['avatar'] is String) {
            avatarUrl = data['avatar'];
          } else if (data['avatar'] is Map) {
            avatarUrl = data['avatar']['secureUrl'] ?? data['avatar']['url'];
          }
        }

        final doctor = Doctor(
          id: data['_id'] ?? '',
          fullName: fullName,
          email: email,
          avatar: avatarUrl,
          specialtyId: specialtyId,
          specialtyName: specialtyName,
          bio: data['bio'] is String ? data['bio'] : null,
          experience: data['experience'] ?? 0,
          education: data['education'] is String ? data['education'] : null,
          languages: data['languages'] != null 
              ? List<String>.from(data['languages'])
              : [],
          rating: (data['rating'] ?? 0).toDouble(),
          reviewCount: data['reviewCount'] ?? 0,
          consultationFee: (data['consultationFee'] ?? 0).toDouble(),
          isAvailable: data['isAvailable'] ?? true,
          createdAt: data['createdAt'] != null 
              ? DateTime.parse(data['createdAt'])
              : DateTime.now(),
        );
        
        print('[DEBUG] Created doctor: ${doctor.fullName}, specialty: ${doctor.specialtyName}');
        return doctor;
      }).toList();
      notifyListeners();
    } catch (e, stackTrace) {
      print('[ERROR] setDoctors error: $e');
      print('[ERROR] Stack trace: $stackTrace');
      _setError('Lỗi parse dữ liệu bác sĩ: $e');
    }
  }
}
