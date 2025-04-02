import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css';
import './index.css';
import './styles/navbar.css';
import './styles/profile.css';
import './styles/appointments.css';
import './styles/admin.css';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import Doctors from './pages/Doctors.jsx';
import Branches from './pages/Branches.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Appointment from './pages/Appointment.jsx';
import Profile from './pages/Profile.jsx';
import Appointments from './pages/Appointments.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import AdminDashboard from './pages/admin/Dashboard';
import AdminRoute from './components/AdminRoute';
import ForgotPassword from './pages/ForgotPassword';
import OtpVerification from './pages/OtpVerification';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import NeedVerification from './pages/NeedVerification';
import AdminForbidden from './pages/admin/Forbidden';
import DoctorRoute from './components/DoctorRoute';
import UserRoute from './components/UserRoute';
import DoctorDashboard from './pages/doctor/Dashboard';
import DoctorAppointments from './pages/doctor/Appointments';
import DoctorPatients from './pages/doctor/Patients';
import DoctorProfile from './pages/doctor/Profile';
import RoleManagement from './pages/admin/RoleManagement';
import PermissionManagement from './pages/admin/PermissionManagement';
import UserManagement from './pages/admin/UserManagement';
import NotFound from './pages/NotFound';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Navbar />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email/:token" element={<VerifyEmail />} />
            <Route path="/otp-verification" element={<OtpVerification />} />
            <Route path="/need-verification" element={<NeedVerification />} />
            
            {/* User Protected Routes */}
            <Route element={<UserRoute />}>
              <Route path="/profile" element={<Profile />} />
              <Route path="/appointments" element={<Appointments />} />
            </Route>
            
            {/* Doctor Protected Routes */}
            <Route element={<DoctorRoute />}>
              <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
              <Route path="/doctor/appointments" element={<DoctorAppointments />} />
              <Route path="/doctor/patients" element={<DoctorPatients />} />
              <Route path="/doctor/profile" element={<DoctorProfile />} />
            </Route>
            
            {/* Admin Protected Routes */}
            <Route element={<AdminRoute />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<UserManagement />} />
              <Route path="/admin/roles" element={<RoleManagement />} />
              <Route path="/admin/permissions" element={<PermissionManagement />} />
            </Route>
            
            {/* Catch All */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Footer />
        </div>
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