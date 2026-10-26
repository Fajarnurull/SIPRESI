import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getAllStudents,
  getAttendancesByStudent,
  getGradesByStudent,
  getMessagesByStudent,
  markMessageRead
} from '../../lib/storage';
import { Student, AttendanceRecord, GradeRecord, MessageRecord } from '../../types';
import {
  GraduationCap,
  CalendarCheck,
  Award,
  MessageSquare,
  CheckCircle2,
  BookOpen,
  Clock,
  Sparkles
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

export const StudentDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const allStudents = await getAllStudents();
      // Cari student matching studentId atau identitas NISN
      const std =
        allStudents.find((s) => s.id === currentUser?.studentId) ||
        allStudents.find((s) => s.nisn === currentUser?.identitas) ||
        allStudents[0];

      if (std) {
        setStudent(std);
        const [attList, grdList, msgList] = await Promise.all([
          getAttendancesByStudent(std.id),
          getGradesByStudent(std.id),
          getMessagesByStudent(std.id)
        ]);
        setAttendances(attList);
        setGrades(grdList);
        setMessages(msgList);
      }
    } catch (e) {
      console.error('Error loading student dashboard:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleMarkAsRead = async (msgId: string) => {
    await markMessageRead(msgId);
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, dibaca: true } : m))
    );
  };

  // Presensi bulan ini
  const sortedAtt = [...attendances].sort((a, b) => b.bulan.localeCompare(a.bulan));
  const currentAtt = sortedAtt[0] || {
    bulan: '2026-10',
    hariEfektif: 20,
    hadir: 18,
    sakit: 1,
    izin: 1,
    alpa: 0
  };

  const attPercentage = currentAtt.hariEfektif > 0
    ? Math.round((currentAtt.hadir / currentAtt.hariEfektif) * 100)
    : 100;

  // Data grafik presensi
  const attChartData = [...attendances]
    .sort((a, b) => a.bulan.localeCompare(b.bulan))
    .map((a) => ({
      bulan: a.bulan,
      Hadir: a.hadir,
      Sakit: a.sakit,
      Izin: a.izin,
      Alpa: a.alpa
    }));

  // Nilai rapor terbaru
  const latestGrade = grades[0];
  const gradeChartData = latestGrade?.nilaiMapel
    ? Object.entries(latestGrade.nilaiMapel).map(([mapel, nilai]) => ({
        mapel: mapel.length > 7 ? mapel.slice(0, 7) + '..' : mapel,
        fullName: mapel,
        Nilai: nilai,
        KKM: 70
      }))
    : [];

  const unreadMessagesCount = messages.filter((m) => !m.dibaca).length;

  return (
    <div className="space-y-6">
      {/* HEADER BANNER SISWA */}
      <div className="bg-gradient-to-r from-[#16A34A] via-[#15803D] to-[#0B1F4A] rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="relative z-10 max-w-xl">
          <span className="text-[11px] font-bold uppercase tracking-wider bg-white/10 text-emerald-200 px-3 py-1 rounded-full border border-white/10">
            Portal Belajar Siswa
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-2 leading-tight">
            Selamat Datang, {student?.nama || currentUser?.nama || 'Siswa'}!
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 mt-2 leading-relaxed">
            Pantau kehadiran belajar harianmu, capaian nilai rapor semester, dan pesan bimbingan dari Guru BK untuk terus berprestasi.
          </p>
        </div>

        <div className="relative z-10 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center flex-shrink-0 w-full sm:w-auto">
          <p className="text-xs text-emerald-200 font-medium">Kelas Kamu:</p>
          <p className="text-2xl font-black text-white mt-0.5">
            Kelas {student?.kelas || '8B'}
          </p>
          <p className="text-[11px] text-emerald-200 font-mono mt-1">
            NISN: {student?.nisn || currentUser?.identitas}
          </p>
        </div>
      </div>

      {/* 4 KARTU STATISTIK SISWA (MURNI INFORMATIF TANPA STIGMA RISIKO) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Persentase Kehadiran */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Kehadiran Bulan Ini
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-700">{attPercentage}%</span>
            <span className="text-xs text-slate-500">
              ({currentAtt.hadir}/{currentAtt.hariEfektif} hari)
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-100 mt-2 overflow-hidden">
            <div className="h-full rounded-full bg-emerald-600" style={{ width: `${attPercentage}%` }} />
          </div>
        </div>

        {/* Rata-Rata Nilai Rapor */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Rata-Rata Nilai
            </span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-blue-700">
              {latestGrade?.rataRata ? latestGrade.rataRata.toFixed(1) : '-'}
            </span>
            <span className="text-xs text-slate-500">dari 100</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            KKM Sekolah: 70.0
          </p>
        </div>

        {/* Status Presensi Hari Ini */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Status Presensi
            </span>
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Siswa Aktif Terdaftar
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Alpa bulan ini: <b>{currentAtt.alpa} hari</b>
          </p>
        </div>

        {/* Pesan Bimbingan */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pesan dari Guru BK
            </span>
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-purple-700">{messages.length}</span>
            <span className="text-xs text-purple-600 font-bold">
              ({unreadMessagesCount} baru)
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Pesan bimbingan & informasi beasiswa
          </p>
        </div>
      </div>

      {/* GRAFIK PRESENSI & NILAI MAPEL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GRAFIK PRESENSI */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Grafik Kehadiran Belajarmu</h3>
              <p className="text-xs text-slate-500">Presensi per bulan semester berjalan</p>
            </div>
            <CalendarCheck className="w-5 h-5 text-emerald-600" />
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attChartData}>
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

        {/* GRAFIK CAPAIAN NILAI RAPOR */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Nilai Mata Pelajaran Semester</h3>
              <p className="text-xs text-slate-500">Capaian hasil belajar tiap mata pelajaran</p>
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

      {/* PESAN DARI GURU BK (DENGAN TANDAI SUDAH DIBACA) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Pesan & Catatan Bimbingan dari Guru BK
            </h3>
            <p className="text-xs text-slate-500">
              Bimbingan motivasi, pengumuman beasiswa PIP/KIP, atau undangan konseling
            </p>
          </div>
          {unreadMessagesCount > 0 && (
            <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
              {unreadMessagesCount} Pesan Baru Belum Dibaca
            </span>
          )}
        </div>

        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs italic">
              Belum ada pesan dari Guru BK saat ini. Tetap semangat belajarnya!
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`p-4 rounded-2xl border transition-all ${
                  m.dibaca
                    ? 'bg-slate-50/70 border-slate-200/80'
                    : 'bg-emerald-50/40 border-emerald-300 shadow-xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs">
                      BK
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{m.dariNama}</p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(m.tanggal).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  {!m.dibaca && (
                    <button
                      onClick={() => handleMarkAsRead(m.id)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors self-start sm:self-auto flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Tandai Sudah Dibaca</span>
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-700 leading-relaxed pl-10">
                  {m.isi}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
