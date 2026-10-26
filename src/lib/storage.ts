import {
  UserProfile,
  LoginIndexItem,
  Student,
  AttendanceRecord,
  GradeRecord,
  BehaviorRecord,
  PredictionRecord,
  InterventionRecord,
  MessageRecord,
  ModelSettings,
  InitSettings
} from '../types';
import { DEFAULT_MODEL_SETTINGS, runStudentPrediction } from './prediction';
import { isFirebaseConfigured, db, secondaryAuth } from '../firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

// Kunci penyimpanan lokal
const STORAGE_KEYS = {
  USERS: 'sipresi_users',
  LOGIN_INDEX: 'sipresi_login_index',
  STUDENTS: 'sipresi_students',
  ATTENDANCE: 'sipresi_attendance',
  GRADES: 'sipresi_grades',
  BEHAVIORS: 'sipresi_behaviors',
  PREDICTIONS: 'sipresi_predictions',
  INTERVENTIONS: 'sipresi_interventions',
  MESSAGES: 'sipresi_messages',
  MODEL_SETTINGS: 'sipresi_model_settings',
  INIT_SETTINGS: 'sipresi_init_settings'
};

// Helper untuk membaca dari localStorage
function getLocalItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch (err) {
    console.error(`Error reading ${key} from localStorage:`, err);
    return defaultValue;
  }
}

// Helper untuk menulis ke localStorage
function setLocalItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error writing ${key} to localStorage:`, err);
  }
}

// ==========================================
// 1. PENGATURAN AWAL / INIT SETTINGS
// ==========================================
export async function getInitSettings(): Promise<InitSettings | null> {
  if (isFirebaseConfigured() && db) {
    try {
      const snap = await getDoc(doc(db, 'settings', 'init'));
      return snap.exists() ? (snap.data() as InitSettings) : null;
    } catch (e) {
      console.warn('Firestore getInitSettings fallback:', e);
    }
  }
  return getLocalItem<InitSettings | null>(STORAGE_KEYS.INIT_SETTINGS, null);
}

export async function initializeFirstAdmin(
  nama: string,
  username: string,
  email: string,
  uid: string
): Promise<InitSettings> {
  const initData: InitSettings = {
    initialized: true,
    adminUid: uid,
    adminEmail: email,
    createdAt: new Date().toISOString()
  };

  const adminProfile: UserProfile = {
    uid,
    nama,
    role: 'admin',
    identitas: username,
    email,
    aktif: true,
    createdAt: new Date().toISOString()
  };

  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, 'settings', 'init'), initData);
      await setDoc(doc(db, 'users', uid), adminProfile);
      await setDoc(doc(db, 'loginIndex', username), { email, role: 'admin' });
      await setDoc(doc(db, 'settings', 'weights'), DEFAULT_MODEL_SETTINGS);
    } catch (e) {
      console.error('Firestore init error:', e);
    }
  }

  // Simpan juga ke local storage
  setLocalItem(STORAGE_KEYS.INIT_SETTINGS, initData);
  const users = getLocalItem<UserProfile[]>(STORAGE_KEYS.USERS, []);
  if (!users.some(u => u.uid === uid)) {
    users.push(adminProfile);
    setLocalItem(STORAGE_KEYS.USERS, users);
  }
  const loginIdx = getLocalItem<Record<string, LoginIndexItem>>(STORAGE_KEYS.LOGIN_INDEX, {});
  loginIdx[username] = { email, role: 'admin' };
  setLocalItem(STORAGE_KEYS.LOGIN_INDEX, loginIdx);

  return initData;
}

// ==========================================
// 2. KELOLA PENGGUNA & LOGIN INDEX
// ==========================================
export async function getLoginIndexItem(identitas: string): Promise<LoginIndexItem | null> {
  if (isFirebaseConfigured() && db) {
    try {
      const snap = await getDoc(doc(db, 'loginIndex', identitas));
      if (snap.exists()) {
        return snap.data() as LoginIndexItem;
      }
    } catch (e) {
      console.warn('Firestore getLoginIndexItem error:', e);
    }
  }
  const map = getLocalItem<Record<string, LoginIndexItem>>(STORAGE_KEYS.LOGIN_INDEX, {});
  return map[identitas] || null;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (isFirebaseConfigured() && db) {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        return snap.data() as UserProfile;
      }
    } catch (e) {
      console.warn('Firestore getUserProfile error:', e);
    }
  }
  const users = getLocalItem<UserProfile[]>(STORAGE_KEYS.USERS, []);
  return users.find(u => u.uid === uid) || null;
}

export async function getAllUsers(): Promise<UserProfile[]> {
  if (isFirebaseConfigured() && db) {
    try {
      const snap = await getDocs(collection(db, 'users'));
      return snap.docs.map(d => d.data() as UserProfile);
    } catch (e) {
      console.warn('Firestore getAllUsers fallback:', e);
    }
  }
  return getLocalItem<UserProfile[]>(STORAGE_KEYS.USERS, []);
}

export async function createNewUser(
  profile: Omit<UserProfile, 'uid' | 'createdAt'>,
  password: string
): Promise<UserProfile> {
  let newUid = `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  // Jika Firestore & secondaryAuth aktif
  if (isFirebaseConfigured() && secondaryAuth && db) {
    try {
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, profile.email, password);
      newUid = userCredential.user.uid;
    } catch (err: unknown) {
      console.error('Firebase Auth createUser error:', err);
      // Lanjutkan dengan fallback UID jika offline/dev
    }
  }

  const fullProfile: UserProfile = {
    ...profile,
    uid: newUid,
    createdAt: new Date().toISOString()
  };

  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, 'users', newUid), fullProfile);
      await setDoc(doc(db, 'loginIndex', profile.identitas), {
        email: profile.email,
        role: profile.role
      });
    } catch (e) {
      console.warn('Firestore write user error:', e);
    }
  }

  // Update local storage
  const users = getLocalItem<UserProfile[]>(STORAGE_KEYS.USERS, []);
  const idx = users.findIndex(u => u.identitas === profile.identitas);
  if (idx >= 0) {
    users[idx] = fullProfile;
  } else {
    users.push(fullProfile);
  }
  setLocalItem(STORAGE_KEYS.USERS, users);

  const loginIdx = getLocalItem<Record<string, LoginIndexItem>>(STORAGE_KEYS.LOGIN_INDEX, {});
  loginIdx[profile.identitas] = { email: profile.email, role: profile.role };
  setLocalItem(STORAGE_KEYS.LOGIN_INDEX, loginIdx);

  // Simpan juga password di demo credentials store jika local mode
  const passwords = getLocalItem<Record<string, string>>('sipresi_passwords', {});
  passwords[profile.email] = password;
  setLocalItem('sipresi_passwords', passwords);

  return fullProfile;
}

