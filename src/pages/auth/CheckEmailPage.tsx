import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MailCheck, ArrowLeft, RotateCw } from 'lucide-react';

export const CheckEmailPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { resetPasswordByEmail } = useAuth();
  const email = (location.state as { email?: string })?.email || 'email-anda@sekolah.id';

  const [cooldown, setCooldown] = useState(45);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  // Masking email untuk privasi (contoh: a***@...)
  const maskEmail = (str: string) => {
    const parts = str.split('@');
    if (parts.length < 2) return str;
    const name = parts[0];
    const domain = parts[1];
    const maskedName = name.length > 2 ? `${name[0]}***${name[name.length - 1]}` : `${name}***`;
    return `${maskedName}@${domain}`;
  };

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((c) => c - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0) return;
    setResendStatus('Mengirim ulang...');
    const res = await resetPasswordByEmail(email);
    setCooldown(45);
    setResendStatus(res.message || 'Tautan baru telah dikirimkan.');
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200/80 p-6 sm:p-8 text-center">
        <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 shadow-sm border border-blue-100">
          <MailCheck className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-bold text-slate-900">Periksa Kotak Masuk Anda</h2>
        
        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
          Kami telah mengirimkan tautan pemulihan kata sandi resmi ke:
        </p>
        
        <p className="mt-1 font-mono font-bold text-sm text-blue-700 bg-blue-50/80 py-1.5 px-3 rounded-xl border border-blue-100 inline-block">
          {maskEmail(email)}
        </p>

        <p className="text-xs text-slate-500 mt-4 leading-relaxed">
          Silakan klik tautan di dalam email tersebut untuk mereset kata sandi Anda. Jika tidak muncul di kotak masuk utama, mohon periksa folder <i>Spam</i> atau <i>Promosi</i>.
        </p>

        {resendStatus && (
          <p className="mt-3 text-xs text-emerald-600 font-medium bg-emerald-50 py-1 px-3 rounded-lg border border-emerald-100">
            {resendStatus}
          </p>
        )}

        <div className="mt-6 space-y-3">
          <button
            onClick={handleResend}
            disabled={cooldown > 0}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCw className={`w-3.5 h-3.5 ${cooldown > 0 ? '' : 'text-blue-600'}`} />
            <span>
              {cooldown > 0 ? `Kirim ulang tautan (${cooldown}d)` : 'Kirim Ulang Tautan'}
            </span>
          </button>

          {/* Akses Cepat Simulasi Reset di Preview */}
          <button
            onClick={() => navigate('/reset-password?oobCode=demo-token-123')}
            className="w-full py-2 px-3 rounded-xl border border-dashed border-blue-200 bg-blue-50/40 text-[11px] font-medium text-blue-700 hover:bg-blue-50 transition-colors"
          >
            Buka Halaman Reset Password (Simulasi Preview) →
          </button>
        </div>

        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center">
          <Link
            to="/lupa-password"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Ubah email</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
