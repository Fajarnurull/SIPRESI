# SIPRESI – Sistem Prediksi Risiko Putus Sekolah
### SMP Negeri 2 Wanadadi (Decision Support System Berbasis Website)

SIPRESI adalah Decision Support System (DSS) terpadu untuk memprediksi tingkat risiko putus sekolah siswa SMP berbasis data presensi (kehadiran), capaian nilai rapor, tren akademik, catatan kedisiplinan, kondisi sosial-ekonomi, dan status keluarga menggunakan model pembobotan transparan **Simple Additive Weighting (SAW)** yang dapat dikalibrasi oleh pihak sekolah.

---

## 🚀 Panduan Setup Firebase & Menjalankan Aplikasi

Aplikasi ini sudah dirancang **langsung siap dijalankan dan diuji coba** (out-of-the-box) melalui mode simulasi terintegrasi, dan dapat langsung disambungkan ke Firebase Cloud Firestore nyata dengan langkah mudah berikut:

### 1. Buat Proyek Firebase
1. Buka [Firebase Console](https://console.firebase.google.com/).
2. Klik **Add Project** (Tambah Proyek), beri nama misalnya `sipresi-smpn2-wanadadi`.
3. Matikan atau nyalakan Google Analytics sesuai preferensi, lalu klik **Create Project**.

### 2. Aktifkan Firebase Authentication (Email/Password)
1. Pada menu sebelah kiri, pilih **Build** > **Authentication** > **Get Started**.
2. Pada tab **Sign-in method**, pilih **Email/Password**.
3. Aktifkan toggle **Email/Password** pertama (abaikan Email link/passwordless), lalu klik **Save**.

### 3. Aktifkan Cloud Firestore
1. Pada menu kiri, pilih **Build** > **Firestore Database** > **Create Database**.
2. Pilih lokasi server terdekat (misal: `asia-southeast2` Jakarta).
3. Pilih **Start in production mode** lalu klik **Next** / **Enable**.

### 4. Tempel Konfigurasi Firebase (`src/firebase.ts`)
1. Di Firebase Console, klik ikon roda gigi ⚙️ di samping Project Overview > **Project settings**.
2. Di bagian **Your apps**, klik ikon Web `</>` untuk mendaftarkan web app.
3. Salin objek `firebaseConfig` dan tempelkan ke file `/src/firebase.ts` menggantikan placeholder:
```typescript
export const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "sipresi-smpn2-wanadadi.firebaseapp.com",
  projectId: "sipresi-smpn2-wanadadi",
  storageBucket: "sipresi-smpn2-wanadadi.appspot.com",
  messagingSenderId: "123456789...",
  appId: "1:123456789:web:abcdef..."
};
```

### 5. Terapkan Aturan Keamanan (`firestore.rules`)
1. Buka Firebase Console > **Firestore Database** > tab **Rules**.
2. Salin seluruh isi dari file `/firestore.rules` pada repositori ini ke editor Firebase Rules.
3. Klik **Publish**.

### 6. Contoh Composite Index Firestore (Jika Diperlukan)
Jika Anda menggunakan query gabungan tertentu pada volume data besar, tambahkan indeks gabungan berikut di Firebase Console > **Firestore Database** > tab **Indexes**:
- **Collection**: `attendance` | **Fields**: `studentId` (Ascending), `bulan` (Descending)
- **Collection**: `grades` | **Fields**: `studentId` (Ascending), `semester` (Ascending)
- **Collection**: `predictions` | **Fields**: `level` (Ascending), `skor` (Descending)
- **Collection**: `interventions` | **Fields**: `studentId` (Ascending), `status` (Ascending)

### 7. Buat Administrator Pertama & Muat Data Contoh
1. Buka halaman rahasia `/setup-awal` pada aplikasi browser Anda:
   - Contoh: `https://[domain-aplikasi]/setup-awal`
2. Isi Nama, Username Admin, Email Sekolah, dan Password minimal 8 karakter.
3. Klik **Inisialisasi & Buat Admin**. Dokumen `settings/init` akan dibuat dan halaman `/setup-awal` otomatis terkunci permanen demi keamanan.
4. Masuk ke **Dashboard Admin** (login menggunakan akun admin yang baru saja dibuat).
5. Pada Dashboard Admin, klik tombol **"Muat Data Contoh (60 Siswa)"**.
6. Sistem akan otomatis mengisi ±60 siswa fiktif kelas 7A–9C beserta rekapan presensi 3 bulan, nilai semester, catatan pelanggaran, dan perhitungan DSS.

---

## 🔑 Akun Demo Siap Uji (Mode Demo / Lokal)

| Peran | Identitas Login | Password | Keterangan |
|---|---|---|---|
| **Administrator** | `admin` | `admin123` | Akses penuh CRUD, manajemen user, kalibrasi bobot DSS, data siswa |
| **Guru BK** | `198506122010011005` | `gurubk123` | Pengguna utama: DSS analitik, konseling, home visit, kirim pesan |
| **Kepala Sekolah** | `197204151998021002` | `kepsek123` | Pemantauan eksekutif pimpinan (read-only), efektivitas tindak lanjut |
| **Siswa** | `0091234567` | `siswa123` | Portal belajar siswa (presensi, nilai, pesan BK tanpa stigma risiko) |

---

## 📊 Rumus Model DSS (Simple Additive Weighting)
1. **Persentase Ketidakhadiran (Bobot 35%)**: Rasio alpa dan izin tanpa surat dalam 3 bulan terakhir.
2. **Rata-rata Nilai Rendah (Bobot 20%)**: Jarak capaian nilai terhadap KKM (70.0).
3. **Tren Penurunan Nilai (Bobot 15%)**: Penurunan poin dibanding semester sebelumnya.
4. **Catatan Perilaku & Sikap (Bobot 10%)**: Akumulasi poin pelanggaran tata tertib sekolah.
5. **Kondisi Ekonomi & Tunggakan (Bobot 10%)**: Taraf kerentanan ekonomi (skala 1-5) dan keberadaan tunggakan.
6. **Jarak Rumah ke Sekolah (Bobot 5%)**: Jarak tempuh tempat tinggal (> 6 km berisiko tinggi akses transportasi).
7. **Status Orang Tua / Wali (Bobot 5%)**: Latar belakang keluarga (yatim, piatu, yatim piatu, wali, atau lengkap).

- **Ambang Batas Risiko**:
  - Skor $\ge 70$ : **Risiko Tinggi** (Merah `#DC2626`)
  - Skor $40 - 69$ : **Risiko Sedang** (Kuning/Amber `#F59E0B`)
  - Skor $< 40$ : **Risiko Rendah** (Hijau `#16A34A`)

---
*SMP Negeri 2 Wanadadi · Banjarnegara, Jawa Tengah*
