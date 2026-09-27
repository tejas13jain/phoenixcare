import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { Navbar } from './components/layout/Navbar.jsx';
import { SplashScreen } from './components/layout/SplashScreen.jsx';
import { ProtectedRoute } from './components/layout/ProtectedRoute.jsx';
import { EngagementBanner } from './components/layout/EngagementBanner.jsx';

import { HomePage } from './pages/HomePage.jsx';
import { DoctorListingPage } from './pages/DoctorListingPage.jsx';
import { DoctorProfilePage } from './pages/DoctorProfilePage.jsx';
import { BookingFlowPage } from './pages/BookingFlowPage.jsx';
import { ConsultationRoomPage } from './pages/ConsultationRoomPage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';

import { LoginPage } from './pages/auth/LoginPage.jsx';
import { SignupPage } from './pages/auth/SignupPage.jsx';
import { OtpLoginPage } from './pages/auth/OtpLoginPage.jsx';

import { PatientDashboardPage } from './pages/patient/PatientDashboardPage.jsx';
import { PatientAppointmentsPage } from './pages/patient/PatientAppointmentsPage.jsx';
import { HealthVaultPage } from './pages/patient/HealthVaultPage.jsx';
import { PrescriptionViewerPage } from './pages/patient/PrescriptionViewerPage.jsx';
import { HealthReportPage } from './pages/patient/HealthReportPage.jsx';

import { DoctorDashboardPage } from './pages/doctor/DoctorDashboardPage.jsx';
import { DoctorAvailabilityPage } from './pages/doctor/DoctorAvailabilityPage.jsx';
import { DoctorAnalyticsPage } from './pages/doctor/DoctorAnalyticsPage.jsx';

import { AdminLayout } from './pages/admin/AdminLayout.jsx';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage.jsx';
import { AdminDoctorsPage } from './pages/admin/AdminDoctorsPage.jsx';
import { AdminUsersPage } from './pages/admin/AdminUsersPage.jsx';
import { AdminPaymentsPage } from './pages/admin/AdminPaymentsPage.jsx';
import { AdminReportsPage } from './pages/admin/AdminReportsPage.jsx';
import { AdminModerationPage } from './pages/admin/AdminModerationPage.jsx';

export default function App() {
  const location = useLocation();

  return (
    <>
      <SplashScreen />
      <Toaster position="top-right" toastOptions={{ style: { fontFamily: 'Inter, sans-serif', fontSize: '14px' } }} />
      <Navbar />
      <EngagementBanner />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<HomePage />} />
          <Route path="/doctors" element={<DoctorListingPage />} />
          <Route path="/doctors/:id" element={<DoctorProfilePage />} />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/otp-login" element={<OtpLoginPage />} />

          <Route
            path="/book/:doctorId"
            element={
              <ProtectedRoute roles={['patient']}>
                <BookingFlowPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/consultation/:appointmentId"
            element={
              <ProtectedRoute roles={['patient', 'doctor']}>
                <ConsultationRoomPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/prescriptions/:appointmentId"
            element={
              <ProtectedRoute roles={['patient', 'doctor']}>
                <PrescriptionViewerPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/patient/dashboard"
            element={
              <ProtectedRoute roles={['patient']}>
                <PatientDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/appointments"
            element={
              <ProtectedRoute roles={['patient']}>
                <PatientAppointmentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/health-vault"
            element={
              <ProtectedRoute roles={['patient']}>
                <HealthVaultPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/health-report"
            element={
              <ProtectedRoute roles={['patient']}>
                <HealthReportPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/doctor/dashboard"
            element={
              <ProtectedRoute roles={['doctor']}>
                <DoctorDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/availability"
            element={
              <ProtectedRoute roles={['doctor']}>
                <DoctorAvailabilityPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/analytics"
            element={
              <ProtectedRoute roles={['doctor']}>
                <DoctorAnalyticsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path="doctors" element={<AdminDoctorsPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="payments" element={<AdminPaymentsPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="moderation" element={<AdminModerationPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AnimatePresence>
    </>
  );
}
