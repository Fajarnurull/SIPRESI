import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  getAllStudents,
  getAllAttendances,
  getAllGrades,
  getAllBehaviors,
  getModelSettings,
  savePrediction,
  getAllPredictions
} from '../../lib/storage';
import { runStudentPrediction } from '../../lib/prediction';
import { Student, PredictionRecord, RiskLevel } from '../../types';
import { RiskBadge } from '../../components/common/RiskBadge';
import { useAuth } from '../../context/AuthContext';
import {
  Sparkles,
  Play,
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  TrendingDown,
  RefreshCw
} from 'lucide-react';

export const RunPredictionPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [predictions, setPredictions] = useState<PredictionRecord[]>([]);
  const [targetScope, setTargetScope] = useState<'all' | string>('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const classList = ['7A', '7B', '7C', '8A', '8B', '8C', '9A', '9B', '9C'];

  const loadData = async () => {
    const [s, p] = await Promise.all([getAllStudents(), getAllPredictions()]);
    setStudents(s);
    setPredictions(p);
  };

  useEffect(() => {
    loadData();
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

  const displayList = Array.from(latestPredictionsMap.values()).filter((p) => {
    const std = studentMap.get(p.studentId);
    const sName = p.studentName || std?.nama || '';
    const sNisn = p.studentNisn || std?.nisn || '';
    const sClass = p.studentClass || std?.kelas || '';

    const matchSearch =
      sName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sNisn.includes(searchTerm);
    const matchLevel = levelFilter === 'all' || p.level === levelFilter;
    const matchClass = classFilter === 'all' || sClass === classFilter;

    return matchSearch && matchLevel && matchClass;
  });

  // Eksekusi prediksi batch dengan progress bar
  const handleExecuteBatchPrediction = async () => {
    setIsProcessing(true);
    setProgress(0);
    setFeedbackMsg(null);

    const [allStudents, allAtts, allGrades, allBehs, settings] = await Promise.all([
      getAllStudents(),
      getAllAttendances(),
      getAllGrades(),
      getAllBehaviors(),
      getModelSettings()
    ]);

    const targetStudents = allStudents.filter((s) => {
      if (!s.aktif) return false;
      if (targetScope === 'all') return true;
      return s.kelas === targetScope;
    });

    if (targetStudents.length === 0) {
      alert('Tidak ada siswa aktif yang ditemukan pada target yang dipilih.');
      setIsProcessing(false);
      return;
    }

    const total = targetStudents.length;
    let completed = 0;

    for (const std of targetStudents) {
      const stdAtts = allAtts.filter((a) => a.studentId === std.id);
      const stdGrade = allGrades.find((g) => g.studentId === std.id);
      const stdBehs = allBehs.filter((b) => b.studentId === std.id);

      const pred = runStudentPrediction(
        std,
        stdAtts,
        stdGrade,
        stdBehs,
        settings,
        currentUser?.nama || 'Guru BK'
      );

      await savePrediction(pred);

      completed++;
      setProcessedCount(completed);
      setProgress(Math.round((completed / total) * 100));

      // Beri jeda kecil agar animasi progress bar terlihat smooth
      if (total <= 60) {
        await new Promise((r) => setTimeout(r, 20));
      }
    }

    setIsProcessing(false);
    setFeedbackMsg(
      `Analisis prediksi DSS berhasil diselesaikan untuk ${total} siswa ${
        targetScope === 'all' ? 'semua kelas' : `kelas ${targetScope}`
      }!`
    );
    await loadData();
  };

  return (
    <div className="space-y-6">
      {/* HEADER & CONTROLLER BANNER */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-xl">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              Mesin Analitik DSS
            </span>
            <h1 className="text-2xl font-bold text-slate-900 mt-2">
              Jalankan Prediksi Risiko Putus Sekolah
            </h1>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Kalkulasi otomatis mengintegrasikan seluruh faktor (bobot presensi 35%, nilai rendah 20%, tren nilai 15%, disiplin 10%, ekonomi 10%, jarak 5%, dan status keluarga 5%).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Target Siswa:</span>
              <select
                value={targetScope}
                onChange={(e) => setTargetScope(e.target.value)}
                disabled={isProcessing}
                className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-teal-500"
              >
                <option value="all">Semua Siswa Aktif ({students.length})</option>
                {classList.map((c) => (
                  <option key={c} value={c}>
                    Hanya Kelas {c}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleExecuteBatchPrediction}
              disabled={isProcessing}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isProcessing ? 'Memproses DSS...' : 'Jalankan Prediksi Sekarang'}</span>
            </button>
          </div>
        </div>

        {/* PROGRESS BAR PROSES PREDIKSI */}
        {isProcessing && (
          <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 animate-in fade-in">
            <div className="flex justify-between items-center text-xs text-teal-900 font-bold mb-2">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600 animate-ping" />
                Menganalisis multi-faktor siswa... ({processedCount} siswa)
              </span>
              <span className="font-mono">{progress}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-teal-200/50 overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-teal-600 transition-all duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* NOTIFIKASI BERHASIL */}
        {feedbackMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span className="font-medium">{feedbackMsg}</span>
            </div>
            <button onClick={() => setFeedbackMsg(null)} className="font-bold text-slate-500">
              &times;
            </button>
          </div>
        )}
      </div>

      {/* FILTER & HASIL PREDIKSI */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama atau NISN pada hasil prediksi..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Tingkat:</span>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden"
            >
              <option value="all">Semua Level</option>
              <option value="tinggi">Risiko Tinggi</option>
              <option value="sedang">Risiko Sedang</option>
              <option value="rendah">Risiko Rendah</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Kelas:</span>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden"
            >
              <option value="all">Semua Kelas</option>
              {classList.map((c) => (
                <option key={c} value={c}>
                  Kelas {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* TABEL HASIL PREDIKSI LENGKAP */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Nama & NISN Siswa</th>
                <th className="px-4 py-3.5 text-center">Kelas</th>
                <th className="px-4 py-3.5">Skor Risiko (DSS)</th>
                <th className="px-4 py-3.5">Level Risiko</th>
                <th className="px-4 py-3.5">Faktor Paling Berpengaruh</th>
                <th className="px-4 py-3.5">Rekomendasi Utama</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {displayList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Tidak ada hasil prediksi yang sesuai filter pencarian.
                  </td>
                </tr>
              ) : (
                displayList.map((p) => {
                  const std = studentMap.get(p.studentId);
                  const barColor =
                    p.skor >= 70 ? 'bg-red-600' : p.skor >= 40 ? 'bg-amber-500' : 'bg-emerald-600';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-slate-900 leading-snug">{p.studentName || std?.nama}</p>
                        <p className="text-[11px] text-slate-400 font-mono">NISN: {p.studentNisn || std?.nisn}</p>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-xs">
                          {p.studentClass || std?.kelas}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="w-28">
                          <span className="font-bold text-xs text-slate-900 font-mono">{p.skor} / 100</span>
                          <div className="w-full h-1.5 rounded-full bg-slate-100 mt-1 overflow-hidden">
                            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${p.skor}%` }} />
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <RiskBadge level={p.level} size="sm" />
                      </td>

                      <td className="px-4 py-3.5 text-xs font-semibold text-slate-800">
                        {p.faktorUtama}
                      </td>

                      <td className="px-4 py-3.5 text-xs text-slate-600 max-w-xs leading-snug">
                        {p.rekomendasi[0] || 'Pemantauan rutin'}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <Link
                          to={`/bk/student/${p.studentId}`}
                          className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs inline-flex items-center gap-1 transition-colors"
                        >
                          <span>Rincian</span>
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
