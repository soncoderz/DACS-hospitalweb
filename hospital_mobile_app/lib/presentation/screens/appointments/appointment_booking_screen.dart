import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../../core/constants/app_constants.dart';
import '../../providers/hospital_provider.dart';
import '../../providers/specialty_provider.dart';
import '../../providers/service_provider.dart';
import '../../providers/doctor_provider.dart';
import '../../providers/appointment_provider.dart';

class AppointmentBookingScreen extends StatefulWidget {
  const AppointmentBookingScreen({super.key});

  @override
  State<AppointmentBookingScreen> createState() => _AppointmentBookingScreenState();
}

class _AppointmentBookingScreenState extends State<AppointmentBookingScreen> {
  int _currentStep = 0;
  
  // Booking data
  String? _selectedHospitalId;
  String? _selectedSpecialtyId;
  String? _selectedServiceId;
  String? _selectedDoctorId;
  DateTime? _selectedDate;
  String? _selectedTimeSlot;
  final _reasonController = TextEditingController();
  final _couponController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadInitialData();
  }

  void _loadInitialData() {
    context.read<HospitalProvider>().fetchHospitals();
  }

  @override
  void dispose() {
    _reasonController.dispose();
    _couponController.dispose();
    super.dispose();
  }

  void _nextStep() {
    if (_currentStep < 6) {
      setState(() {
        _currentStep++;
      });
    }
  }

  void _previousStep() {
    if (_currentStep > 0) {
      setState(() {
        _currentStep--;
      });
    }
  }

  Future<void> _submitBooking() async {
    if (_selectedDoctorId == null || _selectedSpecialtyId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng chọn đủ thông tin')),
      );
      return;
    }

    final appointmentProvider = context.read<AppointmentProvider>();
    
    final success = await appointmentProvider.bookAppointment(
      doctorId: _selectedDoctorId!,
      specialtyId: _selectedSpecialtyId!,
      appointmentDate: _selectedDate ?? DateTime.now(),
      timeSlot: _selectedTimeSlot ?? '08:00',
      reason: _reasonController.text.trim().isEmpty ? null : _reasonController.text.trim(),
    );

    if (!mounted) return;

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Đặt lịch thành công!'),
          backgroundColor: Colors.green,
        ),
      );
      Navigator.pushReplacementNamed(context, '/appointments');
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(appointmentProvider.errorMessage ?? 'Đặt lịch thất bại'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Đặt Lịch Khám'),
        elevation: 0,
      ),
      body: Column(
        children: [
          // Progress indicator
          _buildProgressIndicator(),
          
          // Step content
          Expanded(
            child: _buildStepContent(),
          ),
          
          // Navigation buttons
          _buildNavigationButtons(),
        ],
      ),
    );
  }

  Widget _buildProgressIndicator() {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: List.generate(7, (index) {
          final isActive = index <= _currentStep;
          final isCompleted = index < _currentStep;
          
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
                if (index < 6) const SizedBox(width: 4),
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
        return _buildHospitalSelection();
      case 1:
        return _buildSpecialtySelection();
      case 2:
        return _buildServiceSelection();
      case 3:
        return _buildDoctorSelection();
      case 4:
        return _buildDateTimeSelection();
      case 5:
        return _buildPatientInfo();
      case 6:
        return _buildReviewAndConfirm();
      default:
        return const SizedBox();
    }
  }

  Widget _buildHospitalSelection() {
    return Consumer<HospitalProvider>(
      builder: (context, provider, child) {
        if (provider.isLoading) {
          return const Center(child: CircularProgressIndicator());
        }

        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const Text(
              'Chọn Bệnh Viện / Phòng Khám',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            ...provider.hospitals.map((hospital) {
              final isSelected = _selectedHospitalId == hospital['_id'];
              return Card(
                color: isSelected ? Colors.blue.shade50 : null,
                child: ListTile(
                  leading: const Icon(Icons.local_hospital, color: Colors.blue),
                  title: Text(hospital['name'] ?? ''),
                  subtitle: Text(hospital['address'] ?? ''),
                  trailing: isSelected ? const Icon(Icons.check_circle, color: Colors.blue) : null,
                  onTap: () {
                    setState(() {
                      _selectedHospitalId = hospital['_id'];
                    });
                    context.read<SpecialtyProvider>().fetchSpecialties();
                    _nextStep();
                  },
                ),
              );
            }).toList(),
          ],
        );
      },
    );
  }

  Widget _buildSpecialtySelection() {
    return Consumer<SpecialtyProvider>(
      builder: (context, provider, child) {
        if (provider.isLoading) {
          return const Center(child: CircularProgressIndicator());
        }

        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const Text(
              'Chọn Chuyên Khoa',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            ...provider.specialties.map((specialty) {
              final isSelected = _selectedSpecialtyId == specialty['_id'];
              return Card(
                color: isSelected ? Colors.blue.shade50 : null,
                child: ListTile(
                  leading: const Icon(Icons.medical_services, color: Colors.blue),
                  title: Text(specialty['name'] ?? ''),
                  trailing: isSelected ? const Icon(Icons.check_circle, color: Colors.blue) : null,
                  onTap: () {
                    setState(() {
                      _selectedSpecialtyId = specialty['_id'];
                    });
                    context.read<ServiceProvider>().fetchServices();
                    _nextStep();
                  },
                ),
              );
            }).toList(),
          ],
        );
      },
    );
  }

  Widget _buildServiceSelection() {
    return Consumer<ServiceProvider>(
      builder: (context, provider, child) {
        if (provider.isLoading) {
          return const Center(child: CircularProgressIndicator());
        }

        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const Text(
              'Chọn Dịch Vụ',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            TextButton(
              onPressed: () {
                setState(() {
                  _selectedServiceId = null;
                });
                _nextStep();
              },
              child: const Text('Bỏ qua bước này'),
            ),
            const SizedBox(height: 8),
            ...provider.services.map((service) {
              final isSelected = _selectedServiceId == service['_id'];
              return Card(
                color: isSelected ? Colors.blue.shade50 : null,
                child: ListTile(
                  leading: const Icon(Icons.medical_information, color: Colors.green),
                  title: Text(service['name'] ?? ''),
                  subtitle: Text('${service['price'] ?? 0}đ'),
                  trailing: isSelected ? const Icon(Icons.check_circle, color: Colors.blue) : null,
                  onTap: () {
                    setState(() {
                      _selectedServiceId = service['_id'];
                    });
                    context.read<DoctorProvider>().fetchDoctors();
                    _nextStep();
                  },
                ),
              );
            }).toList(),
          ],
        );
      },
    );
  }

  Widget _buildDoctorSelection() {
    return Consumer<DoctorProvider>(
      builder: (context, provider, child) {
        if (provider.isLoading) {
          return const Center(child: CircularProgressIndicator());
        }

        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const Text(
              'Chọn Bác Sĩ',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            ...provider.doctors.map((doctor) {
              final isSelected = _selectedDoctorId == doctor['_id'];
              final fullName = doctor['user']?['fullName'] ?? doctor['fullName'] ?? 'Bác sĩ';
              final specialty = doctor['specialtyId']?['name'] ?? '';
              final rating = doctor['avgRating'] ?? 0.0;
              
              return Card(
                color: isSelected ? Colors.blue.shade50 : null,
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundImage: NetworkImage(
                      doctor['user']?['avatarUrl'] ?? AppConstants.defaultDoctorAvatarUrl,
                    ),
                  ),
                  title: Text(fullName),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(specialty),
                      Row(
                        children: [
                          const Icon(Icons.star, color: Colors.amber, size: 16),
                          Text(' ${(rating as num).toStringAsFixed(1)}'),
                        ],
                      ),
                    ],
                  ),
                  trailing: isSelected ? const Icon(Icons.check_circle, color: Colors.blue) : null,
                  onTap: () {
                    setState(() {
                      _selectedDoctorId = doctor['_id'];
                    });
                    _nextStep();
                  },
                ),
              );
            }).toList(),
          ],
        );
      },
    );
  }

  Widget _buildDateTimeSelection() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text(
          'Chọn Ngày & Giờ Khám',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Ngày khám:', style: TextStyle(fontWeight: FontWeight.w600)),
                const SizedBox(height: 8),
                InkWell(
                  onTap: () async {
                    final date = await showDatePicker(
                      context: context,
                      initialDate: DateTime.now().add(const Duration(days: 1)),
                      firstDate: DateTime.now(),
                      lastDate: DateTime.now().add(const Duration(days: 30)),
                    );
                    if (date != null) {
                      setState(() {
                        _selectedDate = date;
                      });
                    }
                  },
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.calendar_today),
                        const SizedBox(width: 12),
                        Text(
                          _selectedDate != null
                              ? DateFormat('dd/MM/yyyy').format(_selectedDate!)
                              : 'Chọn ngày',
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        const Text('Giờ khám:', style: TextStyle(fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            '08:00', '09:00', '10:00', '14:00', '15:00', '16:00',
          ].map((time) {
            final isSelected = _selectedTimeSlot == time;
            return ChoiceChip(
              label: Text(time),
              selected: isSelected,
              onSelected: (selected) {
                setState(() {
                  _selectedTimeSlot = time;
                });
              },
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildPatientInfo() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text(
          'Thông Tin Bệnh Nhân',
          style: TextStyle(fontSize: 20, fontWeight:FontWeight.bold),
        ),
        const SizedBox(height: 16),
        TextField(
          controller: _reasonController,
          decoration: const InputDecoration(
            labelText: 'Lý do khám (không bắt buộc)',
            border: OutlineInputBorder(),
            hintText: 'Mô tả triệu chứng hoặc lý do khám bệnh',
          ),
          maxLines: 3,
        ),
        const SizedBox(height: 16),
        TextField(
          controller: _couponController,
          decoration: const InputDecoration(
            labelText: 'Mã giảm giá (không bắt buộc)',
            border: OutlineInputBorder(),
            suffixIcon: Icon(Icons.confirmation_number),
          ),
        ),
      ],
    );
  }

  Widget _buildReviewAndConfirm() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text(
          'Xác Nhận Thông Tin',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildInfoRow('Ngày khám:', _selectedDate != null
                    ? DateFormat('dd/MM/yyyy').format(_selectedDate!)
                    : 'Chưa chọn'),
                _buildInfoRow('Giờ khám:', _selectedTimeSlot ?? 'Chưa chọn'),
                _buildInfoRow('Lý do:', _reasonController.text.isEmpty
                    ? 'Không có'
                    : _reasonController.text),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
          ),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }

  Widget _buildNavigationButtons() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.grey.shade300,
            blurRadius: 4,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Row(
        children: [
          if (_currentStep > 0)
            Expanded(
              child: OutlinedButton(
                onPressed: _previousStep,
                child: const Text('Quay lại'),
              ),
            ),
          if (_currentStep > 0) const SizedBox(width: 12),
          Expanded(
            child: ElevatedButton(
              onPressed: _currentStep == 6 ? _submitBooking : _nextStep,
              child: Text(_currentStep == 6 ? 'Xác nhận đặt lịch' : 'Tiếp tục'),
            ),
          ),
        ],
      ),
    );
  }
}
