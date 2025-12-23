import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:dio/dio.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../../../domain/entities/appointment.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/services/token_storage_service.dart';
import '../../providers/appointment_provider.dart';
import '../../providers/auth_provider.dart';
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
    extends State<RescheduleAppointmentScreen> with SingleTickerProviderStateMixin {
  // Schedule data from API
  List<dynamic> _schedules = [];
  List<String> _availableDates = [];
  List<Map<String, dynamic>> _availableTimeSlots = [];
  
  // Selection state
  String? _selectedDate;
  String? _selectedScheduleId;
  Map<String, dynamic>? _selectedTimeSlot;
  
  // Calendar state
  DateTime _currentMonth = DateTime.now();
  
  // UI state
  bool _isLoading = true;
  bool _isSubmitting = false;
  String? _errorMessage;
  
  // Socket state
  IO.Socket? _socket;
  bool _isSocketConnected = false;
  final Map<String, String> _lockedSlots = {}; // key: scheduleId_timeSlotId, value: userId
  String? _userId;
  String? _currentRoomKey;
  bool _isDisposing = false;
  
  // Animation for locked slots
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    // Set a default user id from the appointment to avoid null comparisons
    _userId = widget.appointment.patientId;
    
    // Setup pulse animation for locked slots
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);
    _pulseAnimation = Tween<double>(begin: 0.6, end: 1.0).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
    
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final authUserId = context.read<AuthProvider>().user?.id;
      _userId = authUserId ?? _userId ?? widget.appointment.patientId;
      _initSocket();
      _fetchSchedules();
    });
  }

  @override
  void dispose() {
    _isDisposing = true;
    _unlockCurrentSlot();
    // Properly destroy socket
    if (_socket != null) {
      _socket!.clearListeners();
      _socket!.disconnect();
      _socket!.dispose();
      _socket = null;
    }
    _pulseController.dispose();
    super.dispose();
  }

  /// Initialize socket connection
  Future<void> _initSocket() async {
    if (_socket != null) return;
    
    try {
      final tokenService = TokenStorageService();
      final token = await tokenService.getToken();
      if (token == null || token.isEmpty) {
        debugPrint('🔌 No token for socket auth');
        return;
      }

      debugPrint('🔌 Initializing socket connection to ${ApiConstants.socketUrl}');

      _socket = IO.io(
        ApiConstants.socketUrl,
        IO.OptionBuilder()
            .setTransports(['websocket'])
            .enableReconnection()
            .setReconnectionAttempts(5)
            .setReconnectionDelay(1000)
            .setPath('/socket.io')
            .setAuth({'token': token})
            .build(),
      );

      _socket!.onConnect((_) {
        if (!mounted || _isDisposing) return;
        debugPrint('🔌 Socket connected for reschedule');
        setState(() => _isSocketConnected = true);
        if (_selectedDate != null) {
          _joinAppointmentRoom(_selectedDate!);
        }
      });

      _socket!.onDisconnect((_) {
        if (!mounted || _isDisposing) return;
        debugPrint('🔌 Socket disconnected');
        setState(() {
          _isSocketConnected = false;
          _currentRoomKey = null;
        });
      });

      _socket!.onConnectError((error) {
        debugPrint('🔌 Socket connect error: $error');
      });

      _socket!.onError((error) {
        debugPrint('🔌 Socket error: $error');
      });

      // Listen for current locked slots when joining room
      _socket!.on('current_locked_slots', (payload) {
        if (!mounted || _isDisposing) return;
        debugPrint('📝 Received current_locked_slots: $payload');
        if (payload is Map && payload['lockedSlots'] is List) {
          final Map<String, String> updated = {};
          for (final slot in payload['lockedSlots'] as List) {
            if (slot is Map) {
              final scheduleId = slot['scheduleId']?.toString();
              final timeSlotId = slot['timeSlotId']?.toString();
              final lockedUserId = slot['userId']?.toString() ?? '';
              if (scheduleId != null && timeSlotId != null) {
                updated['${scheduleId}_$timeSlotId'] = lockedUserId;
              }
            }
          }
          setState(() {
            _lockedSlots.clear();
            _lockedSlots.addAll(updated);
          });
          debugPrint('📝 Updated locked slots: $_lockedSlots');
        }
      });

      // Listen for time slot locked event
      _socket!.on('time_slot_locked', (payload) {
        if (!mounted || _isDisposing) return;
        debugPrint('🔒 Received time_slot_locked: $payload');
        if (payload is Map) {
          final scheduleId = payload['scheduleId']?.toString();
          final timeSlotId = payload['timeSlotId']?.toString();
          final lockedUserId = payload['userId']?.toString() ?? '';
          if (scheduleId != null && timeSlotId != null) {
            setState(() {
              _lockedSlots['${scheduleId}_$timeSlotId'] = lockedUserId;
            });
            debugPrint('🔒 Slot locked: ${scheduleId}_$timeSlotId by $lockedUserId');
            
            // If our selected slot was locked by someone else, clear selection
            if (_selectedScheduleId == scheduleId &&
                _selectedTimeSlot?['startTime'] == timeSlotId &&
                _userId != null &&
                _userId!.isNotEmpty &&
                lockedUserId != _userId) {
              _showSnackBar('Khung giờ bạn chọn vừa được người khác chọn.', Colors.orange);
              setState(() {
                _selectedTimeSlot = null;
                _selectedScheduleId = null;
              });
            }
          }
        }
      });

      // Listen for time slot unlocked event
      _socket!.on('time_slot_unlocked', (payload) {
        if (!mounted || _isDisposing) return;
        debugPrint('🔓 Received time_slot_unlocked: $payload');
        if (payload is Map) {
          final scheduleId = payload['scheduleId']?.toString();
          final timeSlotId = payload['timeSlotId']?.toString();
          if (scheduleId != null && timeSlotId != null) {
            setState(() {
              _lockedSlots.remove('${scheduleId}_$timeSlotId');
            });
            debugPrint('🔓 Slot unlocked: ${scheduleId}_$timeSlotId');
          }
        }
      });

      // Listen for lock confirmed
      _socket!.on('time_slot_lock_confirmed', (payload) {
        if (!mounted || _isDisposing) return;
        debugPrint('✅ Lock confirmed: $payload');
      });

      // Listen for lock rejected
      _socket!.on('time_slot_lock_rejected', (payload) {
        if (!mounted || _isDisposing) return;
        debugPrint('❌ Lock rejected: $payload');
        final previousSlotKey = (_selectedScheduleId != null && _selectedTimeSlot != null)
            ? '${_selectedScheduleId}_${_selectedTimeSlot!['startTime']}'
            : null;
        _showSnackBar('Khung giờ này đang được người khác xử lý.', Colors.orange);
        setState(() {
          if (previousSlotKey != null) {
            _lockedSlots.remove(previousSlotKey);
          }
          _selectedTimeSlot = null;
          _selectedScheduleId = null;
        });
      });

      // Listen for time slot status update
      _socket!.on('time_slot_updated', (payload) {
        if (!mounted || _isDisposing) return;
        debugPrint('📊 Time slot updated: $payload');
        if (payload is Map) {
          final scheduleId = payload['scheduleId']?.toString();
          final timeSlotInfo = payload['timeSlotInfo'] as Map?;
          if (scheduleId != null && timeSlotInfo != null) {
            _updateSlotStatus(scheduleId, timeSlotInfo);
          }
        }
      });

      // Connect socket
      _socket!.connect();

    } catch (e) {
      debugPrint('🔌 Socket init error: $e');
    }
  }

  /// Join appointment room for real-time updates
  void _joinAppointmentRoom(String date) {
    if (_socket == null || !_isSocketConnected) {
      debugPrint('🚪 Cannot join room - socket not connected');
      return;
    }
    
    final doctorId = widget.appointment.doctorId;
    final roomKey = 'appointments_${doctorId}_$date';
    
    if (_currentRoomKey == roomKey) {
      debugPrint('🚪 Already in room: $roomKey');
      return;
    }
    
    debugPrint('🚪 Joining room: $roomKey');
    _socket!.emit('join_appointment_room', {
      'doctorId': doctorId,
      'date': date,
    });
    
    _currentRoomKey = roomKey;
  }

  /// Lock a time slot
  void _lockTimeSlot(String scheduleId, String timeSlotId) {
    if (_socket == null || !_isSocketConnected || _selectedDate == null) {
      debugPrint('🔐 Cannot lock - socket not connected');
      return;
    }
    
    final slotKey = '${scheduleId}_$timeSlotId';
    if (mounted && !_isDisposing) {
      setState(() {
        _lockedSlots[slotKey] = _userId ?? '';
      });
    } else {
      _lockedSlots[slotKey] = _userId ?? '';
    }
    
    debugPrint('🔐 Requesting lock: ${scheduleId}_$timeSlotId');
    _socket!.emit('lock_time_slot', {
      'scheduleId': scheduleId,
      'timeSlotId': timeSlotId,
      'doctorId': widget.appointment.doctorId,
      'date': _selectedDate,
    });
  }

  /// Unlock current selected slot
  void _unlockCurrentSlot() {
    if (_socket == null || _selectedScheduleId == null || _selectedTimeSlot == null || _selectedDate == null) {
      return;
    }
    
    final slotKey = '${_selectedScheduleId}_${_selectedTimeSlot!['startTime']}';
    debugPrint('🔓 Unlocking: $slotKey');
    _socket!.emit('unlock_time_slot', {
      'scheduleId': _selectedScheduleId,
      'timeSlotId': _selectedTimeSlot!['startTime'],
      'doctorId': widget.appointment.doctorId,
      'date': _selectedDate,
    });
    if (mounted && !_isDisposing) {
      setState(() {
        _lockedSlots.remove(slotKey);
      });
    } else {
      _lockedSlots.remove(slotKey);
    }
  }

  /// Update slot status from socket event
  void _updateSlotStatus(String scheduleId, Map timeSlotInfo) {
    setState(() {
      for (int i = 0; i < _availableTimeSlots.length; i++) {
        final slot = _availableTimeSlots[i];
        if (slot['scheduleId'] == scheduleId &&
            slot['startTime'] == timeSlotInfo['startTime']) {
          _availableTimeSlots[i] = {
            ...slot,
            'bookedCount': timeSlotInfo['bookedCount'] ?? slot['bookedCount'],
            'maxBookings': timeSlotInfo['maxBookings'] ?? slot['maxBookings'],
            'isBooked': timeSlotInfo['isBooked'] ?? slot['isBooked'],
          };
          break;
        }
      }
    });
  }

  void _showSnackBar(String message, Color color) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: color),
    );
  }

  /// Fetch available schedules for the doctor
  Future<void> _fetchSchedules() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final dio = Dio();
      final tokenService = TokenStorageService();
      final token = await tokenService.getToken();
      
      if (token != null) {
        dio.options.headers['Authorization'] = 'Bearer $token';
      }

      final response = await dio.get(
        '${ApiConstants.baseUrl}/appointments/doctors/${widget.appointment.doctorId}/schedules',
      );

      debugPrint('Schedule API response: ${response.data}');

      if (response.statusCode == 200) {
        final data = response.data;
        // API returns status: 'success' (string) or success: true (boolean)
        final isSuccess = data['success'] == true || 
                         data['status'] == true || 
                         data['status'] == 'success';
        
        if (isSuccess && data['data'] != null) {
          final scheduleData = data['data'] as List;
          
          // Normalize schedule data
          _schedules = scheduleData.map((schedule) {
            final scheduleMap = Map<String, dynamic>.from(schedule);
            if (scheduleMap['timeSlots'] != null) {
              final timeSlots = (scheduleMap['timeSlots'] as List).map((slot) {
                final slotMap = Map<String, dynamic>.from(slot);
                final bookedCount = slotMap['bookedCount'] ?? 0;
                final maxBookings = slotMap['maxBookings'] ?? 3;
                return {
                  ...slotMap,
                  'bookedCount': bookedCount,
                  'maxBookings': maxBookings,
                  'isBooked': bookedCount >= maxBookings,
                };
              }).toList();
              scheduleMap['timeSlots'] = timeSlots;
            }
            return scheduleMap;
          }).toList();

          // Extract available dates (only future dates)
          final now = DateTime.now();
          final today = DateTime(now.year, now.month, now.day);
          final dates = <String>{};
          
          for (final schedule in _schedules) {
            if (schedule['date'] != null && schedule['isActive'] != false) {
              final dateStr = schedule['date'].toString().split('T')[0];
              final scheduleDate = DateTime.parse(dateStr);
              // Only include future dates (at least tomorrow)
              if (scheduleDate.isAfter(today)) {
                dates.add(dateStr);
              }
            }
          }
          
          _availableDates = dates.toList()..sort();
          
          // Set current month to first available date
          if (_availableDates.isNotEmpty) {
            final firstDate = DateTime.parse(_availableDates.first);
            _currentMonth = DateTime(firstDate.year, firstDate.month);
          }
          
          debugPrint('Available dates: $_availableDates');
        } else {
          _errorMessage = 'Không có lịch khám khả dụng cho bác sĩ này.';
        }
      }
    } catch (e) {
      debugPrint('Error fetching schedules: $e');
      _errorMessage = 'Không thể tải lịch khám. Vui lòng thử lại sau.';
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  /// Find time slots for selected date
  void _findTimeSlots(String date) {
    final slotsForDate = <Map<String, dynamic>>[];
    
    for (final schedule in _schedules) {
      if (schedule['date'] == null) continue;
      final scheduleDate = schedule['date'].toString().split('T')[0];
      
      if (scheduleDate == date && schedule['timeSlots'] != null) {
        final scheduleId = schedule['_id']?.toString() ?? '';
        final timeSlots = schedule['timeSlots'] as List;
        
        for (final slot in timeSlots) {
          final slotMap = Map<String, dynamic>.from(slot);
          slotsForDate.add({
            'scheduleId': scheduleId,
            'startTime': slotMap['startTime'],
            'endTime': slotMap['endTime'],
            'bookedCount': slotMap['bookedCount'] ?? 0,
            'maxBookings': slotMap['maxBookings'] ?? 3,
            'isBooked': slotMap['isBooked'] ?? false,
          });
        }
      }
    }
    
    // Sort by start time
    slotsForDate.sort((a, b) => 
      (a['startTime'] as String).compareTo(b['startTime'] as String));
    
    setState(() {
      _availableTimeSlots = slotsForDate;
    });
  }

  /// Handle date selection
  void _handleDateSelect(String dateString) {
    // Unlock previous slot if any
    _unlockCurrentSlot();
    
    setState(() {
      _selectedDate = dateString;
      _selectedScheduleId = null;
      _selectedTimeSlot = null;
      _lockedSlots.clear(); // Clear locked slots when changing date
    });
    
    _findTimeSlots(dateString);
    _joinAppointmentRoom(dateString);
  }

  /// Handle time slot selection
  void _handleTimeSlotSelect(Map<String, dynamic> slot) {
    if (slot['isBooked'] == true) return;
    
    _userId = _userId ?? context.read<AuthProvider>().user?.id ?? widget.appointment.patientId;
    final newSlotKey = '${slot['scheduleId']}_${slot['startTime']}';
    
    // Check if locked by another user
    if (_lockedSlots.containsKey(newSlotKey) && _lockedSlots[newSlotKey] != _userId) {
      _showSnackBar('Khung giờ này đang được người khác xử lý.', Colors.orange);
      return;
    }
    
    // Check if selecting the same slot - do nothing
    if (_selectedScheduleId == slot['scheduleId'] && 
        _selectedTimeSlot?['startTime'] == slot['startTime']) {
      debugPrint('🔐 Same slot selected, ignoring');
      return;
    }
    
    // IMPORTANT: Unlock previous slot FIRST before doing anything else
    if (_selectedScheduleId != null && _selectedTimeSlot != null) {
      final prevKey = '${_selectedScheduleId}_${_selectedTimeSlot!['startTime']}';
      debugPrint('🔓 Will unlock previous slot: $prevKey');
      _unlockPreviousSlot(_selectedScheduleId!, _selectedTimeSlot!['startTime']);
    }
    
    // Update state to new slot
    setState(() {
      _selectedScheduleId = slot['scheduleId'];
      _selectedTimeSlot = slot;
    });
    
    // Lock new slot AFTER state is updated
    _lockTimeSlot(slot['scheduleId'], slot['startTime']);
  }
  
  /// Unlock a specific slot (not necessarily the current one)
  void _unlockPreviousSlot(String scheduleId, String timeSlotId) {
    if (_socket == null || !_isSocketConnected || _selectedDate == null) {
      debugPrint('🔓 Cannot unlock - socket not connected');
      return;
    }
    
    final slotKey = '${scheduleId}_$timeSlotId';
    debugPrint('🔓 Unlocking: $slotKey');
    
    // Immediately update local state (don't wait for server response)
    if (mounted && !_isDisposing) {
      setState(() {
        _lockedSlots.remove(slotKey);
      });
    }
    
    // Then notify server
    _socket!.emit('unlock_time_slot', {
      'scheduleId': scheduleId,
      'timeSlotId': timeSlotId,
      'doctorId': widget.appointment.doctorId,
      'date': _selectedDate,
    });
  }

  /// Change calendar month
  void _changeMonth(int delta) {
    final next = DateTime(_currentMonth.year, _currentMonth.month + delta);
    final minDate = DateTime(DateTime.now().year, DateTime.now().month);
    final maxDate = DateTime.now().add(const Duration(days: 90));
    final maxMonth = DateTime(maxDate.year, maxDate.month);
    
    if (next.isBefore(minDate) || next.isAfter(maxMonth)) return;
    
    setState(() {
      _currentMonth = next;
    });
  }

  /// Submit reschedule request
  Future<void> _confirmReschedule() async {
    if (_selectedDate == null || _selectedScheduleId == null || _selectedTimeSlot == null) {
      _showSnackBar('Vui lòng chọn ngày và giờ khám', Colors.orange);
      return;
    }

    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.event, color: Colors.blue),
            SizedBox(width: 8),
            Expanded(child: Text('Xác nhận đổi lịch')),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Bạn có chắc chắn muốn đổi lịch hẹn?'),
            const SizedBox(height: 16),
            const Text('Thông tin mới:', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.calendar_today, size: 16, color: Colors.grey),
                const SizedBox(width: 8),
                Text('Ngày: ${_formatDisplayDate(_selectedDate!)}'),
              ],
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                const Icon(Icons.access_time, size: 16, color: Colors.grey),
                const SizedBox(width: 8),
                Text('Giờ: ${_selectedTimeSlot!['startTime']} - ${_selectedTimeSlot!['endTime']}'),
              ],
            ),
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

    setState(() => _isSubmitting = true);

    try {
      final dio = Dio();
      final tokenService = TokenStorageService();
      final token = await tokenService.getToken();
      
      if (token != null) {
        dio.options.headers['Authorization'] = 'Bearer $token';
      }

      // Payload matching web version
      final payload = {
        'scheduleId': _selectedScheduleId,
        'appointmentDate': _selectedDate,
        'timeSlot': {
          'startTime': _selectedTimeSlot!['startTime'],
          'endTime': _selectedTimeSlot!['endTime'],
        }
      };

      debugPrint('Reschedule payload: $payload');

      final response = await dio.put(
        '${ApiConstants.baseUrl}/appointments/${widget.appointment.id}/reschedule',
        data: payload,
      );

      debugPrint('Reschedule response: ${response.data}');

      if (response.data['success'] == true) {
        if (mounted) {
          _showSnackBar('Đổi lịch hẹn thành công!', Colors.green);
          // Refresh appointments list
          context.read<AppointmentProvider>().refreshAppointments();
          Navigator.pop(context, true);
        }
      } else {
        throw Exception(response.data['message'] ?? 'Không thể đổi lịch hẹn');
      }
    } catch (e) {
      String errorMessage = 'Không thể đổi lịch hẹn. Vui lòng thử lại sau.';
      
      if (e is DioException && e.response?.data != null) {
        errorMessage = e.response?.data['message'] ?? errorMessage;
        
        // Handle specific error codes
        if (e.response?.statusCode == 409) {
          errorMessage = 'Khung giờ này đang được người khác xử lý.';
        }
      }
      
      if (mounted) {
        _showSnackBar(errorMessage, Colors.red);
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  String _formatDisplayDate(String dateString) {
    try {
      final date = DateTime.parse(dateString);
      return DateFormat('dd/MM/yyyy').format(date);
    } catch (e) {
      return dateString;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Đổi lịch hẹn'),
        elevation: 0,
        actions: [
          // Socket status indicator
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Icon(
              _isSocketConnected ? Icons.wifi : Icons.wifi_off,
              color: _isSocketConnected ? Colors.green : Colors.grey,
              size: 20,
            ),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _errorMessage != null
              ? _buildErrorView()
              : _buildContent(),
    );
  }

  Widget _buildErrorView() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            Text(
              _errorMessage!,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 16),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _fetchSchedules,
              icon: const Icon(Icons.refresh),
              label: const Text('Thử lại'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContent() {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Current Appointment Info
          _buildCurrentAppointmentInfo(),
          
          // Rules/Notes
          _buildRulesInfo(),
          
          const SizedBox(height: 16),
          
          // Select New Date
          _buildDateSelector(),
          
          // Select Time Slot
          if (_selectedDate != null) _buildTimeSlotSelector(),
          
          const SizedBox(height: 24),
          
          // Confirm Button
          _buildConfirmButton(),
          
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildCurrentAppointmentInfo() {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Thông tin lịch hẹn hiện tại',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          _buildInfoRow(Icons.calendar_today, 'Ngày khám',
              DateFormat('dd/MM/yyyy').format(widget.appointment.appointmentDate)),
          _buildInfoRow(Icons.access_time, 'Giờ khám', widget.appointment.timeSlot),
          _buildInfoRow(Icons.person, 'Bác sĩ', widget.appointment.doctorName),
          if (widget.appointment.hospitalName != null)
            _buildInfoRow(Icons.local_hospital, 'Bệnh viện', widget.appointment.hospitalName!),
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(icon, size: 18, color: Colors.blue),
          const SizedBox(width: 8),
          Text('$label: ', style: const TextStyle(color: Colors.grey)),
          Expanded(child: Text(value, style: const TextStyle(fontWeight: FontWeight.w500))),
        ],
      ),
    );
  }

  Widget _buildRulesInfo() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.blue.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.blue.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.info_outline, color: Colors.blue.shade700, size: 20),
              const SizedBox(width: 8),
              Text('Lưu ý:', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.blue.shade700)),
            ],
          ),
          const SizedBox(height: 8),
          _buildRuleItem('Mỗi lịch hẹn chỉ được đổi tối đa 2 lần'),
          _buildRuleItem('Không thể đổi lịch trong 4 giờ trước giờ hẹn'),
          _buildRuleItem('Không thể đổi lịch về thời gian đã qua'),
        ],
      ),
    );
  }

  Widget _buildRuleItem(String text) {
    return Padding(
      padding: const EdgeInsets.only(left: 8, top: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('• ', style: TextStyle(color: Colors.blue.shade700)),
          Expanded(child: Text(text, style: TextStyle(fontSize: 12, color: Colors.blue.shade700))),
        ],
      ),
    );
  }

  Widget _buildDateSelector() {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.calendar_today, color: Colors.blue),
              SizedBox(width: 8),
              Text('Chọn ngày khám mới', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 16),
          
          if (_availableDates.isEmpty)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.orange.shade50,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Row(
                children: [
                  Icon(Icons.warning_amber, color: Colors.orange),
                  SizedBox(width: 8),
                  Expanded(child: Text('Không có lịch khám khả dụng cho bác sĩ này.')),
                ],
              ),
            )
          else
            _buildCalendar(),
        ],
      ),
    );
  }

  Widget _buildCalendar() {
    return Container(
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey.shade200),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          // Month navigation
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.grey.shade50,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(8)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                IconButton(
                  icon: const Icon(Icons.chevron_left),
                  onPressed: () => _changeMonth(-1),
                ),
                Text(
                  'Tháng ${_currentMonth.month} / ${_currentMonth.year}',
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                IconButton(
                  icon: const Icon(Icons.chevron_right),
                  onPressed: () => _changeMonth(1),
                ),
              ],
            ),
          ),
          
          // Legend
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            color: Colors.grey.shade50,
            child: Row(
              children: [
                Container(width: 8, height: 8, decoration: BoxDecoration(color: Colors.blue, borderRadius: BorderRadius.circular(2))),
                const SizedBox(width: 4),
                const Text('Ngày có lịch khám', style: TextStyle(fontSize: 11, color: Colors.grey)),
              ],
            ),
          ),
          
          // Day labels
          Container(
            padding: const EdgeInsets.symmetric(vertical: 8),
            color: Colors.grey.shade50,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
                  .map((d) => Text(d, style: TextStyle(fontSize: 12, color: Colors.grey.shade600, fontWeight: FontWeight.w600)))
                  .toList(),
            ),
          ),
          
          // Calendar grid
          Padding(
            padding: const EdgeInsets.all(8),
            child: _buildCalendarGrid(),
          ),
        ],
      ),
    );
  }

  Widget _buildCalendarGrid() {
    final firstDayOfMonth = DateTime(_currentMonth.year, _currentMonth.month, 1);
    final daysInMonth = DateUtils.getDaysInMonth(_currentMonth.year, _currentMonth.month);
    final leadingEmpty = (firstDayOfMonth.weekday + 6) % 7;
    final totalCells = leadingEmpty + daysInMonth;
    final rows = (totalCells / 7).ceil();

    return Column(
      children: List.generate(rows, (row) {
        return Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: List.generate(7, (col) {
            final cellIndex = row * 7 + col;
            if (cellIndex < leadingEmpty || cellIndex >= leadingEmpty + daysInMonth) {
              return const SizedBox(width: 36, height: 36);
            }
            
            final dayNumber = cellIndex - leadingEmpty + 1;
            final date = DateTime(_currentMonth.year, _currentMonth.month, dayNumber);
            final dateString = DateFormat('yyyy-MM-dd').format(date);
            final isAvailable = _availableDates.contains(dateString);
            final isSelected = _selectedDate == dateString;
            
            return GestureDetector(
              onTap: isAvailable ? () => _handleDateSelect(dateString) : null,
              child: Container(
                width: 36,
                height: 36,
                margin: const EdgeInsets.all(2),
                decoration: BoxDecoration(
                  color: isSelected 
                      ? Colors.blue 
                      : isAvailable 
                          ? Colors.blue.withOpacity(0.1) 
                          : Colors.transparent,
                  borderRadius: BorderRadius.circular(18),
                  border: isAvailable && !isSelected 
                      ? Border.all(color: Colors.blue, width: 1.5) 
                      : null,
                ),
                alignment: Alignment.center,
                child: Text(
                  '$dayNumber',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: isSelected 
                        ? Colors.white 
                        : isAvailable 
                            ? Colors.blue.shade700 
                            : Colors.grey.shade400,
                  ),
                ),
              ),
            );
          }),
        );
      }),
    );
  }

  Widget _buildTimeSlotSelector() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.access_time, color: Colors.blue),
              SizedBox(width: 8),
              Text('Chọn giờ khám', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 16),
          
          if (_availableTimeSlots.isEmpty)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.orange.shade50,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Row(
                children: [
                  Icon(Icons.event_busy, color: Colors.orange),
                  SizedBox(width: 8),
                  Expanded(child: Text('Không có khung giờ khả dụng cho ngày này.')),
                ],
              ),
            )
          else
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 2.0,
                crossAxisSpacing: 8,
                mainAxisSpacing: 8,
              ),
              itemCount: _availableTimeSlots.length,
              itemBuilder: (context, index) {
                final slot = _availableTimeSlots[index];
                return _buildTimeSlotCard(slot);
              },
            ),
          
          const SizedBox(height: 12),
          
          // Legend
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.grey.shade50,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Chú thích:', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12)),
                const SizedBox(height: 4),
                _buildLegendItem(Colors.white, 'Còn trống', border: Colors.grey),
                _buildLegendItem(Colors.amber, 'Đang có người chọn'),
                _buildLegendItem(Colors.grey, 'Đã đầy'),
                _buildLegendItem(Colors.blue, 'Đã chọn'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTimeSlotCard(Map<String, dynamic> slot) {
    final isBooked = slot['isBooked'] == true;
    final slotKey = '${slot['scheduleId']}_${slot['startTime']}';
    final isLockedByOther = _lockedSlots.containsKey(slotKey) && _lockedSlots[slotKey] != _userId;
    final isLockedByMe = _lockedSlots.containsKey(slotKey) && _lockedSlots[slotKey] == _userId;
    final isSelected = _selectedTimeSlot != null &&
        _selectedTimeSlot!['scheduleId'] == slot['scheduleId'] &&
        _selectedTimeSlot!['startTime'] == slot['startTime'];
    final bookedCount = slot['bookedCount'] ?? 0;
    final maxBookings = slot['maxBookings'] ?? 3;
    final remaining = maxBookings - bookedCount;

    Color bgColor;
    Color borderColor;
    Color textColor;
    
    if (isBooked) {
      // Đã đầy - xám
      bgColor = Colors.grey.shade200;
      borderColor = Colors.grey.shade400;
      textColor = Colors.grey;
    } else if (isLockedByOther) {
      // Đang có người chọn - vàng
      bgColor = Colors.amber.shade50;
      borderColor = Colors.amber.shade400;
      textColor = Colors.amber.shade800;
    } else if (isSelected || isLockedByMe) {
      // Đang chọn bởi mình - xanh dương
      bgColor = Colors.blue.shade50;
      borderColor = Colors.blue;
      textColor = Colors.blue.shade700;
    } else {
      // Còn trống - trắng (default)
      bgColor = Colors.white;
      borderColor = Colors.grey.shade300;
      textColor = Colors.black87;
    }

    Widget card = GestureDetector(
      onTap: (isBooked || isLockedByOther) ? null : () => _handleTimeSlotSelect(slot),
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: borderColor, width: (isSelected || isLockedByMe) ? 2 : 1),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Flexible(
                  child: Text(
                    '${slot['startTime']} - ${slot['endTime']}',
                    style: TextStyle(fontWeight: FontWeight.bold, color: textColor, fontSize: 13),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                if (isLockedByOther || isLockedByMe)
                  Padding(
                    padding: const EdgeInsets.only(left: 4),
                    child: Icon(
                      Icons.lock,
                      size: 14,
                      color: isLockedByOther ? Colors.amber : Colors.blue,
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              isBooked 
                  ? 'Đã đầy' 
                  : isLockedByOther 
                      ? 'Đang có người chọn'
                      : remaining < maxBookings && remaining > 0
                          ? 'Còn $remaining/$maxBookings'
                          : 'Còn trống',
              style: TextStyle(
                fontSize: 10,
                fontWeight: isLockedByOther ? FontWeight.w600 : FontWeight.normal,
                color: isBooked 
                    ? Colors.grey 
                    : isLockedByOther
                        ? Colors.amber.shade800
                        : Colors.green.shade700,
              ),
            ),
          ],
        ),
      ),
    );

    // Add pulse animation for locked by other
    if (isLockedByOther) {
      return FadeTransition(
        opacity: _pulseAnimation,
        child: card,
      );
    }

    return card;
  }

  Widget _buildLegendItem(Color color, String text, {Color? border}) {
    return Padding(
      padding: const EdgeInsets.only(top: 2),
      child: Row(
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
              border: border != null ? Border.all(color: border, width: 1) : null,
            ),
          ),
          const SizedBox(width: 6),
          Expanded(child: Text(text, style: const TextStyle(fontSize: 11))),
        ],
      ),
    );
  }

  Widget _buildConfirmButton() {
    final canSubmit = _selectedDate != null && 
                      _selectedScheduleId != null && 
                      _selectedTimeSlot != null;
    
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          Expanded(
            child: OutlinedButton(
              onPressed: () => Navigator.pop(context),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: const Text('Hủy'),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            flex: 2,
            child: ElevatedButton(
              onPressed: canSubmit && !_isSubmitting ? _confirmReschedule : null,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
                backgroundColor: Colors.blue,
                disabledBackgroundColor: Colors.grey.shade300,
              ),
              child: _isSubmitting
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Text('Xác nhận đổi lịch', style: TextStyle(color: Colors.white)),
            ),
          ),
        ],
      ),
    );
  }
}
