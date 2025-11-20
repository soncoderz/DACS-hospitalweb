import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../../core/constants/app_constants.dart';
import '../../providers/appointment_provider.dart';
import '../../providers/auth_provider.dart';

class AppointmentsScreen extends StatefulWidget {
  const AppointmentsScreen({super.key});

  @override
  State<AppointmentsScreen> createState() => _AppointmentsScreenState();
}

class _AppointmentsScreenState extends State<AppointmentsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      // Check authentication before fetching appointments
      final authProvider = context.read<AuthProvider>();
      
      print('[AppointmentsScreen] Checking authentication...');
      print('[AppointmentsScreen] Is authenticated: ${authProvider.isAuthenticated}');
      
      if (!authProvider.isAuthenticated) {
        print('[AppointmentsScreen] User not authenticated, checking auth status...');
        await authProvider.checkAuthStatus();
        
        if (!authProvider.isAuthenticated && mounted) {
          print('[AppointmentsScreen] Still not authenticated, redirecting to login...');
          Navigator.pushReplacementNamed(context, '/login');
          return;
        }
      }
      
      print('[AppointmentsScreen] User authenticated, fetching appointments...');
      if (mounted) {
        context.read<AppointmentProvider>().fetchMyAppointments();
      }
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  String _formatDate(DateTime date) {
    return DateFormat('dd/MM/yyyy').format(date);
  }

  String _getStatusText(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'Chờ xác nhận';
      case 'confirmed':
        return 'Đã xác nhận';
      case 'completed':
        return 'Hoàn thành';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Lịch Hẹn Của Tôi'),
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Sắp tới'),
            Tab(text: 'Đã hoàn thành'),
            Tab(text: 'Đã hủy'),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () {
              Navigator.pushNamed(context, '/appointment-booking');
            },
            tooltip: 'Đặt lịch mới',
          ),
        ],
      ),
      body: Consumer<AppointmentProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading && provider.appointments.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          if (provider.errorMessage != null && provider.appointments.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 60, color: Colors.red),
                  const SizedBox(height: 16),
                  Text(
                    provider.errorMessage!,
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Colors.red),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () {
                      provider.fetchMyAppointments();
                    },
                    child: const Text('Thử lại'),
                  ),
                ],
              ),
            );
          }

          return TabBarView(
            controller: _tabController,
            children: [
              // Upcoming appointments
              _buildAppointmentList(provider.upcomingAppointments),
              // Completed appointments
              _buildAppointmentList(provider.completedAppointments),
              // Cancelled appointments
              _buildAppointmentList(provider.cancelledAppointments),
            ],
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.pushNamed(context, '/appointment-booking');
        },
        child: const Icon(Icons.add),
      ),
    );
  }

  Widget _buildAppointmentList(List appointments) {
    if (appointments.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.event_busy, size: 80, color: Colors.grey.shade400),
            const SizedBox(height: 16),
            Text(
              'Không có lịch hẹn',
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey.shade600,
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => context.read<AppointmentProvider>().refreshAppointments(),
      child: ListView.builder(
        padding: const EdgeInsets.all(AppConstants.defaultPadding),
        itemCount: appointments.length,
        itemBuilder: (context, index) {
          final appointment = appointments[index];
          return Card(
            elevation: 2,
            margin: const EdgeInsets.only(bottom: 16),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            child: InkWell(
              onTap: () {
                Navigator.pushNamed(
                  context,
                  '/appointment-detail',
                  arguments: appointment.id,
                );
              },
              borderRadius: BorderRadius.circular(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header with status and booking code
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade50,
                      borderRadius: const BorderRadius.only(
                        topLeft: Radius.circular(16),
                        topRight: Radius.circular(16),
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        // Title
                        const Text(
                          'Khám tổng quát',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                        // Status badge
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: _getStatusColor(appointment.status).withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: _getStatusColor(appointment.status).withOpacity(0.3),
                            ),
                          ),
                          child: Text(
                            _getStatusText(appointment.status),
                            style: TextStyle(
                              color: _getStatusColor(appointment.status),
                              fontWeight: FontWeight.w600,
                              fontSize: 11,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  
                  // Booking code
                  if (appointment.bookingCode != null)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      color: Colors.blue.shade50,
                      child: Row(
                        children: [
                          Icon(Icons.qr_code, size: 16, color: Colors.blue.shade700),
                          const SizedBox(width: 8),
                          Text(
                            'Mã: ${appointment.bookingCode}',
                            style: TextStyle(
                              color: Colors.blue.shade700,
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        // Doctor info
                        _buildInfoRow(
                          icon: Icons.person,
                          iconColor: Colors.blue,
                          label: 'Bác sĩ',
                          value: appointment.doctorName ?? 'Chưa có thông tin',
                        ),
                        const SizedBox(height: 12),
                        
                        // Hospital info
                        _buildInfoRow(
                          icon: Icons.local_hospital,
                          iconColor: Colors.red,
                          label: 'Bệnh viện',
                          value: appointment.hospitalName ?? 'Chưa có thông tin',
                        ),
                        const SizedBox(height: 12),
                        
                        // Date info
                        _buildInfoRow(
                          icon: Icons.calendar_today,
                          iconColor: Colors.orange,
                          label: 'Ngày khám',
                          value: _formatDate(appointment.appointmentDate),
                        ),
                        const SizedBox(height: 12),
                        
                        // Time info
                        _buildInfoRow(
                          icon: Icons.access_time,
                          iconColor: Colors.purple,
                          label: 'Thời gian',
                          value: appointment.timeSlot,
                        ),
                        
                        // Queue number if available
                        if (appointment.queueNumber != null && appointment.queueNumber! > 0) ...[
                          const SizedBox(height: 12),
                          _buildInfoRow(
                            icon: Icons.format_list_numbered,
                            iconColor: Colors.indigo,
                            label: 'Số thứ tự khám',
                            value: appointment.queueNumber.toString(),
                          ),
                        ],
                        
                        // Room info if available
                        if (appointment.roomInfo != null) ...[
                          const SizedBox(height: 12),
                          _buildInfoRow(
                            icon: Icons.meeting_room,
                            iconColor: Colors.teal,
                            label: 'Phòng khám',
                            value: appointment.roomInfo!,
                          ),
                        ],
                      ],
                    ),
                  ),
                  
                  // Footer with fee, payment status and actions
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade50,
                      borderRadius: const BorderRadius.only(
                        bottomLeft: Radius.circular(16),
                        bottomRight: Radius.circular(16),
                      ),
                    ),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            // Fee
                            if (appointment.fee != null)
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Tổng tiền',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: Colors.grey.shade600,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    NumberFormat.currency(
                                      locale: 'vi',
                                      symbol: 'đ',
                                      decimalDigits: 0,
                                    ).format(appointment.fee),
                                    style: const TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.green,
                                    ),
                                  ),
                                ],
                              )
                            else
                              const SizedBox.shrink(),
                            
                            // View detail button
                            ElevatedButton.icon(
                              onPressed: () {
                                Navigator.pushNamed(
                                  context,
                                  '/appointment-detail',
                                  arguments: appointment.id,
                                );
                              },
                              icon: const Icon(Icons.visibility, size: 16),
                              label: const Text('Xem chi tiết'),
                              style: ElevatedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                  vertical: 10,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                              ),
                            ),
                          ],
                        ),
                        
                        // Payment status
                        if (appointment.paymentStatus != null) ...[
                          const SizedBox(height: 12),
                          _buildPaymentStatusBadge(
                            appointment.paymentStatus!,
                            appointment.paymentMethod,
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
  
  Widget _buildInfoRow({
    required IconData icon,
    required Color iconColor,
    required String label,
    required String value,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: iconColor.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(
            icon,
            size: 20,
            color: iconColor,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey.shade600,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
  
  Widget _buildPaymentStatusBadge(String status, String? method) {
    if (status == 'paid' || status == 'completed') {
      // Payment method specific styling
      Color bgColor;
      Color textColor;
      String methodLabel;
      IconData methodIcon;
      
      switch (method) {
        case 'momo':
          bgColor = Colors.pink.shade50;
          textColor = Colors.pink.shade700;
          methodLabel = 'MoMo';
          methodIcon = Icons.account_balance_wallet;
          break;
        case 'paypal':
          bgColor = Colors.blue.shade50;
          textColor = Colors.blue.shade700;
          methodLabel = 'PayPal';
          methodIcon = Icons.payment;
          break;
        default:
          bgColor = Colors.green.shade50;
          textColor = Colors.green.shade700;
          methodLabel = 'Tiền mặt';
          methodIcon = Icons.money;
      }
      
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: textColor.withOpacity(0.3)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.check_circle, size: 16, color: textColor),
            const SizedBox(width: 6),
            Text(
              'Đã thanh toán',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: textColor,
              ),
            ),
            if (method != null) ...[
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.5),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(methodIcon, size: 12, color: textColor),
                    const SizedBox(width: 4),
                    Text(
                      methodLabel,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                        color: textColor,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      );
    } else {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.orange.shade50,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.orange.shade200),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.schedule, size: 16, color: Colors.orange.shade700),
            const SizedBox(width: 6),
            Text(
              'Chưa thanh toán',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: Colors.orange.shade700,
              ),
            ),
          ],
        ),
      );
    }
  }
}
