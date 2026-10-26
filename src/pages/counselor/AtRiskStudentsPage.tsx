import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  getAllStudents,
  getAllPredictions
} from '../../lib/storage';
import { Student, PredictionRecord } from '../../types';
import { RiskBadge } from '../../components/common/RiskBadge';
import {
  AlertTriangle,
  Search,
  Filter,
  ArrowUpDown,
  ChevronRight,
  HeartHandshake
} from 'lucide-react';

export const AtRiskStudentsPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [predictions, setPredictions] = useState<PredictionRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<'all' | 'tinggi' | 'sedang'>('all');
  const [classFilter, setClassFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'score_desc' | 'score_asc'>('score_desc');
  const [isLoading, setIsLoading] = useState(true);

  const classList = ['7A', '7B', '7C', '8A', '8B', '8C', '9A', '9B', '9C'];

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const [s, p] = await Promise.all([getAllStudents(), getAllPredictions()]);
        setStudents(s);
        setPredictions(p);
      } catch (e) {
        console.error('Error loading at-risk students:', e);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const studentMap = new Map<string, Student>();
  students.forEach((s) => studentMap.set(s.id, s));

  // Ambil prediksi terbaru per siswa
  const latestPredMap = new Map<string, PredictionRecord>();
  predictions.forEach((p) => {
    if (!latestPredMap.has(p.studentId)) {
      latestPredMap.set(p.studentId, p);
    }
  });

  // Filter hanya siswa yang berisiko (Tinggi atau Sedang)
  const atRiskList = Array.from(latestPredMap.values())
    .filter((p) => p.level === 'tinggi' || p.level === 'sedang')
    .filter((p) => {
      const std = studentMap.get(p.studentId);
      const name = p.studentName || std?.nama || '';
      const nisn = p.studentNisn || std?.nisn || '';
      const cls = p.studentClass || std?.kelas || '';

      const matchSearch =
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nisn.includes(searchTerm);
      const matchLevel = levelFilter === 'all' || p.level === levelFilter;
      const matchClass = classFilter === 'all' || cls === classFilter;

      return matchSearch && matchLevel && matchClass;
    })
    .sort((a, b) => {
      if (sortBy === 'score_desc') return b.skor - a.skor;
      return a.skor - b.skor;
    });

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Daftar Siswa Berisiko Putus Sekolah</h1>
        <p className="text-xs text-slate-500 mt-1">
          Daftar siswa kategori Risiko Tinggi dan Sedang yang membutuhkan pendampingan, konseling, serta rencana intervensi.
        </p>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama, NISN, atau kelas siswa berisiko..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Tingkat:</span>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value as any)}
              className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden"
            >
              <option value="all">Semua Berisiko</option>
              <option value="tinggi">Hanya Risiko Tinggi</option>
              <option value="sedang">Hanya Risiko Sedang</option>
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

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Urutkan:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden"
            >
              <option value="score_desc">Skor Tertinggi</option>
              <option value="score_asc">Skor Terendah</option>
            </select>
          </div>
        </div>
      </div>

      {/* TABEL SISWA BERISIKO */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Nama & NISN Siswa</th>
                <th className="px-4 py-3.5 text-center">Kelas</th>
                <th className="px-4 py-3.5">Skor DSS (0-100)</th>
                <th className="px-4 py-3.5">Tingkat Risiko</th>
                <th className="px-4 py-3.5">Faktor Pemicu Utama</th>
                <th className="px-4 py-3.5">Rekomendasi Tindak Lanjut</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Memuat daftar siswa berisiko...
                  </td>
                </tr>
              ) : atRiskList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Tidak ada siswa berisiko yang memenuhi filter saat ini.
                  </td>
                </tr>
              ) : (
                atRiskList.map((p) => {
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
                          <span className="font-black text-xs text-slate-900 font-mono">{p.skor}</span>
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
                        {p.rekomendasi[0]}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <Link
                          to={`/bk/student/${p.studentId}`}
                          className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs inline-flex items-center gap-1 transition-colors"
                        >
                          <span>Buka Kasus</span>
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
