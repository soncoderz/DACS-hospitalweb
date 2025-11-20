import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:dio/dio.dart';
import '../../providers/hospital_provider.dart';
import '../../providers/specialty_provider.dart';
import '../../providers/doctor_provider.dart';
import '../../providers/service_provider.dart';
import '../../../core/constants/api_constants.dart';

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

class _AppointmentBookingScreenState extends State<AppointmentBookingScreen> {
  int _currentStep = 0;
  bool _isLoading = false;

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

  // Price details
  double _consultationFee = 0;
  double _serviceFee = 0;
  double _discountAmount = 0;
  Map<String, dynamic>? _couponInfo;

  @override
  void initState() {
    super.initState();
    _selectedHospitalId = widget.hospitalId;
    _selectedSpecialtyId = widget.specialtyId;
    _selectedDoctorId = widget.doctorId;
    _selectedServiceId = widget.serviceId;

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadInitialData();
    });
  }

  @override
  void dispose() {
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
              height: 300,
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey.shade300),
                borderRadius: BorderRadius.circular(8),
              ),
              child: CalendarDatePicker(
                initialDate: _selectedDate ?? _availableDates.first,
                firstDate: DateTime.now(),
                lastDate: DateTime.now().add(const Duration(days: 90)),
                onDateChanged: (date) {
                  if (_availableDates.any((d) => 
                      d.year == date.year && 
                      d.month == date.month && 
                      d.day == date.day)) {
                    setState(() {
                      _selectedDate = date;
                      _selectedTimeSlot = null;
                    });
                    _loadTimeSlots(date);
                  }
                },
                selectableDayPredicate: (date) {
                  return _availableDates.any((d) => 
                      d.year == date.year && 
                      d.month == date.month && 
                      d.day == date.day);
                },
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
                  return GestureDetector(
                    onTap: isBooked ? null : () {
                      setState(() {
                        _selectedTimeSlot = slot;
                        _selectedScheduleId = slot['scheduleId'];
                      });
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: isBooked 
                            ? Colors.grey.shade300
                            : isSelected 
                                ? Colors.blue.shade100
                                : Colors.white,
                        border: Border.all(
                          color: isBooked 
                              ? Colors.grey
                              : isSelected 
                                  ? Colors.blue
                                  : Colors.grey.shade300,
                        ),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Column(
                        children: [
                          Text(
                            '${slot['startTime']} - ${slot['endTime']}',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              color: isBooked ? Colors.grey : Colors.black,
                            ),
                          ),
                          Text(
                            isBooked 
                                ? 'Đã đầy'
                                : 'Còn ${slot['maxBookings'] - (slot['bookedCount'] ?? 0)}/${slot['maxBookings']}',
                            style: TextStyle(
                              fontSize: 12,
                              color: isBooked 
                                  ? Colors.grey
                                  : Colors.green,
                            ),
                          ),
                        ],
                      ),
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
          TextField(
            controller: _couponController,
            decoration: InputDecoration(
              labelText: 'Mã giảm giá (nếu có)',
              border: const OutlineInputBorder(),
              suffixIcon: IconButton(
                icon: const Icon(Icons.check),
                onPressed: _validateCoupon,
              ),
            ),
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

  Future<void> _fetchSchedules() async {
    if (_selectedDoctorId == null) return;

    setState(() => _isLoading = true);
    try {
      final dio = Dio();
      final response = await dio.get(
        '${ApiConstants.baseUrl}/appointments/doctors/$_selectedDoctorId/schedules',
      );

      if (response.statusCode == 200 && response.data['success'] == true) {
        _schedules = response.data['data'] ?? [];
        _extractAvailableDates();
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

  void _extractAvailableDates() {
    final dates = <DateTime>[];
    for (final schedule in _schedules) {
      if (schedule['isActive'] == true && schedule['date'] != null) {
        try {
          final date = DateTime.parse(schedule['date']);
          dates.add(DateTime(date.year, date.month, date.day));
        } catch (e) {
          // Skip invalid dates
        }
      }
    }
    setState(() {
      _availableDates = dates.toSet().toList()..sort();
    });
  }

  void _loadTimeSlots(DateTime date) {
    final slots = <Map<String, dynamic>>[];
    for (final schedule in _schedules) {
      if (schedule['date'] == null) continue;
      
      try {
        final scheduleDate = DateTime.parse(schedule['date']);
        if (scheduleDate.year == date.year && 
            scheduleDate.month == date.month && 
            scheduleDate.day == date.day &&
            schedule['isActive'] == true) {
          final timeSlots = schedule['timeSlots'] as List? ?? [];
          for (final slot in timeSlots) {
            if (slot['startTime'] != null && slot['endTime'] != null) {
              slots.add({
                'scheduleId': schedule['_id'],
                'startTime': slot['startTime'],
                'endTime': slot['endTime'],
                'bookedCount': slot['bookedCount'] ?? 0,
                'maxBookings': slot['maxBookings'] ?? 3,
                'isBooked': (slot['bookedCount'] ?? 0) >= (slot['maxBookings'] ?? 3),
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
      
      final requestData = {
        'hospitalId': _selectedHospitalId,
        'specialtyId': _selectedSpecialtyId,
        'doctorId': _selectedDoctorId,
        'serviceId': _selectedServiceId,
        'scheduleId': _selectedScheduleId,
        'appointmentDate': _selectedDate?.toIso8601String(),
        'timeSlot': {
          'startTime': _selectedTimeSlot?['startTime'],
          'endTime': _selectedTimeSlot?['endTime'],
        },
        'appointmentType': _appointmentType,
        'symptoms': _symptomsController.text.trim(),
        'medicalHistory': _medicalHistoryController.text.trim(),
        'notes': _notesController.text.trim(),
        'couponCode': _couponController.text.trim(),
        'estimatedCost': _consultationFee + _serviceFee - _discountAmount,
      };

      final response = await dio.post(
        '${ApiConstants.baseUrl}/appointments',
        data: requestData,
      );

      if (response.statusCode == 201 && response.data['success']) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Đặt lịch thành công!'),
              backgroundColor: Colors.green,
            ),
          );
          Navigator.of(context).pop(true);
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi đặt lịch: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }
}
