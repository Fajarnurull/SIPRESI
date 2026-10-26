export type UserRole = 'admin' | 'guru_bk' | 'kepala_sekolah' | 'siswa';

export type RiskLevel = 'rendah' | 'sedang' | 'tinggi';

export type ParentStatus = 'lengkap' | 'yatim' | 'piatu' | 'yatim_piatu' | 'wali';

export type InterventionStatus = 'direncanakan' | 'berjalan' | 'selesai';

export interface UserProfile {
  uid: string;
  nama: string;
  role: UserRole;
  identitas: string; // Username Admin / NIP / NISN
  email: string;
  aktif: boolean;
  studentId?: string; // Khusus siswa
  createdAt: string;
}

export interface LoginIndexItem {
  email: string;
  role: UserRole;
}

export interface Student {
  id: string;
  nama: string;
  nisn: string;
  kelas: string; // misal "7A", "8B", "9C"
  jenisKelamin: 'L' | 'P';
  statusOrtu: ParentStatus;
  kondisiEkonomi: number; // 1-5 (1 = sangat mampu, 5 = sangat rentan)
  jarakKm: number;
  adaTunggakan: boolean;
  aktif: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AttendanceRecord {
  id: string; // studentId_YYYY-MM
  studentId: string;
  bulan: string; // YYYY-MM
  hariEfektif: number;
  hadir: number;
  sakit: number;
  izin: number;
  alpa: number;
  updatedAt?: string;
}

export interface SubjectGrade {
  mapel: string;
  nilai: number;
}

export interface GradeRecord {
  id: string; // studentId_semester
  studentId: string;
  semester: string; // misal "2026/2027 Ganjil"
  rataRata: number;
  nilaiMapel: Record<string, number>;
  rataRataSebelumnya?: number;
  updatedAt?: string;
}

export interface BehaviorRecord {
  id: string;
  studentId: string;
  tanggal: string; // YYYY-MM-DD
  jenis: 'pelanggaran' | 'catatan_bk' | 'prestasi';
  poin: number; // nilai pelanggaran (positif)
  keterangan: string;
  dicatatOleh: string; // nama guru / BK
  createdAt?: string;
}

export interface FactorContribution {
  nama: string;
  bobotPersen: number;
  nilaiMentah: string | number;
  skorNormal: number; // 0-100
  kontribusi: number; // (bobot * normal)
  keterangan: string;
}

export interface PredictionRecord {
  id: string;
  studentId: string;
  studentName?: string;
  studentClass?: string;
  studentNisn?: string;
  tanggal: string; // ISO date string
  skor: number; // 0 - 100
  level: RiskLevel;
  faktor: FactorContribution[];
  rekomendasi: string[];
  dijalankanOleh: string; // Nama / UID penginput
  faktorUtama?: string;
}

export interface InterventionRecord {
  id: string;
  studentId: string;
  studentName?: string;
  studentClass?: string;
  predictionId?: string;
  jenis: string; // misal "Kunjungan Rumah (Home Visit)", "Konseling Individu", "Panggilan Orang Tua", dll.
  catatan: string;
  status: InterventionStatus;
  tanggal: string; // YYYY-MM-DD
  olehUid: string;
  olehNama: string;
  hasil?: string;
  skorSebelum?: number;
  skorSesudah?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface MessageRecord {
  id: string;
  studentId: string;
  dari: string; // UID Guru BK
  dariNama: string;
  isi: string;
  tanggal: string; // ISO string
  dibaca: boolean;
}

export interface ModelWeights {
  absence: number; // default 35
  lowGrades: number; // default 20
  gradeTrend: number; // default 15
  behavior: number; // default 10
  economy: number; // default 10
  distance: number; // default 5
  parentStatus: number; // default 5
}

export interface ModelThresholds {
  high: number; // default 70
  medium: number; // default 40
}

export interface ModelSettings {
  weights: ModelWeights;
  thresholds: ModelThresholds;
  updatedAt?: string;
  updatedBy?: string;
}

export interface InitSettings {
  initialized: boolean;
  adminUid: string;
  adminEmail: string;
  createdAt: string;
}
