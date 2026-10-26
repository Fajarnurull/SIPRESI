import React, { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, Eye, EyeOff, Check, X, ShieldAlert, ArrowRight } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const oobCode = searchParams.get('oobCode') || '';
  const navigate = useNavigate();
  const { confirmNewPassword } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Kriteria Validasi Kata Sandi
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  // Kekuatan Password (0-4 segmen)
  const strengthScore = useMemo(() => {
    let score = 0;
    if (hasMinLength) score++;
    if (hasUppercase) score++;
    if (hasLowercase) score++;
    if (hasNumber) score++;
    return score;
  }, [hasMinLength, hasUppercase, hasLowercase, hasNumber]);

  const strengthLabels = ['Sangat Lemah', 'Lemah', 'Sedang', 'Kuat', 'Sangat Kuat'];
  const strengthColors = ['bg-slate-200', 'bg-red-500', 'bg-amber-500', 'bg-blue-500', 'bg-emerald-500'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!hasMinLength || !hasUppercase || !hasLowercase || !hasNumber) {
      setErrorMessage('Kata sandi belum memenuhi seluruh kriteria keamanan.');
      return;
    }

    if (!passwordsMatch) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setIsLoading(true);
    const res = await confirmNewPassword(oobCode, password);
    setIsLoading(false);

    if (res.success) {
      navigate('/reset-sukses');
    } else {
      setErrorMessage(res.message || 'Gagal mengubah kata sandi.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200/80 p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Buat Password Baru</h2>
          <p className="text-xs text-slate-500 mt-1">
            Silakan masukkan kata sandi baru untuk akun SIPRESI Anda.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2 text-xs">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* PASSWORD BARU */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Password Baru <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 8 karakter kombinasi"
                className="w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* INDIKATOR KEKUATAN 4 SEGMEN */}
            <div className="mt-2.5">
              <div className="flex items-center justify-between text-[11px] mb-1 font-medium">
                <span className="text-slate-500">Kekuatan Sandi:</span>
                <span className="font-semibold text-slate-700">{strengthLabels[strengthScore]}</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 h-1.5">
                {[1, 2, 3, 4].map((seg) => (
                  <div
                    key={seg}
                    className={`rounded-full transition-colors ${
                      strengthScore >= seg ? strengthColors[strengthScore] : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* KONFIRMASI PASSWORD */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Ulangi Password Baru <span className="text-red-500">*</span>
            </label>
            <input
              type={showPass ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ketik ulang password baru"
              className="w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>

          {/* CHECKLIST SYARAT KEAMANAN */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
            <p className="font-bold text-slate-700 text-[11px] mb-1">Syarat Keamanan Password:</p>
            <div className="flex items-center gap-2">
              {hasMinLength ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <X className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span className={hasMinLength ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                Minimal 8 karakter
              </span>
            </div>
            <div className="flex items-center gap-2">
              {hasUppercase && hasLowercase ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <X className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span className={hasUppercase && hasLowercase ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                Kombinasi huruf besar (A-Z) dan kecil (a-z)
              </span>
            </div>
            <div className="flex items-center gap-2">
              {hasNumber ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <X className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span className={hasNumber ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                Mengandung minimal 1 angka (0-9)
              </span>
            </div>
            <div className="flex items-center gap-2">
              {passwordsMatch ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <X className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span className={passwordsMatch ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                Kedua password cocok
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !passwordsMatch || strengthScore < 4}
            className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
            <span>Simpan Password Baru</span>
          </button>
        </form>
      </div>
    </div>
  );
};
