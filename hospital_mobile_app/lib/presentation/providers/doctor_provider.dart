import 'package:flutter/foundation.dart';
import '../../core/errors/error_handler.dart';
import '../../core/errors/failures.dart';
import '../../domain/entities/doctor.dart';
import '../../domain/entities/review.dart';
import '../../domain/entities/service.dart';
import '../../domain/repositories/doctor_repository.dart';

class DoctorProvider extends ChangeNotifier {
  final DoctorRepository _doctorRepository;

  DoctorProvider(this._doctorRepository);

  List<Doctor> _doctors = [];
  List<Doctor> _favoriteDoctors = [];
  Doctor? _selectedDoctor;
  bool _isLoading = false;
  bool _isDetailLoading = false;
  String? _errorMessage;
  String? _detailError;
  String? _currentSpecialtyFilter;
  String? _currentSearchQuery;
  List<Service> _doctorServices = [];
  List<Review> _doctorReviews = [];

  List<Doctor> get doctors => _doctors;
  List<Doctor> get favoriteDoctors => _favoriteDoctors;
  Doctor? get selectedDoctor => _selectedDoctor;
  bool get isLoading => _isLoading;
  bool get isDetailLoading => _isDetailLoading;
  String? get errorMessage => _errorMessage;
  String? get detailError => _detailError;
  List<Service> get doctorServices => _doctorServices;
  List<Review> get doctorReviews => _doctorReviews;

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

  void _setDetailLoading(bool value) {
    _isDetailLoading = value;
    notifyListeners();
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }

  void clearDetailState() {
    _doctorServices = [];
    _doctorReviews = [];
    _selectedDoctor = null;
    _detailError = null;
    _isDetailLoading = false;
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

  Future<void> fetchDoctorDetail(String id) async {
    _setLoading(true);
    _setDetailLoading(true);
    _setError(null);
    _setDetailError(null);
    _doctorServices = [];
    _doctorReviews = [];

    final doctorResult = await _doctorRepository.getDoctorById(id);
    doctorResult.fold(
      (failure) {
        final message = ErrorHandler.getErrorMessage(failure);
        _setError(message);
        _setDetailError(message);
      },
      (doctor) {
        _selectedDoctor = doctor;
      },
    );

    final servicesResult = await _doctorRepository.getDoctorServices(id);
    servicesResult.fold(
      (failure) => _setDetailError(ErrorHandler.getErrorMessage(failure)),
      (services) {
        _doctorServices = services;
      },
    );

    final reviewsResult = await _doctorRepository.getDoctorReviews(id);
    reviewsResult.fold(
      (failure) => _setDetailError(ErrorHandler.getErrorMessage(failure)),
      (reviews) => _doctorReviews = reviews,
    );

    _setLoading(false);
    _setDetailLoading(false);
    notifyListeners();
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
        final message = ErrorHandler.getErrorMessage(failure);

        // Nếu server báo đã có trong danh sách yêu thích, coi như thành công
        if (!isFavorite &&
            failure is ValidationFailure &&
            message.toLowerCase().contains('đã có trong danh sách yêu thích')) {
          // Bảo đảm bác sĩ có trong danh sách cục bộ
          Doctor? doctor;
          try {
            doctor = _favoriteDoctors.firstWhere((d) => d.id == doctorId);
          } catch (_) {}
          doctor ??= _selectedDoctor;
          if (doctor == null) {
            try {
              doctor = _doctors.firstWhere((d) => d.id == doctorId);
            } catch (_) {}
          }

          if (!_favoriteDoctors.any((d) => d.id == doctorId) && doctor != null) {
            _favoriteDoctors.add(doctor);
            notifyListeners();
          }
          return true;
        }

        _setError(message);
        return false;
      },
      (_) {
        if (isFavorite) {
          _favoriteDoctors.removeWhere((d) => d.id == doctorId);
        } else {
          Doctor? doctor;
          try {
            doctor = _doctors.firstWhere((d) => d.id == doctorId);
          } catch (_) {
            doctor = _selectedDoctor;
          }
          if (doctor != null) {
            _favoriteDoctors.add(doctor);
          }
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

  Future<List<Doctor>> getDoctorsBySpecialty(String specialtyId) async {
    final result = await _doctorRepository.getDoctors(specialtyId: specialtyId);
    return result.fold(
      (failure) {
        _setDetailError(ErrorHandler.getErrorMessage(failure));
        return [];
      },
      (doctors) => doctors,
    );
  }

  Future<List<Doctor>> getDoctorsByService(String serviceId) async {
    final result = await _doctorRepository.getDoctorsByService(serviceId);
    return result.fold(
      (failure) {
        _setDetailError(ErrorHandler.getErrorMessage(failure));
        return [];
      },
      (doctors) => doctors,
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

        // Hospital information if present
        final hospital = data['hospitalId'] ?? data['hospital'];
        String? hospitalId;
        String? hospitalName;
        String? hospitalAddress;
        String? hospitalImage;
        if (hospital is Map) {
          hospitalId = hospital['_id'] ?? hospital['id'];
          hospitalName = hospital['name'];
          hospitalAddress = hospital['address'];
          hospitalImage = hospital['imageUrl'] ?? hospital['image'];
        } else if (hospital is String) {
          hospitalId = hospital;
        }

        // Ratings info with multiple possible keys
        final ratings = data['ratings'];
        final ratingValue = (data['rating'] ??
                data['averageRating'] ??
                (ratings is Map ? ratings['average'] : null) ??
                0)
            .toDouble();
        final reviewCountValue = data['reviewCount'] ??
            data['reviewsCount'] ??
            data['numReviews'] ??
            (ratings is Map ? ratings['count'] : null) ??
            0;

        final doctor = Doctor(
          id: data['_id'] ?? '',
          fullName: fullName,
          email: email,
          avatar: avatarUrl,
          specialtyId: specialtyId,
          specialtyName: specialtyName,
          bio: data['bio'] is String ? data['bio'] : null,
          experience: data['experience'] ?? 0,
          education: data['education'] is String
              ? data['education']
              : (data['education'] is List
                  ? (data['education'] as List)
                      .whereType<String>()
                      .join('\n')
                  : null),
          certifications: data['certifications'] != null
              ? List<String>.from(
                  data['certifications'].whereType<String>(),
                )
              : const [],
          specializations: data['specializations'] != null
              ? List<String>.from(
                  data['specializations'].whereType<String>(),
                )
              : const [],
          hospitalId: hospitalId,
          hospitalName: hospitalName,
          hospitalAddress: hospitalAddress,
          hospitalImage: hospitalImage,
          languages: data['languages'] != null 
              ? List<String>.from(data['languages'])
              : [],
          rating: ratingValue,
          reviewCount: reviewCountValue,
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
