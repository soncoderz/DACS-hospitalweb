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
}