export async function toggleUserStatus(uid: string, aktif: boolean): Promise<void> {
  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, 'users', uid), { aktif }, { merge: true });
    } catch (e) {
      console.warn('Firestore toggleUserStatus error:', e);
    }
  }
  const users = getLocalItem<UserProfile[]>(STORAGE_KEYS.USERS, []);
  const target = users.find(u => u.uid === uid);
  if (target) {
    target.aktif = aktif;
    setLocalItem(STORAGE_KEYS.USERS, users);
  }
}

// ==========================================
// 3. DATA SISWA
// ==========================================
export async function getAllStudents(): Promise<Student[]> {
  if (isFirebaseConfigured() && db) {
    try {
      const snap = await getDocs(collection(db, 'students'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Student));
    } catch (e) {
      console.warn('Firestore getAllStudents fallback:', e);
    }
  }
  return getLocalItem<Student[]>(STORAGE_KEYS.STUDENTS, []);
}

export async function saveStudent(student: Partial<Student> & { nisn: string; nama: string; kelas: string }): Promise<Student> {
  const id = student.id || `std_${student.nisn}`;
  const now = new Date().toISOString();

  const fullStudent: Student = {
    id,
    nama: student.nama,
    nisn: student.nisn,
    kelas: student.kelas,
    jenisKelamin: student.jenisKelamin || 'L',
    statusOrtu: student.statusOrtu || 'lengkap',
    kondisiEkonomi: student.kondisiEkonomi || 3,
    jarakKm: student.jarakKm || 2,
    adaTunggakan: Boolean(student.adaTunggakan),
    aktif: student.aktif !== undefined ? student.aktif : true,
    updatedAt: now,
    createdAt: student.createdAt || now
  };

  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, 'students', id), fullStudent);
    } catch (e) {
      console.warn('Firestore saveStudent error:', e);
    }
  }

  const list = getLocalItem<Student[]>(STORAGE_KEYS.STUDENTS, []);
  const idx = list.findIndex(s => s.id === id);
  if (idx >= 0) {
    list[idx] = fullStudent;
  } else {
    list.push(fullStudent);
  }
  setLocalItem(STORAGE_KEYS.STUDENTS, list);

  return fullStudent;
}

