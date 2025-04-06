import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import './index.css';
import './styles/navbar.css';
import './styles/profile.css';
import './styles/appointments.css';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import Doctors from './pages/Doctors.jsx';
import Branches from './pages/Branches.jsx';
import Auth from './pages/Auth.jsx';
import Appointment from './pages/Appointment.jsx';
import Profile from './pages/Profile.jsx';
import Appointments from './pages/Appointments.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import ForgotPassword from './pages/ForgotPassword';
import OtpVerification from './pages/OtpVerification';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import NeedVerification from './pages/NeedVerification';
import UserRoute from './components/UserRoute';
import NotFound from './pages/NotFound';
import SocialCallback from './pages/SocialCallback.jsx';
import SetSocialPassword from './pages/SetSocialPassword';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading-app">Đang tải...</div>;
  }

  return (
    <div className="app">
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/otp-verification" element={<OtpVerification />} />
        <Route path="/need-verification" element={<NeedVerification />} />
        <Route path="/appointment" element={<Appointment />} />
        <Route path="/auth/social-callback" element={<SocialCallback />} />
        <Route path="/facebook-callback" element={<SocialCallback />} />
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/branches" element={<Branches />} />
        
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
        </Route>
        
        {/* New routes */}
        <Route path="/set-social-password" element={<SetSocialPassword />} />
        
        {/* Catch All */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
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
          }}
        />
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