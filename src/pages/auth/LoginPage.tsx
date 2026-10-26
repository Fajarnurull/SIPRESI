import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  User,
  AlertCircle,
  Clock,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { role: routeRole } = useParams<{ role: string }>();
  const navigate = useNavigate();
  const { login, failedAttempts, lockoutRemaining, isLockedOut } = useAuth();

  const role: UserRole =
    routeRole === 'admin' ? 'admin' :
    routeRole === 'guru_bk' ? 'guru_bk' :
    routeRole === 'kepala_sekolah' ? 'kepala_sekolah' :
    routeRole === 'siswa' ? 'siswa' : 'guru_bk';

  const roleConfig = {
    admin: {
      title: 'Administrator',
      initial: 'A',
      identityLabel: 'Username',
      identityPlaceholder: 'Masukkan Username Admin (contoh: admin)',
      accentColor: '#2563EB',
      buttonBg: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
      avatarBg: 'bg-blue-600 text-white',
      demoIdentity: 'admin',
      demoPass: 'admin123'
    },
    guru_bk: {
      title: 'Guru BK',
      initial: 'BK',
      identityLabel: 'NIP',
      identityPlaceholder: 'Masukkan 18 digit NIP (contoh: 198506122010011005)',
      accentColor: '#0D9488',
      buttonBg: 'bg-teal-600 hover:bg-teal-700 active:bg-teal-800',
      badgeClass: 'bg-teal-50 text-teal-800 border-teal-200',
      avatarBg: 'bg-teal-600 text-white',
      demoIdentity: '198506122010011005',
      demoPass: 'gurubk123'
    },
    kepala_sekolah: {
      title: 'Kepala Sekolah',
      initial: 'KS',
      identityLabel: 'NIP',
      identityPlaceholder: 'Masukkan 18 digit NIP (contoh: 197204151998021002)',
      accentColor: '#7C3AED',
      buttonBg: 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800',
      badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
      avatarBg: 'bg-purple-600 text-white',
      demoIdentity: '197204151998021002',
      demoPass: 'kepsek123'
    },
    siswa: {
      title: 'Siswa',
      initial: 'S',
      identityLabel: 'NISN',
      identityPlaceholder: 'Masukkan 10 digit NISN (contoh: 0091234567)',
      accentColor: '#16A34A',
      buttonBg: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      avatarBg: 'bg-emerald-600 text-white',
      demoIdentity: '0091234567',
      demoPass: 'siswa123'
    }
  }[role];

  const [identitas, setIdentitas] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!identitas.trim() || !password) {
      setErrorMessage(`${roleConfig.identityLabel} dan password wajib diisi.`);
      return;
    }

    setIsSubmitting(true);
    const result = await login(identitas, password, role, rememberMe);
    setIsSubmitting(false);

    if (result.success) {
      navigate('/login-sukses');
    } else {
      setErrorMessage(result.error || `${roleConfig.identityLabel} atau password salah.`);
    }
  };

  const handleFillDemo = () => {
    setIdentitas(roleConfig.demoIdentity);
    setPassword(roleConfig.demoPass);
    setErrorMessage(null);
  };

  const hasError = Boolean(errorMessage);

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200/80 p-6 sm:p-8">
        {/* Tautan Kembali */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/pilih-peran"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ganti peran</span>
          </Link>

          <span className="text-[11px] text-slate-400 font-mono">SMPN 2 Wanadadi</span>
        </div>

        {/* HEADER PERAN */}
        <div className="flex items-center gap-4 mb-6 pb-5 border-b border-slate-100">
          <div className={`w-14 h-14 rounded-2xl ${roleConfig.avatarBg} font-black text-xl flex items-center justify-center shadow-md flex-shrink-0`}>
            {roleConfig.initial}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 leading-tight">
                Login {roleConfig.title}
              </h2>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${roleConfig.badgeClass}`}>
                Identitas: {roleConfig.identityLabel}
              </span>
            </div>
          </div>
        </div>

        {/* BANNER ERROR / LOCKOUT */}
        {isLockedOut ? (
          <div className="mb-5 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3 animate-in fade-in">
            <Clock className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600 animate-pulse" />
            <div>
              <p className="text-xs font-bold">Akses Terkunci Sementara</p>
              <p className="text-xs mt-1">
                Percobaan masuk gagal 3 kali. Silakan tunggu <b>{lockoutRemaining} detik</b> sebelum mencoba kembali.
              </p>
            </div>
          </div>
        ) : errorMessage ? (
          <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3 animate-in fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
            <div className="text-xs">
              <p className="font-semibold leading-tight">{errorMessage}</p>
              {failedAttempts > 0 && failedAttempts < 3 && (
                <p className="mt-1 font-bold text-red-800">
                  Sisa percobaan: {3 - failedAttempts} kali
                </p>
              )}
            </div>
          </div>
        ) : null}

        {/* FORM LOGIN */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* FIELD IDENTITAS */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {roleConfig.identityLabel} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={identitas}
                onChange={(e) => setIdentitas(e.target.value)}
                disabled={isLockedOut || isSubmitting}
                placeholder={roleConfig.identityPlaceholder}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 border ${
                  hasError ? 'border-red-500 ring-2 ring-red-100' : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                } text-slate-900 placeholder-slate-400 focus:outline-hidden transition-all disabled:opacity-50`}
              />
            </div>
          </div>

          {/* FIELD PASSWORD */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Password <span className="text-red-500">*</span>
              </label>
              <Link
                to="/lupa-password"
                className="text-xs font-medium text-slate-500 hover:text-blue-600 hover:underline transition-colors"
              >
                Lupa password?
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLockedOut || isSubmitting}
                placeholder="Masukkan kata sandi akun"
                className={`w-full pl-10 pr-11 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 border ${
                  hasError ? 'border-red-500 ring-2 ring-red-100' : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                } text-slate-900 placeholder-slate-400 focus:outline-hidden transition-all disabled:opacity-50`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* INGAT SAYA */}
          <div className="flex items-center pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-600 font-medium">Ingat saya di perangkat ini</span>
            </label>
          </div>

          {/* TOMBOL SUBMIT */}
          <button
            type="submit"
            disabled={isLockedOut || isSubmitting}
            className={`w-full py-3 px-4 rounded-xl text-sm font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 ${roleConfig.buttonBg} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isSubmitting ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : null}
            <span>Masuk</span>
          </button>
        </form>

        {/* QUICK DEMO HELPER */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <button
            type="button"
            onClick={handleFillDemo}
            className="w-full py-2 px-3 rounded-xl border border-dashed border-slate-300 hover:border-blue-400 bg-slate-50/70 hover:bg-blue-50/40 text-xs text-slate-600 font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
            <span>Isi Otomatis Akun Demo {roleConfig.title}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
