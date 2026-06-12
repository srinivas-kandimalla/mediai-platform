import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ChatbotWidget } from './components/ChatbotWidget';

// Route Pages lazy/direct imports
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { RegisterPatient } from './pages/RegisterPatient';
import { RegisterDoctor } from './pages/RegisterDoctor';
import { Unauthorized } from './pages/Unauthorized';

// Patient Pages
import { PatientDashboard } from './pages/PatientDashboard';
import { PatientProfile } from './pages/PatientProfile';
import { PatientAppointments } from './pages/PatientAppointments';
import { PatientEHR } from './pages/PatientEHR';
import { PatientLabReports } from './pages/PatientLabReports';
import { PatientPredictions } from './pages/PatientPredictions';
import { PatientChatbot } from './pages/PatientChatbot';

// Doctor Pages
import { DoctorDashboard } from './pages/DoctorDashboard';
import { DoctorPatients } from './pages/DoctorPatients';
import { DoctorAppointments } from './pages/DoctorAppointments';
import { DoctorPredictions } from './pages/DoctorPredictions';
import { DoctorRecommendations } from './pages/DoctorRecommendations';
import { DoctorReports } from './pages/DoctorReports';

// Admin Pages
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminBeds } from './pages/AdminBeds';
import { AdminResources } from './pages/AdminResources';
import { AdminStaff } from './pages/AdminStaff';
import { AdminAlerts } from './pages/AdminAlerts';
import { AdminAnalytics } from './pages/AdminAnalytics';

// Layout wrapping Navbar, Sidebar and MediBot Widget
const PortalLayout = () => (
  <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#080c14] text-slate-100">
    <Navbar />
    <div className="flex flex-1">
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
    <ChatbotWidget />
  </div>
);

const App: React.FC = () => {
  const { initialize } = useAuthStore();

  useEffect(() => {
    // Load caching tokens on launch
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<RegisterPatient />} />
        <Route path="/register/doctor" element={<RegisterDoctor />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* PATIENT PORTAL ROUTES */}
        <Route element={<ProtectedRoute allowedRoles={['PATIENT']} />}>
          <Route element={<PortalLayout />}>
            <Route path="/patient/dashboard" element={<PatientDashboard />} />
            <Route path="/patient/profile" element={<PatientProfile />} />
            <Route path="/patient/appointments" element={<PatientAppointments />} />
            <Route path="/patient/ehr" element={<PatientEHR />} />
            <Route path="/patient/lab-reports" element={<PatientLabReports />} />
            <Route path="/patient/predictions" element={<PatientPredictions />} />
            <Route path="/patient/chatbot" element={<PatientChatbot />} />
          </Route>
        </Route>

        {/* DOCTOR PORTAL ROUTES */}
        <Route element={<ProtectedRoute allowedRoles={['DOCTOR']} />}>
          <Route element={<PortalLayout />}>
            <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
            <Route path="/doctor/patients" element={<DoctorPatients />} />
            <Route path="/doctor/appointments" element={<DoctorAppointments />} />
            <Route path="/doctor/predictions" element={<DoctorPredictions />} />
            <Route path="/doctor/recommendations" element={<DoctorRecommendations />} />
            <Route path="/doctor/reports" element={<DoctorReports />} />
          </Route>
        </Route>

        {/* ADMIN PORTAL ROUTES */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route element={<PortalLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/beds" element={<AdminBeds />} />
            <Route path="/admin/resources" element={<AdminResources />} />
            <Route path="/admin/staff" element={<AdminStaff />} />
            <Route path="/admin/alerts" element={<AdminAlerts />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
          </Route>
        </Route>

        {/* Redirect unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