export async function deleteStudent(id: string): Promise<void> {
  if (isFirebaseConfigured() && db) {
    try {
      await deleteDoc(doc(db, 'students', id));
    } catch (e) {
      console.warn('Firestore deleteStudent error:', e);
    }
  }
  const list = getLocalItem<Student[]>(STORAGE_KEYS.STUDENTS, []);
  setLocalItem(STORAGE_KEYS.STUDENTS, list.filter(s => s.id !== id));
}

// ==========================================
// 4. DATA KEHADIRAN / ATTENDANCE
// ==========================================
export async function getAttendancesByStudent(studentId: string): Promise<AttendanceRecord[]> {
  if (isFirebaseConfigured() && db) {
    try {
      const q = query(collection(db, 'attendance'), where('studentId', '==', studentId));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as AttendanceRecord));
    } catch (e) {
      console.warn('Firestore getAttendancesByStudent fallback:', e);
    }
  }
  const list = getLocalItem<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, []);
  return list.filter(a => a.studentId === studentId);
}

export async function getAllAttendances(): Promise<AttendanceRecord[]> {
  if (isFirebaseConfigured() && db) {
    try {
      const snap = await getDocs(collection(db, 'attendance'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as AttendanceRecord));
    } catch (e) {
      console.warn('Firestore getAllAttendances fallback:', e);
    }
  }
  return getLocalItem<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, []);
}

export async function saveAttendance(att: AttendanceRecord): Promise<void> {
  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, 'attendance', att.id), att);
    } catch (e) {
      console.warn('Firestore saveAttendance error:', e);
    }
  }
  const list = getLocalItem<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, []);
  const idx = list.findIndex(a => a.id === att.id);
  if (idx >= 0) {
    list[idx] = att;
  } else {
    list.push(att);
  }
  setLocalItem(STORAGE_KEYS.ATTENDANCE, list);
}

// ==========================================
// 5. DATA NILAI & PERILAKU
// ==========================================
export async function getAllGrades(): Promise<GradeRecord[]> {
  if (isFirebaseConfigured() && db) {
    try {
      const snap = await getDocs(collection(db, 'grades'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as GradeRecord));
    } catch (e) {
      console.warn('Firestore getAllGrades fallback:', e);
    }
  }
  return getLocalItem<GradeRecord[]>(STORAGE_KEYS.GRADES, []);
}

export async function getGradesByStudent(studentId: string): Promise<GradeRecord[]> {
  if (isFirebaseConfigured() && db) {
    try {
      const q = query(collection(db, 'grades'), where('studentId', '==', studentId));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as GradeRecord));
    } catch (e) {
      console.warn('Firestore getGradesByStudent fallback:', e);
    }
  }
  const list = getLocalItem<GradeRecord[]>(STORAGE_KEYS.GRADES, []);
  return list.filter(g => g.studentId === studentId);
}

export async function saveGrade(grade: GradeRecord): Promise<void> {
  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, 'grades', grade.id), grade);
    } catch (e) {
      console.warn('Firestore saveGrade error:', e);
    }
  }
  const list = getLocalItem<GradeRecord[]>(STORAGE_KEYS.GRADES, []);
  const idx = list.findIndex(g => g.id === grade.id);
  if (idx >= 0) {
    list[idx] = grade;
  } else {
    list.push(grade);
  }
  setLocalItem(STORAGE_KEYS.GRADES, list);
}

export async function getAllBehaviors(): Promise<BehaviorRecord[]> {
  if (isFirebaseConfigured() && db) {
    try {
      const snap = await getDocs(collection(db, 'behaviors'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as BehaviorRecord));
    } catch (e) {
      console.warn('Firestore getAllBehaviors fallback:', e);
    }
  }
  return getLocalItem<BehaviorRecord[]>(STORAGE_KEYS.BEHAVIORS, []);
}

export async function getBehaviorsByStudent(studentId: string): Promise<BehaviorRecord[]> {
  if (isFirebaseConfigured() && db) {
    try {
      const q = query(collection(db, 'behaviors'), where('studentId', '==', studentId));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as BehaviorRecord));
    } catch (e) {
      console.warn('Firestore getBehaviorsByStudent fallback:', e);
    }
  }
  const list = getLocalItem<BehaviorRecord[]>(STORAGE_KEYS.BEHAVIORS, []);
  return list.filter(b => b.studentId === studentId);
}

