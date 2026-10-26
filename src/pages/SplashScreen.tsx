import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap } from 'lucide-react';

export const SplashScreen: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 4; // ~2.5 detik untuk mencapai 100%
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      if (currentUser) {
        // Arahkan ke dashboard peran
        if (currentUser.role === 'admin') navigate('/admin/dashboard');
        else if (currentUser.role === 'guru_bk') navigate('/bk/dashboard');
        else if (currentUser.role === 'kepala_sekolah') navigate('/kepsek/dashboard');
        else navigate('/siswa/dashboard');
      } else {
        navigate('/pilih-peran');
      }
    }
  }, [progress, currentUser, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B1F4A] via-[#103275] to-[#1D4ED8] flex flex-col items-center justify-between p-6 sm:p-10 relative overflow-hidden text-white font-sans">
      {/* LINGKARAN DEKORATIF TRANSPARAN */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/5 blur-2xl pointer-events-none" />
      <div className="absolute top-1/3 -right-24 w-80 h-80 rounded-full bg-blue-400/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 left-1/4 w-72 h-72 rounded-full bg-white/5 blur-2xl pointer-events-none" />

      {/* TOP HEADER */}
      <div className="w-full flex justify-between items-center text-xs text-blue-200/80 tracking-widest uppercase font-medium">
        <span>Sistem Informasi Terpadu</span>
        <span>Kabupaten Banjarnegara</span>
      </div>

      {/* CENTER HERO BRANDING */}
      <div className="flex flex-col items-center text-center max-w-lg z-10 my-auto">
        {/* LOGO EMBLEM */}
        <div className="relative mb-6 group">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-white p-2.5 shadow-2xl flex items-center justify-center transform transition-transform duration-500 hover:scale-105 border-2 border-white/20">
            <img
              src="/assets/aistudio/Gemini_Generated_Image_bk8l3vbk8l3vbk8l_8b6897c6.jpg"
              alt="Logo Resmi SIPRESI SMP Negeri 2 Wanadadi"
              className="w-full h-full object-contain rounded-2xl"
              onError={(e) => {
                // Fallback jika image gagal load
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  parent.innerHTML = '<div class="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white"><svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5z"></path></svg></div>';
                }
              }}
            />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-xl shadow-lg border-2 border-[#0B1F4A]">
            <GraduationCap className="w-4 h-4" />
          </div>
        </div>

        {/* NAMA SISTEM */}
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-2 drop-shadow-md">
          SIPRESI
        </h1>

        <p className="text-base sm:text-lg font-semibold text-blue-100 max-w-md leading-snug">
          Sistem Prediksi Risiko Putus Sekolah
        </p>

        <div className="mt-3 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium text-blue-200">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>Decision Support System · Berbasis Website</span>
        </div>

        {/* PROGRESS BAR LOADING */}
        <div className="w-64 sm:w-80 mt-10">
          <div className="flex justify-between text-xs text-blue-200 mb-2 font-mono">
            <span>Memuat sistem analitik...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/20 overflow-hidden backdrop-blur-xs p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-300 transition-all duration-150 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="w-full flex flex-col sm:flex-row justify-between items-center text-xs text-blue-200/90 gap-2 border-t border-white/10 pt-4 z-10">
        <span className="font-semibold text-white tracking-wide">
          SMP Negeri 2 Wanadadi
        </span>
        <span className="text-blue-300 font-mono">
          Versi 1.0 · Tahun Ajaran 2026/2027
        </span>
      </div>
    </div>
  );
};
