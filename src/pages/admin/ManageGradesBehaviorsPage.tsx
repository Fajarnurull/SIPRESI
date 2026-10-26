import React, { useState, useEffect } from 'react';
import {
  getAllStudents,
  getAllGrades,
  saveGrade,
  getAllBehaviors,
  saveBehavior,
  deleteBehavior
} from '../../lib/storage';
import { Student, GradeRecord, BehaviorRecord } from '../../types';
import {
  Award,
  AlertTriangle,
  Plus,
  Search,
  CheckCircle2,
  X,
  Edit2,
  Trash2,
  TrendingDown,
  TrendingUp,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const ManageGradesBehaviorsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'grades' | 'behaviors'>('grades');
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [behaviors, setBehaviors] = useState<BehaviorRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Form Modal Nilai
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [selectedStudentForGrade, setSelectedStudentForGrade] = useState<Student | null>(null);
  const [semester, setSemester] = useState('2026/2027 Ganjil');
  const [prevAvg, setPrevAvg] = useState(75);
  const [mapelScores, setMapelScores] = useState<Record<string, number>>({
    'Matematika': 75,
    'Bahasa Indonesia': 78,
    'Bahasa Inggris': 74,
    'IPA': 76,
    'IPS': 78,
    'PPKn': 80,
    'PAI / Agama': 82
  });

  // Form Modal Perilaku
  const [showBehaviorModal, setShowBehaviorModal] = useState(false);
  const [selectedStudentIdForBeh, setSelectedStudentIdForBeh] = useState('');
  const [behDate, setBehDate] = useState(new Date().toISOString().slice(0, 10));
  const [behType, setBehType] = useState<'pelanggaran' | 'catatan_bk'>('pelanggaran');
  const [behPoints, setBehPoints] = useState(15);
  const [behDesc, setBehDesc] = useState('');

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const classList = ['7A', '7B', '7C', '8A', '8B', '8C', '9A', '9B', '9C'];

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sList, gList, bList] = await Promise.all([
        getAllStudents(),
        getAllGrades(),
        getAllBehaviors()
      ]);
      setStudents(sList);
      setGrades(gList);
      setBehaviors(bList);
    } catch (e) {
      console.error('Error loading grades/behaviors:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const studentMap = new Map<string, Student>();
  students.forEach((s) => studentMap.set(s.id, s));

  const filteredStudents = students.filter((s) => {
    const matchClass = selectedClass === 'all' || s.kelas === selectedClass;
    const matchSearch =
      s.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nisn.includes(searchTerm);
    return matchClass && matchSearch && s.aktif;
  });

  const getGradeForStudent = (studentId: string) => {
    return grades.find((g) => g.studentId === studentId);
  };

  const handleOpenGradeModal = (student: Student) => {
    setSelectedStudentForGrade(student);
    const existing = getGradeForStudent(student.id);
    if (existing) {
      setSemester(existing.semester);
      setPrevAvg(existing.rataRataSebelumnya || 75);
      setMapelScores(existing.nilaiMapel || { 'Matematika': 75, 'IPA': 75, 'Bahasa Indonesia': 75 });
    } else {
      setSemester('2026/2027 Ganjil');
      setPrevAvg(78);
      setMapelScores({
        'Matematika': 75,
        'Bahasa Indonesia': 78,
        'Bahasa Inggris': 74,
        'IPA': 76,
        'IPS': 78,
        'PPKn': 80,
        'PAI / Agama': 82
      });
    }
    setShowGradeModal(true);
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForGrade) return;

    const values = Object.values(mapelScores);
    const sum = values.reduce((a, b) => a + Number(b), 0);
    const rataRata = values.length > 0 ? Math.round((sum / values.length) * 10) / 10 : 75;

    const record: GradeRecord = {
      id: `${selectedStudentForGrade.id}_${semester.replace(/\//g, '-').replace(/\s/g, '_')}`,
      studentId: selectedStudentForGrade.id,
      semester,
      rataRata,
      nilaiMapel: mapelScores,
      rataRataSebelumnya: Number(prevAvg),
      updatedAt: new Date().toISOString()
    };

    await saveGrade(record);
    setShowGradeModal(false);
    setFeedbackMsg({
      type: 'success',
      text: `Nilai semester untuk ${selectedStudentForGrade.nama} (Rata-rata: ${rataRata}) berhasil disimpan!`
    });
    await loadData();
  };

  const handleSaveBehavior = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentIdForBeh || !behDesc.trim()) return;

    await saveBehavior({
      studentId: selectedStudentIdForBeh,
      tanggal: behDate,
      jenis: behType,
      poin: Number(behPoints),
      keterangan: behDesc.trim(),
      dicatatOleh: currentUser?.nama || 'Petugas Kedisiplinan'
    });

    setShowBehaviorModal(false);
    setSelectedStudentIdForBeh('');
    setBehDesc('');
    setFeedbackMsg({
      type: 'success',
      text: 'Catatan kedisiplinan/pelanggaran berhasil ditambahkan!'
    });
    await loadData();
  };

  const handleDeleteBehavior = async (id: string) => {
    if (!confirm('Hapus catatan perilaku ini?')) return;
    await deleteBehavior(id);
    await loadData();
  };

  return (
    <div className="space-y-6">
      {/* HEADER & TABS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nilai Akademik & Catatan Perilaku</h1>
          <p className="text-xs text-slate-500 mt-1">
            Data penilaian semester (bobot 35% gabungan rata-rata & tren) dan poin pelanggaran disiplin (bobot 10%).
          </p>
        </div>

        {activeTab === 'behaviors' && (
          <button
            onClick={() => {
              setSelectedStudentIdForBeh(students[0]?.id || '');
              setShowBehaviorModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Catatan Disiplin</span>
          </button>
        )}
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

      {/* TAB SELECTOR */}
      <div className="flex border-b border-slate-200 gap-8">
        <button
          onClick={() => setActiveTab('grades')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 transition-all border-b-2 ${
            activeTab === 'grades'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Nilai Rapor & Tren Akademik ({grades.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('behaviors')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 transition-all border-b-2 ${
            activeTab === 'behaviors'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Catatan Disiplin & Perilaku ({behaviors.length})</span>
        </button>
      </div>

      {/* TAB 1: NILAI AKADEMIK */}
      {activeTab === 'grades' && (
        <div className="space-y-4">
          {/* SEARCH & FILTER */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3">
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

            <div className="flex items-center gap-2 w-full sm:w-auto">
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

          {/* TABEL NILAI */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Nama & NISN Siswa</th>
                    <th className="px-4 py-3.5 text-center">Kelas</th>
                    <th className="px-4 py-3.5 text-center">Semester Lalu</th>
                    <th className="px-4 py-3.5 text-center">Rata-Rata Saat Ini</th>
                    <th className="px-4 py-3.5 text-center">Tren Nilai</th>
                    <th className="px-4 py-3.5">Rincian Mata Pelajaran Utama</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredStudents.map((std) => {
                    const grd = getGradeForStudent(std.id);
                    const avg = grd?.rataRata;
                    const prev = grd?.rataRataSebelumnya;
                    const trend = avg && prev ? avg - prev : 0;

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

                        <td className="px-4 py-3.5 text-center font-mono text-slate-500">
                          {prev ? prev.toFixed(1) : '-'}
                        </td>

                        <td className="px-4 py-3.5 text-center font-mono">
                          {avg ? (
                            <span
                              className={`px-2 py-0.5 rounded-lg font-bold text-xs ${
                                avg < 65
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : avg < 75
                                  ? 'bg-amber-50 text-amber-800'
                                  : 'bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              {avg.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Belum diisi</span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-center font-mono">
                          {avg && prev ? (
                            trend < 0 ? (
                              <span className="inline-flex items-center gap-1 text-red-600 font-bold text-xs">
                                <TrendingDown className="w-3.5 h-3.5" />
                                <span>{trend.toFixed(1)}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs">
                                <TrendingUp className="w-3.5 h-3.5" />
                                <span>+{trend.toFixed(1)}</span>
                              </span>
                            )
                          ) : (
                            '-'
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-xs text-slate-600">
                          {grd?.nilaiMapel ? (
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(grd.nilaiMapel).slice(0, 4).map(([m, val]) => (
                                <span
                                  key={m}
                                  className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-700"
                                >
                                  {m.slice(0, 3)}: <b>{val}</b>
                                </span>
                              ))}
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => handleOpenGradeModal(std)}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold inline-flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3 text-blue-600" />
                            <span>{grd ? 'Ubah Nilai' : 'Input Nilai'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CATATAN DISIPLIN & PERILAKU */}
      {activeTab === 'behaviors' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Tanggal</th>
                  <th className="px-4 py-3.5">Nama Siswa</th>
                  <th className="px-4 py-3.5 text-center">Kelas</th>
                  <th className="px-4 py-3.5 text-center">Poin Pelanggaran</th>
                  <th className="px-4 py-3.5">Keterangan Kejadian</th>
                  <th className="px-4 py-3.5">Dicatat Oleh</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {behaviors.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400">
                      Belum ada catatan pelanggaran yang terekam.
                    </td>
                  </tr>
                ) : (
                  behaviors.map((b) => {
                    const std = studentMap.get(b.studentId);
                    return (
                      <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5 font-mono text-xs text-slate-600">
                          {b.tanggal}
                        </td>

                        <td className="px-4 py-3.5 font-bold text-slate-900">
                          {std?.nama || b.studentId}
                        </td>

                        <td className="px-4 py-3.5 text-center">
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-xs">
                            {std?.kelas || '-'}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 font-bold text-xs border border-red-200">
                            +{b.poin} Poin
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-xs text-slate-700 max-w-xs">
                          {b.keterangan}
                        </td>

                        <td className="px-4 py-3.5 text-xs text-slate-500">
                          {b.dicatatOleh}
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => handleDeleteBehavior(b.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
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
      )}

      {/* MODAL INPUT NILAI */}
      {showGradeModal && selectedStudentForGrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Input Nilai Akademik Semester</h3>
                <p className="text-xs text-slate-500">
                  {selectedStudentForGrade.nama} ({selectedStudentForGrade.kelas})
                </p>
              </div>
              <button onClick={() => setShowGradeModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGrade} className="space-y-4 mt-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Semester</label>
                  <input
                    type="text"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Rata-Rata Semester Lalu</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={prevAvg}
                    onChange={(e) => setPrevAvg(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Nilai Mata Pelajaran Utama:</label>
                <div className="grid grid-cols-2 gap-2.5">
                  {Object.entries(mapelScores).map(([mapel, val]) => (
                    <div key={mapel} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-xs font-medium text-slate-700 truncate">{mapel}</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={val}
                        onChange={(e) => {
                          const num = parseInt(e.target.value, 10) || 0;
                          setMapelScores((prev) => ({ ...prev, [mapel]: num }));
                        }}
                        className="w-16 px-2 py-1 text-right font-bold text-xs bg-white border border-slate-200 rounded-lg"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowGradeModal(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  Simpan Nilai
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL INPUT PERILAKU */}
      {showBehaviorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Catat Pelanggaran / Sikap Siswa</h3>
              <button onClick={() => setShowBehaviorModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBehavior} className="space-y-3.5 mt-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Siswa</label>
                <select
                  value={selectedStudentIdForBeh}
                  onChange={(e) => setSelectedStudentIdForBeh(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                  required
                >
                  <option value="">-- Pilih Siswa --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama} ({s.kelas}) - NISN: {s.nisn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={behDate}
                    onChange={(e) => setBehDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Poin Pelanggaran</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={behPoints}
                    onChange={(e) => setBehPoints(parseInt(e.target.value) || 10)}
                    className="w-full px-3 py-2 bg-red-50 text-red-900 font-bold border border-red-200 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Keterangan Kejadian</label>
                <textarea
                  rows={3}
                  value={behDesc}
                  onChange={(e) => setBehDesc(e.target.value)}
                  placeholder="Deskripsikan pelanggaran tata tertib atau sikap yang terekam..."
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                  required
                />
              </div>

              <div className="mt-6 pt-4 border-t flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowBehaviorModal(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  Simpan Catatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