export async function saveBehavior(b: Omit<BehaviorRecord, 'id'> & { id?: string }): Promise<BehaviorRecord> {
  const id = b.id || `beh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const record: BehaviorRecord = { ...b, id };

  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, 'behaviors', id), record);
    } catch (e) {
      console.warn('Firestore saveBehavior error:', e);
    }
  }
  const list = getLocalItem<BehaviorRecord[]>(STORAGE_KEYS.BEHAVIORS, []);
  const idx = list.findIndex(item => item.id === id);
  if (idx >= 0) {
    list[idx] = record;
  } else {
    list.push(record);
  }
  setLocalItem(STORAGE_KEYS.BEHAVIORS, list);
  return record;
}

export async function deleteBehavior(id: string): Promise<void> {
  if (isFirebaseConfigured() && db) {
    try {
      await deleteDoc(doc(db, 'behaviors', id));
    } catch (e) {
      console.warn('Firestore deleteBehavior error:', e);
    }
  }
  const list = getLocalItem<BehaviorRecord[]>(STORAGE_KEYS.BEHAVIORS, []);
  setLocalItem(STORAGE_KEYS.BEHAVIORS, list.filter(b => b.id !== id));
}

// ==========================================
// 6. HASIL PREDIKSI (DSS)
// ==========================================
export async function getAllPredictions(): Promise<PredictionRecord[]> {
  if (isFirebaseConfigured() && db) {
    try {
      const snap = await getDocs(collection(db, 'predictions'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as PredictionRecord));
    } catch (e) {
      console.warn('Firestore getAllPredictions fallback:', e);
    }
  }
  return getLocalItem<PredictionRecord[]>(STORAGE_KEYS.PREDICTIONS, []);
}

export async function savePrediction(pred: PredictionRecord): Promise<void> {
  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, 'predictions', pred.id), pred);
    } catch (e) {
      console.warn('Firestore savePrediction error:', e);
    }
  }
  const list = getLocalItem<PredictionRecord[]>(STORAGE_KEYS.PREDICTIONS, []);
  const idx = list.findIndex(p => p.id === pred.id);
  if (idx >= 0) {
    list[idx] = pred;
  } else {
    list.unshift(pred);
  }
  setLocalItem(STORAGE_KEYS.PREDICTIONS, list);
}

// ==========================================
// 7. TINDAK LANJUT / INTERVENSI
// ==========================================
export async function getAllInterventions(): Promise<InterventionRecord[]> {
  if (isFirebaseConfigured() && db) {
    try {
      const snap = await getDocs(collection(db, 'interventions'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as InterventionRecord));
    } catch (e) {
      console.warn('Firestore getAllInterventions fallback:', e);
    }
  }
  return getLocalItem<InterventionRecord[]>(STORAGE_KEYS.INTERVENTIONS, []);
}

export async function saveIntervention(data: Omit<InterventionRecord, 'id'> & { id?: string }): Promise<InterventionRecord> {
  const id = data.id || `int_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const record: InterventionRecord = {
    ...data,
    id,
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, 'interventions', id), record);
    } catch (e) {
      console.warn('Firestore saveIntervention error:', e);
    }
  }
  const list = getLocalItem<InterventionRecord[]>(STORAGE_KEYS.INTERVENTIONS, []);
  const idx = list.findIndex(i => i.id === id);
  if (idx >= 0) {
    list[idx] = record;
  } else {
    list.unshift(record);
  }
  setLocalItem(STORAGE_KEYS.INTERVENTIONS, list);
  return record;
}

// ==========================================
// 8. PESAN SISWA
// ==========================================
export async function getMessagesByStudent(studentId: string): Promise<MessageRecord[]> {
  if (isFirebaseConfigured() && db) {
    try {
      const q = query(collection(db, 'messages'), where('studentId', '==', studentId));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as MessageRecord));
    } catch (e) {
      console.warn('Firestore getMessagesByStudent fallback:', e);
    }
  }
  const list = getLocalItem<MessageRecord[]>(STORAGE_KEYS.MESSAGES, []);
  return list.filter(m => m.studentId === studentId);
}

export async function getAllMessages(): Promise<MessageRecord[]> {
  if (isFirebaseConfigured() && db) {
    try {
      const snap = await getDocs(collection(db, 'messages'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as MessageRecord));
    } catch (e) {
      console.warn('Firestore getAllMessages fallback:', e);
    }
  }
  return getLocalItem<MessageRecord[]>(STORAGE_KEYS.MESSAGES, []);
}

