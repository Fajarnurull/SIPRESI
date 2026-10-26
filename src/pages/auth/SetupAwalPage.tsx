import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { initializeFirstAdmin, getInitSettings } from '../../lib/storage';
import { Shield, Lock, User, Mail, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export const SetupAwalPage: React.FC = () => {
  const navigate = useNavigate();
  const { checkInitialization } = useAuth();
  const [alreadyInit, setAlreadyInit] = useState<boolean | null>(null);
  const [nama, setNama] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function checkInit() {
      const init = await getInitSettings();
      if (init && init.initialized) {
        setAlreadyInit(true);
      } else {
        setAlreadyInit(false);
      }
    }
    checkInit();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!nama.trim() || !username.trim() || !email.trim() || !password) {
      setErrorMessage('Semua bidang wajib diisi.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password minimal 8 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Konfirmasi password tidak cocok.');
      return;
    }

    setIsLoading(true);
    try {
      const uid = `admin_${Date.now()}`;
      await initializeFirstAdmin(nama.trim(), username.trim(), email.trim(), uid);
      await checkInitialization();
      alert('Akun Administrator Pertama Berhasil Dibuat! Halaman setup-awal sekarang terkunci selamanya.');
      navigate('/login/admin');
    } catch (err: unknown) {
      console.error('Setup error:', err);
      setErrorMessage('Gagal menyelesaikan konfigurasi admin awal.');
    } finally {
      setIsLoading(false);
    }
  };

  if (alreadyInit === null) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-4">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (alreadyInit) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200/80 p-8 text-center">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Sistem Telah Terinisialisasi</h2>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Halaman inisialisasi /setup-awal telah dikunci demi keamanan sekolah karena akun Administrator pertama sudah terdaftar.
          </p>
          <div className="mt-6">
            <Link
              to="/pilih-peran"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors"
            >
              <span>Menuju Halaman Login</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-4 font-sans">
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl border border-slate-200/80 p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
            <Shield className="w-7 h-7" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            Inisialisasi Pertama
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-2">Buat Akun Administrator</h2>
          <p className="text-xs text-slate-500 mt-1">
            Konfigurasi akun super admin sekolah untuk SIPRESI SMP Negeri 2 Wanadadi.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Lengkap & Gelar <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: H. Sudarsono, M.Pd."
              required
              className="w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Username Login <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                required
                className="w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Sekolah <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@smpn2wanadadi.sch.id"
                required
                className="w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 karakter"
                required
                className="w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ulangi Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ketik ulang"
                required
                className="w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="p-3 bg-blue-50 rounded-xl text-[11px] text-blue-800 border border-blue-200">
            Setelah tombol ditekan, dokumen <code>settings/init</code> akan dibuat secara permanen sehingga halaman setup ini tidak dapat diakses lagi.
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>Inisialisasi & Buat Admin</span>
          </button>
        </form>
      </div>
    </div>
  );
};
