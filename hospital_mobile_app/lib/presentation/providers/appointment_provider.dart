import 'package:flutter/foundation.dart';
import '../../core/errors/error_handler.dart';
import '../../domain/entities/appointment.dart';
import '../../domain/repositories/appointment_repository.dart';

class AppointmentProvider extends ChangeNotifier {
  final AppointmentRepository _appointmentRepository;

  AppointmentProvider(this._appointmentRepository);

  List<Appointment> _appointments = [];
  List<Appointment> _history = [];
  List<TimeSlot> _availableSlots = [];
  Appointment? _selectedAppointment;
  bool _isLoading = false;
  String? _errorMessage;

  List<Appointment> get appointments => _appointments;
  List<Appointment> get history => _history;
  List<TimeSlot> get availableSlots => _availableSlots;
  Appointment? get selectedAppointment => _selectedAppointment;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  List<Appointment> get upcomingAppointments => _appointments
      .where((a) =>
          a.status == 'pending' ||
          a.status == 'confirmed' &&
              a.appointmentDate.isAfter(DateTime.now()))
      .toList();

  List<Appointment> get completedAppointments =>
      _appointments.where((a) => a.status == 'completed').toList();

  List<Appointment> get cancelledAppointments =>
      _appointments.where((a) => a.status == 'cancelled').toList();

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

  Future<void> fetchAvailableSlots(String doctorId, DateTime date) async {
    _setLoading(true);
    _setError(null);

    final result = await _appointmentRepository.getAvailableSlots(
      doctorId,
      date,
    );

    result.fold(
      (failure) {
        _setError(ErrorHandler.getErrorMessage(failure));
        _availableSlots = [];
        _setLoading(false);
      },
      (slots) {
        _availableSlots = slots;
        _setLoading(false);
      },
    );
  }

  Future<bool> bookAppointment({
    required String doctorId,
    required String specialtyId,
    required DateTime appointmentDate,
    required String timeSlot,
    String? reason,
  }) async {
    _setLoading(true);
    _setError(null);

    final result = await _appointmentRepository.createAppointment(
      doctorId: doctorId,
      specialtyId: specialtyId,
      appointmentDate: appointmentDate,
      timeSlot: timeSlot,
      reason: reason,
    );

    return result.fold(
      (failure) {
        _setError(ErrorHandler.getErrorMessage(failure));
        _setLoading(false);
        return false;
      },
      (appointment) {
        _appointments.insert(0, appointment);
        _setLoading(false);
        return true;
      },
    );
  }

  Future<void> fetchMyAppointments() async {
    _setLoading(true);
    _setError(null);

    final result = await _appointmentRepository.getMyAppointments();

    result.fold(
      (failure) {
        _setError(ErrorHandler.getErrorMessage(failure));
        _setLoading(false);
      },
      (appointments) {
        _appointments = appointments;
        _setLoading(false);
      },
    );
  }

  Future<void> fetchAppointmentById(String id) async {
    _setLoading(true);
    _setError(null);

    final result = await _appointmentRepository.getAppointmentById(id);

    result.fold(
      (failure) {
        _setError(ErrorHandler.getErrorMessage(failure));
        _setLoading(false);
      },
      (appointment) {
        _selectedAppointment = appointment;
        _setLoading(false);
      },
    );
  }

  Future<bool> cancelAppointment(String id, String? reason) async {
    _setLoading(true);
    _setError(null);

    final result = await _appointmentRepository.cancelAppointment(id, reason);

    return result.fold(
      (failure) {
        _setError(ErrorHandler.getErrorMessage(failure));
        _setLoading(false);
        return false;
      },
      (_) {
        final index = _appointments.indexWhere((a) => a.id == id);
        if (index != -1) {
          _appointments[index] = Appointment(
            id: _appointments[index].id,
            patientId: _appointments[index].patientId,
            patientName: _appointments[index].patientName,
            doctorId: _appointments[index].doctorId,
            doctorName: _appointments[index].doctorName,
            specialtyName: _appointments[index].specialtyName,
            appointmentDate: _appointments[index].appointmentDate,
            timeSlot: _appointments[index].timeSlot,
            status: 'cancelled',
            reason: reason,
            notes: _appointments[index].notes,
            bookingCode: _appointments[index].bookingCode,
            fee: _appointments[index].fee,
            createdAt: _appointments[index].createdAt,
          );
        }
        _setLoading(false);
        return true;
      },
    );
  }

  Future<bool> rescheduleAppointment(
    String id,
    DateTime newDate,
    String newTimeSlot,
  ) async {
    _setLoading(true);
    _setError(null);

    final result = await _appointmentRepository.rescheduleAppointment(
      id,
      newDate,
      newTimeSlot,
    );

    return result.fold(
      (failure) {
        _setError(ErrorHandler.getErrorMessage(failure));
        _setLoading(false);
        return false;
      },
      (appointment) {
        final index = _appointments.indexWhere((a) => a.id == id);
        if (index != -1) {
          _appointments[index] = appointment;
        }
        _setLoading(false);
        return true;
      },
    );
  }

  void clearSelectedAppointment() {
    _selectedAppointment = null;
    notifyListeners();
  }

  Future<void> refreshAppointments() async {
    await fetchMyAppointments();
  }
}