export async function sendMessage(msg: Omit<MessageRecord, 'id' | 'tanggal' | 'dibaca'>): Promise<MessageRecord> {
  const id = `msg_${Date.now()}`;
  const record: MessageRecord = {
    ...msg,
    id,
    tanggal: new Date().toISOString(),
    dibaca: false
  };

  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, 'messages', id), record);
    } catch (e) {
      console.warn('Firestore sendMessage error:', e);
    }
  }
  const list = getLocalItem<MessageRecord[]>(STORAGE_KEYS.MESSAGES, []);
  list.unshift(record);
  setLocalItem(STORAGE_KEYS.MESSAGES, list);
  return record;
}

export async function markMessageRead(id: string): Promise<void> {
  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, 'messages', id), { dibaca: true }, { merge: true });
    } catch (e) {
      console.warn('Firestore markMessageRead error:', e);
    }
  }
  const list = getLocalItem<MessageRecord[]>(STORAGE_KEYS.MESSAGES, []);
  const target = list.find(m => m.id === id);
  if (target) {
    target.dibaca = true;
    setLocalItem(STORAGE_KEYS.MESSAGES, list);
  }
}

// ==========================================
// 9. MODEL SETTINGS (BOBOT & AMBANG BATAS)
// ==========================================
export async function getModelSettings(): Promise<ModelSettings> {
  if (isFirebaseConfigured() && db) {
    try {
      const snap = await getDoc(doc(db, 'settings', 'weights'));
      if (snap.exists()) {
        return snap.data() as ModelSettings;
      }
    } catch (e) {
      console.warn('Firestore getModelSettings fallback:', e);
    }
  }
  return getLocalItem<ModelSettings>(STORAGE_KEYS.MODEL_SETTINGS, DEFAULT_MODEL_SETTINGS);
}

export async function saveModelSettings(settings: ModelSettings): Promise<void> {
  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, 'settings', 'weights'), settings);
    } catch (e) {
      console.warn('Firestore saveModelSettings error:', e);
    }
  }
  setLocalItem(STORAGE_KEYS.MODEL_SETTINGS, settings);
}

