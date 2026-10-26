/**
 * Konfigurasi Firebase Modular SDK v10 untuk SIPRESI – SMP Negeri 2 Wanadadi.
 * 
 * Silakan ganti nilai placeholder di bawah ini dengan konfigurasi proyek Firebase Anda
 * yang didapat dari Firebase Console > Project Settings > General > Your apps > SDK setup/configuration.
 */
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_AUTH_DOMAIN_HERE",
  projectId: "YOUR_PROJECT_ID_HERE",
  storageBucket: "YOUR_STORAGE_BUCKET_HERE",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID_HERE",
  appId: "YOUR_APP_ID_HERE"
};

/**
 * Memeriksa apakah konfigurasi Firebase telah diisi dengan kredensial nyata
 * atau masih berupa placeholder.
 */
export const isFirebaseConfigured = (): boolean => {
  return (
    Boolean(firebaseConfig.apiKey) &&
    firebaseConfig.apiKey !== "YOUR_API_KEY_HERE" &&
    !firebaseConfig.apiKey.startsWith("YOUR_") &&
    Boolean(firebaseConfig.projectId) &&
    firebaseConfig.projectId !== "YOUR_PROJECT_ID_HERE"
  );
};

// Inisialisasi Firebase App utama
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let secondaryApp: FirebaseApp | null = null;
let secondaryAuth: Auth | null = null;

if (isFirebaseConfigured()) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);

    // Inisialisasi secondary app untuk Admin membuat user tanpa ter-logout
    const secondaryAppName = 'sipresiSecondaryAuth';
    secondaryApp = getApps().find(a => a.name === secondaryAppName) || initializeApp(firebaseConfig, secondaryAppName);
    secondaryAuth = getAuth(secondaryApp);
  } catch (error) {
    console.warn('Gagal menginisialisasi Firebase SDK:', error);
  }
}

export { app, auth, db, secondaryApp, secondaryAuth };
