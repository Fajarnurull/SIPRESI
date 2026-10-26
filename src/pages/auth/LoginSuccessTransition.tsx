import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { RoleBadge } from '../../components/common/RoleBadge';
import { CheckCircle2, ShieldCheck } from 'lucide-react';

export const LoginSuccessTransition: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(timer);
          return 100;
        }
        return p + 10;
      });
    }, 120);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (progress >= 100 && currentUser) {
      if (currentUser.role === 'admin') navigate('/admin/dashboard');
      else if (currentUser.role === 'guru_bk') navigate('/bk/dashboard');
      else if (currentUser.role === 'kepala_sekolah') navigate('/kepsek/dashboard');
      else if (currentUser.role === 'siswa') navigate('/siswa/dashboard');
      else navigate('/pilih-peran');
    }
  }, [progress, currentUser, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B1F4A] via-[#123680] to-[#1D4ED8] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Lingkaran dekoratif */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/5 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-blue-400/10 blur-2xl pointer-events-none" />

      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center relative z-10 border border-white/20 animate-in zoom-in-95 duration-300">
        <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-sm">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
          Autentikasi Berhasil
        </span>

        <h2 className="text-2xl font-black text-slate-900 mt-3">
          Login Berhasil!
        </h2>

        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          Selamat datang, <span className="font-bold text-slate-900">{currentUser?.nama || 'Pengguna'}</span>!
          <br />
          Anda masuk sebagai {currentUser?.role && <RoleBadge role={currentUser.role} size="sm" />} SIPRESI.
        </p>

        {/* PROGRESS BAR */}
        <div className="mt-8">
          <div className="flex justify-between text-xs text-slate-400 mb-2 font-mono">
            <span>Mempersiapkan dasbor kerja...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-150 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Sesi terenkripsi & diawasi sistem keamanan sekolah</span>
        </div>
      </div>
    </div>
  );
};
