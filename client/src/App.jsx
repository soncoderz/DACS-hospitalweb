import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/user/Home.jsx';
import Doctors from './pages/user/Doctors.jsx';
import DoctorDetail from './pages/user/DoctorDetail.jsx';
import Branches from './pages/user/Branches.jsx';
import BranchDetail from './pages/user/BranchesDetail.jsx';
import Auth from './pages/user/Auth.jsx';
import Contact from './pages/user/Contact.jsx';

// Trang user
import Profile from './pages/user/Profile.jsx';
import Appointments from './pages/user/Appointments.jsx';
import Appointment from './pages/user/Appointment.jsx';
import AppointmentDetail from './pages/user/AppointmentDetail.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';
import ForgotPassword from './pages/user/ForgotPassword';
import OtpVerification from './pages/user/OtpVerification';
import ResetPassword from './pages/user/ResetPassword';
import VerifyEmail from './pages/user/VerifyEmail';
import NeedVerification from './pages/user/NeedVerification';

// Routes protectors
import UserRoute from './components/UserRoute';
import AdminRoute from './components/admin/AdminRoute';
import DoctorRoute from './components/doctor/DoctorRoute';

// Trang doctor
import DoctorDashboard from './pages/doctor/Dashboard';
import DoctorAppointments from './pages/doctor/Appointments';
import DoctorSchedule from './pages/doctor/Schedule';
import DoctorPatients from './pages/doctor/Patients';
import DoctorMedicalRecords from './pages/doctor/MedicalRecords';
import DoctorProfile from './pages/doctor/Profile';
import DoctorReviews from './pages/doctor/Reviews';
import DoctorAppointmentDetail from './pages/doctor/AppointmentDetail';

// Trang khác
import NotFound from './pages/user/NotFound';
import SocialCallback from './pages/user/SocialCallback.jsx';
import SetSocialPassword from './pages/user/SetSocialPassword';
import Specialties from './pages/user/Specialties.jsx';
import SpecialtyDetail from './pages/user/SpecialtyDetail.jsx';
import Services from './pages/user/Services.jsx';
import ServiceDetail from './pages/user/ServiceDetail.jsx';
import RescheduleAppointment from './pages/user/RescheduleAppointment';
import PaymentStatus from './pages/user/PaymentStatus.jsx';
import ReviewChoice from './pages/user/ReviewChoice.jsx';
import ReviewForm from './pages/user/ReviewForm.jsx';

// Trang admin
import AdminDashboard from './pages/admin/Dashboard';
import AdminSpecialties from './pages/admin/Specialties';
import AdminServices from './pages/admin/Services';
import AdminRooms from './pages/admin/Rooms';
import Users from './pages/admin/Users';
import Hospitals from './pages/admin/Hospitals';
import AdminDoctors from './pages/admin/Doctors';
// Thêm các trang admin mới
import AdminAppointments from './pages/admin/Appointments';
import AdminCoupons from './pages/admin/Coupons';
import AdminPayments from './pages/admin/Payments';
import AdminReviews from './pages/admin/Reviews';
import AdminDoctorSchedules from './pages/admin/DoctorSchedules';
import AdminMedications from './pages/admin/Medications';


function AppContent() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="spinner"></div>
    </div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Routes>
        {/* Admin Routes - No Navbar/Footer */}
        <Route path="/admin" element={<AdminRoute />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="doctors" element={<AdminDoctors />} />
          <Route path="hospitals" element={<Hospitals />} />
          <Route path="specialties" element={<AdminSpecialties />} />
          <Route path="services" element={<AdminServices />} />
          <Route path="rooms" element={<AdminRooms />} />
          {/* Thêm routes cho các trang admin mới */}
          <Route path="appointments" element={<AdminAppointments />} />
          <Route path="coupons" element={<AdminCoupons />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="doctor-schedules" element={<AdminDoctorSchedules />} />
          <Route path="medications" element={<AdminMedications />} />
        </Route>

        {/* Doctor Routes - No Navbar/Footer */}
        <Route path="/doctor" element={<DoctorRoute />}>
          <Route path="dashboard" element={<DoctorDashboard />} />
          <Route path="appointments" element={<DoctorAppointments />} />
          <Route path="appointments/:id" element={<DoctorAppointmentDetail />} />
          <Route path="patients" element={<DoctorPatients />} />
          <Route path="medical-records/:patientId" element={<DoctorMedicalRecords />} />
          <Route path="medical-records" element={<DoctorMedicalRecords />} />
          <Route path="schedule" element={<DoctorSchedule />} />
          <Route path="profile" element={<DoctorProfile />} />
          <Route path="reviews" element={<DoctorReviews />} />
        </Route>

        {/* Public and User Routes - With Navbar/Footer */}
        <Route path="*" element={
          <>
            <Navbar />
            <div className="flex-grow">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/otp-verification" element={<OtpVerification />} />
                <Route path="/need-verification" element={<NeedVerification />} />
               
                <Route path="/auth/social-callback" element={<SocialCallback />} />
                <Route path="/facebook-callback" element={<SocialCallback />} />
                <Route path="/doctors" element={<Doctors />} />
                <Route path="/doctors/:doctorId" element={<DoctorDetail />} />
                <Route path="/branches" element={<Branches />} />
                <Route path="/branches/:id" element={<BranchDetail />} />
                <Route path="/specialties" element={<Specialties />} />
                <Route path="/specialties/:specialtyId" element={<SpecialtyDetail />} />
                <Route path="/services" element={<Services />} />
                <Route path="/services/:serviceId" element={<ServiceDetail />} />
                <Route path="/appointment" element={<Appointment />} />
                <Route path="/contact" element={<Contact />} />
                
                {/* PayPal Payment Status Routes */}
                <Route path="/payment/paypal/success" element={<PaymentStatus />} />
                <Route path="/payment/paypal/cancel" element={<PaymentStatus />} />
                
                {/* Redirect old routes to new auth page */}
                <Route path="/login" element={
                  isAuthenticated ? <Navigate to="/" /> : <Auth />
                } />
                <Route path="/register" element={
                  isAuthenticated ? <Navigate to="/" /> : <Auth />
                } />
                
                {/* User Protected Routes */}
                <Route element={<UserRoute />}>
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/appointments" element={<Appointments />} />
                  <Route path="/appointments/:id" element={<AppointmentDetail />} />
                  <Route path="/appointments/:id/reschedule" element={<RescheduleAppointment />} />
                  <Route path="/appointments/:id/review" element={<ReviewChoice />} />
                  <Route path="/appointments/:id/review/:type" element={<ReviewForm />} />
                </Route>
                
                {/* New routes */}
                <Route path="/set-social-password" element={<SetSocialPassword />} />
                
                {/* Catch All */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            <Footer />
          </>
        } />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <NotificationProvider>
          <AppContent />
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick={false}
            rtl={false}
            pauseOnFocusLoss
            draggable={false}
            pauseOnHover
            theme="light"
            limit={3}
            style={{
              fontSize: '16px',
              zIndex: 9999,
              marginTop: '4.5rem'
            }}
          />
        </NotificationProvider>
      </Router>
    </AuthProvider>
  );
}

// Protected route component for authenticated users
function PrivateRoute({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    // Redirect to login if not authenticated, but remember where they were going
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default App; 
