import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:intl/date_symbol_data_local.dart';
import '../../../domain/entities/appointment.dart';
import '../../providers/appointment_provider.dart';
import '../../widgets/common/custom_button.dart';

class AppointmentDetailScreen extends StatefulWidget {
  final String appointmentId;

  const AppointmentDetailScreen({
    Key? key,
    required this.appointmentId,
  }) : super(key: key);

  @override
  State<AppointmentDetailScreen> createState() =>
      _AppointmentDetailScreenState();
}

class _AppointmentDetailScreenState extends State<AppointmentDetailScreen> {
  @override
  void initState() {
    super.initState();
    initializeDateFormatting('vi', null);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadAppointmentDetails();
    });
  }

  Future<void> _loadAppointmentDetails() async {
    final provider = context.read<AppointmentProvider>();
    await provider.fetchAppointmentById(widget.appointmentId);
  }

  void _copyBookingCode(String bookingCode) {
    Clipboard.setData(ClipboardData(text: bookingCode));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Đã sao chép mã đặt lịch'),
        duration: Duration(seconds: 2),
      ),
    );
  }

  Future<void> _showCancelDialog(Appointment appointment) async {
    final reasonController = TextEditingController();

    final result = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Hủy lịch hẹn'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Bạn có chắc chắn muốn hủy lịch hẹn này?'),
            const SizedBox(height: 16),
            TextField(
              controller: reasonController,
              decoration: const InputDecoration(
                labelText: 'Lý do hủy',
                hintText: 'Nhập lý do hủy lịch',
                border: OutlineInputBorder(),
              ),
              maxLines: 3,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Không'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
            ),
            child: const Text('Hủy lịch'),
          ),
        ],
      ),
    );

    if (result == true && mounted) {
      final provider = context.read<AppointmentProvider>();
      final success = await provider.cancelAppointment(
        appointment.id,
        reasonController.text.trim().isEmpty
            ? null
            : reasonController.text.trim(),
      );

      if (mounted) {
        if (success) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Đã hủy lịch hẹn thành công')),
          );
          Navigator.pop(context, true);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(provider.errorMessage ?? 'Không thể hủy lịch hẹn'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    }
  }

  void _navigateToReschedule(Appointment appointment) {
    Navigator.pushNamed(
      context,
      '/reschedule-appointment',
      arguments: appointment,
    ).then((result) {
      if (result == true) {
        _loadAppointmentDetails();
      }
    });
  }

  void _contactDoctor() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Tính năng liên hệ bác sĩ đang được phát triển'),
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return Colors.orange;
      case 'confirmed':
        return Colors.blue;
      case 'completed':
        return Colors.green;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _getStatusText(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'Chờ xác nhận';
      case 'confirmed':
        return 'Đã xác nhận';
      case 'completed':
        return 'Đã hoàn thành';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Chi tiết lịch hẹn'),
        elevation: 0,
      ),
      body: Consumer<AppointmentProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (provider.errorMessage != null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 64, color: Colors.red),
                  const SizedBox(height: 16),
                  Text(
                    provider.errorMessage!,
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 16),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: _loadAppointmentDetails,
                    child: const Text('Thử lại'),
                  ),
                ],
              ),
            );
          }

          final appointment = provider.selectedAppointment;
          if (appointment == null) {
            return const Center(
              child: Text('Không tìm thấy thông tin lịch hẹn'),
            );
          }

          final canModify = appointment.status == 'pending' ||
              appointment.status == 'confirmed';

          return SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Status Banner
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  color: _getStatusColor(appointment.status).withAlpha(26),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        appointment.status == 'completed'
                            ? Icons.check_circle
                            : appointment.status == 'cancelled'
                                ? Icons.cancel
                                : Icons.schedule,
                        color: _getStatusColor(appointment.status),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        _getStatusText(appointment.status),
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: _getStatusColor(appointment.status),
                        ),
                      ),
                    ],
                  ),
                ),

                // Booking Code
                Container(
                  margin: const EdgeInsets.all(16),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.blue.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.blue.shade200),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Mã đặt lịch',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            appointment.bookingCode,
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 2,
                            ),
                          ),
                        ],
                      ),
                      IconButton(
                        onPressed: () =>
                            _copyBookingCode(appointment.bookingCode),
                        icon: const Icon(Icons.copy),
                        tooltip: 'Sao chép mã',
                      ),
                    ],
                  ),
                ),

                // Doctor Information
                _buildSection(
                  title: 'Thông tin bác sĩ',
                  icon: Icons.person,
                  child: Column(
                    children: [
                      _buildInfoRow('Bác sĩ', appointment.doctorName),
                      _buildInfoRow('Chuyên khoa', appointment.specialtyName),
                      if (appointment.hospitalName != null)
                        _buildInfoRow('Bệnh viện', appointment.hospitalName!),
                    ],
                  ),
                ),

                // Appointment Information
                _buildSection(
                  title: 'Thông tin lịch hẹn',
                  icon: Icons.calendar_today,
                  child: Column(
                    children: [
                      _buildInfoRow(
                        'Ngày khám',
                        DateFormat('dd/MM/yyyy', 'vi')
                            .format(appointment.appointmentDate),
                      ),
                      _buildInfoRow('Giờ khám', appointment.timeSlot),
                      if (appointment.fee != null)
                        _buildInfoRow(
                          'Phí khám',
                          NumberFormat.currency(locale: 'vi', symbol: 'đ')
                              .format(appointment.fee),
                        ),
                    ],
                  ),
                ),

                // Patient Information
                _buildSection(
                  title: 'Thông tin bệnh nhân',
                  icon: Icons.person_outline,
                  child: Column(
                    children: [
                      _buildInfoRow('Họ tên', appointment.patientName),
                      if (appointment.reason != null &&
                          appointment.reason!.isNotEmpty)
                        _buildInfoRow('Lý do khám', appointment.reason!),
                      if (appointment.notes != null &&
                          appointment.notes!.isNotEmpty)
                        _buildInfoRow('Ghi chú', appointment.notes!),
                    ],
                  ),
                ),

                // Cancellation Reason (if cancelled)
                if (appointment.status == 'cancelled' &&
                    appointment.reason != null &&
                    appointment.reason!.isNotEmpty)
                  _buildSection(
                    title: 'Lý do hủy',
                    icon: Icons.info_outline,
                    child: Text(
                      appointment.reason!,
                      style: const TextStyle(fontSize: 14),
                    ),
                  ),

                // Created Date
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text(
                    'Đặt lịch lúc: ${DateFormat('dd/MM/yyyy HH:mm', 'vi').format(appointment.createdAt)}',
                    style: const TextStyle(
                      fontSize: 12,
                      color: Colors.grey,
                    ),
                  ),
                ),

                // Action Buttons
                if (canModify)
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        if (appointment.status == 'confirmed')
                          CustomButton(
                            text: 'Liên hệ bác sĩ',
                            onPressed: _contactDoctor,
                            icon: Icons.phone,
                          ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton.icon(
                                onPressed: () =>
                                    _navigateToReschedule(appointment),
                                icon: const Icon(Icons.edit_calendar),
                                label: const Text('Đổi lịch'),
                                style: OutlinedButton.styleFrom(
                                  padding:
                                      const EdgeInsets.symmetric(vertical: 12),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: OutlinedButton.icon(
                                onPressed: () =>
                                    _showCancelDialog(appointment),
                                icon: const Icon(Icons.cancel),
                                label: const Text('Hủy lịch'),
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: Colors.red,
                                  padding:
                                      const EdgeInsets.symmetric(vertical: 12),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildSection({
    required String title,
    required IconData icon,
    required Widget child,
  }) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withAlpha(26),
            spreadRadius: 1,
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 20, color: Colors.blue),
              const SizedBox(width: 8),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const Divider(height: 24),
          child,
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 14,
                color: Colors.grey,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    context.read<AppointmentProvider>().clearSelectedAppointment();
    super.dispose();
  }
}
