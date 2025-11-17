import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/constants/app_constants.dart';
import 'core/network/dio_client.dart';
import 'core/services/token_storage_service.dart';
import 'data/datasources/auth_remote_data_source.dart';
import 'data/datasources/doctor_remote_data_source.dart';
import 'data/datasources/specialty_remote_data_source.dart';
import 'data/datasources/appointment_remote_data_source.dart';
import 'data/datasources/hospital_remote_data_source.dart';
import 'data/datasources/news_remote_data_source.dart';
import 'data/datasources/review_remote_data_source.dart';
import 'data/datasources/statistics_remote_data_source.dart';
import 'data/repositories/auth_repository_impl.dart';
import 'data/repositories/doctor_repository_impl.dart';
import 'data/repositories/specialty_repository_impl.dart';
import 'data/repositories/appointment_repository_impl.dart';
import 'data/repositories/hospital_repository_impl.dart';
import 'data/repositories/news_repository_impl.dart';
import 'data/repositories/review_repository_impl.dart';
import 'data/repositories/statistics_repository_impl.dart';
import 'presentation/providers/auth_provider.dart';
import 'presentation/providers/doctor_provider.dart';
import 'presentation/providers/specialty_provider.dart';
import 'presentation/providers/appointment_provider.dart';
import 'presentation/providers/hospital_provider.dart';
import 'presentation/providers/news_provider.dart';
import 'presentation/providers/review_provider.dart';
import 'presentation/providers/statistics_provider.dart';
import 'presentation/screens/splash/splash_screen.dart';
import 'presentation/screens/auth/login_screen.dart';
import 'presentation/screens/auth/register_screen.dart';
import 'presentation/screens/auth/forgot_password_screen.dart';
import 'presentation/screens/auth/otp_verification_screen.dart';
import 'presentation/screens/auth/reset_password_screen.dart';
import 'presentation/screens/main/main_screen.dart';
import 'presentation/screens/doctors/doctors_list_screen.dart';
import 'presentation/screens/doctors/doctor_detail_screen.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    // Initialize dependencies
    final dioClient = DioClient();
    final tokenStorage = TokenStorageService();

    return MultiProvider(
      providers: [
        // Auth Provider
        ChangeNotifierProvider(
          create: (_) => AuthProvider(
            AuthRepositoryImpl(
              AuthRemoteDataSourceImpl(dioClient),
              tokenStorage,
            ),
            tokenStorage,
          ),
        ),

        // Doctor Provider
        ChangeNotifierProvider(
          create: (_) => DoctorProvider(
            DoctorRepositoryImpl(
              DoctorRemoteDataSourceImpl(dioClient),
            ),
          ),
        ),

        // Specialty Provider
        ChangeNotifierProvider(
          create: (_) => SpecialtyProvider(
            SpecialtyRepositoryImpl(
              SpecialtyRemoteDataSourceImpl(dioClient),
            ),
          ),
        ),

        // Appointment Provider
        ChangeNotifierProvider(
          create: (_) => AppointmentProvider(
            AppointmentRepositoryImpl(
              AppointmentRemoteDataSourceImpl(dioClient),
            ),
          ),
        ),

        // Hospital Provider
        ChangeNotifierProvider(
          create: (_) => HospitalProvider(
            repository: HospitalRepositoryImpl(
              remoteDataSource: HospitalRemoteDataSource(dioClient: dioClient),
            ),
          ),
        ),

        // News Provider
        ChangeNotifierProvider(
          create: (_) => NewsProvider(
            repository: NewsRepositoryImpl(
              remoteDataSource: NewsRemoteDataSource(dioClient: dioClient),
            ),
          ),
        ),

        // Review Provider
        ChangeNotifierProvider(
          create: (_) => ReviewProvider(
            repository: ReviewRepositoryImpl(
              remoteDataSource: ReviewRemoteDataSource(dioClient: dioClient),
            ),
          ),
        ),

        // Statistics Provider
        ChangeNotifierProvider(
          create: (_) => StatisticsProvider(
            repository: StatisticsRepositoryImpl(
              remoteDataSource: StatisticsRemoteDataSource(dioClient: dioClient),
            ),
          ),
        ),
      ],
      child: MaterialApp(
        title: AppConstants.appName,
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(
            seedColor: Colors.blue,
            primary: Colors.blue,
          ),
          useMaterial3: true,
          appBarTheme: const AppBarTheme(
            centerTitle: true,
            elevation: 0,
          ),
        ),
        initialRoute: '/',
        routes: {
          '/': (context) => const SplashScreen(),
          '/login': (context) => const LoginScreen(),
          '/register': (context) => const RegisterScreen(),
          '/forgot-password': (context) => const ForgotPasswordScreen(),
          '/home': (context) => const MainScreen(),
          '/doctors': (context) => const DoctorsListScreen(),
        },
        onGenerateRoute: (settings) {
          // Handle routes with arguments
          if (settings.name == '/verify-otp') {
            final email = settings.arguments as String;
            return MaterialPageRoute(
              builder: (context) => OtpVerificationScreen(email: email),
            );
          }
          if (settings.name == '/reset-password') {
            final args = settings.arguments as Map<String, String>;
            return MaterialPageRoute(
              builder: (context) => ResetPasswordScreen(
                email: args['email']!,
                otp: args['otp']!,
              ),
            );
          }
          if (settings.name == '/doctor-detail') {
            final doctorId = settings.arguments as String;
            return MaterialPageRoute(
              builder: (context) => DoctorDetailScreen(doctorId: doctorId),
            );
          }
          return null;
        },
      ),
    );
  }
}
