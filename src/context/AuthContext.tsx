import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, UserProfile } from '../types';
import {
  getLoginIndexItem,
  getUserProfile,
  autoInitializeDemoStorage,
  getInitSettings
} from '../lib/storage';
import { isFirebaseConfigured, auth } from '../firebase';
import {
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  confirmPasswordReset
} from 'firebase/auth';

interface AuthContextType {
  currentUser: UserProfile | null;
  selectedRole: UserRole | null;
  setSelectedRole: (role: UserRole | null) => void;
  isLoading: boolean;
  failedAttempts: number;
  lockoutRemaining: number;
  isLockedOut: boolean;
  login: (identitas: string, password: string, roleRequired: UserRole, rememberMe: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPasswordByEmail: (email: string) => Promise<{ success: boolean; message?: string }>;
  confirmNewPassword: (code: string, newPass: string) => Promise<{ success: boolean; message?: string }>;
  isSchoolInitialized: boolean;
  checkInitialization: () => Promise<boolean>;
  refreshCurrentUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_AUTH_KEY = 'sipresi_active_user';
const REMEMBER_ME_KEY = 'sipresi_remember_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);
  const [isSchoolInitialized, setIsSchoolInitialized] = useState<boolean>(true);

  // Inisialisasi awal
  useEffect(() => {
    autoInitializeDemoStorage();

    async function loadInitialSession() {
      try {
        const init = await getInitSettings();
        setIsSchoolInitialized(Boolean(init && init.initialized));

        // Cek sesi tersimpan
        const sessionUser = sessionStorage.getItem(SESSION_AUTH_KEY) || localStorage.getItem(REMEMBER_ME_KEY);
        if (sessionUser) {
          const parsed = JSON.parse(sessionUser) as UserProfile;
          const fresh = await getUserProfile(parsed.uid);
          if (fresh && fresh.aktif) {
            setCurrentUser(fresh);
            setSelectedRole(fresh.role);
          } else {
            sessionStorage.removeItem(SESSION_AUTH_KEY);
            localStorage.removeItem(REMEMBER_ME_KEY);
          }
        }
      } catch (err) {
        console.error('Session load error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadInitialSession();
  }, []);

  // Timer hitung mundur lockout 60 detik jika gagal 3 kali
  useEffect(() => {
    if (lockoutRemaining <= 0) return;
    const timer = setInterval(() => {
      setLockoutRemaining((prev) => {
        if (prev <= 1) {
          setFailedAttempts(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutRemaining]);

  const checkInitialization = async (): Promise<boolean> => {
    const init = await getInitSettings();
    const isInit = Boolean(init && init.initialized);
    setIsSchoolInitialized(isInit);
    return isInit;
  };

  const refreshCurrentUser = async () => {
    if (currentUser) {
      const fresh = await getUserProfile(currentUser.uid);
      if (fresh) setCurrentUser(fresh);
    }
  };

  const login = async (
    identitas: string,
    password: string,
    roleRequired: UserRole,
    rememberMe: boolean
  ): Promise<{ success: boolean; error?: string }> => {
    if (lockoutRemaining > 0) {
      return {
        success: false,
        error: `Akses terkunci sementara karena 3 kali percobaan gagal. Tunggu ${lockoutRemaining} detik.`
      };
    }

    const trimmedId = identitas.trim();
    if (!trimmedId || !password) {
      return { success: false, error: 'Identitas dan password wajib diisi.' };
    }

    // 1. Cari dokumen di loginIndex/{identitas}
    const loginItem = await getLoginIndexItem(trimmedId);
    if (!loginItem) {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      if (nextAttempts >= 3) {
        setLockoutRemaining(60);
        return {
          success: false,
          error: 'Identitas atau password salah. Batas 3 kali percobaan terlampaui. Akun terkunci 60 detik.'
        };
      }
      return {
        success: false,
        error: `Identitas atau password salah. Silakan periksa kembali dan coba lagi. (Sisa percobaan: ${3 - nextAttempts} kali)`
      };
    }

    // 2. Verifikasi kesesuaian peran yang dipilih (jangan membocorkan detail)
    if (loginItem.role !== roleRequired) {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      if (nextAttempts >= 3) {
        setLockoutRemaining(60);
        return {
          success: false,
          error: 'Identitas atau password salah. Batas 3 kali percobaan terlampaui. Akun terkunci 60 detik.'
        };
      }
      return {
        success: false,
        error: `Identitas atau password salah. Silakan periksa kembali dan coba lagi. (Sisa percobaan: ${3 - nextAttempts} kali)`
      };
    }

    // 3. Autentikasi kredensial
    let authenticatedUid = '';
    const email = loginItem.email;

    if (isFirebaseConfigured() && auth) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        authenticatedUid = userCredential.user.uid;
      } catch (authError: unknown) {
        console.error('Firebase Auth sign in error:', authError);
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);
        if (nextAttempts >= 3) {
          setLockoutRemaining(60);
          return {
            success: false,
            error: 'Identitas atau password salah. Batas 3 kali percobaan terlampaui. Akun terkunci 60 detik.'
          };
        }
        return {
          success: false,
          error: `Identitas atau password salah. Silakan periksa kembali dan coba lagi. (Sisa percobaan: ${3 - nextAttempts} kali)`
        };
      }
    } else {
      // Local fallback checking
      const localPasswords = JSON.parse(localStorage.getItem('sipresi_passwords') || '{}');
      const expectedPassword = localPasswords[email];
      
      // Default fallback jika belum tersimpan spesifik
      const fallbackCheck =
        (password === 'admin123' && loginItem.role === 'admin') ||
        (password === 'gurubk123' && loginItem.role === 'guru_bk') ||
        (password === 'kepsek123' && loginItem.role === 'kepala_sekolah') ||
        (password === 'siswa123' && loginItem.role === 'siswa') ||
        (expectedPassword && expectedPassword === password);

      if (!fallbackCheck) {
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);
        if (nextAttempts >= 3) {
          setLockoutRemaining(60);
          return {
            success: false,
            error: 'Identitas atau password salah. Batas 3 kali percobaan terlampaui. Akun terkunci 60 detik.'
          };
        }
        return {
          success: false,
          error: `Identitas atau password salah. Silakan periksa kembali dan coba lagi. (Sisa percobaan: ${3 - nextAttempts} kali)`
        };
      }

      // Ambil UID dari profile lokal
      const users = JSON.parse(localStorage.getItem('sipresi_users') || '[]');
      const matched = users.find((u: UserProfile) => u.identitas === trimmedId);
      authenticatedUid = matched ? matched.uid : `user_${trimmedId}`;
    }

    // 4. Ambil profil pengguna lengkap dari users/{uid}
    const profile = await getUserProfile(authenticatedUid);
    if (!profile) {
      return { success: false, error: 'Profil pengguna tidak ditemukan di basis data sekolah.' };
    }

    // 5. Cek apakah status aktif
    if (!profile.aktif) {
      return {
        success: false,
        error: 'Akun Anda dinonaktifkan oleh Administrator sekolah. Silakan hubungi admin sekolah untuk pemulihan akses.'
      };
    }

    // Reset attempt counter setelah berhasil
    setFailedAttempts(0);
    setCurrentUser(profile);
    setSelectedRole(profile.role);

    // Simpan sesi
    sessionStorage.setItem(SESSION_AUTH_KEY, JSON.stringify(profile));
    if (rememberMe) {
      localStorage.setItem(REMEMBER_ME_KEY, JSON.stringify(profile));
    } else {
      localStorage.removeItem(REMEMBER_ME_KEY);
    }

    return { success: true };
  };

  const logout = async () => {
    if (isFirebaseConfigured() && auth) {
      try {
        await signOut(auth);
      } catch (err) {
        console.warn('Firebase signOut error:', err);
      }
    }
    setCurrentUser(null);
    setSelectedRole(null);
    sessionStorage.removeItem(SESSION_AUTH_KEY);
    localStorage.removeItem(REMEMBER_ME_KEY);
  };

  const resetPasswordByEmail = async (email: string): Promise<{ success: boolean; message?: string }> => {
    const trimmed = email.trim();
    if (!trimmed) {
      return { success: false, message: 'Alamat email wajib diisi.' };
    }

    if (isFirebaseConfigured() && auth) {
      try {
        await sendPasswordResetEmail(auth, trimmed);
        return { success: true, message: `Tautan reset resmi Firebase telah dikirim ke ${trimmed}.` };
      } catch (err: unknown) {
        console.error('sendPasswordResetEmail error:', err);
        return { success: false, message: 'Gagal mengirim email reset password. Pastikan email terdaftar.' };
      }
    }

    // Mock reset notification
    return {
      success: true,
      message: `Tautan reset simulasi telah dikirim ke ${trimmed}. Periksa kotak masuk Anda.`
    };
  };

  const confirmNewPassword = async (code: string, newPass: string): Promise<{ success: boolean; message?: string }> => {
    if (isFirebaseConfigured() && auth) {
      try {
        await confirmPasswordReset(auth, code, newPass);
        return { success: true, message: 'Password berhasil diubah!' };
      } catch (err: unknown) {
        console.error('confirmPasswordReset error:', err);
        return { success: false, message: 'Kode reset tidak valid atau telah kadaluarsa.' };
      }
    }

    return { success: true, message: 'Password berhasil diubah dalam mode simulasi.' };
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        selectedRole,
        setSelectedRole,
        isLoading,
        failedAttempts,
        lockoutRemaining,
        isLockedOut: lockoutRemaining > 0,
        login,
        logout,
        resetPasswordByEmail,
        confirmNewPassword,
        isSchoolInitialized,
        checkInitialization,
        refreshCurrentUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
