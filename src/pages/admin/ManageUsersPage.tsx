import React, { useState, useEffect } from 'react';
import {
  getAllUsers,
  createNewUser,
  toggleUserStatus,
  getAllStudents
} from '../../lib/storage';
import { UserProfile, UserRole, Student } from '../../types';
import { RoleBadge } from '../../components/common/RoleBadge';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { useAuth } from '../../context/AuthContext';
import {
  UserPlus,
  Search,
  Shield,
  KeyRound,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  Mail,
  UserCheck
} from 'lucide-react';

export const ManageUsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Modal Tambah User
  const [showAddModal, setShowAddModal] = useState(false);
  const [nama, setNama] = useState('');
  const [role, setRole] = useState<UserRole>('guru_bk');
  const [identitas, setIdentitas] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Konfirmasi Toggle Status
  const [targetToggleUser, setTargetToggleUser] = useState<UserProfile | null>(null);
  const [isToggling, setIsToggling] = useState(false);

  // Feedback Banner
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { resetPasswordByEmail } = useAuth();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [uList, sList] = await Promise.all([getAllUsers(), getAllStudents()]);
      setUsers(uList);
      setStudents(sList);
    } catch (e) {
      console.error('Error loading users:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter list
  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.identitas.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const handleOpenAdd = () => {
    setNama('');
    setRole('guru_bk');
    setIdentitas('');
    setEmail('');
    setPassword('');
    setSelectedStudentId('');
    setFormError(null);
    setShowAddModal(true);
  };

  const handleStudentSelect = (stdId: string) => {
    setSelectedStudentId(stdId);
    const std = students.find((s) => s.id === stdId);
    if (std) {
      setNama(std.nama);
      setIdentitas(std.nisn);
      setEmail(`${std.nisn.toLowerCase()}@siswa.smpn2wanadadi.sch.id`);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!nama.trim() || !identitas.trim() || !email.trim() || !password) {
      setFormError('Semua bidang wajib diisi.');
      return;
    }

    if (password.length < 6) {
      setFormError('Password minimal 6 karakter.');
      return;
    }

    // Cek duplikasi identitas
    if (users.some((u) => u.identitas.toLowerCase() === identitas.trim().toLowerCase())) {
      setFormError(`Identitas (${identitas}) sudah terdaftar pada pengguna lain.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await createNewUser(
        {
          nama: nama.trim(),
          role,
          identitas: identitas.trim(),
          email: email.trim(),
          aktif: true,
          studentId: role === 'siswa' ? selectedStudentId || `std_${identitas.trim()}` : undefined
        },
        password
      );

      setShowAddModal(false);
      setFeedbackMsg({
        type: 'success',
        text: `Akun ${nama.trim()} (${role.toUpperCase()}) berhasil dibuat!`
      });
      await loadData();
    } catch (err: unknown) {
      console.error('Error creating user:', err);
      setFormError('Gagal membuat pengguna baru. Pastikan email belum digunakan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!targetToggleUser) return;
    setIsToggling(true);
    try {
      const newStatus = !targetToggleUser.aktif;
      await toggleUserStatus(targetToggleUser.uid, newStatus);
      setFeedbackMsg({
        type: 'success',
        text: `Status akun ${targetToggleUser.nama} berhasil diubah menjadi ${
          newStatus ? 'AKTIF' : 'NONAKTIF'
        }.`
      });
      setTargetToggleUser(null);
      await loadData();
    } catch (err) {
      console.error('Error toggling status:', err);
      setFeedbackMsg({ type: 'error', text: 'Gagal mengubah status akun.' });
    } finally {
      setIsToggling(false);
    }
  };

  const handleSendReset = async (u: UserProfile) => {
    const res = await resetPasswordByEmail(u.email);
    if (res.success) {
      setFeedbackMsg({
        type: 'success',
        text: `Email instruksi reset kata sandi telah dikirimkan ke alamat ${u.email}.`
      });
    } else {
      setFeedbackMsg({ type: 'error', text: res.message || 'Gagal mengirim email reset password.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER & TAMBAH AKUN */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kelola Pengguna Sistem</h1>
          <p className="text-xs text-slate-500 mt-1">
            Daftar seluruh akun terotorisasi SIPRESI (Admin, Guru BK, Kepala Sekolah, dan Siswa).
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Pengguna Baru</span>
        </button>
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

      {/* SEARCH & FILTER BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama, identitas (NIP/NISN/Username), atau email..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Peran:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden focus:border-blue-500"
          >
            <option value="all">Semua Peran ({users.length})</option>
            <option value="admin">Administrator</option>
            <option value="guru_bk">Guru BK</option>
            <option value="kepala_sekolah">Kepala Sekolah</option>
            <option value="siswa">Siswa</option>
          </select>
        </div>
      </div>

      {/* TABEL PENGGUNA */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Nama & Profil</th>
                <th className="px-4 py-3.5">Peran</th>
                <th className="px-4 py-3.5">Identitas Login</th>
                <th className="px-4 py-3.5">Email Terdaftar</th>
                <th className="px-4 py-3.5 text-center">Status Akun</th>
                <th className="px-5 py-3.5 text-right">Aksi Manajemen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span>Memuat data pengguna...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    Tidak ada akun pengguna yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.uid} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs flex-shrink-0 border border-slate-200">
                          {u.nama.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 leading-snug">{u.nama}</p>
                          <p className="text-[10px] text-slate-400 font-mono">UID: {u.uid.slice(0, 14)}...</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <RoleBadge role={u.role} size="sm" />
                    </td>

                    <td className="px-4 py-3.5 font-mono text-xs font-semibold text-slate-800">
                      {u.identitas}
                    </td>

                    <td className="px-4 py-3.5 text-slate-600 text-xs">
                      {u.email}
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      {u.aktif ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Aktif</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
                          <XCircle className="w-3 h-3" />
                          <span>Nonaktif</span>
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-2">
                        {/* Tombol Kirim Email Reset */}
                        <button
                          onClick={() => handleSendReset(u)}
                          title="Kirim email reset kata sandi"
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>

                        {/* Tombol Toggle Status (Aktif/Nonaktif) */}
                        <button
                          onClick={() => setTargetToggleUser(u)}
                          title={u.aktif ? 'Nonaktifkan akun ini' : 'Aktifkan akun ini'}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                            u.aktif
                              ? 'border-red-200 text-red-600 hover:bg-red-50'
                              : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {u.aktif ? 'Nonaktifkan' : 'Aktifkan'}
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

      {/* MODAL TAMBAH PENGGUNA */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 border border-slate-100 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <UserPlus className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Tambah Akun Pengguna Baru</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
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

            <form onSubmit={handleCreateUser} className="space-y-4 mt-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pilih Peran Sistem <span className="text-red-500">*</span>
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:border-blue-500 focus:outline-hidden"
                >
                  <option value="guru_bk">Guru BK (Bimbingan Konseling)</option>
                  <option value="admin">Administrator Sekolah</option>
                  <option value="kepala_sekolah">Kepala Sekolah</option>
                  <option value="siswa">Siswa</option>
                </select>
              </div>

              {/* Jika role Siswa, bisa pilih dari data siswa yang sudah ada */}
              {role === 'siswa' && students.length > 0 && (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                  <label className="block text-xs font-bold text-emerald-900 mb-1">
                    Pilih Data Siswa Terdaftar (Otomatis Isi Nama & NISN)
                  </label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => handleStudentSelect(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden"
                  >
                    <option value="">-- Buat Manual atau Pilih Siswa --</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nama} ({s.kelas} - NISN: {s.nisn})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap & Gelar <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Contoh: Sri Wahyuningsih, S.Psi., M.Pd."
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Identitas Login ({role === 'admin' ? 'Username' : role === 'siswa' ? 'NISN' : 'NIP'}) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={identitas}
                    onChange={(e) => setIdentitas(e.target.value)}
                    placeholder={role === 'admin' ? 'username_admin' : role === 'siswa' ? '0091234567' : '198506122010011005'}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono focus:border-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Pengguna/Wali <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@sekolah.sch.id"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password Awal <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:border-blue-500 focus:outline-hidden"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Password dapat diubah kemudian oleh pengguna melalui tautan Lupa Password.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  <span>Simpan & Buat Akun</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI NONAKTIFKAN / AKTIFKAN */}
      {targetToggleUser && (
        <ConfirmModal
          isOpen={true}
          title={`${targetToggleUser.aktif ? 'Nonaktifkan' : 'Aktifkan'} Akun ${targetToggleUser.nama}?`}
          message={
            targetToggleUser.aktif
              ? `Pengguna dengan identitas ${targetToggleUser.identitas} tidak akan dapat login lagi ke SIPRESI hingga Anda mengaktifkannya kembali.`
              : `Pengguna dengan identitas ${targetToggleUser.identitas} akan dapat kembali login dan menggunakan hak akses perannya.`
          }
          confirmLabel={targetToggleUser.aktif ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan'}
          isDanger={targetToggleUser.aktif}
          isLoading={isToggling}
          onConfirm={handleToggleStatus}
          onClose={() => setTargetToggleUser(null)}
        />
      )}
    </div>
  );
};
