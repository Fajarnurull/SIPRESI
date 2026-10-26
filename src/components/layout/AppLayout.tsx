import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { RoleBadge } from '../common/RoleBadge';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CalendarCheck,
  Award,
  Sliders,
  FileText,
  AlertTriangle,
  HeartHandshake,
  MessageSquare,
  TrendingUp,
  LogOut,
  Menu,
  X,
  Sparkles,
  HelpCircle,
  Database
} from 'lucide-react';
import { isFirebaseConfigured } from '../../firebase';

interface AppLayoutProps {
  children: React.ReactNode;
  pageTitle: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, pageTitle }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const role = currentUser?.role || 'guru_bk';

  // Warna aksen per peran
  const roleTheme = {
    admin: {
      accentColor: '#2563EB',
      activeBg: 'bg-blue-600 text-white',
      badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-400/30'
    },
    guru_bk: {
      accentColor: '#0D9488',
      activeBg: 'bg-teal-600 text-white',
      badgeBg: 'bg-teal-500/20 text-teal-300 border-teal-400/30'
    },
    kepala_sekolah: {
      accentColor: '#7C3AED',
      activeBg: 'bg-purple-600 text-white',
      badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-400/30'
    },
    siswa: {
      accentColor: '#16A34A',
      activeBg: 'bg-emerald-600 text-white',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
    }
  }[role];

  // Daftar navigasi berdasarkan peran
  const getNavItems = () => {
    switch (role) {
      case 'admin':
        return [
          { name: 'Dashboard Admin', path: '/admin/dashboard', icon: LayoutDashboard },
          { name: 'Kelola Pengguna', path: '/admin/users', icon: Users },
          { name: 'Data Siswa', path: '/admin/students', icon: GraduationCap },
          { name: 'Data Kehadiran', path: '/admin/attendance', icon: CalendarCheck },
          { name: 'Nilai & Perilaku', path: '/admin/grades-behaviors', icon: Award },
          { name: 'Pengaturan Model DSS', path: '/admin/model-settings', icon: Sliders },
          { name: 'Laporan & Ekspor', path: '/reports', icon: FileText }
        ];
      case 'guru_bk':
        return [
          { name: 'Dashboard BK', path: '/bk/dashboard', icon: LayoutDashboard },
          { name: 'Jalankan Prediksi DSS', path: '/bk/prediction', icon: Sparkles },
          { name: 'Siswa Berisiko', path: '/bk/at-risk', icon: AlertTriangle },
          { name: 'Tindak Lanjut & Intervensi', path: '/bk/interventions', icon: HeartHandshake },
          { name: 'Kirim Pesan Siswa', path: '/bk/messages', icon: MessageSquare },
          { name: 'Laporan & Ekspor', path: '/reports', icon: FileText }
        ];
      case 'kepala_sekolah':
        return [
          { name: 'Ringkasan Eksekutif', path: '/kepsek/dashboard', icon: LayoutDashboard },
          { name: 'Efektivitas Intervensi', path: '/kepsek/effectiveness', icon: TrendingUp },
          { name: 'Laporan Sekolah', path: '/reports', icon: FileText }
        ];
      case 'siswa':
        return [
          { name: 'Dashboard Akademik', path: '/siswa/dashboard', icon: LayoutDashboard },
          { name: 'Pesan Guru BK', path: '/siswa/messages', icon: MessageSquare }
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  const handleLogout = async () => {
    await logout();
    navigate('/pilih-peran');
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col md:flex-row font-sans text-[#0F172A]">
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0B1F4A] text-slate-100 flex-shrink-0 border-r border-slate-800 shadow-xl z-20">
        {/* LOGO & BRANDING */}
        <div className="p-5 border-b border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md flex-shrink-0">
            <GraduationCap className="w-6 h-6 text-[#1D4ED8]" />
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-wide text-white">SIPRESI</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/30 text-blue-200 font-mono font-medium">DSS</span>
            </div>
            <p className="text-[11px] text-slate-300 truncate font-medium">
              SMP Negeri 2 Wanadadi
            </p>
          </div>
        </div>

        {/* STATUS PERSISTENSI */}
        <div className="px-5 py-2.5 bg-slate-900/40 text-[11px] flex items-center justify-between text-slate-300 border-b border-white/5">
          <span className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-blue-400" />
            {isFirebaseConfigured() ? 'Cloud Firestore' : 'Mode Demo / Offline'}
          </span>
          <span className={`w-2 h-2 rounded-full ${isFirebaseConfigured() ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
        </div>

        {/* MENU NAVIGASI */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Menu Utama
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path + '/'));
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive: exactActive }) => {
                  const active = exactActive || isActive;
                  return `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    active
                      ? `${roleTheme.activeBg} shadow-md`
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`;
                }}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* PROFILE CARD & LOGOUT */}
        <div className="p-3 border-t border-white/10 bg-black/20">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5 mb-2">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white font-bold text-sm border border-white/20">
              {currentUser?.nama?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {currentUser?.nama || 'Pengguna'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-slate-300 truncate">
                  {currentUser?.identitas}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-medium text-red-300 hover:text-white hover:bg-red-600/80 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Sesi</span>
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER BAR */}
      <div className="md:hidden bg-[#0B1F4A] text-white p-4 flex items-center justify-between shadow-md sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-[#1D4ED8]" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wide">SIPRESI</h1>
            <p className="text-[10px] text-slate-300">SMP N 2 Wanadadi</p>
          </div>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-white/10 text-white"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0B1F4A] text-white border-b border-white/10 px-4 py-3 space-y-1 z-30 animate-in slide-in-from-top">
          <div className="py-2 border-b border-white/10 flex items-center justify-between mb-2">
            <div>
              <p className="text-xs font-bold text-white">{currentUser?.nama}</p>
              <p className="text-[11px] text-slate-300">{currentUser?.identitas}</p>
            </div>
            {currentUser?.role && <RoleBadge role={currentUser.role} size="sm" />}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium ${
                  isActive ? roleTheme.activeBg : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}

          <div className="pt-2 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2 text-xs text-red-300 hover:text-white"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar Sesi</span>
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* TOP BAR DESKTOP */}
        <header className="hidden md:flex bg-white border-b border-slate-200 px-8 py-4 items-center justify-between sticky top-0 z-10 shadow-xs">
          <div>
            <h2 className="text-xl font-bold text-[#0F172A] tracking-tight">{pageTitle}</h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Decision Support System Prediksi Risiko Putus Sekolah · SMPN 2 Wanadadi
            </p>
          </div>

          <div className="flex items-center gap-4">
            {currentUser?.role && <RoleBadge role={currentUser.role} size="md" />}
            
            <div className="h-6 w-px bg-slate-200" />

            <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Tahun Ajaran 2026/2027</span>
            </div>

            <button
              title="Bantuan & Panduan"
              onClick={() => alert('SIPRESI DSS SMP Negeri 2 Wanadadi\nSistem Prediksi Risiko Putus Sekolah berbasis data presensi, capaian nilai akademik, dan catatan pelanggaran disiplin.')}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
