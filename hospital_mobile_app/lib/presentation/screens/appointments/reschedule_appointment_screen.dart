import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../../domain/entities/appointment.dart';
import '../../providers/appointment_provider.dart';
import '../../widgets/common/custom_button.dart';

class RescheduleAppointmentScreen extends StatefulWidget {
  final Appointment appointment;

  const RescheduleAppointmentScreen({
    super.key,
    required this.appointment,
  });

  @override
  State<RescheduleAppointmentScreen> createState() =>
      _RescheduleAppointmentScreenState();
}

class _RescheduleAppointmentScreenState
    extends State<RescheduleAppointmentScreen> {
  DateTime? _selectedDate;
  String? _selectedTimeSlot;
  bool _isLoadingSlots = false;

  @override
  void initState() {
    super.initState();
    _selectedDate = widget.appointment.appointmentDate;
  }

  Future<void> _selectDate() async {
    final now = DateTime.now();
    final firstDate = now.add(const Duration(days: 1));
    final lastDate = now.add(const Duration(days: 90));

    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate ?? firstDate,
      firstDate: firstDate,
      lastDate: lastDate,
      locale: const Locale('vi', 'VN'),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.light(
              primary: Theme.of(context).primaryColor,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null && picked != _selectedDate) {
      setState(() {
        _selectedDate = picked;
        _selectedTimeSlot = null;
      });
      await _loadAvailableSlots();
    }
  }

  Future<void> _loadAvailableSlots() async {
    if (_selectedDate == null) return;

    setState(() {
      _isLoadingSlots = true;
    });

    final provider = context.read<AppointmentProvider>();
    await provider.fetchAvailableSlots(
      widget.appointment.doctorId,
      _selectedDate!,
    );

    setState(() {
      _isLoadingSlots = false;
    });
  }

  Future<void> _confirmReschedule() async {
    if (_selectedDate == null || _selectedTimeSlot == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vui lòng chọn ngày và giờ khám'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    // Check if same date and time
    if (_selectedDate!.year == widget.appointment.appointmentDate.year &&
        _selectedDate!.month == widget.appointment.appointmentDate.month &&
        _selectedDate!.day == widget.appointment.appointmentDate.day &&
        _selectedTimeSlot == widget.appointment.timeSlot) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vui lòng chọn ngày hoặc giờ khác với lịch hiện tại'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Xác nhận đổi lịch'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Bạn có chắc chắn muốn đổi lịch hẹn?'),
            const SizedBox(height: 16),
            const Text(
              'Thông tin mới:',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              'Ngày: ${DateFormat('dd/MM/yyyy', 'vi').format(_selectedDate!)}',
            ),
            Text('Giờ: $_selectedTimeSlot'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Hủy'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Xác nhận'),
          ),
        ],
      ),
    );

    if (confirm != true || !mounted) return;

    final provider = context.read<AppointmentProvider>();
    final success = await provider.rescheduleAppointment(
      widget.appointment.id,
      _selectedDate!,
      _selectedTimeSlot!,
    );

    if (mounted) {
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Đổi lịch hẹn thành công'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context, true);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              provider.errorMessage ?? 'Không thể đổi lịch hẹn',
            ),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Đổi lịch hẹn'),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Current Appointment Info
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              color: Colors.grey.shade100,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Lịch hẹn hiện tại',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Bác sĩ: ${widget.appointment.doctorName}',
                    style: const TextStyle(fontSize: 14),
                  ),
                  Text(
                    'Ngày: ${DateFormat('dd/MM/yyyy', 'vi').format(widget.appointment.appointmentDate)}',
                    style: const TextStyle(fontSize: 14),
                  ),
                  Text(
                    'Giờ: ${widget.appointment.timeSlot}',
                    style: const TextStyle(fontSize: 14),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Select New Date
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Chọn ngày khám mới',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  InkWell(
                    onTap: _selectDate,
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        border: Border.all(color: Colors.grey.shade300),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            _selectedDate != null
                                ? DateFormat('dd/MM/yyyy', 'vi')
                                    .format(_selectedDate!)
                                : 'Chọn ngày',
                            style: TextStyle(
                              fontSize: 16,
                              color: _selectedDate != null
                                  ? Colors.black
                                  : Colors.grey,
                            ),
                          ),
                          const Icon(Icons.calendar_today),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Select Time Slot
            if (_selectedDate != null) ...[
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Chọn giờ khám',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Consumer<AppointmentProvider>(
                      builder: (context, provider, child) {
                        if (_isLoadingSlots) {
                          return const Center(
                            child: Padding(
                              padding: EdgeInsets.all(32),
                              child: CircularProgressIndicator(),
                            ),
                          );
                        }

                        if (provider.availableSlots.isEmpty) {
                          return Container(
                            padding: const EdgeInsets.all(24),
                            decoration: BoxDecoration(
                              color: Colors.orange.shade50,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Column(
                              children: [
                                const Icon(
                                  Icons.event_busy,
                                  size: 48,
                                  color: Colors.orange,
                                ),
                                const SizedBox(height: 8),
                                const Text(
                                  'Không có khung giờ trống',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                const Text(
                                  'Vui lòng chọn ngày khác',
                                  style: TextStyle(color: Colors.grey),
                                ),
                                const SizedBox(height: 12),
                                TextButton(
                                  onPressed: _selectDate,
                                  child: const Text('Chọn ngày khác'),
                                ),
                              ],
                            ),
                          );
                        }

                        return GridView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          gridDelegate:
                              const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 3,
                            childAspectRatio: 2.5,
                            crossAxisSpacing: 8,
                            mainAxisSpacing: 8,
                          ),
                          itemCount: provider.availableSlots.length,
                          itemBuilder: (context, index) {
                            final slot = provider.availableSlots[index];
                            final isSelected = _selectedTimeSlot == slot.time;

                            return InkWell(
                              onTap: slot.isAvailable
                                  ? () {
                                      setState(() {
                                        _selectedTimeSlot = slot.time;
                                      });
                                    }
                                  : null,
                              child: Container(
                                decoration: BoxDecoration(
                                  color: !slot.isAvailable
                                      ? Colors.grey.shade200
                                      : isSelected
                                          ? Theme.of(context).primaryColor
                                          : Colors.white,
                                  border: Border.all(
                                    color: !slot.isAvailable
                                        ? Colors.grey.shade300
                                        : isSelected
                                            ? Theme.of(context).primaryColor
                                            : Colors.grey.shade400,
                                  ),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Center(
                                  child: Text(
                                    slot.time,
                                    style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: isSelected
                                          ? FontWeight.bold
                                          : FontWeight.normal,
                                      color: !slot.isAvailable
                                          ? Colors.grey
                                          : isSelected
                                              ? Colors.white
                                              : Colors.black,
                                    ),
                                  ),
                                ),
                              ),
                            );
                          },
                        );
                      },
                    ),
                  ],
                ),
              ),
            ],

            const SizedBox(height: 32),

            // Confirm Button
            Padding(
              padding: const EdgeInsets.all(16),
              child: Consumer<AppointmentProvider>(
                builder: (context, provider, child) {
                  return CustomButton(
                    text: 'Xác nhận đổi lịch',
                    onPressed: provider.isLoading ? null : _confirmReschedule,
                    isLoading: provider.isLoading,
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
