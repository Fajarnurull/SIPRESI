import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { AppLayout } from '../components/layout/AppLayout';

// Public & Auth Pages
import { SplashScreen } from '../pages/SplashScreen';
import { RoleSelect } from '../pages/RoleSelect';
import { LoginPage } from '../pages/auth/LoginPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { CheckEmailPage } from '../pages/auth/CheckEmailPage';
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage';
import { ResetSuccessPage } from '../pages/auth/ResetSuccessPage';
import { LoginSuccessTransition } from '../pages/auth/LoginSuccessTransition';
import { SetupAwalPage } from '../pages/auth/SetupAwalPage';

// Admin Pages
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { ManageUsersPage } from '../pages/admin/ManageUsersPage';
import { ManageStudentsPage } from '../pages/admin/ManageStudentsPage';
import { ManageAttendancePage } from '../pages/admin/ManageAttendancePage';
import { ManageGradesBehaviorsPage } from '../pages/admin/ManageGradesBehaviorsPage';
import { ModelSettingsPage } from '../pages/admin/ModelSettingsPage';

// Guru BK Pages
import { CounselorDashboard } from '../pages/counselor/CounselorDashboard';
import { RunPredictionPage } from '../pages/counselor/RunPredictionPage';
import { AtRiskStudentsPage } from '../pages/counselor/AtRiskStudentsPage';
import { StudentDetailPage } from '../pages/counselor/StudentDetailPage';
import { InterventionsPage } from '../pages/counselor/InterventionsPage';
import { MessagesPage } from '../pages/counselor/MessagesPage';

// Kepala Sekolah Pages
import { PrincipalDashboard } from '../pages/principal/PrincipalDashboard';
import { InterventionEffectivenessPage } from '../pages/principal/InterventionEffectivenessPage';

// Siswa Pages
import { StudentDashboard } from '../pages/student/StudentDashboard';
import { StudentMessagesPage } from '../pages/student/StudentMessagesPage';

// Reports
import { ReportsPage } from '../pages/reports/ReportsPage';

interface RoleRouteProps {
  allowedRoles: UserRole[];
  pageTitle: string;
  element: React.ReactElement;
}

