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

  String _normalizeStatus(String? raw) {
    if (raw == null) return 'pending';
    final value = raw
        .toString()
        .trim()
        .toLowerCase()
        .replaceAll(' ', '_')
        .replaceAll('-', '_');
    switch (value) {
      case 'cancel':
      case 'canceled':
        return 'cancelled';
      case 'reschedule':
      case 'rescheduling':
        return 'rescheduled';
      case 'pendingpayment':
      case 'pending_payment':
        return 'pending_payment';
      case 'done':
      case 'finish':
      case 'finished':
        return 'completed';
      case 'paid':
      case 'payment_success':
      case 'payment_successful':
      case 'payment_completed':
      case 'paid_full':
        return 'paid';
      default:
        return value;
    }
  }

  List<Appointment> get _sortedAppointments {
    final List<Appointment> sorted = List<Appointment>.from(_appointments);
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);

    sorted.sort((a, b) {
      final dateA = DateTime(a.appointmentDate.year, a.appointmentDate.month, a.appointmentDate.day);
      final dateB = DateTime(b.appointmentDate.year, b.appointmentDate.month, b.appointmentDate.day);

      final distanceA = dateA.difference(today).inDays.abs();
      final distanceB = dateB.difference(today).inDays.abs();

      final isAFutureOrToday = !dateA.isBefore(today);
      final isBFutureOrToday = !dateB.isBefore(today);

      if (isAFutureOrToday && isBFutureOrToday) {
        return distanceA.compareTo(distanceB);
      }

      if (isAFutureOrToday != isBFutureOrToday) {
        return isAFutureOrToday ? -1 : 1;
      }

      return distanceA.compareTo(distanceB);
    });

    return sorted;
  }

  List<Appointment> _filterByStatuses(Set<String> statuses) {
    return _sortedAppointments
        .where((a) => statuses.contains(_normalizeStatus(a.status)))
        .toList();
  }

  List<Appointment> get upcomingAppointments => _filterByStatuses({
        'pending',
        'confirmed',
        'rescheduled',
        'pending_payment',
        'hospitalized',
      });

  List<Appointment> get completedAppointments =>
      _filterByStatuses({'completed', 'done', 'finished', 'paid'});

  List<Appointment> get cancelledAppointments =>
      _filterByStatuses({
        'cancelled',
        'canceled',
        'rejected',
        'no-show',
        'no_show',
        'declined',
      });

  // Sub-filters for upcoming tab (matching web version)
  List<Appointment> get pendingAppointments =>
      _filterByStatuses({'pending'});

  List<Appointment> get confirmedAppointments =>
      _filterByStatuses({'confirmed'});

  List<Appointment> get rescheduledAppointments =>
      _filterByStatuses({'rescheduled'});

  List<Appointment> get pendingPaymentAppointments =>
      _filterByStatuses({'pending_payment'});

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
        
        // Debug logging to see what statuses we have
        print('[AppointmentProvider] Fetched ${appointments.length} appointments');
        final statusCounts = <String, int>{};
        for (var apt in appointments) {
          final normalizedStatus = _normalizeStatus(apt.status);
          statusCounts[normalizedStatus] = (statusCounts[normalizedStatus] ?? 0) + 1;
        }
        print('[AppointmentProvider] Status counts: $statusCounts');
        print('[AppointmentProvider] Upcoming: ${upcomingAppointments.length}');
        print('[AppointmentProvider] Completed: ${completedAppointments.length}');
        print('[AppointmentProvider] Cancelled: ${cancelledAppointments.length}');
        print('[AppointmentProvider] Pending: ${pendingAppointments.length}');
        print('[AppointmentProvider] Confirmed: ${confirmedAppointments.length}');
        print('[AppointmentProvider] Rescheduled: ${rescheduledAppointments.length}');
        print('[AppointmentProvider] Pending Payment: ${pendingPaymentAppointments.length}');
        
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
