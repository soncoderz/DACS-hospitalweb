import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:dio/dio.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../../providers/hospital_provider.dart';
import '../../providers/specialty_provider.dart';
import '../../providers/doctor_provider.dart';
import '../../providers/service_provider.dart';
import '../../providers/auth_provider.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/services/token_storage_service.dart';

/// Màn hình đặt lịch khám - Flow: Bệnh viện → Chuyên khoa → Bác sĩ → Dịch vụ → Ngày → Giờ
class AppointmentBookingScreen extends StatefulWidget {
  final String? hospitalId;
  final String? specialtyId;
  final String? doctorId;
  final String? serviceId;

  const AppointmentBookingScreen({
    super.key,
    this.hospitalId,
    this.specialtyId,
    this.doctorId,
    this.serviceId,
  });

  @override
  State<AppointmentBookingScreen> createState() => _AppointmentBookingScreenState();
}

class _AppointmentBookingScreenState extends State<AppointmentBookingScreen> with SingleTickerProviderStateMixin {
  int _currentStep = 0;
  bool _isLoading = false;
  bool _isSocketConnected = false;
  bool _isDisposing = false;
  late final AnimationController _lockPulseController;
  late final Animation<double> _lockPulseAnimation;

  // Form data
  String? _selectedHospitalId;
  String? _selectedSpecialtyId;
  String? _selectedDoctorId;
  String? _selectedServiceId;
  DateTime? _selectedDate;
  Map<String, dynamic>? _selectedTimeSlot;
  String? _selectedScheduleId;

  // Additional form fields
  String _appointmentType = 'first-visit';
  final TextEditingController _symptomsController = TextEditingController();
  final TextEditingController _medicalHistoryController = TextEditingController();
  final TextEditingController _notesController = TextEditingController();
  final TextEditingController _couponController = TextEditingController();

  // Schedule data
  List<dynamic> _schedules = [];
  List<DateTime> _availableDates = [];
  List<Map<String, dynamic>> _timeSlots = [];
  DateTime _calendarMonth = DateTime.now();

  // Price details
  double _consultationFee = 0;
  double _serviceFee = 0;
  double _discountAmount = 0;
  Map<String, dynamic>? _couponInfo;

  // Realtime socket
  IO.Socket? _socket;
  final Map<String, String> _lockedSlotOwners = {};
  final TokenStorageService _tokenStorage = TokenStorageService();
  String? _userId;
  String? _currentRoomKey;

