import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getAllStudents,
  getAttendancesByStudent,
  getGradesByStudent,
  getBehaviorsByStudent,
  getAllPredictions,
  getAllInterventions,
  saveIntervention,
  saveBehavior
} from '../../lib/storage';
import {
  Student,
  AttendanceRecord,
  GradeRecord,
  BehaviorRecord,
  PredictionRecord,
  InterventionRecord
} from '../../types';
import { RiskBadge } from '../../components/common/RiskBadge';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft,
  GraduationCap,
  CalendarCheck,
  Award,
  AlertTriangle,
  HeartHandshake,
  User,
  MapPin,
  Coins,
  Shield,
  Plus,
  CheckCircle2,
  FileText,
  Clock
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from 'recharts';

export const StudentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();

  const [student, setStudent] = useState<Student | null>(null);
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [behaviors, setBehaviors] = useState<BehaviorRecord[]>([]);
  const [prediction, setPrediction] = useState<PredictionRecord | null>(null);
  const [interventions, setInterventions] = useState<InterventionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form Tambah Catatan Konseling / Intervensi
  const [showInterventionModal, setShowInterventionModal] = useState(false);
  const [intJenis, setIntJenis] = useState('Konseling Individu');
  const [intCatatan, setIntCatatan] = useState('');
  const [intStatus, setIntStatus] = useState<'direncanakan' | 'berjalan' | 'selesai'>('berjalan');
  const [intHasil, setIntHasil] = useState('');
  const [isSavingInt, setIsSavingInt] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const loadStudentData = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [allStd, allAtt, allGrd, allBeh, allPred, allInt] = await Promise.all([
        getAllStudents(),
        getAttendancesByStudent(id),
        getGradesByStudent(id),
        getBehaviorsByStudent(id),
        getAllPredictions(),
        getAllInterventions()
      ]);

      const foundStd = allStd.find((s) => s.id === id);
      setStudent(foundStd || null);
      setAttendances(allAtt);
      setGrades(allGrd);
      setBehaviors(allBeh);

      // Prediksi terbaru
      const stdPreds = allPred.filter((p) => p.studentId === id);
      setPrediction(stdPreds[0] || null);

      // Intervensi
      const stdInts = allInt.filter((i) => i.studentId === id);
      setInterventions(stdInts);
    } catch (e) {
      console.error('Error loading student details:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStudentData();
  }, [id]);

  const handleSaveIntervention = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student || !intCatatan.trim()) return;

    setIsSavingInt(true);
    try {
      await saveIntervention({
        studentId: student.id,
        studentName: student.nama,
        studentClass: student.kelas,
        predictionId: prediction?.id,
        jenis: intJenis,
        catatan: intCatatan.trim(),
        status: intStatus,
        tanggal: new Date().toISOString().slice(0, 10),
        olehUid: currentUser?.uid || 'bk_officer',
        olehNama: currentUser?.nama || 'Guru BK',
        hasil: intHasil.trim() || undefined,
        skorSebelum: prediction?.skor
      });

      setShowInterventionModal(false);
      setIntCatatan('');
      setIntHasil('');
      setFeedbackMsg('Catatan bimbingan & rencana intervensi berhasil ditambahkan ke riwayat siswa!');
      await loadStudentData();
    } catch (err) {
      console.error('Error saving intervention:', err);
      alert('Gagal menyimpan tindak lanjut.');
    } finally {
      setIsSavingInt(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <span className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <span className="ml-2">Memuat dossier siswa...</span>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border">
        <h2 className="text-lg font-bold text-slate-800">Siswa Tidak Ditemukan</h2>
        <Link to="/bk/at-risk" className="mt-4 inline-block text-xs font-bold text-teal-600 hover:underline">
          &larr; Kembali ke daftar siswa berisiko
        </Link>
      </div>
    );
  }

  // Persiapkan data grafik kehadiran bulanan
  const attendanceChartData = attendances
    .sort((a, b) => a.bulan.localeCompare(b.bulan))
    .map((att) => ({
      bulan: att.bulan,
      Hadir: att.hadir,
      Sakit: att.sakit,
      Izin: att.izin,
      Alpa: att.alpa
    }));

  // Persiapkan data grafik nilai mapel
  const latestGrade = grades[0];
  const gradeChartData = latestGrade?.nilaiMapel
    ? Object.entries(latestGrade.nilaiMapel).map(([mapel, nilai]) => ({
        mapel: mapel.length > 8 ? mapel.slice(0, 8) + '..' : mapel,
        fullName: mapel,
        Nilai: nilai,
        KKM: 70
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* TOMBOL KEMBALI */}
      <div className="flex items-center justify-between">
        <Link
          to="/bk/at-risk"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Siswa Berisiko</span>
        </Link>

        <span className="text-xs text-slate-400">
          ID Dokumen: <code className="font-mono">{student.id}</code>
        </span>
      </div>

      {/* FEEDBACK BANNER */}
      {feedbackMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{feedbackMsg}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="font-bold text-slate-500">
            &times;
          </button>
        </div>
      )}

      {/* PROFIL CARD & PREDICTION SCORE */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-teal-500 to-[#0B1F4A] text-white font-black text-2xl sm:text-3xl flex items-center justify-center shadow-md flex-shrink-0">
            {student.nama.charAt(0)}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                {student.nama}
              </h1>
              <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs border border-blue-100">
                Kelas {student.kelas}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold text-xs">
                {student.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
              </span>
            </div>

            <p className="text-xs text-slate-500 mt-1 font-mono">
              NISN: <b>{student.nisn}</b> · Status Siswa: <span className="text-emerald-600 font-bold">Aktif</span>
            </p>

            {/* TAGS LATAR BELAKANG */}
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Keluarga: <b className="capitalize">{student.statusOrtu === 'yatim_piatu' ? 'Yatim Piatu' : student.statusOrtu}</b></span>
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
                <Coins className="w-3.5 h-3.5 text-amber-500" />
                <span>Ekonomi: <b>Skala {student.kondisiEkonomi}/5</b></span>
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
                <MapPin className="w-3.5 h-3.5 text-blue-500" />
                <span>Jarak Rumah: <b>{student.jarakKm} km</b></span>
              </span>

              {student.adaTunggakan && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-red-50 border border-red-200 text-red-700 font-bold">
                  <span>Ada Tunggakan</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* SKOR RISIKO DSS */}
        {prediction ? (
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col items-center text-center w-full lg:w-64 flex-shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Hasil Analitik DSS
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className={`text-4xl font-black font-mono ${
                prediction.skor >= 70 ? 'text-red-600' : prediction.skor >= 40 ? 'text-amber-600' : 'text-emerald-600'
              }`}>
                {prediction.skor}
              </span>
              <span className="text-xs text-slate-400">/ 100</span>
            </div>
            <div className="mt-2">
              <RiskBadge level={prediction.level} size="md" />
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              Faktor Utama: <b>{prediction.faktorUtama}</b>
            </p>
          </div>
        ) : (
          <div className="p-4 bg-slate-50 rounded-2xl border text-center text-xs text-slate-500 w-full lg:w-56">
            Belum ada hasil prediksi terbaru.
          </div>
        )}
      </div>

      {/* RINCIAN KONTRIBUSI 7 FAKTOR DSS */}
      {prediction && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Rincian Kontribusi 7 Faktor DSS</h3>
              <p className="text-xs text-slate-500">
                Transparansi perhitungan SAW (Skor Akhir = Jumlah [Bobot x Skor Ternormalisasi])
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prediction.faktor.map((f, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/70 flex flex-col justify-between"
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{f.nama}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{f.keterangan}</p>
                  </div>
                  <span className="text-xs font-mono font-black text-slate-800 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                    +{f.kontribusi} poin
                  </span>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                    <span>Nilai: <b>{f.nilaiMentah}</b></span>
                    <span>Normal: <b>{f.skorNormal}/100</b> (Bobot {f.bobotPersen}%)</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        f.skorNormal >= 60 ? 'bg-red-500' : f.skorNormal >= 30 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${f.skorNormal}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GRAFIK PRESENSI & NILAI MAPEL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GRAFIK KEHADIRAN */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Riwayat Kehadiran Bulanan</h3>
              <p className="text-xs text-slate-500">Presensi 3 bulan terakhir</p>
            </div>
            <CalendarCheck className="w-5 h-5 text-teal-600" />
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="bulan" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="Hadir" fill="#16A34A" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Sakit" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Izin" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Alpa" fill="#DC2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRAFIK NILAI MAPEL */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Nilai Rapor per Mata Pelajaran</h3>
              <p className="text-xs text-slate-500">
                Rata-rata: <b>{latestGrade?.rataRata || '-'}</b> · KKM: 70
              </p>
            </div>
            <Award className="w-5 h-5 text-blue-600" />
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradeChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="mapel" tick={{ fontSize: 9, fill: '#64748B' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip />
                <Bar dataKey="Nilai" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* REKOMENDASI DSS & RIWAYAT INTERVENSI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* REKOMENDASI OTOMATIS */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <AlertTriangle className="w-4 h-4" />
              </span>
              <h3 className="text-base font-bold text-slate-900">Rekomendasi Tindak Lanjut DSS</h3>
            </div>

            <ul className="space-y-2.5">
              {prediction?.rekomendasi.map((rek, idx) => (
                <li
                  key={idx}
                  className="p-3 rounded-2xl bg-amber-50/50 border border-amber-200/60 text-xs text-amber-900 flex items-start gap-2.5"
                >
                  <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 font-bold flex items-center justify-center flex-shrink-0 text-[10px] mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed font-medium">{rek}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t">
            <button
              onClick={() => setShowInterventionModal(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <HeartHandshake className="w-4 h-4" />
              <span>Tambah Tindak Lanjut / Catatan Konseling</span>
            </button>
          </div>
        </div>

        {/* RIWAYAT INTERVENSI */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">Riwayat Penanganan Siswa</h3>
            <span className="text-xs text-slate-500">{interventions.length} catatan</span>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {interventions.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center italic">
                Belum ada intervensi tercatat untuk siswa ini.
              </p>
            ) : (
              interventions.map((it) => (
                <div
                  key={it.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{it.jenis}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        it.status === 'selesai'
                          ? 'bg-emerald-50 text-emerald-700'
                          : it.status === 'berjalan'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {it.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600">{it.catatan}</p>

                  {it.hasil && (
                    <p className="text-xs text-emerald-700 font-medium bg-emerald-50 p-2 rounded-xl border border-emerald-100">
                      <b>Hasil:</b> {it.hasil}
                    </p>
                  )}

                  <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
                    <span>Oleh: {it.olehNama}</span>
                    <span>{it.tanggal}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* MODAL TAMBAH TINDAK LANJUT */}
      {showInterventionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Tambah Tindak Lanjut / Catatan Konseling
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Siswa: <b>{student.nama}</b> (Kelas {student.kelas})
            </p>

            <form onSubmit={handleSaveIntervention} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Bentuk / Jenis Tindak Lanjut
                </label>
                <select
                  value={intJenis}
                  onChange={(e) => setIntJenis(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                >
                  <option value="Kunjungan Rumah (Home Visit)">Kunjungan Rumah (Home Visit)</option>
                  <option value="Konseling Individu">Konseling Individu</option>
                  <option value="Pemanggilan Orang Tua / Wali">Pemanggilan Orang Tua / Wali</option>
                  <option value="Koordinasi Beasiswa PIP / KIP">Koordinasi Beasiswa PIP / KIP</option>
                  <option value="Rujukan Bimbingan Belajar Tambahan">Rujukan Bimbingan Belajar Tambahan</option>
                  <option value="Mentoring Wali Kelas">Mentoring Wali Kelas</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Status Penanganan
                </label>
                <select
                  value={intStatus}
                  onChange={(e) => setIntStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                >
                  <option value="direncanakan">Direncanakan</option>
                  <option value="berjalan">Sedang Berjalan</option>
                  <option value="selesai">Selesai / Tuntas</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Proses Konseling / Pertemuan <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={intCatatan}
                  onChange={(e) => setIntCatatan(e.target.value)}
                  placeholder="Deskripsikan proses konseling, akar masalah yang disampaikan siswa/wali, serta kesepakatan..."
                  required
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Hasil / Perkembangan Tindak Lanjut
                </label>
                <textarea
                  rows={2}
                  value={intHasil}
                  onChange={(e) => setIntHasil(e.target.value)}
                  placeholder="Catatan perkembangan kehadiran atau kesepakatan komitmen..."
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                />
              </div>

              <div className="mt-6 pt-4 border-t flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowInterventionModal(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingInt}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  {isSavingInt ? 'Menyimpan...' : 'Simpan Tindak Lanjut'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