const ProtectedRoleRoute: React.FC<RoleRouteProps> = ({ allowedRoles, pageTitle, element }) => {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center">
        <span className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Jika belum login, arahkan ke pilih peran
  if (!currentUser) {
    return <Navigate to="/pilih-peran" replace />;
  }

  // Jika role pengguna tidak sesuai dengan yang diizinkan untuk route ini,
  // arahkan kembali ke dashboard perannya sendiri (Route guard berbasis role)
  if (!allowedRoles.includes(currentUser.role)) {
    if (currentUser.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (currentUser.role === 'guru_bk') return <Navigate to="/bk/dashboard" replace />;
    if (currentUser.role === 'kepala_sekolah') return <Navigate to="/kepsek/dashboard" replace />;
    return <Navigate to="/siswa/dashboard" replace />;
  }

  return <AppLayout pageTitle={pageTitle}>{element}</AppLayout>;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* ALUR AWAL & AUTENTIKASI */}
      <Route path="/" element={<SplashScreen />} />
      <Route path="/pilih-peran" element={<RoleSelect />} />
      <Route path="/login/:role" element={<LoginPage />} />
      <Route path="/lupa-password" element={<ForgotPasswordPage />} />
      <Route path="/cek-email" element={<CheckEmailPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/reset-sukses" element={<ResetSuccessPage />} />
      <Route path="/login-sukses" element={<LoginSuccessTransition />} />
      <Route path="/setup-awal" element={<SetupAwalPage />} />

      {/* ADMIN ROUTES */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoleRoute
            allowedRoles={['admin']}
            pageTitle="Dashboard Administrator"
            element={<AdminDashboard />}
          />
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoleRoute
            allowedRoles={['admin']}
            pageTitle="Kelola Pengguna Sistem"
            element={<ManageUsersPage />}
          />
        }
      />
      <Route
        path="/admin/students"
        element={
          <ProtectedRoleRoute
            allowedRoles={['admin']}
            pageTitle="Master Data Siswa"
            element={<ManageStudentsPage />}
          />
        }
      />
      <Route
        path="/admin/attendance"
        element={
          <ProtectedRoleRoute
            allowedRoles={['admin']}
            pageTitle="Rekap Presensi Bulanan"
            element={<ManageAttendancePage />}
          />
        }
      />
      <Route
        path="/admin/grades-behaviors"
        element={
          <ProtectedRoleRoute
            allowedRoles={['admin']}
            pageTitle="Nilai Rapor & Sikap Disiplin"
            element={<ManageGradesBehaviorsPage />}
          />
        }
      />
      <Route
        path="/admin/model-settings"
        element={
          <ProtectedRoleRoute
            allowedRoles={['admin']}
            pageTitle="Kalibrasi Model DSS (Bobot & Ambang)"
            element={<ModelSettingsPage />}
          />
        }
      />

      {/* GURU BK ROUTES (PENGGUNA UTAMA) */}
      <Route
        path="/bk/dashboard"
        element={
          <ProtectedRoleRoute
            allowedRoles={['guru_bk']}
            pageTitle="Dashboard Bimbingan Konseling"
            element={<CounselorDashboard />}
          />
        }
      />
      <Route
        path="/bk/prediction"
        element={
          <ProtectedRoleRoute
            allowedRoles={['guru_bk']}
            pageTitle="Analisis Prediksi Risiko DSS"
            element={<RunPredictionPage />}
          />
        }
      />
      <Route
        path="/bk/at-risk"
        element={
          <ProtectedRoleRoute
            allowedRoles={['guru_bk']}
            pageTitle="Daftar Siswa Berisiko"
            element={<AtRiskStudentsPage />}
          />
        }
      />
      <Route
        path="/bk/student/:id"
        element={
          <ProtectedRoleRoute
            allowedRoles={['guru_bk', 'admin', 'kepala_sekolah']}
            pageTitle="Dossier & Rincian Prediksi Siswa"
            element={<StudentDetailPage />}
          />
        }
      />
      <Route
        path="/bk/interventions"
        element={
          <ProtectedRoleRoute
            allowedRoles={['guru_bk']}
            pageTitle="Program Tindak Lanjut & Intervensi"
            element={<InterventionsPage />}
          />
        }
      />
      <Route
        path="/bk/messages"
        element={
          <ProtectedRoleRoute
            allowedRoles={['guru_bk']}
            pageTitle="Kirim Pesan Bimbingan Siswa"
            element={<MessagesPage />}
          />
        }
      />

      {/* KEPALA SEKOLAH ROUTES */}
      <Route
        path="/kepsek/dashboard"
        element={
          <ProtectedRoleRoute
            allowedRoles={['kepala_sekolah']}
            pageTitle="Ringkasan Eksekutif Sekolah"
            element={<PrincipalDashboard />}
          />
        }
      />
      <Route
        path="/kepsek/effectiveness"
        element={
          <ProtectedRoleRoute
            allowedRoles={['kepala_sekolah']}
            pageTitle="Efektivitas Hasil Intervensi"
            element={<InterventionEffectivenessPage />}
          />
        }
      />

      {/* SISWA ROUTES (HANYA DATA SENDIRI, TANPA STIGMA SKOR RISIKO) */}
      <Route
        path="/siswa/dashboard"
        element={
          <ProtectedRoleRoute
            allowedRoles={['siswa']}
            pageTitle="Portal Belajar Siswa"
            element={<StudentDashboard />}
          />
        }
      />
      <Route
        path="/siswa/messages"
        element={
          <ProtectedRoleRoute
            allowedRoles={['siswa']}
            pageTitle="Pesan dari Guru BK"
            element={<StudentMessagesPage />}
          />
        }
      />

      {/* LAPORAN (ADMIN, GURU BK, KEPALA SEKOLAH - SISWA DITOLAK) */}
      <Route
        path="/reports"
        element={
          <ProtectedRoleRoute
            allowedRoles={['admin', 'guru_bk', 'kepala_sekolah']}
            pageTitle="Laporan & Ekspor Dokumen"
            element={<ReportsPage />}
          />
        }
      />

      {/* FALLBACK CATCH-ALL */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
