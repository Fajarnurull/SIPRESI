import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import {
  ShieldCheck,
  TrendingDown,
  Users2,
  GraduationCap,
  ArrowRight,
  Info,
  CheckCircle2
} from 'lucide-react';

export const RoleSelect: React.FC = () => {
  const navigate = useNavigate();
  const { setSelectedRole } = useAuth();
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);

  const roles = [
    {
      id: 'admin' as UserRole,
      initial: 'A',
      title: 'Administrator',
      loginType: 'Username',
      accentColor: '#2563EB',
      borderColor: 'hover:border-blue-500',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
      avatarBg: 'bg-blue-600 text-white',
      btnBg: 'bg-blue-600 hover:bg-blue-700',
      description: 'Kelola data master sekolah, pengguna, kehadiran, nilai, serta konfigurasi bobot DSS.',
      demoHint: 'Username: admin · Pass: admin123'
    },
    {
      id: 'guru_bk' as UserRole,
      initial: 'BK',
      title: 'Guru Bimbingan Konseling',
      loginType: 'NIP',
      accentColor: '#0D9488',
      borderColor: 'hover:border-teal-500',
      badgeBg: 'bg-teal-50 text-teal-800 border-teal-200',
      avatarBg: 'bg-teal-600 text-white',
      btnBg: 'bg-teal-600 hover:bg-teal-700',
      description: 'Pengguna utama: jalankan analisis DSS, pantau siswa berisiko, lakukan home visit & intervensi.',
      demoHint: 'NIP: 198506122010011005 · Pass: gurubk123'
    },
    {
      id: 'kepala_sekolah' as UserRole,
      initial: 'KS',
      title: 'Kepala Sekolah',
      loginType: 'NIP',
      accentColor: '#7C3AED',
      borderColor: 'hover:border-purple-500',
      badgeBg: 'bg-purple-50 text-purple-800 border-purple-200',
      avatarBg: 'bg-purple-600 text-white',
      btnBg: 'bg-purple-600 hover:bg-purple-700',
      description: 'Pemantauan eksekutif pimpinan: tinjau grafik risiko sekolah dan efektivitas hasil tindak lanjut.',
      demoHint: 'NIP: 197204151998021002 · Pass: kepsek123'
    },
    {
      id: 'siswa' as UserRole,
      initial: 'S',
      title: 'Siswa',
      loginType: 'NISN',
      accentColor: '#16A34A',
      borderColor: 'hover:border-emerald-500',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      avatarBg: 'bg-emerald-600 text-white',
      btnBg: 'bg-emerald-600 hover:bg-emerald-700',
      description: 'Portal pribadi siswa: pantau persentase kehadiran bulanan, nilai mapel, dan pesan suportif BK.',
      demoHint: 'NISN: 0091234567 · Pass: siswa123'
    }
  ];

  const handleSelect = (roleId: UserRole) => {
    setSelectedRole(roleId);
    navigate(`/login/${roleId}`);
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col lg:flex-row font-sans">
      {/* PANEL KIRI (BRANDING & HIGHLIGHTS) */}
      <div className="lg:w-5/12 bg-gradient-to-br from-[#0B1F4A] via-[#123680] to-[#1D4ED8] p-8 lg:p-14 text-white flex flex-col justify-between relative overflow-hidden">
        {/* Lingkaran dekoratif */}
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="absolute top-10 -right-20 w-64 h-64 rounded-full bg-blue-400/10 blur-xl pointer-events-none" />

        {/* Top school identity */}
        <div className="z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-white p-1 shadow-lg flex items-center justify-center">
              <img
                src="/assets/aistudio/Gemini_Generated_Image_bk8l3vbk8l3vbk8l_8b6897c6.jpg"
                alt="Logo SIPRESI"
                className="w-full h-full object-contain rounded-xl"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-white leading-none">SIPRESI</h2>
              <p className="text-xs text-blue-200 font-medium mt-0.5">SMP Negeri 2 Wanadadi</p>
            </div>
          </div>

          <div className="my-8 lg:my-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-medium text-cyan-300 border border-white/10 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              Decision Support System (DSS)
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-white leading-tight">
              Cegah putus sekolah <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-200">
                lebih awal, dengan data.
              </span>
            </h1>
            <p className="mt-4 text-sm text-blue-100 leading-relaxed max-w-md">
              Sistem pendukung keputusan terpadu untuk menganalisis risiko putus sekolah siswa secara objektif, transparan, dan memberikan rekomendasi intervensi solutif.
            </p>
          </div>
        </div>

        {/* 3 POIN KEUNGGULAN */}
        <div className="space-y-4 z-10 my-6">
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <div className="p-2 rounded-xl bg-blue-500/20 text-cyan-300 flex-shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">Deteksi Dini Berbasis Data Riil</h3>
              <p className="text-[11px] text-blue-200 mt-0.5 leading-normal">
                Mengintegrasikan presensi harian, grafik nilai akademik, catatan disiplin, dan faktor latar belakang keluarga.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300 flex-shrink-0 mt-0.5">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">Rekomendasi Tindak Lanjut Terarah</h3>
              <p className="text-[11px] text-blue-200 mt-0.5 leading-normal">
                Memberikan panduan tindakan konkrit untuk Guru BK: kunjungan rumah (home visit), beasiswa PIP/KIP, maupun bimbingan belajar.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 flex-shrink-0 mt-0.5">
              <Users2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">Kolaborasi Terpadu Multi-Peran</h3>
              <p className="text-[11px] text-blue-200 mt-0.5 leading-normal">
                Sinergi efektif antara Administrator, Guru Bimbingan Konseling, Kepala Sekolah, serta portal ramah siswa.
              </p>
            </div>
          </div>
        </div>

        {/* Footer kiri */}
        <div className="text-[11px] text-blue-200/80 pt-4 border-t border-white/10 flex justify-between z-10">
          <span>Banjarnegara, Jawa Tengah</span>
          <span>TA 2026/2027</span>
        </div>
      </div>

      {/* PANEL KANAN (PILIH PERAN) */}
      <div className="lg:w-7/12 p-6 sm:p-10 lg:p-14 flex flex-col justify-between">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold tracking-wider uppercase text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                Autentikasi Pengguna
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                Selamat Datang di SIPRESI
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Silakan pilih peran Anda untuk melanjutkan ke portal sistem.
              </p>
            </div>

            <button
              onClick={() => setShowDemoAccounts(!showDemoAccounts)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-xs transition-colors self-start sm:self-auto"
            >
              <Info className="w-3.5 h-3.5 text-blue-600" />
              <span>{showDemoAccounts ? 'Sembunyikan Akun Demo' : 'Lihat Akun Demo'}</span>
            </button>
          </div>

          {/* AKUN DEMO ACCORDION */}
          {showDemoAccounts && (
            <div className="mb-6 p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-slate-700 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 font-bold text-blue-900 mb-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Akun Pengujian Demo (Langsung Siap Digunakan):</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
                <div className="p-2 bg-white rounded-lg border border-blue-100">
                  <span className="font-semibold text-blue-800">Admin:</span> username: <b>admin</b> | pass: <b>admin123</b>
                </div>
                <div className="p-2 bg-white rounded-lg border border-blue-100">
                  <span className="font-semibold text-teal-800">Guru BK:</span> NIP: <b>198506122010011005</b> | pass: <b>gurubk123</b>
                </div>
                <div className="p-2 bg-white rounded-lg border border-blue-100">
                  <span className="font-semibold text-purple-800">Kepsek:</span> NIP: <b>197204151998021002</b> | pass: <b>kepsek123</b>
                </div>
                <div className="p-2 bg-white rounded-lg border border-blue-100">
                  <span className="font-semibold text-emerald-800">Siswa:</span> NISN: <b>0091234567</b> | pass: <b>siswa123</b>
                </div>
              </div>
            </div>
          )}

          {/* GRID 2x2 KARTU PERAN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {roles.map((r) => (
              <div
                key={r.id}
                onClick={() => handleSelect(r.id)}
                className={`bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between group ${r.borderColor} hover:-translate-y-0.5`}
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-2xl ${r.avatarBg} font-black text-lg flex items-center justify-center shadow-md`}>
                      {r.initial}
                    </div>
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${r.badgeBg}`}>
                      Login: {r.loginType}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {r.title}
                  </h3>

                  <p className="mt-2 text-xs text-slate-500 leading-relaxed min-h-[44px]">
                    {r.description}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 group-hover:text-slate-600">
                    Masuk sebagai {r.title.split(' ')[0]}
                  </span>
                  <div className={`w-8 h-8 rounded-xl ${r.btnBg} text-white flex items-center justify-center shadow-xs transition-transform group-hover:translate-x-1`}>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-10 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>Lupa akses atau belum memiliki akun? Hubungi Admin sekolah.</span>
          <a
            href="/setup-awal"
            className="text-slate-400 hover:text-blue-600 hover:underline transition-colors text-[11px]"
          >
            Setup Awal Admin
          </a>
        </div>
      </div>
    </div>
  );
};