// ==========================================
// 10. GENERATOR DATA CONTOH (~60 SISWA FIKTIF)
// ==========================================
export async function seedSampleData(overwrite: boolean = false): Promise<{ count: number }> {
  const existingStudents = await getAllStudents();
  if (existingStudents.length > 0 && !overwrite) {
    return { count: existingStudents.length };
  }

  // Akun Default
  const defaultUsers: UserProfile[] = [
    {
      uid: 'user_admin_01',
      nama: 'H. Sudarsono, M.Pd.',
      role: 'admin',
      identitas: 'admin',
      email: 'admin.smpn2wanadadi@sekolah.id',
      aktif: true,
      createdAt: new Date().toISOString()
    },
    {
      uid: 'user_bk_01',
      nama: 'Sri Wahyuningsih, S.Psi., M.Pd.',
      role: 'guru_bk',
      identitas: '198506122010011005',
      email: 'sri.wahyuni@smpn2wanadadi.sch.id',
      aktif: true,
      createdAt: new Date().toISOString()
    },
    {
      uid: 'user_ks_01',
      nama: 'Drs. Bambang Tejo Pramono, M.M.',
      role: 'kepala_sekolah',
      identitas: '197204151998021002',
      email: 'kepsek@smpn2wanadadi.sch.id',
      aktif: true,
      createdAt: new Date().toISOString()
    },
    {
      uid: 'user_siswa_01',
      nama: 'Aditya Pratama (Fiktif)',
      role: 'siswa',
      identitas: '0091234567',
      email: 'aditya.pratama@siswa.smpn2wanadadi.sch.id',
      studentId: 'std_0091234567',
      aktif: true,
      createdAt: new Date().toISOString()
    }
  ];

  const defaultLoginIndex: Record<string, LoginIndexItem> = {
    'admin': { email: 'admin.smpn2wanadadi@sekolah.id', role: 'admin' },
    '198506122010011005': { email: 'sri.wahyuni@smpn2wanadadi.sch.id', role: 'guru_bk' },
    '197204151998021002': { email: 'kepsek@smpn2wanadadi.sch.id', role: 'kepala_sekolah' },
    '0091234567': { email: 'aditya.pratama@siswa.smpn2wanadadi.sch.id', role: 'siswa' }
  };

  const passwords: Record<string, string> = {
    'admin.smpn2wanadadi@sekolah.id': 'admin123',
    'sri.wahyuni@smpn2wanadadi.sch.id': 'gurubk123',
    'kepsek@smpn2wanadadi.sch.id': 'kepsek123',
    'aditya.pratama@siswa.smpn2wanadadi.sch.id': 'siswa123'
  };

  // 60 Siswa Fiktif di kelas 7A, 7B, 8A, 8B, 9A, 9B
  const firstNames = [
    'Aditya', 'Bagus', 'Cahya', 'Dimas', 'Eko', 'Fajar', 'Gilang', 'Hendra', 'Iqbal', 'Joko',
    'Kurnia', 'Lukman', 'Maulana', 'Noval', 'Oki', 'Panji', 'Rafi', 'Satria', 'Taufik', 'Wahyu',
    'Anisa', 'Bella', 'Citra', 'Dewi', 'Endah', 'Fitri', 'Gita', 'Hani', 'Indah', 'Jelita',
    'Kartika', 'Lestari', 'Maya', 'Nabila', 'Olivia', 'Putri', 'Rini', 'Siti', 'Triana', 'Wulan',
    'Ahmad', 'Bayu', 'Dedi', 'Farhan', 'Gani', 'Ilham', 'Nur', 'Rian', 'Sandi', 'Zaki',
    'Aulia', 'Cindy', 'Dina', 'Erna', 'Fina', 'Hesti', 'Intan', 'Melani', 'Riska', 'Zahra'
  ];

  const lastNames = [
    'Pratama', 'Santoso', 'Hidayat', 'Saputra', 'Kusuma', 'Nugroho', 'Wibowo', 'Setiawan', 'Permana', 'Susilo',
    'Lestari', 'Wahyuni', 'Rahmawati', 'Anggraini', 'Wijaya', 'Puspitasari', 'Kurniawan', 'Ramadhani', 'Utami', 'Siregar'
  ];

  const classes = ['7A', '7B', '8A', '8B', '9A', '9B'];
  const parentStatuses: Student['statusOrtu'][] = ['lengkap', 'lengkap', 'lengkap', 'wali', 'piatu', 'yatim', 'yatim_piatu'];

  const students: Student[] = [];
  const attendances: AttendanceRecord[] = [];
  const grades: GradeRecord[] = [];
  const behaviors: BehaviorRecord[] = [];

  // Siswa 1: Spesifik Aditya Pratama (Siswa Akun Demo)
  students.push({
    id: 'std_0091234567',
    nama: 'Aditya Pratama (Fiktif)',
    nisn: '0091234567',
    kelas: '8B',
    jenisKelamin: 'L',
    statusOrtu: 'yatim',
    kondisiEkonomi: 4,
    jarakKm: 7.5,
    adaTunggakan: true,
    aktif: true,
    createdAt: '2026-07-15T08:00:00Z'
  });

  // Generate 59 siswa lainnya
  for (let i = 1; i < 60; i++) {
    const fName = firstNames[i % firstNames.length];
    const lName = lastNames[(i * 3) % lastNames.length];
    const gender: 'L' | 'P' = i < 30 ? (i % 2 === 0 ? 'L' : 'P') : (i % 2 === 1 ? 'L' : 'P');
    const nisnNum = 91023400 + i;
    const nisn = `00${nisnNum}`;
    const studentClass = classes[i % classes.length];
    const pStatus = parentStatuses[i % parentStatuses.length];

    // Distribusi ekonomi & tunggakan realistis
    const eco = (i % 5) + 1;
    const hasArrears = eco >= 4 ? i % 2 === 0 : false;
    const dist = 1.2 + (i % 9) * 0.9;

    students.push({
      id: `std_${nisn}`,
      nama: `${fName} ${lName} (Fiktif)`,
      nisn,
      kelas: studentClass,
      jenisKelamin: gender,
      statusOrtu: pStatus,
      kondisiEkonomi: eco,
      jarakKm: Math.round(dist * 10) / 10,
      adaTunggakan: hasArrears,
      aktif: true,
      createdAt: '2026-07-15T08:00:00Z'
    });
  }

  // Buat data Kehadiran (3 bulan terakhir: 2026-08, 2026-09, 2026-10)
  const months = ['2026-08', '2026-09', '2026-10'];
  students.forEach((std, idx) => {
    // Siswa berisiko tinggi buatan (misal idx: 0, 5, 12, 19, 26, 33, 40, 47, 54)
    const isHighRiskSample = idx === 0 || idx % 7 === 0;
    const isMediumRiskSample = idx % 3 === 0 && !isHighRiskSample;

    months.forEach((m) => {
      let alpa = 0;
      let izin = 0;
      let sakit = 0;
      let hadir = 20;

      if (isHighRiskSample) {
        alpa = (idx % 3) + 3; // 3 - 5 alpa per bulan
        izin = 2;
        sakit = 1;
        hadir = 20 - (alpa + izin + sakit);
      } else if (isMediumRiskSample) {
        alpa = idx % 2 === 0 ? 1 : 2;
        izin = 1;
        sakit = 1;
        hadir = 20 - (alpa + izin + sakit);
      } else {
        alpa = 0;
        izin = idx % 5 === 0 ? 1 : 0;
        sakit = idx % 4 === 0 ? 1 : 0;
        hadir = 20 - (alpa + izin + sakit);
      }

      attendances.push({
        id: `${std.id}_${m}`,
        studentId: std.id,
        bulan: m,
        hariEfektif: 20,
        hadir: Math.max(0, hadir),
        sakit,
        izin,
        alpa,
        updatedAt: new Date().toISOString()
      });
    });

    // Buat data Nilai Semester
    let avg = 78;
    let prevAvg = 80;

    if (isHighRiskSample) {
      avg = 54 + (idx % 8); // 54 - 61 (rendah)
      prevAvg = avg + 10 + (idx % 5); // penurunan tajam
    } else if (isMediumRiskSample) {
      avg = 68 + (idx % 6);
      prevAvg = avg + 4;
    } else {
      avg = 82 + (idx % 12);
      prevAvg = avg - 1;
    }

    const mapel = {
      'Matematika': Math.round(avg - 5 + Math.random() * 8),
      'Bahasa Indonesia': Math.round(avg + 2),
      'Bahasa Inggris': Math.round(avg - 2),
      'IPA': Math.round(avg - 4 + Math.random() * 6),
      'IPS': Math.round(avg + 1),
      'PPKn': Math.round(avg + 3),
      'PAI / Agama': Math.round(avg + 4)
    };

    grades.push({
      id: `${std.id}_2026-ganjil`,
      studentId: std.id,
      semester: '2026/2027 Ganjil',
      rataRata: Math.round(avg * 10) / 10,
      rataRataSebelumnya: Math.round(prevAvg * 10) / 10,
      nilaiMapel: mapel,
      updatedAt: new Date().toISOString()
    });

    // Buat Perilaku untuk beberapa siswa
    if (isHighRiskSample || idx % 4 === 0) {
      behaviors.push({
        id: `beh_${std.id}_1`,
        studentId: std.id,
        tanggal: '2026-09-18',
        jenis: 'pelanggaran',
        poin: isHighRiskSample ? 25 : 10,
        keterangan: isHighRiskSample
          ? 'Membolos saat jam pelajaran ke-5 & tidak mengumpulkan tugas berulang kali'
          : 'Terlambat masuk sekolah tanpa keterangan valid',
        dicatatOleh: 'Guru BK (Sri Wahyuningsih, S.Psi.)'
      });
    }
  });

  // Hitung prediksi langsung untuk semua siswa
  const predictions: PredictionRecord[] = [];
  const interventions: InterventionRecord[] = [];

  students.forEach((std) => {
    const stdAtts = attendances.filter(a => a.studentId === std.id);
    const stdGrade = grades.find(g => g.studentId === std.id);
    const stdBeh = behaviors.filter(b => b.studentId === std.id);

    const pred = runStudentPrediction(std, stdAtts, stdGrade, stdBeh, DEFAULT_MODEL_SETTINGS, 'Sistem SIPRESI DSS');
    predictions.push(pred);

    // Jika risiko tinggi, buat contoh tindak lanjut terencana / berjalan
    if (pred.level === 'tinggi') {
      interventions.push({
        id: `int_${std.id}_sample`,
        studentId: std.id,
        studentName: std.nama,
        studentClass: std.kelas,
        predictionId: pred.id,
        jenis: 'Kunjungan Rumah (Home Visit)',
        catatan: `Evaluasi presensi langsung ke kediaman siswa. Orang tua bekerja serabutan, siswa sering membantu pekerjaan keluarga.`,
        status: std.id === 'std_0091234567' ? 'berjalan' : 'selesai',
        tanggal: '2026-10-12',
        olehUid: 'user_bk_01',
        olehNama: 'Sri Wahyuningsih, S.Psi., M.Pd.',
        hasil: std.id === 'std_0091234567' ? 'Wali bersedia mengawasi presensi harian, diajukan bantuan PIP.' : 'Telah dilakukan mediasi bersama orang tua & wali kelas. Siswa mulai kembali aktif.',
        skorSebelum: pred.skor,
        skorSesudah: std.id === 'std_0091234567' ? undefined : Math.max(30, pred.skor - 22)
      });
    }
  });

  // Contoh Pesan dari Guru BK untuk Siswa Demo (Aditya)
  const messages: MessageRecord[] = [
    {
      id: 'msg_demo_01',
      studentId: 'std_0091234567',
      dari: 'user_bk_01',
      dariNama: 'Ibu Sri Wahyuningsih, S.Psi. (Guru BK)',
      isi: 'Halo Aditya, jangan sungkan mampir ke ruang BK ya setelah istirahat kedua untuk mengambil formulir pengusulan bantuan Program Indonesia Pintar (PIP). Semangat belajarnya!',
      tanggal: '2026-10-22T09:30:00Z',
      dibaca: false
    },
    {
      id: 'msg_demo_02',
      studentId: 'std_0091234567',
      dari: 'user_bk_01',
      dariNama: 'Ibu Sri Wahyuningsih, S.Psi. (Guru BK)',
      isi: 'Jadwal bimbingan belajar tambahan Matematika dan IPA diadakan tiap hari Selasa dan Kamis pukul 14.00 di Lab Komputer. Silakan hadir ya.',
      tanggal: '2026-10-15T11:00:00Z',
      dibaca: true
    }
  ];

  // Simpan ke Firestore jika aktif
  if (isFirebaseConfigured() && db) {
    try {
      for (const u of defaultUsers) {
        await setDoc(doc(db, 'users', u.uid), u);
      }
      for (const [k, v] of Object.entries(defaultLoginIndex)) {
        await setDoc(doc(db, 'loginIndex', k), v);
      }
      await setDoc(doc(db, 'settings', 'weights'), DEFAULT_MODEL_SETTINGS);
      await setDoc(doc(db, 'settings', 'init'), {
        initialized: true,
        adminUid: 'user_admin_01',
        adminEmail: 'admin.smpn2wanadadi@sekolah.id',
        createdAt: new Date().toISOString()
      });
      for (const s of students) {
        await setDoc(doc(db, 'students', s.id), s);
      }
      for (const a of attendances) {
        await setDoc(doc(db, 'attendance', a.id), a);
      }
      for (const g of grades) {
        await setDoc(doc(db, 'grades', g.id), g);
      }
      for (const b of behaviors) {
        await setDoc(doc(db, 'behaviors', b.id), b);
      }
      for (const p of predictions) {
        await setDoc(doc(db, 'predictions', p.id), p);
      }
      for (const it of interventions) {
        await setDoc(doc(db, 'interventions', it.id), it);
      }
      for (const m of messages) {
        await setDoc(doc(db, 'messages', m.id), m);
      }
    } catch (e) {
      console.warn('Firestore seeding error, fallback to local storage:', e);
    }
  }

  // Simpan ke Local Storage
  setLocalItem(STORAGE_KEYS.USERS, defaultUsers);
  setLocalItem(STORAGE_KEYS.LOGIN_INDEX, defaultLoginIndex);
  setLocalItem('sipresi_passwords', passwords);
  setLocalItem(STORAGE_KEYS.STUDENTS, students);
  setLocalItem(STORAGE_KEYS.ATTENDANCE, attendances);
  setLocalItem(STORAGE_KEYS.GRADES, grades);
  setLocalItem(STORAGE_KEYS.BEHAVIORS, behaviors);
  setLocalItem(STORAGE_KEYS.PREDICTIONS, predictions);
  setLocalItem(STORAGE_KEYS.INTERVENTIONS, interventions);
  setLocalItem(STORAGE_KEYS.MESSAGES, messages);
  setLocalItem(STORAGE_KEYS.MODEL_SETTINGS, DEFAULT_MODEL_SETTINGS);
  setLocalItem(STORAGE_KEYS.INIT_SETTINGS, {
    initialized: true,
    adminUid: 'user_admin_01',
    adminEmail: 'admin.smpn2wanadadi@sekolah.id',
    createdAt: new Date().toISOString()
  });

  return { count: students.length };
}

// Inisialisasi data otomatis jika local storage masih kosong
export function autoInitializeDemoStorage(): void {
  const users = getLocalItem<UserProfile[]>(STORAGE_KEYS.USERS, []);
  if (users.length === 0) {
    seedSampleData(false);
  }
}
