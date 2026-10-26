import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getAllStudents,
  getMessagesByStudent,
  markMessageRead
} from '../../lib/storage';
import { MessageRecord, Student } from '../../types';
import { MessageSquare, CheckCircle2, Clock } from 'lucide-react';

export const StudentMessagesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadMessages = async () => {
    setIsLoading(true);
    try {
      const allStudents = await getAllStudents();
      const std =
        allStudents.find((s) => s.id === currentUser?.studentId) ||
        allStudents.find((s) => s.nisn === currentUser?.identitas) ||
        allStudents[0];

      if (std) {
        const msgList = await getMessagesByStudent(std.id);
        setMessages(msgList);
      }
    } catch (e) {
      console.error('Error loading messages:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [currentUser]);

  const handleMarkAsRead = async (msgId: string) => {
    await markMessageRead(msgId);
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, dibaca: true } : m))
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pesan dari Guru BK</h1>
        <p className="text-xs text-slate-500 mt-1">
          Kotak masuk bimbingan belajar, konsultasi siswa, dan pengumuman dukungan pendidikan.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        {isLoading ? (
          <div className="py-12 text-center text-slate-400 text-xs">Memuat pesan...</div>
        ) : messages.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs italic">
            Belum ada pesan dari Guru BK untukmu.
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
                <div className="flex items-center gap-2.5">
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
  );
};
