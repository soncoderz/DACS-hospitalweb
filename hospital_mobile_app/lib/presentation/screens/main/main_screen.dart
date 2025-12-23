import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../domain/entities/user.dart';
import '../../providers/auth_provider.dart';
import '../home/home_screen.dart';
import '../doctors/doctors_list_screen.dart';
import '../specialties/specialties_screen.dart';
import '../services/services_list_screen.dart';
import '../hospitals/hospitals_screen.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _selectedIndex = 0;

  final List<Widget> _screens = [
    const HomeScreen(),
    const DoctorsListScreen(showAppBar: false),
    const SpecialtiesScreen(showAppBar: false),
    const ServicesListScreen(showAppBar: false),
    const HospitalsScreen(),
  ];

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  Widget _buildDrawerAvatar(User? user) {
    final initial = _getUserInitial(user?.fullName);
    final imageUrl = user?.avatarUrl;

    Widget fallbackAvatar() => CircleAvatar(
          radius: 36,
          backgroundColor: Colors.white,
          child: Text(
            initial,
            style: const TextStyle(
              fontSize: 32,
              fontWeight: FontWeight.bold,
              color: Colors.blue,
            ),
          ),
        );

    if (imageUrl == null || imageUrl.isEmpty) {
      return fallbackAvatar();
    }

    return ClipOval(
      child: CachedNetworkImage(
        imageUrl: imageUrl,
        width: 72,
        height: 72,
        fit: BoxFit.cover,
        placeholder: (_, __) => fallbackAvatar(),
        errorWidget: (_, __, ___) => fallbackAvatar(),
      ),
    );
  }

  String _getUserInitial(String? fullName) {
    if (fullName == null) return 'U';
    final trimmed = fullName.trim();
    if (trimmed.isEmpty) return 'U';
    return trimmed.substring(0, 1).toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: _getTitle(),
        elevation: 0,
      ),
      drawer: _buildDrawer(context),
      body: _screens[_selectedIndex],
      bottomNavigationBar: BottomNavigationBar(
        type: BottomNavigationBarType.fixed,
        currentIndex: _selectedIndex,
        onTap: _onItemTapped,
        selectedItemColor: Colors.blue,
        unselectedItemColor: Colors.grey,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home),
            label: 'Trang chủ',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_search),
            label: 'Bác sĩ',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.medical_services),
            label: 'Chuyên khoa',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.local_hospital),
            label: 'Dịch vụ',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.business),
            label: 'Chi nhánh',
          ),
        ],
      ),
    );
  }

  Widget _getTitle() {
    switch (_selectedIndex) {
      case 0:
        return const Text('Trang Chủ');
      case 1:
        return const Text('Bác Sĩ');
      case 2:
        return const Text('Chuyên Khoa');
      case 3:
        return const Text('Dịch Vụ');
      case 4:
        return const Text('Chi Nhánh');
      default:
        return const Text('Hospital App');
    }
  }

  Widget _buildDrawer(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.user;

    return Drawer(
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          UserAccountsDrawerHeader(
            decoration: const BoxDecoration(
              color: Colors.blue,
            ),
            currentAccountPicture: _buildDrawerAvatar(user),
            accountName: Text(
              user?.fullName ?? 'User',
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
            accountEmail: Text(
              user?.email ?? '',
              style: const TextStyle(fontSize: 14),
            ),
          ),
          ListTile(
            leading: const Icon(Icons.home),
            title: const Text('Trang chủ'),
            onTap: () {
              Navigator.pop(context);
              setState(() {
                _selectedIndex = 0;
              });
            },
          ),
          ListTile(
            leading: const Icon(Icons.person),
            title: const Text('Hồ sơ'),
            onTap: () {
              Navigator.pop(context);
              Navigator.pushNamed(context, '/profile');
            },
          ),
          ListTile(
            leading: const Icon(Icons.calendar_today),
            title: const Text('Lịch hẹn của tôi'),
            onTap: () {
              Navigator.pop(context);
              Navigator.pushNamed(context, '/appointments');
            },
          ),
          ListTile(
            leading: const Icon(Icons.article),
            title: const Text('Tin tức'),
            onTap: () {
              Navigator.pop(context);
              Navigator.pushNamed(context, '/news');
            },
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.logout, color: Colors.red),
            title: const Text(
              'Đăng xuất',
              style: TextStyle(color: Colors.red),
            ),
            onTap: () async {
              final shouldLogout = await showDialog<bool>(
                context: context,
                builder: (context) => AlertDialog(
                  title: const Text('Đăng xuất'),
                  content: const Text('Bạn có chắc muốn đăng xuất?'),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(context, false),
                      child: const Text('Hủy'),
                    ),
                    ElevatedButton(
                      onPressed: () => Navigator.pop(context, true),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.red,
                      ),
                      child: const Text('Đăng xuất'),
                    ),
                  ],
                ),
              );

              if (shouldLogout == true && mounted) {
                await authProvider.logout();
                if (mounted) {
                  Navigator.pushNamedAndRemoveUntil(
                    context,
                    '/login',
                    (route) => false,
                  );
                }
              }
            },
          ),
        ],
      ),
    );
  }
}
