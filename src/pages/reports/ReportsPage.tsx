import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getAllStudents,
  getAllPredictions,
  getAllInterventions
} from '../../lib/storage';
import { Student, PredictionRecord, InterventionRecord } from '../../types';
import { generatePdfReport } from '../../lib/pdf';
import { generateCsvContent, downloadCsvFile } from '../../lib/csv';
import { RiskBadge } from '../../components/common/RiskBadge';
import {
  FileText,
  Download,
  Filter,
  FileSpreadsheet,
  Building,
  GraduationCap,
  HeartHandshake,
  CheckCircle2
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [reportType, setReportType] = useState<'ringkasan_sekolah' | 'siswa_berisiko' | 'rekap_intervensi'>('ringkasan_sekolah');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('Tahun Ajaran 2026/2027 Ganjil');

  const [students, setStudents] = useState<Student[]>([]);
  const [predictions, setPredictions] = useState<PredictionRecord[]>([]);
  const [interventions, setInterventions] = useState<InterventionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const classList = ['7A', '7B', '7C', '8A', '8B', '8C', '9A', '9B', '9C'];

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
        console.error('Error loading reports data:', e);
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

  // Filter Data Siswa Berisiko
  const atRiskFiltered = Array.from(latestPredMap.values()).filter((p) => {
    const std = studentMap.get(p.studentId);
    const cls = p.studentClass || std?.kelas;
    const matchClass = selectedClass === 'all' || cls === selectedClass;
    return matchClass && (p.level === 'tinggi' || p.level === 'sedang');
  });

  // Filter Data Intervensi
  const interventionsFiltered = interventions.filter((it) => {
    const std = studentMap.get(it.studentId);
    const cls = it.studentClass || std?.kelas;
    return selectedClass === 'all' || cls === selectedClass;
  });

  // EKSPOR PDF
  const handleExportPdf = () => {
    const printerName = currentUser?.nama || 'Administrator';
    const roleName =
      currentUser?.role === 'admin'
        ? 'Administrator Sekolah'
        : currentUser?.role === 'guru_bk'
        ? 'Guru Bimbingan Konseling'
        : 'Kepala Sekolah';

    if (reportType === 'ringkasan_sekolah') {
      const summaryHeaders = ['No', 'Kelas', 'Total Siswa', 'Risiko Tinggi', 'Risiko Sedang', 'Risiko Rendah', 'Status Retensi'];
      const summaryRows: (string | number)[][] = classList.map((cls, idx) => {
        let t = 0;
        let s = 0;
        let r = 0;
        let total = 0;

        latestPredMap.forEach((p) => {
          if (p.studentClass === cls) {
            total++;
            if (p.level === 'tinggi') t++;
            else if (p.level === 'sedang') s++;
            else r++;
          }
        });

        const statusStr = t === 0 ? 'Sangat Baik' : t <= 2 ? 'Terkendali' : 'Perhatian Khusus';

        return [idx + 1, `Kelas ${cls}`, total, t, s, r, statusStr];
      });

      generatePdfReport({
        title: 'Laporan Ringkasan Eksekutif Risiko Putus Sekolah',
        subtitle: `SMP Negeri 2 Wanadadi · Filter: ${selectedClass === 'all' ? 'Semua Kelas' : `Kelas ${selectedClass}`}`,
        period: selectedPeriod,
        printedBy: printerName,
        role: roleName,
        headers: summaryHeaders,
        data: summaryRows,
        summaryText: `Total Siswa Dianalisis: ${students.length} orang · Total Risiko Tinggi: ${
          Array.from(latestPredMap.values()).filter((p) => p.level === 'tinggi').length
        } orang.`
      });
    } else if (reportType === 'siswa_berisiko') {
      const atRiskHeaders = ['No', 'Nama Siswa', 'NISN', 'Kelas', 'Skor', 'Level', 'Faktor Pemicu Utama', 'Rekomendasi'];
      const atRiskRows: (string | number)[][] = atRiskFiltered.map((p, idx) => {
        const std = studentMap.get(p.studentId);
        return [
          idx + 1,
          p.studentName || std?.nama || '',
          p.studentNisn || std?.nisn || '',
          p.studentClass || std?.kelas || '',
          p.skor,
          p.level.toUpperCase(),
          p.faktorUtama || 'Presensi',
          p.rekomendasi[0] || 'Pemantauan'
        ];
      });

      generatePdfReport({
        title: 'Laporan Daftar Siswa Berisiko Putus Sekolah',
        subtitle: `Daftar Siswa Kategori Risiko Tinggi dan Sedang · Kelas: ${selectedClass === 'all' ? 'Semua Kelas' : selectedClass}`,
        period: selectedPeriod,
        printedBy: printerName,
        role: roleName,
        headers: atRiskHeaders,
        data: atRiskRows,
        summaryText: `Ditemukan ${atRiskFiltered.length} siswa memerlukan pemantauan dan intervensi konseling terarah.`
      });
    } else {
      const intHeaders = ['No', 'Nama Siswa', 'Kelas', 'Bentuk Tindak Lanjut', 'Status', 'Catatan Tindakan', 'Tanggal'];
      const intRows: (string | number)[][] = interventionsFiltered.map((it, idx) => {
        const std = studentMap.get(it.studentId);
        return [
          idx + 1,
          it.studentName || std?.nama || '',
          it.studentClass || std?.kelas || '',
          it.jenis,
          it.status.toUpperCase(),
          it.catatan.slice(0, 60) + '...',
          it.tanggal
        ];
      });

      generatePdfReport({
        title: 'Laporan Rekapitulasi Tindak Lanjut & Intervensi',
        subtitle: `SMP Negeri 2 Wanadadi · Pelaksanaan Program Konseling & Kunjungan Rumah`,
        period: selectedPeriod,
        printedBy: printerName,
        role: roleName,
        headers: intHeaders,
        data: intRows,
        summaryText: `Total Kasus Intervensi: ${interventionsFiltered.length} kegiatan tercatat.`
      });
    }

    setExportNotice('File Laporan format PDF berhasil diunduh ke komputer Anda.');
  };

  // EKSPOR CSV AMAN
  const handleExportCsv = () => {
    const cleanPeriod = selectedPeriod.replace(/[^a-zA-Z0-9]/g, '-');
    const classTag = selectedClass === 'all' ? 'semua-kelas' : `kelas-${selectedClass}`;

    if (reportType === 'ringkasan_sekolah') {
      const headers = ['No', 'Kelas', 'Total Siswa', 'Risiko Tinggi', 'Risiko Sedang', 'Risiko Rendah', 'Status Retensi'];
      const rows = classList.map((cls, idx) => {
        let t = 0;
        let s = 0;
        let r = 0;
        let total = 0;

        latestPredMap.forEach((p) => {
          if (p.studentClass === cls) {
            total++;
            if (p.level === 'tinggi') t++;
            else if (p.level === 'sedang') s++;
            else r++;
          }
        });

        const statusStr = t === 0 ? 'Sangat Baik' : t <= 2 ? 'Terkendali' : 'Perhatian Khusus';
        return [idx + 1, `Kelas ${cls}`, total, t, s, r, statusStr];
      });

      const csvContent = generateCsvContent(headers, rows);
      downloadCsvFile(`laporan-ringkasan-risiko-sekolah-${classTag}-${cleanPeriod}`, csvContent);
    } else if (reportType === 'siswa_berisiko') {
      const headers = [
        'Nama',
        'NISN',
        'Kelas',
        'Skor Risiko',
        'Level',
        'Faktor Utama',
        'Rekomendasi',
        'Tanggal Prediksi'
      ];

      const rows = atRiskFiltered.map((p) => {
        const std = studentMap.get(p.studentId);
        return [
          p.studentName || std?.nama || '',
          p.studentNisn || std?.nisn || '',
          p.studentClass || std?.kelas || '',
          p.skor,
          p.level,
          p.faktorUtama || '',
          p.rekomendasi.join('; '),
          p.tanggal.slice(0, 10)
        ];
      });

      const csvContent = generateCsvContent(headers, rows);
      downloadCsvFile(`laporan-siswa-berisiko-${classTag}-${new Date().toISOString().slice(0, 7)}`, csvContent);
    } else {
      const headers = [
        'Nama Siswa',
        'Kelas',
        'Jenis Tindak Lanjut',
        'Status',
        'Catatan Intervensi',
        'Hasil Perkembangan',
        'Tanggal',
        'Petugas Pelaksana'
      ];

      const rows = interventionsFiltered.map((it) => {
        const std = studentMap.get(it.studentId);
        return [
          it.studentName || std?.nama || '',
          it.studentClass || std?.kelas || '',
          it.jenis,
          it.status,
          it.catatan,
          it.hasil || '',
          it.tanggal,
          it.olehNama
        ];
      });

      const csvContent = generateCsvContent(headers, rows);
      downloadCsvFile(`laporan-rekap-tindak-lanjut-${classTag}-${new Date().toISOString().slice(0, 7)}`, csvContent);
    }

    setExportNotice('File Laporan format CSV (dengan proteksi UTF-8 & rumus Excel) berhasil diunduh.');
  };

  return (
    <div className="space-y-6">
      {/* HEADER & NOTIFICATION */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pusat Laporan & Ekspor Dokumen</h1>
        <p className="text-xs text-slate-500 mt-1">
          Unduh laporan resmi sekolah format PDF (berkop surat dinas) atau data tabular CSV kompatibel Excel.
        </p>
      </div>

      {exportNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{exportNotice}</span>
          </div>
          <button onClick={() => setExportNotice(null)} className="font-bold text-slate-500">
            &times;
          </button>
        </div>
      )}

      {/* FILTER & PILIHAN JENIS LAPORAN */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Pilih Jenis Laporan:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => setReportType('ringkasan_sekolah')}
              className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                reportType === 'ringkasan_sekolah'
                  ? 'bg-blue-50/80 border-blue-500 text-blue-900 ring-2 ring-blue-100 shadow-xs'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <div className="p-2 rounded-xl bg-blue-600 text-white flex-shrink-0">
                <Building className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold">Ringkasan Risiko Sekolah</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Rekapitulasi sebaran risiko per kelas untuk pimpinan
                </p>
              </div>
            </button>

            <button
              onClick={() => setReportType('siswa_berisiko')}
              className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                reportType === 'siswa_berisiko'
                  ? 'bg-teal-50/80 border-teal-500 text-teal-900 ring-2 ring-teal-100 shadow-xs'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <div className="p-2 rounded-xl bg-teal-600 text-white flex-shrink-0">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold">Daftar Siswa Berisiko</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tabel siswa kategori risiko tinggi & sedang per kelas
                </p>
              </div>
            </button>

            <button
              onClick={() => setReportType('rekap_intervensi')}
              className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                reportType === 'rekap_intervensi'
                  ? 'bg-purple-50/80 border-purple-500 text-purple-900 ring-2 ring-purple-100 shadow-xs'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <div className="p-2 rounded-xl bg-purple-600 text-white flex-shrink-0">
                <HeartHandshake className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold">Rekap Tindak Lanjut</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Log pelaksanaan home visit, konseling, dan bantuan
                </p>
              </div>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Filter Kelas:
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
            >
              <option value="all">Semua Kelas ({students.length} Siswa)</option>
              {classList.map((c) => (
                <option key={c} value={c}>
                  Kelas {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Periode Laporan:
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
            >
              <option value="Tahun Ajaran 2026/2027 Ganjil">Tahun Ajaran 2026/2027 Ganjil</option>
              <option value="Bulan Oktober 2026">Bulan Oktober 2026</option>
              <option value="Bulan September 2026">Bulan September 2026</option>
              <option value="Semester Genap 2025/2026">Semester Genap 2025/2026</option>
            </select>
          </div>
        </div>

        {/* DUA TOMBOL EKSPOR RESMI */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            onClick={handleExportCsv}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Unduh CSV (Format Tabular Aman)</span>
          </button>

          <button
            onClick={handleExportPdf}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Unduh PDF (Kop Resmi Dinas & Sekolah)</span>
          </button>
        </div>
      </div>

      {/* PRATINJAU TABEL DATA SESUAI FILTER */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Pratinjau Data Laporan ({reportType.replace(/_/g, ' ').toUpperCase()})
          </h3>
          <span className="text-xs text-slate-400">
            Data sama persis dengan yang diekspor ke PDF dan CSV
          </span>
        </div>

        <div className="overflow-x-auto">
          {reportType === 'ringkasan_sekolah' ? (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 font-bold uppercase text-[10px] text-slate-500">
                <tr>
                  <th className="p-3.5">Kelas</th>
                  <th className="p-3.5 text-center">Total Siswa</th>
                  <th className="p-3.5 text-center text-red-600">Risiko Tinggi</th>
                  <th className="p-3.5 text-center text-amber-600">Risiko Sedang</th>
                  <th className="p-3.5 text-center text-emerald-600">Risiko Rendah</th>
                  <th className="p-3.5 text-right">Status Retensi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {classList.map((cls) => {
                  let t = 0;
                  let s = 0;
                  let r = 0;
                  let total = 0;
                  latestPredMap.forEach((p) => {
                    if (p.studentClass === cls) {
                      total++;
                      if (p.level === 'tinggi') t++;
                      else if (p.level === 'sedang') s++;
                      else r++;
                    }
                  });

                  return (
                    <tr key={cls} className="hover:bg-slate-50">
                      <td className="p-3.5 font-bold text-slate-900">Kelas {cls}</td>
                      <td className="p-3.5 text-center font-mono">{total}</td>
                      <td className="p-3.5 text-center font-bold text-red-600 font-mono">{t}</td>
                      <td className="p-3.5 text-center font-bold text-amber-600 font-mono">{s}</td>
                      <td className="p-3.5 text-center font-bold text-emerald-600 font-mono">{r}</td>
                      <td className="p-3.5 text-right">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700">
                          {t === 0 ? 'Sangat Baik' : t <= 2 ? 'Terkendali' : 'Perhatian Khusus'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : reportType === 'siswa_berisiko' ? (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 font-bold uppercase text-[10px] text-slate-500">
                <tr>
                  <th className="p-3.5">Nama & NISN</th>
                  <th className="p-3.5 text-center">Kelas</th>
                  <th className="p-3.5 text-center">Skor</th>
                  <th className="p-3.5">Tingkat</th>
                  <th className="p-3.5">Faktor Utama</th>
                  <th className="p-3.5">Rekomendasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {atRiskFiltered.slice(0, 20).map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-3.5">
                      <p className="font-bold text-slate-900">{p.studentName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{p.studentNisn}</p>
                    </td>
                    <td className="p-3.5 text-center font-bold">{p.studentClass}</td>
                    <td className="p-3.5 text-center font-mono font-bold">{p.skor}</td>
                    <td className="p-3.5"><RiskBadge level={p.level} size="sm" /></td>
                    <td className="p-3.5 font-semibold text-slate-800">{p.faktorUtama}</td>
                    <td className="p-3.5 text-slate-600 max-w-xs">{p.rekomendasi[0]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 font-bold uppercase text-[10px] text-slate-500">
                <tr>
                  <th className="p-3.5">Nama Siswa</th>
                  <th className="p-3.5 text-center">Kelas</th>
                  <th className="p-3.5">Jenis Tindak Lanjut</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5">Catatan Tindakan</th>
                  <th className="p-3.5 text-right">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {interventionsFiltered.slice(0, 20).map((it) => (
                  <tr key={it.id} className="hover:bg-slate-50">
                    <td className="p-3.5 font-bold text-slate-900">{it.studentName}</td>
                    <td className="p-3.5 text-center">{it.studentClass}</td>
                    <td className="p-3.5 font-semibold text-teal-800">{it.jenis}</td>
                    <td className="p-3.5 text-center uppercase font-bold text-[10px]">{it.status}</td>
                    <td className="p-3.5 text-slate-600 max-w-xs">{it.catatan}</td>
                    <td className="p-3.5 text-right font-mono text-slate-400">{it.tanggal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
