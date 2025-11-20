import 'package:flutter/foundation.dart';
import '../../core/errors/error_handler.dart';
import '../../domain/entities/service.dart';
import '../../domain/repositories/service_repository.dart';

class ServiceProvider extends ChangeNotifier {
  final ServiceRepository _serviceRepository;

  ServiceProvider(this._serviceRepository);

  List<Service> _services = [];
  List<Service> _filteredServices = [];
  Service? _selectedService;
  bool _isLoading = false;
  String? _errorMessage;
  double? _minPrice;
  double? _maxPrice;

  List<Service> get services => _filteredServices.isEmpty && _minPrice == null && _maxPrice == null
      ? _services
      : _filteredServices;
  Service? get selectedService => _selectedService;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  double? get minPrice => _minPrice;
  double? get maxPrice => _maxPrice;

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

  Future<void> fetchServices() async {
    _setLoading(true);
    _setError(null);

    final result = await _serviceRepository.getServices();

    result.fold(
      (failure) {
        _setError(ErrorHandler.getErrorMessage(failure));
        _setLoading(false);
      },
      (services) {
        _services = services;
        _filteredServices = services;
        _setLoading(false);
      },
    );
  }

  Future<void> fetchServiceById(String id) async {
    _setLoading(true);
    _setError(null);

    final result = await _serviceRepository.getServiceById(id);

    result.fold(
      (failure) {
        _setError(ErrorHandler.getErrorMessage(failure));
        _setLoading(false);
      },
      (service) {
        _selectedService = service;
        _setLoading(false);
      },
    );
  }

  void filterByPriceRange(double? minPrice, double? maxPrice) {
    _minPrice = minPrice;
    _maxPrice = maxPrice;

    if (minPrice == null && maxPrice == null) {
      _filteredServices = _services;
    } else {
      _filteredServices = _services.where((service) {
        if (minPrice != null && service.price < minPrice) return false;
        if (maxPrice != null && service.price > maxPrice) return false;
        return true;
      }).toList();
    }

    notifyListeners();
  }

  void clearFilter() {
    _minPrice = null;
    _maxPrice = null;
    _filteredServices = _services;
    notifyListeners();
  }

  void clearSelectedService() {
    _selectedService = null;
    notifyListeners();
  }

  Future<void> refreshServices() async {
    await fetchServices();
  }

  void setServices(List<dynamic> servicesData) {
    try {
      _services = servicesData.map((data) {
        // Handle specialtyId - can be string or object
        String? specialtyId;
        String? specialtyName;
        
        if (data['specialtyId'] != null) {
          if (data['specialtyId'] is String) {
            specialtyId = data['specialtyId'];
          } else if (data['specialtyId'] is Map) {
            specialtyId = data['specialtyId']['_id'];
            specialtyName = data['specialtyId']['name'];
          }
        }
        
        // If specialtyName is still null, try to get it from specialtyName field
        if (specialtyName == null && data['specialtyName'] != null) {
          if (data['specialtyName'] is String) {
            specialtyName = data['specialtyName'];
          } else if (data['specialtyName'] is Map) {
            specialtyName = data['specialtyName']['name'];
          }
        }

        // Handle image - can be string, object, or null
        String? imageUrl;
        if (data['imageUrl'] != null && data['imageUrl'] is String) {
          imageUrl = data['imageUrl'];
        } else if (data['image'] != null) {
          if (data['image'] is String) {
            imageUrl = data['image'];
          } else if (data['image'] is Map) {
            imageUrl = data['image']['secureUrl'] ?? data['image']['url'];
          }
        }

        return Service(
          id: data['_id'] ?? '',
          name: data['name'] ?? '',
          description: data['description'] ?? '',
          price: (data['price'] ?? 0).toDouble(),
          image: imageUrl,
          specialtyId: specialtyId,
          specialtyName: specialtyName,
          createdAt: data['createdAt'] != null 
              ? DateTime.parse(data['createdAt'])
              : DateTime.now(),
        );
      }).toList();
      _filteredServices = _services;
      notifyListeners();
    } catch (e, stackTrace) {
      print('[ERROR] setServices error: $e');
      print('[ERROR] Stack trace: $stackTrace');
      _setError('Lỗi parse dữ liệu dịch vụ: $e');
    }
  }
}
