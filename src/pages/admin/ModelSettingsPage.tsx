import React, { useState, useEffect } from 'react';
import { getModelSettings, saveModelSettings } from '../../lib/storage';
import { DEFAULT_MODEL_SETTINGS } from '../../lib/prediction';
import { ModelSettings, ModelWeights, ModelThresholds } from '../../types';
import {
  Sliders,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Scale
} from 'lucide-react';

export const ModelSettingsPage: React.FC = () => {
  const [weights, setWeights] = useState<ModelWeights>(DEFAULT_MODEL_SETTINGS.weights);
  const [thresholds, setThresholds] = useState<ModelThresholds>(DEFAULT_MODEL_SETTINGS.thresholds);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadSettings() {
      setIsLoading(true);
      try {
        const s = await getModelSettings();
        if (s) {
          setWeights(s.weights);
          setThresholds(s.thresholds);
        }
      } catch (e) {
        console.error('Error loading settings:', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  // Hitung total bobot
  const totalWeight =
    Number(weights.absence || 0) +
    Number(weights.lowGrades || 0) +
    Number(weights.gradeTrend || 0) +
    Number(weights.behavior || 0) +
    Number(weights.economy || 0) +
    Number(weights.distance || 0) +
    Number(weights.parentStatus || 0);

  const isValidTotal = totalWeight === 100;

  const handleWeightChange = (key: keyof ModelWeights, value: number) => {
    setWeights((prev) => ({
      ...prev,
      [key]: Math.max(0, Math.min(100, value))
    }));
  };

  const handleResetDefault = () => {
    setWeights(DEFAULT_MODEL_SETTINGS.weights);
    setThresholds(DEFAULT_MODEL_SETTINGS.thresholds);
    setFeedbackMsg({
      type: 'success',
      text: 'Nilai bobot dan ambang batas dikembalikan ke standar default (35%, 20%, 15%, 10%, 10%, 5%, 5%).'
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidTotal) {
      setFeedbackMsg({
        type: 'error',
        text: `Total bobot saat ini ${totalWeight}%. Total bobot harus tepat 100% agar perhitungan DSS valid.`
      });
      return;
    }

    if (thresholds.high <= thresholds.medium) {
      setFeedbackMsg({
        type: 'error',
        text: 'Ambang batas risiko tinggi harus lebih besar daripada ambang batas risiko sedang.'
      });
      return;
    }

    setIsSaving(true);
    try {
      const payload: ModelSettings = {
        weights,
        thresholds,
        updatedAt: new Date().toISOString(),
        updatedBy: 'Admin'
      };
      await saveModelSettings(payload);
      setFeedbackMsg({
        type: 'success',
        text: 'Konfigurasi parameter model analitik DSS berhasil disimpan!'
      });
    } catch (err) {
      console.error('Error saving model settings:', err);
      setFeedbackMsg({ type: 'error', text: 'Gagal menyimpan pengaturan model.' });
    } finally {
      setIsSaving(false);
    }
  };

  const factorList: { key: keyof ModelWeights; label: string; desc: string }[] = [
    {
      key: 'absence',
      label: 'Persentase Ketidakhadiran (Alpa + Izin)',
      desc: 'Dihitung dari rasio alpa dan izin tanpa surat dalam 3 bulan terakhir.'
    },
    {
      key: 'lowGrades',
      label: 'Rata-rata Nilai Rendah',
      desc: 'Nilai capaian akademik semester berjalan (semakin jauh di bawah KKM 70, semakin berisiko).'
    },
    {
      key: 'gradeTrend',
      label: 'Tren Penurunan Nilai Rapor',
      desc: 'Penurunan tajam rata-rata nilai dibanding semester sebelumnya.'
    },
    {
      key: 'behavior',
      label: 'Catatan Perilaku & Sikap Disiplin',
      desc: 'Akumulasi poin pelanggaran tata tertib sekolah dalam semester berjalan.'
    },
    {
      key: 'economy',
      label: 'Kondisi Ekonomi & Tunggakan Biaya',
      desc: 'Taraf kerentanan ekonomi keluarga (skala 1-5) dan keberadaan tunggakan administrasi.'
    },
    {
      key: 'distance',
      label: 'Jarak Rumah ke Sekolah',
      desc: 'Jarak geografis tempat tinggal (jarak > 6 km membutuhkan akses transportasi khusus).'
    },
    {
      key: 'parentStatus',
      label: 'Status Orang Tua / Wali',
      desc: 'Latar belakang keluarga (yatim, piatu, yatim piatu, wali, atau lengkap).'
    }
  ];

  return (
    <div className="space-y-6">
      {/* HEADER & ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pengaturan Model DSS (SAW)</h1>
          <p className="text-xs text-slate-500 mt-1">
            Kalibrasi bobot multi-faktor Simple Additive Weighting dan ambang batas klasifikasi risiko putus sekolah.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetDefault}
          className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm shadow-xs transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <RotateCcw className="w-4 h-4 text-amber-600" />
          <span>Kembalikan Default</span>
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
          <button onClick={() => setFeedbackMsg(null)} className="font-bold text-slate-500">
            &times;
          </button>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* TOTAL WEIGHT CARD */}
        <div
          className={`p-5 rounded-3xl border shadow-sm transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
            isValidTotal
              ? 'bg-emerald-50/70 border-emerald-300'
              : 'bg-amber-50/70 border-amber-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-2xl ${
                isValidTotal ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
              }`}
            >
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Total Akumulasi Bobot Faktor</h3>
              <p className="text-xs text-slate-600 mt-0.5">
                {isValidTotal
                  ? 'Total tepat 100%. Model SAW siap dan seimbang untuk kalkulasi skor prediksi.'
                  : `Total saat ini ${totalWeight}%. Harus tepat 100% (selisih: ${100 - totalWeight}%).`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-3xl font-black font-mono ${
                isValidTotal ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {totalWeight}%
            </span>
          </div>
        </div>

        {/* 7 FAKTOR SLIDERS & INPUTS */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Bobot 7 Faktor Prediksi</h2>
              <p className="text-xs text-slate-500">
                Sesuaikan prioritas pengaruh tiap indikator terhadap penentuan risiko.
              </p>
            </div>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Sliders className="w-5 h-5" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {factorList.map((f) => {
              const currentVal = weights[f.key];
              return (
                <div
                  key={f.key}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 hover:bg-white hover:shadow-xs transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{f.label}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{f.desc}</p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={currentVal}
                        onChange={(e) =>
                          handleWeightChange(f.key, parseInt(e.target.value, 10) || 0)
                        }
                        className="w-20 px-3 py-1.5 text-right font-black font-mono text-sm bg-white border border-slate-300 rounded-xl focus:border-blue-500 focus:outline-hidden"
                      />
                      <span className="text-xs font-bold text-slate-500">%</span>
                    </div>
                  </div>

                  {/* RANGE SLIDER */}
                  <div className="pt-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={currentVal}
                      onChange={(e) =>
                        handleWeightChange(f.key, parseInt(e.target.value, 10) || 0)
                      }
                      className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AMBANG BATAS TINGKAT RISIKO */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Ambang Batas Klasifikasi Risiko (Skor 0 - 100)</h2>
              <p className="text-xs text-slate-500">
                Menentukan level pengelompokan risiko siswa berdasarkan skor akhir DSS.
              </p>
            </div>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Scale className="w-5 h-5" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Rendah */}
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Risiko Rendah
              </span>
              <p className="text-xl font-black text-emerald-700 mt-2">
                &lt; {thresholds.medium}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Kondisi terpantau aman dan stabil
              </p>
            </div>

            {/* Sedang */}
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                  Ambang Risiko Sedang
                </span>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={thresholds.medium}
                  onChange={(e) =>
                    setThresholds((prev) => ({
                      ...prev,
                      medium: parseInt(e.target.value, 10) || 40
                    }))
                  }
                  className="w-16 px-2 py-1 text-center font-bold text-xs bg-white border border-amber-300 rounded-lg"
                />
              </div>
              <p className="text-xl font-black text-amber-700 mt-2">
                {thresholds.medium} - {thresholds.high - 1}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Perlu pemantauan intensif berkala
              </p>
            </div>

            {/* Tinggi */}
            <div className="p-4 rounded-2xl bg-red-50/50 border border-red-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-red-800 uppercase tracking-wider">
                  Ambang Risiko Tinggi
                </span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={thresholds.high}
                  onChange={(e) =>
                    setThresholds((prev) => ({
                      ...prev,
                      high: parseInt(e.target.value, 10) || 70
                    }))
                  }
                  className="w-16 px-2 py-1 text-center font-bold text-xs bg-white border border-red-300 rounded-lg"
                />
              </div>
              <p className="text-xl font-black text-red-700 mt-2">
                &ge; {thresholds.high}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Prioritas intervensi & home visit
              </p>
            </div>
          </div>
        </div>

        {/* TOMBOL SIMPAN */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={!isValidTotal || isSaving}
            className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            <Save className="w-4 h-4" />
            <span>Simpan Kalibrasi Model DSS</span>
          </button>
        </div>
      </form>
    </div>
  );
};
