import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  getAllStudents,
  getAllPredictions,
  getAllAttendances,
  getAllGrades,
  seedSampleData
} from '../../lib/storage';
import { Student, PredictionRecord } from '../../types';
import { RiskBadge } from '../../components/common/RiskBadge';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import {
  Users,
  GraduationCap,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  CalendarCheck,
  Award,
  Sparkles,
  Database,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { isFirebaseConfigured } from '../../firebase';

export const AdminDashboard: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [predictions, setPredictions] = useState<PredictionRecord[]>([]);
  const [attendanceCount, setAttendanceCount] = useState<number>(0);
  const [gradesCount, setGradesCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showSeedModal, setShowSeedModal] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedSuccessMsg, setSeedSuccessMsg] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [stdList, predList, attList, grdList] = await Promise.all([
        getAllStudents(),
        getAllPredictions(),
        getAllAttendances(),
        getAllGrades()
      ]);
      setStudents(stdList);
      setPredictions(predList);
      setAttendanceCount(attList.length);
      setGradesCount(grdList.length);
    } catch (err) {
      console.error('Error loading admin dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.aktif).length;

  // Hitung jumlah risiko berdasarkan prediksi terbaru per siswa
  const latestPredMap = new Map<string, PredictionRecord>();
  predictions.forEach(p => {
    if (!latestPredMap.has(p.studentId)) {
      latestPredMap.set(p.studentId, p);
    }
  });

  let highRiskCount = 0;
  let mediumRiskCount = 0;
  let lowRiskCount = 0;

  latestPredMap.forEach(p => {
    if (p.level === 'tinggi') highRiskCount++;
    else if (p.level === 'sedang') mediumRiskCount++;
    else lowRiskCount++;
  });

  // Kelengkapan data bulan ini (Oktober 2026)
  const currentMonth = '2026-10';
  const completenessPercent = totalStudents > 0
    ? Math.min(100, Math.round((attendanceCount / (totalStudents * 3)) * 100))
    : 0;

  const handleConfirmSeed = async () => {
    setIsSeeding(true);
    try {
      const res = await seedSampleData(true);
      setSeedSuccessMsg(`Berhasil memuat ${res.count} siswa fiktif lengkap beserta data presensi, nilai, dan perilakunya.`);
      setShowSeedModal(false);
      await loadData();
    } catch (e) {
      console.error('Seed error:', e);
      alert('Gagal memuat data contoh.');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* NOTIFIKASI SUKSES SEED */}
      {seedSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between text-xs sm:text-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{seedSuccessMsg}</span>
          </div>
          <button
            onClick={() => setSeedSuccessMsg(null)}
            className="text-emerald-700 font-bold hover:underline"
          >
            Tutup
          </button>
        </div>
      )}

      {/* HEADER BANNER & TOMBOL MUAT DATA CONTOH */}
      <div className="bg-gradient-to-r from-[#0B1F4A] to-[#1D4ED8] rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="relative z-10 max-w-xl">
          <span className="text-[11px] font-bold uppercase tracking-wider bg-white/10 text-cyan-200 px-3 py-1 rounded-full border border-white/10">
            Panel Administrator
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-2 leading-tight">
            Pusat Kendali Data & Model SIPRESI
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 mt-2 leading-relaxed">
            Kelola master data siswa SMP Negeri 2 Wanadadi, otorisasi pengguna multi-peran, serta kalibrasi model analitik prediksi risiko putus sekolah.
          </p>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => setShowSeedModal(true)}
            className="px-4 py-3 rounded-2xl bg-white text-[#0B1F4A] font-bold text-xs sm:text-sm shadow-md hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Muat Data Contoh (60 Siswa)</span>
          </button>

          <button
            onClick={loadData}
            title="Muat ulang data"
            className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center justify-center"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4 KARTU STATISTIK UTAMA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Siswa */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Siswa Terdaftar
            </span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{totalStudents}</span>
            <span className="text-xs text-slate-500 font-medium">({activeStudents} aktif)</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Tersebar di kelas VII, VIII, dan IX
          </p>
        </div>

        {/* Risiko Tinggi */}
        <div className="bg-white rounded-2xl p-5 border border-red-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">
              Risiko Tinggi (Perlu Tindak Lanjut)
            </span>
            <div className="p-2.5 rounded-xl bg-red-50 text-red-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-red-600">{highRiskCount}</span>
            <span className="text-xs text-red-600/80 font-medium">siswa</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Skor DSS &ge; 70 (Prioritas Guru BK)
          </p>
        </div>

        {/* Risiko Sedang & Rendah */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Risiko Sedang & Rendah
            </span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <div>
              <span className="text-2xl font-black text-amber-600">{mediumRiskCount}</span>
              <span className="text-[10px] text-slate-500 ml-1">Sedang</span>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <span className="text-2xl font-black text-emerald-600">{lowRiskCount}</span>
              <span className="text-[10px] text-slate-500 ml-1">Rendah</span>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Terpantau stabil dalam pengawasan wali kelas
          </p>
        </div>

        {/* Kelengkapan Data */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Kelengkapan Data {currentMonth}
            </span>
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-teal-700">{completenessPercent}%</span>
            <span className="text-xs text-slate-500 font-medium">terisi</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-100 mt-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-teal-500"
              style={{ width: `${completenessPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* QUICK SHORTCUTS GRID */}
      <div>
        <h3 className="text-base font-bold text-slate-900 mb-3">Akses Cepat Pengelolaan</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            to="/admin/users"
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Users className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  Kelola Pengguna
                </h4>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  Tambah/ubah/nonaktifkan akun Admin, BK, Kepsek, Siswa
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>

          <Link
            to="/admin/students"
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  Data Siswa
                </h4>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  CRUD data siswa, filter kelas, dan impor CSV
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>

          <Link
            to="/admin/attendance"
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  Rekap Kehadiran
                </h4>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  Input presensi bulanan (Hadir, Sakit, Izin, Alpa)
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>

          <Link
            to="/admin/grades-behaviors"
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <Award className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  Nilai & Perilaku
                </h4>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  Rata-rata semester, mapel, & poin disiplin
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>

          <Link
            to="/admin/model-settings"
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <Sliders className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  Pengaturan Model DSS
                </h4>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  Atur bobot 7 faktor (total 100%) & batas risiko
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>

          <Link
            to="/reports"
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Database className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  Laporan & Ekspor
                </h4>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  Unduh Laporan Resmi format PDF dan CSV aman
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        </div>
      </div>

      {/* MODAL KONFIRMASI MUAT DATA CONTOH */}
      <ConfirmModal
        isOpen={showSeedModal}
        title="Muat Data Contoh (~60 Siswa Fiktif)?"
        message="Aksi ini akan mengisi sistem dengan ±60 siswa fiktif kelas VII–IX (SMP Negeri 2 Wanadadi) beserta data presensi 3 bulan, nilai semester, catatan pelanggaran, dan perhitungan prediksi risiko. Seluruh data fiktif ditandai jelas agar sistem siap langsung diuji."
        confirmLabel="Ya, Muat Data Contoh"
        cancelLabel="Batal"
        isLoading={isSeeding}
        onConfirm={handleConfirmSeed}
        onClose={() => setShowSeedModal(false)}
      />
    </div>
  );
};
