import React, { useState, useEffect } from 'react';
import {
  getAllInterventions,
  getAllStudents,
  saveIntervention
} from '../../lib/storage';
import { InterventionRecord, Student, InterventionStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  HeartHandshake,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Calendar,
  X,
  Edit2
} from 'lucide-react';

export const InterventionsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [interventions, setInterventions] = useState<InterventionRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Modal Form
  const [showModal, setShowModal] = useState(false);
  const [editingInt, setEditingInt] = useState<InterventionRecord | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [jenis, setJenis] = useState('Kunjungan Rumah (Home Visit)');
  const [status, setStatus] = useState<InterventionStatus>('berjalan');
  const [catatan, setCatatan] = useState('');
  const [hasil, setHasil] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [iList, sList] = await Promise.all([getAllInterventions(), getAllStudents()]);
      setInterventions(iList);
      setStudents(sList);
    } catch (e) {
      console.error('Error loading interventions:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const studentMap = new Map<string, Student>();
  students.forEach((s) => studentMap.set(s.id, s));

  const filteredList = interventions.filter((it) => {
    const std = studentMap.get(it.studentId);
    const name = it.studentName || std?.nama || '';
    const matchSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      it.jenis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      it.catatan.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || it.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleOpenAdd = () => {
    setEditingInt(null);
    setSelectedStudentId(students[0]?.id || '');
    setJenis('Kunjungan Rumah (Home Visit)');
    setStatus('berjalan');
    setCatatan('');
    setHasil('');
    setShowModal(true);
  };

  const handleOpenEdit = (it: InterventionRecord) => {
    setEditingInt(it);
    setSelectedStudentId(it.studentId);
    setJenis(it.jenis);
    setStatus(it.status);
    setCatatan(it.catatan);
    setHasil(it.hasil || '');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !catatan.trim()) return;

    const std = studentMap.get(selectedStudentId);

    setIsSaving(true);
    try {
      await saveIntervention({
        id: editingInt ? editingInt.id : undefined,
        studentId: selectedStudentId,
        studentName: std?.nama,
        studentClass: std?.kelas,
        jenis,
        status,
        catatan: catatan.trim(),
        hasil: hasil.trim() || undefined,
        tanggal: editingInt ? editingInt.tanggal : new Date().toISOString().slice(0, 10),
        olehUid: currentUser?.uid || 'guru_bk',
        olehNama: currentUser?.nama || 'Guru BK'
      });

      setShowModal(false);
      await loadData();
    } catch (err) {
      console.error('Error saving intervention:', err);
      alert('Gagal menyimpan catatan intervensi.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manajemen Tindak Lanjut & Intervensi</h1>
          <p className="text-xs text-slate-500 mt-1">
            Program penanganan konkrit bagi siswa terindikasi risiko: kunjungan rumah, konseling, dan bantuan sosial.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kasus / Intervensi</span>
        </button>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari siswa, bentuk tindakan, atau catatan..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden"
          >
            <option value="all">Semua Status</option>
            <option value="direncanakan">Direncanakan</option>
            <option value="berjalan">Sedang Berjalan</option>
            <option value="selesai">Selesai / Tuntas</option>
          </select>
        </div>
      </div>

      {/* GRID KARTU INTERVENSI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            Memuat data intervensi...
          </div>
        ) : filteredList.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            Belum ada catatan intervensi yang cocok.
          </div>
        ) : (
          filteredList.map((it) => {
            const std = studentMap.get(it.studentId);
            return (
              <div
                key={it.id}
                className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 leading-snug">
                        {it.studentName || std?.nama}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Kelas {it.studentClass || std?.kelas} · NISN: {std?.nisn}
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                        it.status === 'selesai'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : it.status === 'berjalan'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {it.status}
                    </span>
                  </div>

                  <div className="mb-3">
                    <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg">
                      {it.jenis}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-3">
                    {it.catatan}
                  </p>

                  {it.hasil && (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-700">
                      <span className="font-bold text-slate-900">Perkembangan/Hasil: </span>
                      {it.hasil}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="truncate">Oleh: {it.olehNama}</span>
                  <div className="flex items-center gap-2">
                    <span>{it.tanggal}</span>
                    <button
                      onClick={() => handleOpenEdit(it)}
                      className="p-1 rounded-md hover:bg-slate-100 text-slate-600"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL FORM TAMBAH/EDIT */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingInt ? 'Ubah Tindak Lanjut' : 'Catat Tindak Lanjut Baru'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 mt-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Siswa</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                  required
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama} ({s.kelas}) - NISN: {s.nisn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Tindakan</label>
                  <select
                    value={jenis}
                    onChange={(e) => setJenis(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                  >
                    <option value="Kunjungan Rumah (Home Visit)">Kunjungan Rumah (Home Visit)</option>
                    <option value="Konseling Individu">Konseling Individu</option>
                    <option value="Pemanggilan Orang Tua / Wali">Pemanggilan Orang Tua / Wali</option>
                    <option value="Koordinasi Bantuan PIP/KIP">Koordinasi Bantuan PIP/KIP</option>
                    <option value="Bimbingan Belajar Tambahan">Bimbingan Belajar Tambahan</option>
                    <option value="Mentoring Wali Kelas">Mentoring Wali Kelas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                  >
                    <option value="direncanakan">Direncanakan</option>
                    <option value="berjalan">Sedang Berjalan</option>
                    <option value="selesai">Selesai / Tuntas</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Pelaksanaan <span className="text-red-500">*</span></label>
                <textarea
                  rows={3}
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Deskripsikan proses konseling atau kunjungan..."
                  required
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Hasil / Catatan Perkembangan</label>
                <textarea
                  rows={2}
                  value={hasil}
                  onChange={(e) => setHasil(e.target.value)}
                  placeholder="Hasil kesepakatan, komitmen kehadiran, dll..."
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                />
              </div>

              <div className="mt-6 pt-4 border-t flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan Intervensi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