  @override
  void initState() {
    super.initState();
    _lockPulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);
    _lockPulseAnimation = Tween<double>(begin: 0.65, end: 1.0).animate(
      CurvedAnimation(
        parent: _lockPulseController,
        curve: Curves.easeInOut,
      ),
    );
    _selectedHospitalId = widget.hospitalId;
    _selectedSpecialtyId = widget.specialtyId;
    _selectedDoctorId = widget.doctorId;
    _selectedServiceId = widget.serviceId;

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _userId = context.read<AuthProvider>().user?.id;
      _initSocket();
      _loadInitialData();
    });
  }

  @override
  void dispose() {
    _isDisposing = true;
    _unlockCurrentSlot();
    _socket?.disconnect();
    _socket?.close();
    _lockPulseController.dispose();
    _symptomsController.dispose();
    _medicalHistoryController.dispose();
    _notesController.dispose();
    _couponController.dispose();
    super.dispose();
  }

  Future<void> _loadInitialData() async {
    setState(() => _isLoading = true);
    try {
      await context.read<HospitalProvider>().fetchHospitals();
      
      if (_selectedHospitalId != null) {
        await _fetchSpecialtiesByHospital(_selectedHospitalId!);
      }
      
      if (_selectedHospitalId != null && _selectedSpecialtyId != null) {
        await _fetchDoctorsByHospitalAndSpecialty(_selectedHospitalId!, _selectedSpecialtyId!);
        await _fetchServicesBySpecialty(_selectedSpecialtyId!);
      }
      
      if (_selectedDoctorId != null) {
        await _fetchSchedules();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi tải dữ liệu: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _fetchSpecialtiesByHospital(String hospitalId) async {
    try {
      final dio = Dio();
      final response = await dio.get(
        '${ApiConstants.baseUrl}/appointments/hospitals/$hospitalId/specialties',
      );

      if (response.statusCode == 200 && response.data['success'] == true) {
        final specialties = response.data['data'] as List;
        // Update specialty provider with fetched data
        if (mounted) {
          context.read<SpecialtyProvider>().setSpecialties(specialties);
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi tải chuyên khoa: $e')),
        );
      }
    }
  }

  Future<void> _fetchServicesBySpecialty(String specialtyId) async {
    try {
      final dio = Dio();
      final response = await dio.get(
        '${ApiConstants.baseUrl}/appointments/specialties/$specialtyId/services',
      );

      if (response.statusCode == 200 && response.data['success'] == true) {
        final services = response.data['data'] as List;
        print('[DEBUG] Services data: $services');
        // Update service provider with fetched data
        if (mounted) {
          context.read<ServiceProvider>().setServices(services);
        }
      }
    } catch (e, stackTrace) {
      print('[ERROR] Fetch services error: $e');
      print('[ERROR] Stack trace: $stackTrace');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi tải dịch vụ: $e')),
        );
      }
    }
  }

  Future<void> _fetchDoctorsByHospitalAndSpecialty(String hospitalId, String specialtyId) async {
    try {
      final dio = Dio();
      final response = await dio.get(
        '${ApiConstants.baseUrl}/appointments/hospitals/$hospitalId/specialties/$specialtyId/doctors',
      );

      if (response.statusCode == 200 && response.data['success'] == true) {
        final doctors = response.data['data'] as List;
        print('[DEBUG] Doctors data: $doctors');
        // Update doctor provider with fetched data
        if (mounted) {
          context.read<DoctorProvider>().setDoctors(doctors);
        }
      }
    } catch (e, stackTrace) {
      print('[ERROR] Fetch doctors error: $e');
      print('[ERROR] Stack trace: $stackTrace');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi tải bác sĩ: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Đặt lịch khám'),
        centerTitle: true,
      ),
      body: Column(
        children: [
          _buildProgressIndicator(),
          Expanded(child: _buildStepContent()),
          _buildNavigationButtons(),
        ],
      ),
    );
  }

  Widget _buildProgressIndicator() {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: List.generate(5, (index) {
          final isActive = index <= _currentStep;
          return Expanded(
            child: Row(
              children: [
                Expanded(
                  child: Container(
                    height: 4,
                    decoration: BoxDecoration(
                      color: isActive ? Colors.blue : Colors.grey.shade300,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                if (index < 4) const SizedBox(width: 4),
              ],
            ),
          );
        }),
      ),
    );
  }

  Widget _buildStepContent() {
    switch (_currentStep) {
      case 0:
        return _buildHospitalSpecialtyStep();
      case 1:
        return _buildDoctorServiceStep();
      case 2:
        return _buildDateTimeStep();
      case 3:
        return _buildPaymentInfoStep();
      case 4:
        return _buildConfirmationStep();
      default:
        return const SizedBox();
    }
  }

  Widget _buildHospitalSpecialtyStep() {
    final hospitalProvider = context.watch<HospitalProvider>();
    final specialtyProvider = context.watch<SpecialtyProvider>();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Chọn bệnh viện',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          if (hospitalProvider.isLoading)
            const Center(child: CircularProgressIndicator())
          else if (hospitalProvider.hospitals.isEmpty)
            const Text('Không có bệnh viện nào')
          else
            DropdownButtonFormField<String>(
              value: _selectedHospitalId,
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                hintText: '-- Chọn bệnh viện --',
              ),
              items: hospitalProvider.hospitals.map((hospital) {
                return DropdownMenuItem(
                  value: hospital.id,
                  child: Text(hospital.name),
                );
              }).toList(),
              onChanged: (value) async {
                setState(() {
                  _selectedHospitalId = value;
                  _selectedSpecialtyId = null;
                  _selectedDoctorId = null;
                  _selectedServiceId = null;
                });
                if (value != null) {
                  await _fetchSpecialtiesByHospital(value);
                }
              },
            ),
          if (_selectedHospitalId != null) ...[
            const SizedBox(height: 24),
            const Text(
              'Chọn chuyên khoa',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            if (specialtyProvider.isLoading)
              const Center(child: CircularProgressIndicator())
            else if (specialtyProvider.specialties.isEmpty)
              const Text('Không có chuyên khoa nào')
            else
              DropdownButtonFormField<String>(
                value: _selectedSpecialtyId,
                decoration: const InputDecoration(
                  border: OutlineInputBorder(),
                  hintText: '-- Chọn chuyên khoa --',
                ),
                items: specialtyProvider.specialties.map((specialty) {
                  return DropdownMenuItem(
                    value: specialty.id,
                    child: Text(specialty.name),
                  );
                }).toList(),
                onChanged: (value) async {
                  setState(() {
                    _selectedSpecialtyId = value;
                    _selectedDoctorId = null;
                    _selectedServiceId = null;
                  });
                  if (value != null && _selectedHospitalId != null) {
                    await _fetchDoctorsByHospitalAndSpecialty(_selectedHospitalId!, value);
                    await _fetchServicesBySpecialty(value);
                  }
                },
              ),
          ],
        ],
      ),
    );
  }

  Widget _buildDoctorServiceStep() {
    final doctorProvider = context.watch<DoctorProvider>();
    final serviceProvider = context.watch<ServiceProvider>();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Chọn bác sĩ',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          if (doctorProvider.isLoading)
            const Center(child: CircularProgressIndicator())
          else if (doctorProvider.doctors.isEmpty)
            const Text('Không có bác sĩ nào')
          else
            ...doctorProvider.doctors.map((doctor) {
              final isSelected = _selectedDoctorId == doctor.id;
              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                color: isSelected ? Colors.blue.shade50 : null,
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundImage: doctor.avatar != null
                        ? NetworkImage(doctor.avatar!)
                        : null,
                    child: doctor.avatar == null
                        ? const Icon(Icons.person)
                        : null,
                  ),
                  title: Text(doctor.fullName),
                  subtitle: Text(doctor.specialtyName),
                  trailing: isSelected
                      ? const Icon(Icons.check_circle, color: Colors.blue)
                      : null,
                  onTap: () async {
                    _unlockCurrentSlot();
                    setState(() {
                      _selectedDoctorId = doctor.id;
                      _selectedServiceId = null;
                    });
                    await _fetchSchedules();
                  },
                ),
              );
            }),
          if (_selectedDoctorId != null) ...[
            const SizedBox(height: 24),
            const Text(
              'Chọn dịch vụ',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            if (serviceProvider.isLoading)
              const Center(child: CircularProgressIndicator())
            else if (serviceProvider.services.isEmpty)
              const Text('Không có dịch vụ nào')
            else
              DropdownButtonFormField<String>(
                value: _selectedServiceId,
                decoration: const InputDecoration(
                  border: OutlineInputBorder(),
                  hintText: '-- Chọn dịch vụ --',
                ),
                items: serviceProvider.services.map((service) {
                  return DropdownMenuItem(
                    value: service.id,
                    child: Text('${service.name} - ${service.price.toStringAsFixed(0)} VNĐ'),
                  );
                }).toList(),
                onChanged: (value) {
                  setState(() {
                    _selectedServiceId = value;
                  });
                  _calculatePrices();
                },
              ),
          ],
        ],
      ),
    );
  }

  Widget _buildDateTimeStep() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Chọn ngày khám',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          if (_availableDates.isEmpty)
            const Text('Không có lịch khám nào')
          else
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey.shade300),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.chevron_left),
                        onPressed: () => _changeMonth(-1),
                      ),
                      Text(
                        'Tháng ${_calendarMonth.month} / ${_calendarMonth.year}',
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.chevron_right),
                        onPressed: () => _changeMonth(1),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: const [
                      _CalendarDayLabel('T2'),
                      _CalendarDayLabel('T3'),
                      _CalendarDayLabel('T4'),
                      _CalendarDayLabel('T5'),
                      _CalendarDayLabel('T6'),
                      _CalendarDayLabel('T7'),
                      _CalendarDayLabel('CN'),
                    ],
                  ),
                  const SizedBox(height: 4),
                  _buildCalendarGrid(),
                ],
              ),
            ),
          if (_selectedDate != null) ...[
            const SizedBox(height: 24),
            const Text(
              'Chọn giờ khám',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            if (_timeSlots.isEmpty)
              const Text('Không có khung giờ nào')
            else
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _timeSlots.map((slot) {
                  final isSelected = _selectedTimeSlot?['startTime'] == slot['startTime'];
                  final isBooked = slot['isBooked'] == true;
                  final slotKey = '${slot['scheduleId']}_${slot['startTime']}';
                  final lockedBy = _lockedSlotOwners[slotKey];
                  final isLockedByOther = lockedBy != null && lockedBy.isNotEmpty && lockedBy != _userId;
                  final isLockedByMe = lockedBy != null && lockedBy == _userId;
                  const double slotWidth = 150;
                  const double slotHeight = 88;
                  final Color baseBg = isBooked
                      ? Colors.grey.shade300
                      : isSelected
                          ? Colors.blue.shade100
                          : Colors.white;
                  final Color baseBorder = isBooked
                      ? Colors.grey
                      : isSelected
                          ? Colors.blue
                          : Colors.grey.shade300;

                  final Widget slotContent = Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        '${slot['startTime']} - ${slot['endTime']}',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: isBooked
                              ? Colors.grey
                              : isLockedByOther
                                  ? Colors.amber.shade800
                                  : Colors.black,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        textAlign: TextAlign.center,
                      ),
                      Text(
                        isBooked
                            ? 'Đã đầy'
                            : isLockedByOther
                                ? 'Đang có người chọn'
                                : 'Còn ${slot['maxBookings'] - (slot['bookedCount'] ?? 0)}/${slot['maxBookings']}',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: isLockedByOther ? FontWeight.w600 : FontWeight.normal,
                          color: isBooked
                              ? Colors.grey
                              : isLockedByOther
                                  ? Colors.amber.shade800
                                  : Colors.green,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        textAlign: TextAlign.center,
                      ),
                      if (isLockedByOther)
                        const Padding(
                          padding: EdgeInsets.only(top: 4),
                          child: Icon(
                            Icons.lock_clock,
                            size: 14,
                            color: Colors.amber,
                          ),
                        ),
                      if (isLockedByMe)
                        const Padding(
                          padding: EdgeInsets.only(top: 4),
                          child: Icon(
                            Icons.lock,
                            size: 14,
                            color: Colors.blue,
                          ),
                        ),
                    ],
                  );

                  Widget buildTile({
                    required Color bg,
                    required Color borderColor,
                  }) {
                    return Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: bg,
                        border: Border.all(color: borderColor),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: slotContent,
                    );
                  }

                  Widget slotTile = buildTile(
                    bg: baseBg,
                    borderColor: baseBorder,
                  );

                  if (isLockedByOther) {
                    slotTile = FadeTransition(
                      opacity: _lockPulseAnimation,
                      child: buildTile(
                        bg: Colors.amber.shade50,
                        borderColor: Colors.amber.shade400,
                      ),
                    );
                  } else if (isBooked) {
                    slotTile = buildTile(
                      bg: Colors.grey.shade300,
                      borderColor: Colors.grey,
                    );
                  }

                  return SizedBox(
                    width: slotWidth,
                    height: slotHeight,
                    child: GestureDetector(
                      onTap: (isBooked || isLockedByOther) ? null : () => _handleTimeSlotTap(slot),
                      child: slotTile,
                    ),
                  );
                }).toList(),
              ),
          ],
        ],
      ),
    );
  }

  Widget _buildPaymentInfoStep() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Price summary
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Chi phí dự kiến',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Phí khám:'),
                      Text('${_consultationFee.toStringAsFixed(0)} VNĐ'),
                    ],
                  ),
                  if (_serviceFee > 0) ...[
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Phí dịch vụ:'),
                        Text('${_serviceFee.toStringAsFixed(0)} VNĐ'),
                      ],
                    ),
                  ],
                  if (_discountAmount > 0) ...[
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Giảm giá:', style: TextStyle(color: Colors.green)),
                        Text('-${_discountAmount.toStringAsFixed(0)} VNĐ', 
                             style: const TextStyle(color: Colors.green)),
                      ],
                    ),
                  ],
                  const Divider(),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Tổng cộng:', 
                                 style: TextStyle(fontWeight: FontWeight.bold)),
                      Text('${(_consultationFee + _serviceFee - _discountAmount).toStringAsFixed(0)} VNĐ',
                           style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.blue)),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          // Coupon input
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _couponController,
                  decoration: const InputDecoration(
                    labelText: 'Mã giảm giá (nếu có)',
                    border: OutlineInputBorder(),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              ElevatedButton.icon(
                onPressed: _validateCoupon,
                icon: const Icon(Icons.check),
                label: const Text('Kiểm tra'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          // Appointment type
          DropdownButtonFormField<String>(
            value: _appointmentType,
            decoration: const InputDecoration(
              labelText: 'Loại khám',
              border: OutlineInputBorder(),
            ),
            items: const [
              DropdownMenuItem(value: 'first-visit', child: Text('Khám lần đầu')),
              DropdownMenuItem(value: 'follow-up', child: Text('Tái khám')),
              DropdownMenuItem(value: 'consultation', child: Text('Tư vấn')),
            ],
            onChanged: (value) {
              setState(() {
                _appointmentType = value!;
              });
            },
          ),
          const SizedBox(height: 16),
          // Symptoms
          TextField(
            controller: _symptomsController,
            maxLines: 3,
            decoration: const InputDecoration(
              labelText: 'Triệu chứng',
              border: OutlineInputBorder(),
              hintText: 'Mô tả triệu chứng của bạn...',
            ),
          ),
          const SizedBox(height: 16),
          // Medical history
          TextField(
            controller: _medicalHistoryController,
            maxLines: 3,
            decoration: const InputDecoration(
              labelText: 'Tiền sử bệnh (nếu có)',
              border: OutlineInputBorder(),
              hintText: 'Các bệnh đã mắc, dị ứng, thuốc đang sử dụng...',
            ),
          ),
          const SizedBox(height: 16),
          // Notes
          TextField(
            controller: _notesController,
            maxLines: 3,
            decoration: const InputDecoration(
              labelText: 'Ghi chú thêm',
              border: OutlineInputBorder(),
              hintText: 'Các yêu cầu đặc biệt hoặc thông tin khác...',
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildConfirmationStep() {
    final hospitalProvider = context.read<HospitalProvider>();
    final specialtyProvider = context.read<SpecialtyProvider>();
    final doctorProvider = context.read<DoctorProvider>();
    final serviceProvider = context.read<ServiceProvider>();

    final hospital = hospitalProvider.hospitals.firstWhere(
      (h) => h.id == _selectedHospitalId,
      orElse: () => hospitalProvider.hospitals.first,
    );
    final specialty = specialtyProvider.specialties.firstWhere(
      (s) => s.id == _selectedSpecialtyId,
      orElse: () => specialtyProvider.specialties.first,
    );
    final doctor = doctorProvider.doctors.firstWhere(
      (d) => d.id == _selectedDoctorId,
      orElse: () => doctorProvider.doctors.first,
    );
    final service = _selectedServiceId != null 
        ? serviceProvider.services.firstWhere(
            (s) => s.id == _selectedServiceId,
            orElse: () => serviceProvider.services.first,
          )
        : null;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Xác nhận thông tin đặt lịch',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildInfoRow('Bệnh viện:', hospital.name),
                  _buildInfoRow('Chuyên khoa:', specialty.name),
                  _buildInfoRow('Bác sĩ:', doctor.fullName),
                  if (service != null) _buildInfoRow('Dịch vụ:', service.name),
                  _buildInfoRow('Ngày khám:', _selectedDate != null 
                      ? '${_selectedDate!.day}/${_selectedDate!.month}/${_selectedDate!.year}'
                      : ''),
                  _buildInfoRow('Giờ khám:', _selectedTimeSlot != null 
                      ? '${_selectedTimeSlot!['startTime']} - ${_selectedTimeSlot!['endTime']}'
                      : ''),
                  _buildInfoRow('Loại khám:', _getAppointmentTypeText()),
                  if (_symptomsController.text.isNotEmpty)
                    _buildInfoRow('Triệu chứng:', _symptomsController.text),
                  if (_medicalHistoryController.text.isNotEmpty)
                    _buildInfoRow('Tiền sử bệnh:', _medicalHistoryController.text),
                  if (_notesController.text.isNotEmpty)
                    _buildInfoRow('Ghi chú:', _notesController.text),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Tổng chi phí',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '${(_consultationFee + _serviceFee - _discountAmount).toStringAsFixed(0)} VNĐ',
                    style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.blue),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
          ),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }

  String _getAppointmentTypeText() {
    switch (_appointmentType) {
      case 'first-visit':
        return 'Khám lần đầu';
      case 'follow-up':
        return 'Tái khám';
      case 'consultation':
        return 'Tư vấn';
      default:
        return '';
    }
  }

  Widget _buildNavigationButtons() {
    bool canProceed = false;
    switch (_currentStep) {
      case 0:
        canProceed = _selectedHospitalId != null && _selectedSpecialtyId != null;
        break;
      case 1:
        canProceed = _selectedDoctorId != null && _selectedServiceId != null;
        break;
      case 2:
        canProceed = _selectedDate != null && _selectedTimeSlot != null;
        break;
      case 3:
        canProceed = true;
        break;
      case 4:
        canProceed = true;
        break;
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: Row(
        children: [
          if (_currentStep > 0)
            Expanded(
              child: OutlinedButton(
                onPressed: () {
                  setState(() {
                    _currentStep--;
                  });
                },
                child: const Text('Quay lại'),
              ),
            ),
          if (_currentStep > 0) const SizedBox(width: 16),
          Expanded(
            child: ElevatedButton(
              onPressed: canProceed ? () {
                if (_currentStep < 4) {
                  setState(() {
                    _currentStep++;
                  });
                } else {
                  _submitAppointment();
                }
              } : null,
              child: Text(_currentStep < 4 ? 'Tiếp theo' : 'Hoàn tất'),
            ),
          ),
        ],
      ),
    );
  }

  bool _isSameDay(DateTime a, DateTime b) {
    return a.year == b.year && a.month == b.month && a.day == b.day;
  }

  String _formatDateKey(DateTime date) {
    final year = date.year.toString().padLeft(4, '0');
    final month = date.month.toString().padLeft(2, '0');
    final day = date.day.toString().padLeft(2, '0');
    return '$year-$month-$day';
  }

  Future<void> _initSocket() async {
    if (_socket != null) return;
    try {
      final token = await _tokenStorage.getToken();
      if (token == null || token.isEmpty) return;

      final socket = IO.io(
        ApiConstants.socketUrl,
        IO.OptionBuilder()
            .setTransports(['websocket'])
            .enableReconnection()
            .setPath('/socket.io')
            .setAuth({'token': token})
            .build(),
      );

      socket.onConnect((_) {
        if (!mounted || _isDisposing) return;
        setState(() => _isSocketConnected = true);
        if (_selectedDoctorId != null && _selectedDate != null) {
          _joinAppointmentRoom(_selectedDate!);
        }
      });

      socket.onDisconnect((_) {
        if (!mounted || _isDisposing) return;
        setState(() {
          _isSocketConnected = false;
          _currentRoomKey = null;
          _lockedSlotOwners.clear();
        });
      });

      socket.on('current_locked_slots', (payload) {
        if (payload is Map && payload['lockedSlots'] is List) {
          final Map<String, String> updated = {};
          for (final slot in payload['lockedSlots'] as List) {
            if (slot is Map) {
              final scheduleId = slot['scheduleId']?.toString();
              final timeSlotId = slot['timeSlotId']?.toString();
              final userId = slot['userId']?.toString() ?? '';
              if (scheduleId != null && timeSlotId != null) {
                updated['${scheduleId}_$timeSlotId'] = userId;
              }
            }
          }
          if (!mounted || _isDisposing) return;
          setState(() {
            _lockedSlotOwners
              ..clear()
              ..addAll(updated);
          });
        }
      });

      socket.on('time_slot_locked', (payload) {
        if (payload is Map) {
          final scheduleId = payload['scheduleId']?.toString();
          final timeSlotId = payload['timeSlotId']?.toString();
          final userId = payload['userId']?.toString() ?? '';
          if (scheduleId != null && timeSlotId != null) {
            if (!mounted || _isDisposing) return;
            setState(() {
              _lockedSlotOwners['${scheduleId}_$timeSlotId'] = userId;
            });
          }
        }
      });

      socket.on('time_slot_unlocked', (payload) {
        if (payload is Map) {
          final scheduleId = payload['scheduleId']?.toString();
          final timeSlotId = payload['timeSlotId']?.toString();
          if (scheduleId != null && timeSlotId != null) {
            if (!mounted || _isDisposing) return;
            setState(() {
              _lockedSlotOwners.remove('${scheduleId}_$timeSlotId');
            });
          }
        }
      });

      socket.on('time_slot_lock_rejected', (_) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Khung giờ đang được người khác xử lý')),
          );
        }
      });

      _socket = socket;
    } catch (e) {
      // Ignore socket init errors but keep booking functional
    }
  }

  void _joinAppointmentRoom(DateTime date) {
    if (!_isSocketConnected || _socket == null || _selectedDoctorId == null) return;
    final dateKey = _formatDateKey(date);
    final newRoomKey = 'appointments_${_selectedDoctorId}_$dateKey';
    if (_currentRoomKey == newRoomKey) return;
    setState(() {
      _lockedSlotOwners.clear();
    });
    _socket!.emit('join_appointment_room', {
      'doctorId': _selectedDoctorId,
      'date': dateKey,
    });
    _currentRoomKey = newRoomKey;
  }

  void _lockTimeSlot(Map<String, dynamic> slot) {
    if (!_isSocketConnected || _socket == null || _selectedDoctorId == null || _selectedDate == null) {
      return;
    }
    final slotKey = '${slot['scheduleId']}_${slot['startTime']}';
    setState(() {
      _lockedSlotOwners[slotKey] = _userId ?? '';
    });
    _socket!.emit('lock_time_slot', {
      'scheduleId': slot['scheduleId'],
      'timeSlotId': slot['startTime'],
      'doctorId': _selectedDoctorId,
      'date': _formatDateKey(_selectedDate!),
    });
  }

  void _unlockCurrentSlot() {
    if (!_isSocketConnected || _socket == null || _selectedDoctorId == null || _selectedDate == null) {
      return;
    }
    if (_selectedScheduleId == null || _selectedTimeSlot == null) return;

    final slotKey = '${_selectedScheduleId}_${_selectedTimeSlot?['startTime']}';
    _socket!.emit('unlock_time_slot', {
      'scheduleId': _selectedScheduleId,
      'timeSlotId': _selectedTimeSlot?['startTime'],
      'doctorId': _selectedDoctorId,
      'date': _formatDateKey(_selectedDate!),
    });
    if (_isDisposing || !mounted) {
      _lockedSlotOwners.remove(slotKey);
      return;
    }
    setState(() {
      _lockedSlotOwners.remove(slotKey);
    });
  }

  void _handleTimeSlotTap(Map<String, dynamic> slot) {
    final slotKey = '${slot['scheduleId']}_${slot['startTime']}';
    final lockedBy = _lockedSlotOwners[slotKey];
    final lockedByOther = lockedBy != null && lockedBy.isNotEmpty && lockedBy != _userId;

    if (slot['isBooked'] == true || lockedByOther) {
      return;
    }

    _unlockCurrentSlot();

    setState(() {
      _selectedTimeSlot = slot;
      _selectedScheduleId = slot['scheduleId'];
    });

    _lockTimeSlot(slot);
  }

  Future<void> _fetchSchedules() async {
    if (_selectedDoctorId == null) return;

    setState(() => _isLoading = true);
    try {
      final dio = Dio();
      final response = await dio.get(
        '${ApiConstants.baseUrl}/appointments/doctors/$_selectedDoctorId/schedules',
      );

      if (response.statusCode == 200 && response.data is Map) {
        final data = Map<String, dynamic>.from(response.data as Map);
        final isSuccess = data['success'] == true || data['status'] == 'success';

        final dataField = data['data'];
        List<dynamic> rawSchedules = [];
        if (dataField is List) {
          rawSchedules = dataField;
        } else if (dataField is Map<String, dynamic>) {
          rawSchedules = dataField['schedules'] as List? ?? [];
        } else if (data['schedules'] is List) {
          rawSchedules = data['schedules'] as List;
        }

        if (isSuccess && rawSchedules.isNotEmpty) {
          _schedules = rawSchedules.map((schedule) {
            final scheduleMap = Map<String, dynamic>.from(schedule as Map);
            final timeSlots = (scheduleMap['timeSlots'] as List? ?? []).map((slot) {
              final slotMap = Map<String, dynamic>.from(slot as Map);
              final maxBookings = (slotMap['maxBookings'] ?? 3) as int;
              final bookedCount = (slotMap['bookedCount'] ?? 0) as int;
              return {
                ...slotMap,
                'bookedCount': bookedCount,
                'maxBookings': maxBookings,
                'isBooked': bookedCount >= maxBookings,
              };
            }).toList();

            return {
              ...scheduleMap,
              'isActive': scheduleMap['isActive'] != false,
              'timeSlots': timeSlots,
            };
          }).toList();
          _extractAvailableDates();
        } else {
          _clearScheduleSelections();
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi tải lịch khám: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _clearScheduleSelections() {
    _unlockCurrentSlot();
    setState(() {
      _schedules = [];
      _availableDates = [];
      _selectedDate = null;
      _selectedTimeSlot = null;
      _selectedScheduleId = null;
      _timeSlots = [];
    });
  }

  void _extractAvailableDates() {
    final dates = <DateTime>[];
    for (final schedule in _schedules) {
      if ((schedule['isActive'] != false) && schedule['date'] != null) {
        try {
          final date = DateTime.parse(schedule['date']);
          dates.add(DateTime(date.year, date.month, date.day));
        } catch (e) {
          // Skip invalid dates
        }
      }
    }

    final sortedDates = dates.toSet().toList()..sort();
    DateTime? nextSelectedDate = _selectedDate;
    bool keepCurrentSelection = false;

    if (sortedDates.isNotEmpty) {
      keepCurrentSelection = nextSelectedDate != null &&
          sortedDates.any((d) => _isSameDay(d, nextSelectedDate!));
      nextSelectedDate = keepCurrentSelection ? nextSelectedDate : sortedDates.first;
    } else {
      nextSelectedDate = null;
    }

    setState(() {
      _availableDates = sortedDates;
      _selectedDate = nextSelectedDate;
      if (sortedDates.isNotEmpty) {
        final first = sortedDates.first;
        _calendarMonth = DateTime(first.year, first.month);
      }
      if (!keepCurrentSelection) {
        _selectedTimeSlot = null;
        _selectedScheduleId = null;
        _timeSlots = [];
      }
    });

    if (nextSelectedDate != null) {
      _loadTimeSlots(nextSelectedDate);
      _joinAppointmentRoom(nextSelectedDate);
    }
  }

  void _loadTimeSlots(DateTime date) {
    _lockedSlotOwners.clear();
    final slots = <Map<String, dynamic>>[];
    for (final schedule in _schedules) {
      final isActive = schedule['isActive'] != false;
      if (!isActive || schedule['date'] == null) continue;

      try {
        final scheduleDate = DateTime.parse(schedule['date']);
        if (_isSameDay(scheduleDate, date)) {
          final timeSlots = schedule['timeSlots'] as List? ?? [];
          for (final slot in timeSlots) {
            if (slot is Map && slot['startTime'] != null && slot['endTime'] != null) {
              final maxBookings = (slot['maxBookings'] ?? 3) as int;
              final bookedCount = (slot['bookedCount'] ?? 0) as int;
              slots.add({
                'scheduleId': schedule['_id'],
                'startTime': slot['startTime'],
                'endTime': slot['endTime'],
                'bookedCount': bookedCount,
                'maxBookings': maxBookings,
                'isBooked': bookedCount >= maxBookings,
                'roomId': slot['roomId'],
              });
            }
          }
        }
      } catch (e) {
        // Skip invalid schedule
      }
    }
    slots.sort((a, b) => (a['startTime'] as String).compareTo(b['startTime'] as String));
    setState(() {
      _timeSlots = slots;
    });
    _joinAppointmentRoom(date);
  }

  void _changeMonth(int delta) {
    final next = DateTime(_calendarMonth.year, _calendarMonth.month + delta);
    // Bound within the next 90 days window starting from now
    final minDate = DateTime(DateTime.now().year, DateTime.now().month, 1);
    final maxDate = DateTime.now().add(const Duration(days: 90));
    final maxMonth = DateTime(maxDate.year, maxDate.month, 1);
    if (next.isBefore(minDate) || next.isAfter(maxMonth)) return;
    setState(() {
      _calendarMonth = next;
    });
  }

  Widget _buildCalendarGrid() {
    final firstDayOfMonth = DateTime(_calendarMonth.year, _calendarMonth.month, 1);
    final daysInMonth = DateUtils.getDaysInMonth(_calendarMonth.year, _calendarMonth.month);
    final leadingEmpty = (firstDayOfMonth.weekday + 6) % 7; // Monday start
    final totalCells = leadingEmpty + daysInMonth;
    final rows = (totalCells / 7).ceil();
    final totalWithTrailing = rows * 7;

    return Column(
      children: List.generate(rows, (row) {
        return Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: List.generate(7, (col) {
            final cellIndex = row * 7 + col;
            if (cellIndex < leadingEmpty || cellIndex >= totalWithTrailing) {
              return const _CalendarDayCell.empty();
            }
            final dayNumber = cellIndex - leadingEmpty + 1;
            if (dayNumber > daysInMonth) {
              return const _CalendarDayCell.empty();
            }
            final date = DateTime(_calendarMonth.year, _calendarMonth.month, dayNumber);
            final isAvailable = _availableDates.any((d) => _isSameDay(d, date));
            final isSelected = _selectedDate != null && _isSameDay(_selectedDate!, date);
            return _CalendarDayCell(
              day: dayNumber,
              isAvailable: isAvailable,
              isSelected: isSelected,
              onTap: isAvailable
                  ? () {
                      _unlockCurrentSlot();
                      setState(() {
                        _selectedDate = date;
                        _selectedTimeSlot = null;
                      });
                      _loadTimeSlots(date);
                    }
                  : null,
            );
          }),
        );
      }),
    );
  }

  void _calculatePrices() {
    // This would normally fetch from API
    _consultationFee = 200000; // Default consultation fee
    if (_selectedServiceId != null) {
      final serviceProvider = context.read<ServiceProvider>();
      final service = serviceProvider.services.firstWhere(
        (s) => s.id == _selectedServiceId,
        orElse: () => serviceProvider.services.first,
      );
      _serviceFee = service.price;
    } else {
      _serviceFee = 0;
    }
    setState(() {});
  }

  Future<void> _validateCoupon() async {
    final couponCode = _couponController.text.trim();
    if (couponCode.isEmpty) return;

    setState(() => _isLoading = true);
    try {
      final dio = Dio();
      final response = await dio.get(
        '${ApiConstants.baseUrl}/appointments/coupons/validate',
        queryParameters: {'code': couponCode},
      );

      if (response.statusCode == 200 && response.data['success'] == true) {
        final coupon = response.data['data'];
        setState(() {
          _couponInfo = coupon;
          final discountType = coupon['discountType'];
          final discountValue = (coupon['discountValue'] ?? 0).toDouble();
          
          if (discountType == 'percentage') {
            _discountAmount = (_consultationFee + _serviceFee) * discountValue / 100;
          } else {
            _discountAmount = discountValue;
          }
        });

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Áp dụng mã giảm giá thành công'),
              backgroundColor: Colors.green,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Mã giảm giá không hợp lệ: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _submitAppointment() async {
    setState(() => _isLoading = true);
    try {
      final dio = Dio();
      final token = await _tokenStorage.getToken();
      if (token != null && token.isNotEmpty) {
        dio.options.headers['Authorization'] = 'Bearer $token';
      }
      
      final requestData = {
        'hospitalId': _selectedHospitalId,
        'specialtyId': _selectedSpecialtyId,
        'doctorId': _selectedDoctorId,
        'serviceId': _selectedServiceId,
        'scheduleId': _selectedScheduleId,
        // Send date in yyyy-MM-dd to avoid timezone drift on server comparison
        'appointmentDate': _selectedDate != null ? _formatDateKey(_selectedDate!) : null,
        'timeSlot': {
          'startTime': _selectedTimeSlot?['startTime'],
          'endTime': _selectedTimeSlot?['endTime'],
        },
        'appointmentType': _appointmentType,
        'symptoms': _symptomsController.text.trim(),
        'medicalHistory': _medicalHistoryController.text.trim(),
        'notes': _notesController.text.trim(),
        'couponCode': _couponController.text.trim(),
        'paymentMethod': 'cash',
        'estimatedCost': _consultationFee + _serviceFee - _discountAmount,
      };

      final response = await dio.post(
        '${ApiConstants.baseUrl}/appointments',
        data: requestData,
      );

      if (response.statusCode == 201 && response.data['success'] == true) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(response.data['message'] ?? 'Đặt lịch thành công!'),
              backgroundColor: Colors.green,
            ),
          );
          Navigator.of(context).pop(true);
        }
      } else {
        final msg = response.data is Map && response.data['message'] != null
            ? response.data['message'].toString()
            : 'Đặt lịch không thành công';
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(msg)),
          );
        }
      }
    } catch (e) {
      String message = 'Lỗi đặt lịch: $e';
      if (e is DioException) {
        final data = e.response?.data;
        if (data is Map && data['message'] != null) {
          message = data['message'].toString();
        }
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(message)),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }
}

