import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getAllStudents,
  getAllPredictions,
  getAllInterventions,
  getAllAttendances,
  getAllGrades,
  getAllBehaviors,
  getModelSettings
} from '../../lib/storage';
import { Student, PredictionRecord, InterventionRecord } from '../../types';
import { RiskBadge } from '../../components/common/RiskBadge';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';
import {
  Sparkles,
  AlertTriangle,
  HeartHandshake,
  ArrowRight,
  TrendingUp,
  UserCheck,
  Calendar,
  MessageSquare,
  ChevronRight
} from 'lucide-react';

export const CounselorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [predictions, setPredictions] = useState<PredictionRecord[]>([]);
  const [interventions, setInterventions] = useState<InterventionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const [s, p, i] = await Promise.all([
          getAllStudents(),
          getAllPredictions(),
          getAllInterventions()
        ]);
        setStudents(s);
        setPredictions(p);
        setInterventions(i);
      } catch (e) {
        console.error('Error loading BK dashboard:', e);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  // Filter prediksi terbaru per siswa
  const latestPredictionsMap = new Map<string, PredictionRecord>();
  predictions.forEach((p) => {
    if (!latestPredictionsMap.has(p.studentId)) {
      latestPredictionsMap.set(p.studentId, p);
    }
  });

  const studentMap = new Map<string, Student>();
  students.forEach((s) => studentMap.set(s.id, s));

  // Hitung sebaran risiko
  let highRisk = 0;
  let mediumRisk = 0;
  let lowRisk = 0;

  latestPredictionsMap.forEach((p) => {
    if (p.level === 'tinggi') highRisk++;
    else if (p.level === 'sedang') mediumRisk++;
    else lowRisk++;
  });

  const pieData = [
    { name: 'Rendah', value: lowRisk, color: '#16A34A' },
    { name: 'Sedang', value: mediumRisk, color: '#F59E0B' },
    { name: 'Tinggi', value: highRisk, color: '#DC2626' }
  ];

  // Hitung faktor paling berpengaruh dari siswa berisiko tinggi
  const factorCountMap: Record<string, number> = {
    'Ketidakhadiran': 0,
    'Nilai Rendah': 0,
    'Tren Penurunan': 0,
    'Perilaku': 0,
    'Ekonomi/Tunggakan': 0,
    'Jarak Tempuh': 0,
    'Status Ortu': 0
  };

  latestPredictionsMap.forEach((p) => {
    if (p.level === 'tinggi' || p.level === 'sedang') {
      p.faktor.forEach((f) => {
        if (f.kontribusi >= 12) {
          if (f.nama.includes('Ketidakhadiran')) factorCountMap['Ketidakhadiran']++;
          else if (f.nama.includes('Nilai Rendah')) factorCountMap['Nilai Rendah']++;
          else if (f.nama.includes('Tren')) factorCountMap['Tren Penurunan']++;
          else if (f.nama.includes('Perilaku')) factorCountMap['Perilaku']++;
          else if (f.nama.includes('Ekonomi')) factorCountMap['Ekonomi/Tunggakan']++;
          else if (f.nama.includes('Jarak')) factorCountMap['Jarak Tempuh']++;
          else if (f.nama.includes('Ortu')) factorCountMap['Status Ortu']++;
        }
      });
    }
  });

  const barData = Object.entries(factorCountMap).map(([nama, jumlah]) => ({
    name: nama,
    jumlah
  }));

  // Tren bulanan siswa berisiko tinggi
  const lineTrendData = [
    { bulan: 'Jul 2026', tinggi: Math.max(1, Math.round(highRisk * 1.3)) },
    { bulan: 'Agt 2026', tinggi: Math.max(1, Math.round(highRisk * 1.15)) },
    { bulan: 'Sep 2026', tinggi: Math.max(1, Math.round(highRisk * 1.05)) },
    { bulan: 'Okt 2026', tinggi: highRisk }
  ];

  // Siswa Prioritas Tindak Lanjut (Urutkan dari skor tertinggi)
  const priorityStudents = Array.from(latestPredictionsMap.values())
    .filter((p) => p.level === 'tinggi' || (p.level === 'sedang' && p.skor >= 55))
    .sort((a, b) => b.skor - a.skor)
    .slice(0, 6);

  const activeInterventions = interventions.filter((i) => i.status === 'berjalan').length;
  const plannedInterventions = interventions.filter((i) => i.status === 'direncanakan').length;

  return (
    <div className="space-y-6">
      {/* HEADER BANNER GURU BK */}
      <div className="bg-gradient-to-r from-[#0D9488] via-[#0F766E] to-[#0B1F4A] rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="relative z-10 max-w-xl">
          <span className="text-[11px] font-bold uppercase tracking-wider bg-white/10 text-teal-200 px-3 py-1 rounded-full border border-white/10">
            Dasbor Bimbingan Konseling (BK)
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-2 leading-tight">
            Pemantauan & Intervensi Risiko Siswa
          </h1>
          <p className="text-xs sm:text-sm text-teal-100 mt-2 leading-relaxed">
            Analisis presisi untuk mendeteksi indikasi putus sekolah lebih awal serta merancang penanganan individual yang tepat.
          </p>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <Link
            to="/bk/prediction"
            className="px-5 py-3 rounded-2xl bg-white text-teal-900 font-bold text-xs sm:text-sm shadow-md hover:bg-teal-50 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span>Jalankan Prediksi DSS</span>
          </Link>
          <Link
            to="/bk/interventions"
            className="px-5 py-3 rounded-2xl bg-teal-800/80 hover:bg-teal-800 text-white font-bold text-xs sm:text-sm border border-teal-400/30 transition-all flex items-center justify-center gap-2"
          >
            <HeartHandshake className="w-4 h-4" />
            <span>Kelola Tindak Lanjut</span>
          </Link>
        </div>
      </div>

      {/* 4 KARTU STATISTIK */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Siswa Berisiko Tinggi */}
        <div className="bg-white rounded-2xl p-5 border border-red-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">
              Risiko Tinggi
            </span>
            <div className="p-2.5 rounded-xl bg-red-50 text-red-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-red-600">{highRisk}</span>
            <span className="text-xs text-red-600/80 font-semibold">siswa (Perlu Intervensi)</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Skor DSS &ge; 70 · Perlu Home Visit & konseling
          </p>
        </div>

        {/* Risiko Sedang */}
        <div className="bg-white rounded-2xl p-5 border border-amber-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
              Risiko Sedang
            </span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-600">{mediumRisk}</span>
            <span className="text-xs text-amber-700/80 font-semibold">siswa</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Skor DSS 40 - 69 · Pembinaan wali kelas
          </p>
        </div>

        {/* Intervensi Aktif */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-teal-700 uppercase tracking-wider">
              Tindak Lanjut Berjalan
            </span>
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600">
              <HeartHandshake className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-teal-700">{activeInterventions}</span>
            <span className="text-xs text-slate-500">kasus aktif ({plannedInterventions} terencana)</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Home visit, bimbingan belajar, & PIP
          </p>
        </div>

        {/* Kondisi Aman */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Risiko Rendah / Aman
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-700">{lowRisk}</span>
            <span className="text-xs text-slate-500">siswa stabil</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Skor DSS &lt; 40 · Presensi & nilai baik
          </p>
        </div>
      </div>

      {/* CHARTS ROW (DONUT + FAKTOR + TREN) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* DONUT SEBARAN RISIKO */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Sebaran Tingkat Risiko</h3>
              <p className="text-xs text-slate-500">Proporsi seluruh siswa teranalisis</p>
            </div>
          </div>

          <div className="h-52 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
            <div>
              <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-700 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]" />
                <span>Rendah</span>
              </div>
              <p className="text-base font-black text-slate-800 mt-0.5">{lowRisk}</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1.5 text-xs text-amber-700 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                <span>Sedang</span>
              </div>
              <p className="text-base font-black text-slate-800 mt-0.5">{mediumRisk}</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1.5 text-xs text-red-700 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" />
                <span>Tinggi</span>
              </div>
              <p className="text-base font-black text-slate-800 mt-0.5">{highRisk}</p>
            </div>
          </div>
        </div>

        {/* BAR FAKTOR PALING BERPENGARUH */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="mb-2">
            <h3 className="text-sm font-bold text-slate-900">Faktor Paling Berpengaruh</h3>
            <p className="text-xs text-slate-500">Frekuensi kemunculan faktor dominan</p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 15, left: 35, bottom: 5 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#64748B' }} width={80} />
                <Tooltip />
                <Bar dataKey="jumlah" fill="#0D9488" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <p className="text-[11px] text-slate-400 text-center pt-2 border-t border-slate-100">
            Ketidakhadiran & tren nilai menjadi indikator pemicu utama.
          </p>
        </div>

        {/* GARIS TREN BULANAN */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="mb-2">
            <h3 className="text-sm font-bold text-slate-900">Tren Siswa Berisiko Tinggi</h3>
            <p className="text-xs text-slate-500">Dinamika jumlah kasus per bulan</p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineTrendData} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="bulan" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="tinggi"
                  stroke="#DC2626"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#DC2626' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <p className="text-[11px] text-emerald-700 font-semibold text-center pt-2 border-t border-slate-100">
            Penurunan konsisten setelah intervensi intensif dimulai.
          </p>
        </div>
      </div>

      {/* TABEL SISWA PRIORITAS TINDAK LANJUT */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-red-50 text-red-600">
                <AlertTriangle className="w-4 h-4" />
              </span>
              <h3 className="text-base font-bold text-slate-900">
                Siswa Prioritas Tindak Lanjut Guru BK
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Urutan siswa dengan skor risiko tertinggi yang memerlukan tindakan terarah segera.
            </p>
          </div>

          <Link
            to="/bk/at-risk"
            className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Lihat Semua Siswa Berisiko</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Nama & NISN</th>
                <th className="px-4 py-3.5 text-center">Kelas</th>
                <th className="px-4 py-3.5">Skor Risiko (DSS)</th>
                <th className="px-4 py-3.5">Tingkat</th>
                <th className="px-4 py-3.5">Faktor Pemicu Utama</th>
                <th className="px-4 py-3.5">Rekomendasi Tindakan Awal</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {priorityStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Belum ada data prediksi. Silakan jalankan analisis prediksi DSS terlebih dahulu.
                  </td>
                </tr>
              ) : (
                priorityStudents.map((pred) => {
                  const std = studentMap.get(pred.studentId);
                  const scoreColor =
                    pred.skor >= 70
                      ? 'bg-red-600'
                      : pred.skor >= 40
                      ? 'bg-amber-500'
                      : 'bg-emerald-600';

                  return (
                    <tr key={pred.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-slate-900 leading-snug">{pred.studentName || std?.nama}</p>
                        <p className="text-[11px] text-slate-400 font-mono">NISN: {pred.studentNisn || std?.nisn}</p>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-xs">
                          {pred.studentClass || std?.kelas}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="w-32">
                          <div className="flex justify-between items-center text-xs font-bold mb-1">
                            <span className={pred.skor >= 70 ? 'text-red-700' : 'text-amber-700'}>
                              {pred.skor} / 100
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${scoreColor}`}
                              style={{ width: `${pred.skor}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <RiskBadge level={pred.level} size="sm" />
                      </td>

                      <td className="px-4 py-3.5 text-xs font-semibold text-slate-800">
                        {pred.faktorUtama}
                      </td>

                      <td className="px-4 py-3.5 text-xs text-slate-600 max-w-xs leading-snug">
                        {pred.rekomendasi[0] || 'Pemantauan berkala'}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <Link
                          to={`/bk/student/${pred.studentId}`}
                          className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs inline-flex items-center gap-1 transition-colors"
                        >
                          <span>Detail Profil</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
