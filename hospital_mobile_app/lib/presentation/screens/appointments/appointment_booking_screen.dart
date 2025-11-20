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
  String _selectedPaymentMethod = 'hospital';
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
        
        // Date Selection
        Card(
          elevation: 2,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Ngày khám:',
                  style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
                ),
                const SizedBox(height: 12),
                InkWell(
                  onTap: () async {
                    final date = await showDatePicker(
                      context: context,
                      initialDate: DateTime.now().add(const Duration(days: 1)),
                      firstDate: DateTime.now(),
                      lastDate: DateTime.now().add(const Duration(days: 30)),
                      builder: (context, child) {
                        return Theme(
                          data: Theme.of(context).copyWith(
                            colorScheme: const ColorScheme.light(
                              primary: Colors.blue,
                            ),
                          ),
                          child: child!,
                        );
                      },
                    );
                    if (date != null) {
                      setState(() {
                        _selectedDate = date;
                      });
                    }
                  },
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      border: Border.all(
                        color: _selectedDate != null ? Colors.blue : Colors.grey.shade400,
                        width: 2,
                      ),
                      borderRadius: BorderRadius.circular(12),
                      color: _selectedDate != null ? Colors.blue.shade50 : Colors.white,
                    ),
                    child: Row(
                      children: [
                        Icon(
                          Icons.calendar_today,
                          color: _selectedDate != null ? Colors.blue : Colors.grey,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            _selectedDate != null
                                ? DateFormat('EEEE, dd/MM/yyyy', 'vi').format(_selectedDate!)
                                : 'Chọn ngày khám',
                            style: TextStyle(
                              fontSize: 16,
                              color: _selectedDate != null ? Colors.blue.shade900 : Colors.grey,
                              fontWeight: _selectedDate != null ? FontWeight.w600 : FontWeight.normal,
                            ),
                          ),
                        ),
                        Icon(
                          Icons.arrow_forward_ios,
                          size: 16,
                          color: _selectedDate != null ? Colors.blue : Colors.grey,
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        
        const SizedBox(height: 20),
        
        // Time Slot Selection
        const Text(
          'Giờ khám:',
          style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
        ),
        const SizedBox(height: 12),
        
        // Morning slots
        Card(
          elevation: 1,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.wb_sunny, color: Colors.orange.shade400, size: 20),
                    const SizedBox(width: 8),
                    const Text(
                      'Buổi sáng',
                      style: TextStyle(fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30']
                      .map((time) => _buildTimeSlotChip(time))
                      .toList(),
                ),
              ],
            ),
          ),
        ),
        
        const SizedBox(height: 12),
        
        // Afternoon slots
        Card(
          elevation: 1,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.wb_twilight, color: Colors.blue.shade400, size: 20),
                    const SizedBox(width: 8),
                    const Text(
                      'Buổi chiều',
                      style: TextStyle(fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: ['14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30']
                      .map((time) => _buildTimeSlotChip(time))
                      .toList(),
                ),
              ],
            ),
          ),
        ),
        
        if (_selectedDate != null && _selectedTimeSlot != null) ...[
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.green.shade50,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.green.shade200),
            ),
            child: Row(
              children: [
                Icon(Icons.check_circle, color: Colors.green.shade700),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Đã chọn: ${DateFormat('dd/MM/yyyy').format(_selectedDate!)} lúc $_selectedTimeSlot',
                    style: TextStyle(
                      color: Colors.green.shade900,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildTimeSlotChip(String time) {
    final isSelected = _selectedTimeSlot == time;
    return InkWell(
      onTap: () {
        setState(() {
          _selectedTimeSlot = time;
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? Colors.blue : Colors.white,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isSelected ? Colors.blue : Colors.grey.shade300,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Text(
          time,
          style: TextStyle(
            color: isSelected ? Colors.white : Colors.black87,
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
          ),
        ),
      ),
    );
  }

  Widget _buildPatientInfo() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text(
          'Thông Tin & Thanh Toán',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        
        // Patient Information
        Card(
          elevation: 2,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.person, color: Colors.blue.shade700),
                    const SizedBox(width: 8),
                    const Text(
                      'Thông tin bệnh nhân',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _reasonController,
                  decoration: InputDecoration(
                    labelText: 'Lý do khám',
                    hintText: 'Mô tả triệu chứng hoặc lý do khám bệnh',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    prefixIcon: const Icon(Icons.medical_information),
                    helperText: 'Không bắt buộc',
                  ),
                  maxLines: 3,
                ),
              ],
            ),
          ),
        ),
        
        const SizedBox(height: 16),
        
        // Payment Information
        Card(
          elevation: 2,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.payment, color: Colors.green.shade700),
                    const SizedBox(width: 8),
                    const Text(
                      'Thông tin thanh toán',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                
                // Coupon Code
                TextField(
                  controller: _couponController,
                  decoration: InputDecoration(
                    labelText: 'Mã giảm giá',
                    hintText: 'Nhập mã giảm giá (nếu có)',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    prefixIcon: const Icon(Icons.confirmation_number),
                    suffixIcon: IconButton(
                      icon: const Icon(Icons.check_circle),
                      onPressed: () {
                        // TODO: Validate coupon code
                        if (_couponController.text.isNotEmpty) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Đang kiểm tra mã giảm giá...'),
                              duration: Duration(seconds: 1),
                            ),
                          );
                        }
                      },
                    ),
                    helperText: 'Không bắt buộc',
                  ),
                ),
                
                const SizedBox(height: 16),
                
                // Price Summary
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade50,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.grey.shade300),
                  ),
                  child: Column(
                    children: [
                      _buildPriceRow('Phí khám:', '200,000đ'),
                      const Divider(),
                      _buildPriceRow('Giảm giá:', '-0đ', color: Colors.green),
                      const Divider(),
                      _buildPriceRow(
                        'Tổng cộng:',
                        '200,000đ',
                        isTotal: true,
                      ),
                    ],
                  ),
                ),
                
                const SizedBox(height: 16),
                
                // Payment Method
                const Text(
                  'Phương thức thanh toán:',
                  style: TextStyle(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 8),
                
                _buildPaymentMethodOption(
                  'Thanh toán tại bệnh viện',
                  Icons.local_hospital,
                  Colors.blue,
                ),
                const SizedBox(height: 8),
                _buildPaymentMethodOption(
                  'Thanh toán qua MoMo',
                  Icons.account_balance_wallet,
                  Colors.pink,
                ),
                const SizedBox(height: 8),
                _buildPaymentMethodOption(
                  'Thanh toán qua thẻ',
                  Icons.credit_card,
                  Colors.orange,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPriceRow(String label, String value, {Color? color, bool isTotal = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
              fontSize: isTotal ? 16 : 14,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontWeight: isTotal ? FontWeight.bold : FontWeight.w600,
              fontSize: isTotal ? 18 : 14,
              color: color ?? (isTotal ? Colors.blue.shade900 : Colors.black87),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentMethodOption(String title, IconData icon, Color color) {
    final methodKey = title.contains('bệnh viện') ? 'hospital' 
        : title.contains('MoMo') ? 'momo' 
        : 'card';
    final isSelected = _selectedPaymentMethod == methodKey;
    
    return InkWell(
      onTap: () {
        setState(() {
          _selectedPaymentMethod = methodKey;
        });
      },
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isSelected ? color.withOpacity(0.1) : Colors.white,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isSelected ? color : Colors.grey.shade300,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Icon(icon, color: color),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                title,
                style: TextStyle(
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                ),
              ),
            ),
            if (isSelected)
              Icon(Icons.check_circle, color: color),
          ],
        ),
      ),
    );
  }

  Widget _buildReviewAndConfirm() {
    return Consumer4<HospitalProvider, SpecialtyProvider, DoctorProvider, ServiceProvider>(
      builder: (context, hospitalProvider, specialtyProvider, doctorProvider, serviceProvider, child) {
        final selectedHospital = hospitalProvider.hospitals
            .firstWhere((h) => h['_id'] == _selectedHospitalId, orElse: () => {});
        final selectedSpecialty = specialtyProvider.specialties
            .firstWhere((s) => s['_id'] == _selectedSpecialtyId, orElse: () => {});
        final selectedDoctor = doctorProvider.doctors
            .firstWhere((d) => d['_id'] == _selectedDoctorId, orElse: () => {});
        final selectedService = _selectedServiceId != null
            ? serviceProvider.services.firstWhere(
                (s) => s['_id'] == _selectedServiceId,
                orElse: () => {},
              )
            : null;

        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const Text(
              'Xác Nhận Thông Tin',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text(
              'Vui lòng kiểm tra kỹ thông tin trước khi xác nhận',
              style: TextStyle(color: Colors.grey),
            ),
            const SizedBox(height: 20),
            
            // Hospital & Specialty Info
            Card(
              elevation: 2,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.local_hospital, color: Colors.blue.shade700),
                        const SizedBox(width: 8),
                        const Text(
                          'Thông tin khám',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                    const Divider(height: 24),
                    _buildInfoRow('Bệnh viện:', selectedHospital['name'] ?? 'Chưa chọn'),
                    _buildInfoRow('Chuyên khoa:', selectedSpecialty['name'] ?? 'Chưa chọn'),
                    if (selectedService != null)
                      _buildInfoRow('Dịch vụ:', selectedService['name'] ?? 'Không có'),
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 12),
            
            // Doctor Info
            Card(
              elevation: 2,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.person, color: Colors.green.shade700),
                        const SizedBox(width: 8),
                        const Text(
                          'Bác sĩ',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                    const Divider(height: 24),
                    if (selectedDoctor.isNotEmpty) ...[
                      Row(
                        children: [
                          CircleAvatar(
                            radius: 30,
                            backgroundImage: NetworkImage(
                              selectedDoctor['user']?['avatarUrl'] ?? 
                              AppConstants.defaultDoctorAvatarUrl,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  selectedDoctor['user']?['fullName'] ?? 'Bác sĩ',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w600,
                                    fontSize: 16,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    const Icon(Icons.star, color: Colors.amber, size: 16),
                                    Text(
                                      ' ${(selectedDoctor['avgRating'] ?? 0.0).toStringAsFixed(1)}',
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ] else
                      const Text('Chưa chọn bác sĩ'),
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 12),
            
            // Date & Time Info
            Card(
              elevation: 2,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.calendar_today, color: Colors.orange.shade700),
                        const SizedBox(width: 8),
                        const Text(
                          'Thời gian khám',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                    const Divider(height: 24),
                    _buildInfoRow(
                      'Ngày khám:',
                      _selectedDate != null
                          ? DateFormat('EEEE, dd/MM/yyyy', 'vi').format(_selectedDate!)
                          : 'Chưa chọn',
                    ),
                    _buildInfoRow('Giờ khám:', _selectedTimeSlot ?? 'Chưa chọn'),
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 12),
            
            // Additional Info
            Card(
              elevation: 2,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.info_outline, color: Colors.purple.shade700),
                        const SizedBox(width: 8),
                        const Text(
                          'Thông tin thêm',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                    const Divider(height: 24),
                    _buildInfoRow(
                      'Lý do khám:',
                      _reasonController.text.isEmpty
                          ? 'Không có'
                          : _reasonController.text,
                    ),
                    _buildInfoRow(
                      'Mã giảm giá:',
                      _couponController.text.isEmpty
                          ? 'Không có'
                          : _couponController.text,
                    ),
                    _buildInfoRow(
                      'Thanh toán:',
                      _selectedPaymentMethod == 'hospital'
                          ? 'Tại bệnh viện'
                          : _selectedPaymentMethod == 'momo'
                              ? 'MoMo'
                              : 'Thẻ',
                    ),
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 12),
            
            // Total Price
            Card(
              elevation: 2,
              color: Colors.blue.shade50,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Tổng chi phí:',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      '200,000đ',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: Colors.blue.shade900,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 16),
            
            // Terms & Conditions
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.amber.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.amber.shade200),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.warning_amber, color: Colors.amber.shade700),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Text(
                      'Vui lòng đến trước giờ hẹn 15 phút để làm thủ tục. '
                      'Nếu muốn hủy lịch, vui lòng hủy trước 24 giờ.',
                      style: TextStyle(fontSize: 13),
                    ),
                  ),
                ],
              ),
            ),
          ],
        );
      },
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
    final canProceed = _canProceedToNextStep();
    
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
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: const Text('Quay lại'),
              ),
            ),
          if (_currentStep > 0) const SizedBox(width: 12),
          Expanded(
            child: ElevatedButton(
              onPressed: canProceed
                  ? (_currentStep == 6 ? _submitBooking : _nextStep)
                  : null,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                disabledBackgroundColor: Colors.grey.shade300,
              ),
              child: Text(
                _currentStep == 6 ? 'Xác nhận đặt lịch' : 'Tiếp tục',
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
              ),
            ),
          ),
        ],
      ),
    );
  }

  bool _canProceedToNextStep() {
    switch (_currentStep) {
      case 0:
        return _selectedHospitalId != null;
      case 1:
        return _selectedSpecialtyId != null;
      case 2:
        return true; // Service is optional
      case 3:
        return _selectedDoctorId != null;
      case 4:
        return _selectedDate != null && _selectedTimeSlot != null;
      case 5:
        return true; // Patient info is optional
      case 6:
        return true; // Review step
      default:
        return false;
    }
  }
}