class _CalendarDayLabel extends StatelessWidget {
  final String text;
  const _CalendarDayLabel(this.text);

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Center(
        child: Text(
          text,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey.shade600,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}

class _CalendarDayCell extends StatelessWidget {
  final int? day;
  final bool isAvailable;
  final bool isSelected;
  final VoidCallback? onTap;

  const _CalendarDayCell({
    this.day,
    this.isAvailable = false,
    this.isSelected = false,
    this.onTap,
  });

  const _CalendarDayCell.empty()
      : day = null,
        isAvailable = false,
        isSelected = false,
        onTap = null;

  @override
  Widget build(BuildContext context) {
    if (day == null) {
      return const Expanded(child: SizedBox(height: 36));
    }

    final borderColor = isSelected
        ? Colors.blue
        : isAvailable
            ? Colors.blue
            : Colors.transparent;
    final bgColor = isSelected ? Colors.blue.shade50 : Colors.white;
    final textColor = isAvailable ? Colors.black : Colors.grey.shade400;

    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          margin: const EdgeInsets.symmetric(vertical: 4),
          height: 36,
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: borderColor, width: isAvailable ? 1.5 : 1),
          ),
          alignment: Alignment.center,
          child: Text(
            '$day',
            style: TextStyle(
              color: textColor,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ),
    );
  }
}
