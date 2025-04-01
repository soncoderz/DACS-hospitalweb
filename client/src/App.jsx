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
import AdminLogin from './pages/Admin/Login.jsx';
import ForgotPassword from './pages/ForgotPassword';
import OtpVerification from './pages/OtpVerification';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import NeedVerification from './pages/NeedVerification';
import AdminRoute from './components/AdminRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <AppContent />
        </div>
      </Router>
    </AuthProvider>
  );
}

function AppContent() {
  const { isAdmin } = useAuth();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Không hiển thị Navbar và Footer cho các trang Admin
  return (
    <>
      {!isAdminRoute && <Navbar />}
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<OtpVerification />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/need-verification" element={<NeedVerification />} />
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/branches" element={<Branches />} />
        
        {/* Protected User Routes */}
        <Route path="/appointment" element={<PrivateRoute><Appointment /></PrivateRoute>} />
        <Route path="/appointments" element={<PrivateRoute><Appointments /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        
        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><UsersManagement /></AdminRoute>} />
        <Route path="/admin/hospitals" element={<AdminRoute><BranchesManagement /></AdminRoute>} />
        <Route path="/admin/doctors" element={<AdminRoute><DoctorsManagement /></AdminRoute>} />
        <Route path="/admin/appointments" element={<AdminRoute><AppointmentsManagement /></AdminRoute>} />
        <Route path="/admin/services" element={<AdminRoute><ServicesManagement /></AdminRoute>} />
        <Route path="/admin/promotions" element={<AdminRoute><PromotionsManagement /></AdminRoute>} />
        <Route path="/admin/admins" element={<AdminRoute superAdminOnly={true}><AdminsManagement /></AdminRoute>} />
        
        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!isAdminRoute && <Footer />}
    </>
  );
}

// Protected route component for authenticated users
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    // Redirect to login if not authenticated, but remember where they were going
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// Import Admin Pages
import UsersManagement from './pages/admin/UsersManagement';
import BranchesManagement from './pages/admin/BranchesManagement';
import AppointmentsManagement from './pages/admin/AppointmentsManagement';
import ServicesManagement from './pages/admin/ServicesManagement';
import AdminsManagement from './pages/admin/AdminsManagement';
import PromotionsManagement from './pages/admin/PromotionsManagement';
import DoctorsManagement from './pages/admin/DoctorsManagement';

export default App; 