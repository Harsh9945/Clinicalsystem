import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NavBar } from './components/shared/Navbar';
import { ProtectedRoute } from './components/shared/ProtectedRoute';

// Auth Pages
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';

// Public Pages
import { HomePage } from './components/pages/HomePage';
import { UnauthorizedPage } from './components/pages/UnauthorizedPage';

// Patient Pages
import { PatientDashboard } from './components/patient/PatientDashboard';
import { BookAppointmentPage } from './components/patient/BookAppointmentPage';

// Doctor Pages
import { DoctorDashboard } from './components/doctor/DoctorDashboard';

// Admin Pages
import { AdminDashboard } from './components/admin/AdminDashboard';

// Shared Pages
import { VideoCallPage } from './components/shared/VideoCallPage';

import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Patient Routes */}
      <Route
        path="/patient/dashboard"
        element={<ProtectedRoute component={PatientDashboard} requiredRole="PATIENT" />}
      />
      <Route
        path="/patient/book-appointment"
        element={<ProtectedRoute component={BookAppointmentPage} requiredRole="PATIENT" />}
      />

      {/* Doctor Routes */}
      <Route
        path="/doctor/dashboard"
        element={<ProtectedRoute component={DoctorDashboard} requiredRole="DOCTOR" />}
      />

      {/* Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={<ProtectedRoute component={AdminDashboard} requiredRole="ADMIN" />}
      />

      {/* Shared Authenticated Routes */}
      <Route
        path="/video-call/:appointmentId"
        element={<ProtectedRoute component={VideoCallPage} requiredRole={null} />}
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <NavBar />
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
