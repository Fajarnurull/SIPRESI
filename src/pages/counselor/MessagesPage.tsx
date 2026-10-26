import React, { useState, useEffect } from 'react';
import {
  getAllStudents,
  getAllMessages,
  sendMessage
} from '../../lib/storage';
import { Student, MessageRecord } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  MessageSquare,
  Send,
  User,
  CheckCheck,
  Clock,
  CheckCircle2
} from 'lucide-react';

export const MessagesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadData = async () => {
    const [sList, mList] = await Promise.all([getAllStudents(), getAllMessages()]);
    setStudents(sList);
    setMessages(mList);
    if (sList.length > 0 && !selectedStudentId) {
      setSelectedStudentId(sList[0].id);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const studentMap = new Map<string, Student>();
  students.forEach((s) => studentMap.set(s.id, s));

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !messageText.trim()) return;

    setIsSending(true);
    try {
      await sendMessage({
        studentId: selectedStudentId,
        dari: currentUser?.uid || 'guru_bk',
        dariNama: currentUser?.nama || 'Guru BK (Bimbingan Konseling)',
        isi: messageText.trim()
      });

      setMessageText('');
      setFeedback('Pesan motivasi / bimbingan berhasil dikirim ke portal siswa!');
      await loadData();
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Gagal mengirim pesan.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Kirim Pesan Bimbingan Siswa</h1>
        <p className="text-xs text-slate-500 mt-1">
          Kirim pesan apresiasi, motivasi, atau pengumuman bimbingan belajar langsung ke akun portal siswa.
        </p>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="font-bold text-slate-500">
            &times;
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FORM KIRIM PESAN */}
        <div className="lg:col-span-1 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs h-fit">
          <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Tulis Pesan Baru</h3>
          </div>

          <form onSubmit={handleSend} className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pilih Siswa Penerima <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:border-teal-500"
                required
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nama} ({s.kelas} - NISN: {s.nisn})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Isi Pesan / Catatan Suportif <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={5}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Tulis pesan pengingat jadwal, dorongan semangat belajar, atau panggilan ke ruang BK..."
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:border-teal-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSending || !messageText.trim()}
              className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSending ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>Kirim Pesan ke Siswa</span>
            </button>
          </form>
        </div>

        {/* RIWAYAT PESAN TERKIRIM */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Riwayat Pesan Terkirim</h3>
              <p className="text-xs text-slate-500">
                Pesan bimbingan yang dikirimkan oleh Guru BK ke akun masing-masing siswa
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
              {messages.length} pesan
            </span>
          </div>

          <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
            {messages.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                Belum ada pesan yang dikirimkan.
              </div>
            ) : (
              messages.map((m) => {
                const std = studentMap.get(m.studentId);
                return (
                  <div
                    key={m.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 hover:bg-slate-50/90 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs">
                          {std?.nama?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            Kepada: {std?.nama || m.studentId} ({std?.kelas})
                          </p>
                          <p className="text-[10px] text-slate-400">Pengirim: {m.dariNama}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px]">
                        {m.dibaca ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>Dibaca</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Terkirim</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed pl-9">
                      {m.isi}
                    </p>

                    <div className="text-[10px] text-slate-400 text-right">
                      {new Date(m.tanggal).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
