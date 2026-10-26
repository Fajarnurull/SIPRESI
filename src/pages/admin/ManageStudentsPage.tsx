import React, { useState, useEffect } from 'react';
import {
  getAllStudents,
  saveStudent,
  deleteStudent
} from '../../lib/storage';
import { Student, ParentStatus } from '../../types';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import {
  GraduationCap,
  Plus,
  Upload,
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  FileSpreadsheet
} from 'lucide-react';

export const ManageStudentsPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Modal Form Siswa (Tambah / Edit)
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [nama, setNama] = useState('');
  const [nisn, setNisn] = useState('');
  const [kelas, setKelas] = useState('8A');
  const [jenisKelamin, setJenisKelamin] = useState<'L' | 'P'>('L');
  const [statusOrtu, setStatusOrtu] = useState<ParentStatus>('lengkap');
  const [kondisiEkonomi, setKondisiEkonomi] = useState(3);
  const [jarakKm, setJarakKm] = useState(2.5);
  const [adaTunggakan, setAdaTunggakan] = useState(false);
  const [aktif, setAktif] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Modal Hapus Siswa
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modal Impor CSV dengan Pratinjau & Validasi
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvPreviewData, setCsvPreviewData] = useState<Partial<Student>[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const classList = ['7A', '7B', '7C', '8A', '8B', '8C', '9A', '9B', '9C'];

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getAllStudents();
      setStudents(data);
    } catch (e) {
      console.error('Error loading students:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter list
  const filteredStudents = students.filter((s) => {
    const matchSearch =
      s.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nisn.includes(searchTerm) ||
      s.kelas.toLowerCase().includes(searchTerm.toLowerCase());
    const matchClass = classFilter === 'all' || s.kelas === classFilter;
    const matchStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? s.aktif
        : !s.aktif;
    return matchSearch && matchClass && matchStatus;
  });

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setNama('');
    setNisn('');
    setKelas('8A');
    setJenisKelamin('L');
    setStatusOrtu('lengkap');
    setKondisiEkonomi(3);
    setJarakKm(2.5);
    setAdaTunggakan(false);
    setAktif(true);
    setFormError(null);
    setShowFormModal(true);
  };

  const handleOpenEdit = (s: Student) => {
    setEditingStudent(s);
    setNama(s.nama);
    setNisn(s.nisn);
    setKelas(s.kelas);
    setJenisKelamin(s.jenisKelamin);
    setStatusOrtu(s.statusOrtu);
    setKondisiEkonomi(s.kondisiEkonomi);
    setJarakKm(s.jarakKm);
    setAdaTunggakan(s.adaTunggakan);
    setAktif(s.aktif);
    setFormError(null);
    setShowFormModal(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!nama.trim() || !nisn.trim() || !kelas) {
      setFormError('Nama, NISN, dan Kelas wajib diisi.');
      return;
    }

    // Cek duplikasi NISN jika menambah baru
    if (
      !editingStudent &&
      students.some((s) => s.nisn.trim() === nisn.trim())
    ) {
      setFormError(`Siswa dengan NISN ${nisn} sudah terdaftar.`);
      return;
    }

    setIsSaving(true);
    try {
      await saveStudent({
        id: editingStudent ? editingStudent.id : undefined,
        nama: nama.trim(),
        nisn: nisn.trim(),
        kelas,
        jenisKelamin,
        statusOrtu,
        kondisiEkonomi: Number(kondisiEkonomi),
        jarakKm: Number(jarakKm),
        adaTunggakan,
        aktif
      });

      setShowFormModal(false);
      setFeedbackMsg({
        type: 'success',
        text: `Data siswa ${nama.trim()} berhasil ${editingStudent ? 'diperbarui' : 'ditambahkan'}!`
      });
      await loadData();
    } catch (err) {
      console.error('Error saving student:', err);
      setFormError('Gagal menyimpan data siswa.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    setIsDeleting(true);
    try {
      await deleteStudent(studentToDelete.id);
      setFeedbackMsg({
        type: 'success',
        text: `Siswa ${studentToDelete.nama} berhasil dihapus dari sistem.`
      });
      setStudentToDelete(null);
      await loadData();
    } catch (err) {
      console.error('Error deleting student:', err);
      setFeedbackMsg({ type: 'error', text: 'Gagal menghapus siswa.' });
    } finally {
      setIsDeleting(false);
    }
  };

  // Parsing file CSV untuk Impor Siswa
  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        setCsvErrors(['File CSV kosong atau tidak memiliki baris data.']);
        return;
      }

      const rows: Partial<Student>[] = [];
      const errs: string[] = [];

      // Baris 0 = Header
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        // Split by comma ignoring inside quotes
        const cols = line.split(',').map((c) => c.replace(/^"|"$/g, '').trim());

        if (cols.length < 3) {
          errs.push(`Baris ${i + 1}: Format kolom tidak lengkap.`);
          continue;
        }

        const rawNisn = cols[0];
        const rawNama = cols[1];
        const rawKelas = cols[2];
        const rawJK = (cols[3]?.toUpperCase() === 'P' ? 'P' : 'L') as 'L' | 'P';
        const rawStatus = (cols[4] || 'lengkap') as ParentStatus;
        const rawEko = parseInt(cols[5] || '3', 10);
        const rawJarak = parseFloat(cols[6] || '2.0');
        const rawTunggakan = cols[7]?.toLowerCase() === 'ya' || cols[7] === '1' || cols[7]?.toLowerCase() === 'true';

        if (!rawNisn || !rawNama) {
          errs.push(`Baris ${i + 1}: NISN atau Nama kosong.`);
          continue;
        }

        rows.push({
          nisn: rawNisn,
          nama: rawNama,
          kelas: rawKelas || '8A',
          jenisKelamin: rawJK,
          statusOrtu: rawStatus,
          kondisiEkonomi: isNaN(rawEko) ? 3 : Math.min(5, Math.max(1, rawEko)),
          jarakKm: isNaN(rawJarak) ? 2.0 : rawJarak,
          adaTunggakan: rawTunggakan,
          aktif: true
        });
      }

      setCsvPreviewData(rows);
      setCsvErrors(errs);
      setShowCsvModal(true);
    };

    reader.readAsText(file);
    e.target.value = ''; // reset input
  };

  const handleConfirmImportCsv = async () => {
    if (csvPreviewData.length === 0) return;
    setIsImporting(true);
    try {
      let count = 0;
      for (const item of csvPreviewData) {
        if (item.nisn && item.nama) {
          await saveStudent({
            nama: item.nama,
            nisn: item.nisn,
            kelas: item.kelas || '8A',
            jenisKelamin: item.jenisKelamin || 'L',
            statusOrtu: item.statusOrtu || 'lengkap',
            kondisiEkonomi: item.kondisiEkonomi || 3,
            jarakKm: item.jarakKm || 2,
            adaTunggakan: Boolean(item.adaTunggakan),
            aktif: true
          });
          count++;
        }
      }

      setShowCsvModal(false);
      setFeedbackMsg({
        type: 'success',
        text: `Berhasil mengimpor ${count} data siswa dari CSV ke sistem!`
      });
      await loadData();
    } catch (err) {
      console.error('CSV import error:', err);
      alert('Terjadi kesalahan saat menyimpan data CSV.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER & ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Data Master Siswa</h1>
          <p className="text-xs text-slate-500 mt-1">
            Basis data siswa SMP Negeri 2 Wanadadi untuk pemantauan profil risiko putus sekolah.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <label className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs cursor-pointer transition-colors flex items-center gap-2">
            <Upload className="w-4 h-4 text-blue-600" />
            <span>Impor CSV</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleCsvFileUpload}
              className="hidden"
            />
          </label>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Siswa</span>
          </button>
        </div>
      </div>

      {/* FEEDBACK BANNER */}
      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-2xl flex items-center justify-between text-xs sm:text-sm border animate-in fade-in ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-slate-500 hover:text-slate-800 font-bold ml-2"
          >
            &times;
          </button>
        </div>
      )}

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
            placeholder="Cari nama, NISN, atau kelas siswa..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
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
            <span className="text-xs font-semibold text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </div>
        </div>
      </div>

      {/* TABEL SISWA */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Nama & NISN</th>
                <th className="px-4 py-3.5 text-center">Kelas</th>
                <th className="px-4 py-3.5 text-center">JK</th>
                <th className="px-4 py-3.5">Status Keluarga</th>
                <th className="px-4 py-3.5 text-center">Taraf Ekonomi</th>
                <th className="px-4 py-3.5 text-center">Jarak (Km)</th>
                <th className="px-4 py-3.5 text-center">Tunggakan</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span>Memuat data siswa...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    Tidak ada siswa yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="font-bold text-slate-900 leading-snug">{s.nama}</p>
                        <p className="text-[11px] text-slate-400 font-mono">NISN: {s.nisn}</p>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 font-bold text-xs">
                        {s.kelas}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                          s.jenisKelamin === 'L'
                            ? 'bg-sky-50 text-sky-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {s.jenisKelamin === 'L' ? 'L' : 'P'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-xs text-slate-600 capitalize">
                      {s.statusOrtu === 'yatim_piatu' ? 'Yatim Piatu' : s.statusOrtu}
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                          s.kondisiEkonomi >= 4
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        Skala {s.kondisiEkonomi}/5
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-center font-mono text-xs">
                      {s.jarakKm} km
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      {s.adaTunggakan ? (
                        <span className="text-[11px] font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                          Ada
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                          Lunas
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(s)}
                          title="Edit Data Siswa"
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setStudentToDelete(s)}
                          title="Hapus Siswa"
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL FORM SISWA */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingStudent ? 'Ubah Data Siswa' : 'Tambah Siswa Baru'}
                </h3>
              </div>
              <button
                onClick={() => setShowFormModal(false)}
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

            <form onSubmit={handleSaveStudent} className="space-y-4 mt-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap Siswa <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Contoh: Aditya Pratama"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NISN (10 Digit) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={nisn}
                    onChange={(e) => setNisn(e.target.value)}
                    placeholder="0091234567"
                    required
                    maxLength={10}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono focus:border-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kelas <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={kelas}
                    onChange={(e) => setKelas(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:border-blue-500 focus:outline-hidden"
                  >
                    {classList.map((c) => (
                      <option key={c} value={c}>
                        Kelas {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jenis Kelamin
                  </label>
                  <select
                    value={jenisKelamin}
                    onChange={(e) => setJenisKelamin(e.target.value as 'L' | 'P')}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:border-blue-500 focus:outline-hidden"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status Orang Tua / Wali
                  </label>
                  <select
                    value={statusOrtu}
                    onChange={(e) => setStatusOrtu(e.target.value as ParentStatus)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:border-blue-500 focus:outline-hidden"
                  >
                    <option value="lengkap">Lengkap</option>
                    <option value="yatim">Yatim (Ayah Meninggal)</option>
                    <option value="piatu">Piatu (Ibu Meninggal)</option>
                    <option value="yatim_piatu">Yatim Piatu</option>
                    <option value="wali">Tinggal Bersama Wali</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kondisi Ekonomi (1: Mampu, 5: Rentan)
                  </label>
                  <select
                    value={kondisiEkonomi}
                    onChange={(e) => setKondisiEkonomi(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:border-blue-500 focus:outline-hidden"
                  >
                    <option value={1}>1 - Mampu / Sejahtera</option>
                    <option value={2}>2 - Cukup</option>
                    <option value={3}>3 - Menengah / Rata-rata</option>
                    <option value={4}>4 - Kurang Mampu</option>
                    <option value={5}>5 - Sangat Rentan / Miskin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jarak Rumah ke Sekolah (Km)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="50"
                    value={jarakKm}
                    onChange={(e) => setJarakKm(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={adaTunggakan}
                    onChange={(e) => setAdaTunggakan(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-semibold text-slate-700">Ada Tunggakan Administrasi</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aktif}
                    onChange={(e) => setAktif(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-semibold text-slate-700">Status Siswa Aktif</span>
                </label>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  <span>{editingStudent ? 'Simpan Perubahan' : 'Simpan Siswa'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PRATINJAU & VALIDASI CSV */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full p-6 sm:p-8 border border-slate-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Pratinjau & Validasi Impor CSV</h3>
                  <p className="text-xs text-slate-500">
                    Memeriksa {csvPreviewData.length} baris data sebelum dimasukkan ke database sekolah.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCsvModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {csvErrors.length > 0 && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                <p className="font-bold mb-1">Catatan Validasi:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  {csvErrors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-4 flex-1 overflow-y-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">NISN</th>
                    <th className="p-3">Nama Siswa</th>
                    <th className="p-3">Kelas</th>
                    <th className="p-3">JK</th>
                    <th className="p-3">Status Ortu</th>
                    <th className="p-3">Ekonomi</th>
                    <th className="p-3">Jarak</th>
                    <th className="p-3">Tunggakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {csvPreviewData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-semibold">{row.nisn}</td>
                      <td className="p-3 font-bold text-slate-900">{row.nama}</td>
                      <td className="p-3">{row.kelas}</td>
                      <td className="p-3">{row.jenisKelamin}</td>
                      <td className="p-3 capitalize">{row.statusOrtu}</td>
                      <td className="p-3">Skala {row.kondisiEkonomi}</td>
                      <td className="p-3">{row.jarakKm} km</td>
                      <td className="p-3">{row.adaTunggakan ? 'Ada' : 'Tidak'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Total baris siap diimpor: <b>{csvPreviewData.length} siswa</b>
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowCsvModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImportCsv}
                  disabled={isImporting || csvPreviewData.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isImporting && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  <span>Simpan Semua ke Database</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HAPUS SISWA */}
      {studentToDelete && (
        <ConfirmModal
          isOpen={true}
          title={`Hapus Siswa ${studentToDelete.nama}?`}
          message={`Apakah Anda yakin ingin menghapus siswa dengan NISN ${studentToDelete.nisn} dari daftar siswa SMP Negeri 2 Wanadadi? Tindakan ini bersifat permanen.`}
          confirmLabel="Ya, Hapus Data"
          isDanger={true}
          isLoading={isDeleting}
          onConfirm={handleDeleteStudent}
          onClose={() => setStudentToDelete(null)}
        />
      )}
    </div>
  );
};
