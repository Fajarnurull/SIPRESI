import React, { useState, useEffect } from 'react';
import {
  getAllStudents,
  getAllAttendances,
  saveAttendance
} from '../../lib/storage';
import { Student, AttendanceRecord } from '../../types';
import {
  CalendarCheck,
  Plus,
  Upload,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  FileSpreadsheet,
  Edit2
} from 'lucide-react';

export const ManageAttendancePage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState('2026-10');
  const [selectedClass, setSelectedClass] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Form Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [hariEfektif, setHariEfektif] = useState(20);
  const [hadir, setHadir] = useState(18);
  const [sakit, setSakit] = useState(1);
  const [izin, setIzin] = useState(1);
  const [alpa, setAlpa] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // CSV Import Modal
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const months = ['2026-07', '2026-08', '2026-09', '2026-10', '2026-11', '2026-12'];
  const classList = ['7A', '7B', '7C', '8A', '8B', '8C', '9A', '9B', '9C'];

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sList, aList] = await Promise.all([getAllStudents(), getAllAttendances()]);
      setStudents(sList);
      setAttendances(aList);
    } catch (e) {
      console.error('Error loading attendance data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Map studentId to student object
  const studentMap = new Map<string, Student>();
  students.forEach((s) => studentMap.set(s.id, s));

  // Filter students based on class and search
  const visibleStudents = students.filter((s) => {
    const matchClass = selectedClass === 'all' || s.kelas === selectedClass;
    const matchSearch =
      s.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nisn.includes(searchTerm);
    return matchClass && matchSearch && s.aktif;
  });

  // Ambil record presensi per siswa untuk bulan yang dipilih
  const getAttendanceForStudent = (studentId: string) => {
    return attendances.find((a) => a.studentId === studentId && a.bulan === selectedMonth);
  };

  const handleOpenAddOrEdit = (student: Student) => {
    setSelectedStudentId(student.id);
    const existing = getAttendanceForStudent(student.id);
    if (existing) {
      setHariEfektif(existing.hariEfektif);
      setHadir(existing.hadir);
      setSakit(existing.sakit);
      setIzin(existing.izin);
      setAlpa(existing.alpa);
    } else {
      setHariEfektif(20);
      setHadir(20);
      setSakit(0);
      setIzin(0);
      setAlpa(0);
    }
    setFormError(null);
    setShowModal(true);
  };

  const handleSaveAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const totalDays = Number(hadir) + Number(sakit) + Number(izin) + Number(alpa);
    if (totalDays > Number(hariEfektif)) {
      setFormError(`Jumlah hari (Hadir + Sakit + Izin + Alpa = ${totalDays}) melebihi Hari Efektif (${hariEfektif}).`);
      return;
    }

    setIsSaving(true);
    try {
      const record: AttendanceRecord = {
        id: `${selectedStudentId}_${selectedMonth}`,
        studentId: selectedStudentId,
        bulan: selectedMonth,
        hariEfektif: Number(hariEfektif),
        hadir: Number(hadir),
        sakit: Number(sakit),
        izin: Number(izin),
        alpa: Number(alpa),
        updatedAt: new Date().toISOString()
      };

      await saveAttendance(record);
      setShowModal(false);
      setFeedbackMsg({
        type: 'success',
        text: `Data kehadiran siswa bulan ${selectedMonth} berhasil disimpan!`
      });
      await loadData();
    } catch (err) {
      console.error('Error saving attendance:', err);
      setFormError('Gagal menyimpan rekap presensi.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
      const rows: any[] = [];
      const errs: string[] = [];

      // Header: NISN, Bulan, HariEfektif, Hadir, Sakit, Izin, Alpa
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.replace(/^"|"$/g, '').trim());
        if (cols.length < 5) continue;

        const nisn = cols[0];
        const bln = cols[1] || selectedMonth;
        const efektif = parseInt(cols[2] || '20', 10);
        const hdr = parseInt(cols[3] || '20', 10);
        const skt = parseInt(cols[4] || '0', 10);
        const izn = parseInt(cols[5] || '0', 10);
        const alp = parseInt(cols[6] || '0', 10);

        const matchedStd = students.find((s) => s.nisn === nisn);
        if (!matchedStd) {
          errs.push(`Baris ${i + 1}: NISN ${nisn} tidak ditemukan.`);
          continue;
        }

        rows.push({
          studentId: matchedStd.id,
          studentName: matchedStd.nama,
          nisn,
          bulan: bln,
          hariEfektif: efektif,
          hadir: hdr,
          sakit: skt,
          izin: izn,
          alpa: alp
        });
      }

      setCsvPreview(rows);
      setCsvErrors(errs);
      setShowCsvModal(true);
    };

    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmImportCsv = async () => {
    if (csvPreview.length === 0) return;
    setIsImporting(true);
    try {
      for (const row of csvPreview) {
        await saveAttendance({
          id: `${row.studentId}_${row.bulan}`,
          studentId: row.studentId,
          bulan: row.bulan,
          hariEfektif: row.hariEfektif,
          hadir: row.hadir,
          sakit: row.sakit,
          izin: row.izin,
          alpa: row.alpa,
          updatedAt: new Date().toISOString()
        });
      }
      setShowCsvModal(false);
      setFeedbackMsg({
        type: 'success',
        text: `Berhasil mengimpor ${csvPreview.length} catatan kehadiran!`
      });
      await loadData();
    } catch (err) {
      console.error('CSV import error:', err);
      alert('Gagal mengimpor kehadiran.');
    } finally {
      setIsImporting(false);
    }
  };

  const activeStudentObj = students.find((s) => s.id === selectedStudentId);

  return (
    <div className="space-y-6">
      {/* HEADER & ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rekap Data Kehadiran Siswa</h1>
          <p className="text-xs text-slate-500 mt-1">
            Pencatatan presensi bulanan (Hadir, Sakit, Izin, Alpa) sebagai parameter utama DSS (bobot 35%).
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <label className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs cursor-pointer transition-colors flex items-center gap-2">
            <Upload className="w-4 h-4 text-teal-600" />
            <span>Impor Presensi CSV</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleCsvUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* FEEDBACK BANNER */}
      {feedbackMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-between text-xs sm:text-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="font-bold text-slate-500">
            &times;
          </button>
        </div>
      )}

      {/* FILTERS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama atau NISN siswa..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Bulan:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden"
            >
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Kelas:</span>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
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

      {/* TABEL PRESENSI */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Nama & NISN Siswa</th>
                <th className="px-4 py-3.5 text-center">Kelas</th>
                <th className="px-4 py-3.5 text-center">Hari Efektif</th>
                <th className="px-4 py-3.5 text-center text-emerald-700">Hadir</th>
                <th className="px-4 py-3.5 text-center text-blue-700">Sakit</th>
                <th className="px-4 py-3.5 text-center text-amber-700">Izin</th>
                <th className="px-4 py-3.5 text-center text-red-700">Alpa</th>
                <th className="px-4 py-3.5 text-center">% Kehadiran</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-400">
                    Memuat data kehadiran...
                  </td>
                </tr>
              ) : visibleStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-400">
                    Tidak ada siswa yang sesuai filter.
                  </td>
                </tr>
              ) : (
                visibleStudents.map((std) => {
                  const att = getAttendanceForStudent(std.id);
                  const efektif = att ? att.hariEfektif : 20;
                  const hadirCount = att ? att.hadir : 0;
                  const pct = att ? Math.round((hadirCount / (efektif || 1)) * 100) : 0;
                  const hasRecord = Boolean(att);

                  return (
                    <tr key={std.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-slate-900 leading-snug">{std.nama}</p>
                        <p className="text-[11px] text-slate-400 font-mono">NISN: {std.nisn}</p>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-xs">
                          {std.kelas}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-center font-mono text-xs">
                        {hasRecord ? efektif : '-'}
                      </td>

                      <td className="px-4 py-3.5 text-center font-bold text-emerald-700">
                        {hasRecord ? hadirCount : '-'}
                      </td>

                      <td className="px-4 py-3.5 text-center font-mono text-blue-700">
                        {hasRecord ? att?.sakit : '-'}
                      </td>

                      <td className="px-4 py-3.5 text-center font-mono text-amber-700">
                        {hasRecord ? att?.izin : '-'}
                      </td>

                      <td className="px-4 py-3.5 text-center font-bold">
                        {hasRecord ? (
                          <span className={att && att.alpa > 0 ? 'text-red-600 font-black' : 'text-slate-400'}>
                            {att?.alpa}
                          </span>
                        ) : '-'}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        {hasRecord ? (
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                              pct >= 90
                                ? 'bg-emerald-50 text-emerald-700'
                                : pct >= 75
                                ? 'bg-amber-50 text-amber-800'
                                : 'bg-red-50 text-red-700'
                            }`}
                          >
                            {pct}%
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Belum diisi</span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleOpenAddOrEdit(std)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-1.5 ${
                            hasRecord
                              ? 'border border-slate-200 text-slate-700 hover:bg-slate-100'
                              : 'bg-teal-600 text-white hover:bg-teal-700 shadow-xs'
                          }`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>{hasRecord ? 'Ubah' : 'Input Presensi'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL INPUT / UBAH PRESENSI */}
      {showModal && activeStudentObj && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Rekap Presensi Siswa</h3>
                <p className="text-xs text-slate-500">
                  {activeStudentObj.nama} ({activeStudentObj.kelas}) · Bulan {selectedMonth}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAttendance} className="space-y-3.5 mt-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Hari Efektif Belajar Bulan Ini
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={hariEfektif}
                  onChange={(e) => setHariEfektif(parseInt(e.target.value) || 20)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-emerald-800 mb-1">
                    Jumlah Hadir
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={hariEfektif}
                    value={hadir}
                    onChange={(e) => setHadir(parseInt(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 bg-emerald-50/50 border border-emerald-200 rounded-xl text-emerald-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-blue-800 mb-1">
                    Sakit (Surat Dokter/Ortu)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={hariEfektif}
                    value={sakit}
                    onChange={(e) => setSakit(parseInt(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 bg-blue-50/50 border border-blue-200 rounded-xl text-blue-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-amber-800 mb-1">
                    Izin (Ada Pemberitahuan)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={hariEfektif}
                    value={izin}
                    onChange={(e) => setIzin(parseInt(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 bg-amber-50/50 border border-amber-200 rounded-xl text-amber-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-red-800 mb-1">
                    Alpa (Tanpa Keterangan) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={hariEfektif}
                    value={alpa}
                    onChange={(e) => setAlpa(parseInt(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 bg-red-50/50 border border-red-200 rounded-xl text-red-900 font-bold"
                  />
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2"
                >
                  {isSaving && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  <span>Simpan Presensi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV MODAL */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 border border-slate-100 max-h-[90vh] flex flex-col">
            <h3 className="text-base font-bold text-slate-900 mb-2">Pratinjau Impor Presensi CSV</h3>
            <p className="text-xs text-slate-500 mb-4">
              Ditemukan {csvPreview.length} baris presensi siap diimpor.
            </p>

            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl mb-4">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 sticky top-0 p-2 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-2">NISN</th>
                    <th className="p-2">Nama</th>
                    <th className="p-2">Bulan</th>
                    <th className="p-2">Hadir</th>
                    <th className="p-2">Alpa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {csvPreview.slice(0, 50).map((r, i) => (
                    <tr key={i}>
                      <td className="p-2 font-mono">{r.nisn}</td>
                      <td className="p-2">{r.studentName}</td>
                      <td className="p-2">{r.bulan}</td>
                      <td className="p-2 font-bold text-emerald-600">{r.hadir}</td>
                      <td className="p-2 font-bold text-red-600">{r.alpa}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCsvModal(false)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmImportCsv}
                disabled={isImporting}
                className="px-5 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold"
              >
                {isImporting ? 'Menyimpan...' : 'Impor Semua Presensi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
