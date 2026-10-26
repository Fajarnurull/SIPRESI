import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export const ResetSuccessPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200/80 p-8 text-center">
        <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-sm animate-in zoom-in-75 duration-300">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <h2 className="text-2xl font-black text-slate-900">Password Berhasil Diubah</h2>
        
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          Kata sandi baru Anda telah berhasil diperbarui di sistem SIPRESI SMP Negeri 2 Wanadadi. Silakan masuk kembali dengan kata sandi baru Anda.
        </p>

        <div className="mt-8">
          <Link
            to="/pilih-peran"
            className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all flex items-center justify-center gap-2"
          >
            <span>Kembali ke Login</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
