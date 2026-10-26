import {
  Student,
  AttendanceRecord,
  GradeRecord,
  BehaviorRecord,
  PredictionRecord,
  ModelSettings,
  FactorContribution,
  RiskLevel
} from '../types';

export const DEFAULT_MODEL_SETTINGS: ModelSettings = {
  weights: {
    absence: 35,
    lowGrades: 20,
    gradeTrend: 15,
    behavior: 10,
    economy: 10,
    distance: 5,
    parentStatus: 5
  },
  thresholds: {
    high: 70,
    medium: 40
  }
};

/**
 * Menghitung normalisasi faktor ketidakhadiran (0 - 100).
 * Menggunakan rumus: (alpa + 0.5 * izin) / total_hari_efektif dalam rentang data terakhir (maks 3 bulan).
 * Jika rasio >= 20% (misal 12 hari absen dalam 60 hari efektif), skor = 100.
 */
export function calculateAbsenceRisk(attendances: AttendanceRecord[]): {
  normalized: number;
  rawStr: string;
  detail: string;
} {
  if (!attendances || attendances.length === 0) {
    return {
      normalized: 0,
      rawStr: '0 hari alpa',
      detail: 'Belum ada data kehadiran terekam'
    };
  }

  // Ambil maksimal 3 bulan terakhir
  const sorted = [...attendances].sort((a, b) => b.bulan.localeCompare(a.bulan)).slice(0, 3);
  let totalEfektif = 0;
  let totalAlpa = 0;
  let totalIzin = 0;
  let totalSakit = 0;

  for (const att of sorted) {
    totalEfektif += att.hariEfektif || 20;
    totalAlpa += att.alpa || 0;
    totalIzin += att.izin || 0;
    totalSakit += att.sakit || 0;
  }

  if (totalEfektif === 0) totalEfektif = 60;

  // Beban ketidakhadiran: alpa berbobot 1, izin berbobot 0.5, sakit ringan 0.25 jika berlebih
  const weightedAbsenceDays = totalAlpa + 0.5 * totalIzin + 0.25 * Math.max(0, totalSakit - 3);
  const absenceRatio = (weightedAbsenceDays / totalEfektif) * 100;

  // Normalisasi: rasio ketidakhadiran 15% atau lebih sudah sangat berisiko (skor 100)
  // Rasio 0% = 0, rasio 15% = 100
  const normalized = Math.min(100, Math.round((absenceRatio / 15) * 100));

  return {
    normalized,
    rawStr: `${totalAlpa} alpa, ${totalIzin} izin (${absenceRatio.toFixed(1)}% dari ${totalEfektif} hari)`,
    detail: `${sorted.length} bulan terakhir: ${totalAlpa} Alpa, ${totalIzin} Izin, ${totalSakit} Sakit`
  };
}

/**
 * Menghitung normalisasi rata-rata nilai rendah (0 - 100).
 * Skala nilai 0-100.
 * Nilai >= 85 -> risiko 0
 * Nilai KKM 70 -> risiko ~50
 * Nilai <= 50 -> risiko 100
 */
export function calculateLowGradeRisk(grade?: GradeRecord): {
  normalized: number;
  rawStr: string;
  detail: string;
} {
  if (!grade || grade.rataRata === undefined || grade.rataRata === null) {
    return {
      normalized: 40, // Netral jika belum ada data
      rawStr: 'Belum ada nilai',
      detail: 'Menunggu input nilai semester'
    };
  }

  const avg = grade.rataRata;
  let normalized = 0;

  if (avg >= 85) {
    normalized = 0;
  } else if (avg <= 50) {
    normalized = 100;
  } else {
    // Linear interpolasi antara 50 (risiko 100) dan 85 (risiko 0)
    normalized = Math.round(((85 - avg) / (85 - 50)) * 100);
  }

  return {
    normalized: Math.max(0, Math.min(100, normalized)),
    rawStr: `Rata-rata: ${avg.toFixed(1)}`,
    detail: `Nilai rata-rata semester berjalan: ${avg.toFixed(1)} (KKM: 70)`
  };
}

/**
 * Menghitung normalisasi tren penurunan nilai (0 - 100).
 * Selisih = rataRataSebelumnya - rataRata.
 * Jika nilai turun 15 poin atau lebih -> risiko 100.
 * Jika nilai stabil atau naik -> risiko 0.
 */
export function calculateGradeTrendRisk(grade?: GradeRecord): {
  normalized: number;
  rawStr: string;
  detail: string;
} {
  if (!grade || grade.rataRataSebelumnya === undefined || grade.rataRataSebelumnya === null) {
    return {
      normalized: 10,
      rawStr: 'Stabil / Semester awal',
      detail: 'Tidak ada penurunan tercatat dari semester lalu'
    };
  }

  const selisih = grade.rataRataSebelumnya - grade.rataRata;

  if (selisih <= 0) {
    // Nilai naik atau sama
    return {
      normalized: 0,
      rawStr: `Meningkat (+${Math.abs(selisih).toFixed(1)})`,
      detail: `Tren positif dari ${grade.rataRataSebelumnya.toFixed(1)} ke ${grade.rataRata.toFixed(1)}`
    };
  }

  // Penurunan hingga 15 poin dinormalisasi ke 0 - 100
  const normalized = Math.min(100, Math.round((selisih / 15) * 100));

  return {
    normalized,
    rawStr: `Turun ${selisih.toFixed(1)} poin`,
    detail: `Penurunan dari ${grade.rataRataSebelumnya.toFixed(1)} menjadi ${grade.rataRata.toFixed(1)}`
  };
}

/**
 * Menghitung normalisasi catatan perilaku (0 - 100).
 * Akumulasi poin pelanggaran pada semester berjalan.
 * Poin 0 = risiko 0
 * Poin >= 50 = risiko 100
 */
export function calculateBehaviorRisk(behaviors: BehaviorRecord[]): {
  normalized: number;
  rawStr: string;
  detail: string;
} {
  if (!behaviors || behaviors.length === 0) {
    return {
      normalized: 0,
      rawStr: '0 poin pelanggaran',
      detail: 'Catatan perilaku disiplin dan tertib'
    };
  }

  let totalPoin = 0;
  const pelanggaranList: string[] = [];

  for (const b of behaviors) {
    if (b.jenis === 'pelanggaran') {
      totalPoin += b.poin || 0;
      pelanggaranList.push(b.keterangan);
    }
  }

  const normalized = Math.min(100, Math.round((totalPoin / 50) * 100));

  return {
    normalized,
    rawStr: `${totalPoin} poin (${pelanggaranList.length} pelanggaran)`,
    detail: pelanggaranList.length > 0 ? pelanggaranList.slice(0, 2).join('; ') : 'Tidak ada pelanggaran'
  };
}

/**
 * Menghitung normalisasi kondisi ekonomi + tunggakan (0 - 100).
 * Kondisi 1-5: 1 = Sangat Mampu (0%), 5 = Sangat Rentan/Kurang Mampu (80%).
 * Tunggakan menambah 20%.
 */
export function calculateEconomyRisk(student: Student): {
  normalized: number;
  rawStr: string;
  detail: string;
} {
  const ekonomi = student.kondisiEkonomi || 3;
  // level 1: 0, level 2: 20, level 3: 40, level 4: 65, level 5: 85
  const baseMap: Record<number, number> = {
    1: 0,
    2: 20,
    3: 40,
    4: 65,
    5: 85
  };

  let normalized = baseMap[ekonomi] ?? 40;
  if (student.adaTunggakan) {
    normalized = Math.min(100, normalized + 20);
  }

  const labelEkonomi =
    ekonomi === 1 ? 'Mampu' :
    ekonomi === 2 ? 'Cukup' :
    ekonomi === 3 ? 'Menengah' :
    ekonomi === 4 ? 'Kurang Mampu' : 'Sangat Rentan';

  const statusTunggakan = student.adaTunggakan ? 'Ada tunggakan SPP/seragam' : 'Tidak ada tunggakan';

  return {
    normalized,
    rawStr: `${labelEkonomi}${student.adaTunggakan ? ' + Ada Tunggakan' : ''}`,
    detail: `Taraf ekonomi ${labelEkonomi}, ${statusTunggakan}`
  };
}

/**
 * Menghitung normalisasi jarak rumah ke sekolah (0 - 100).
 * Jarak <= 2 km = 0
 * Jarak 10 km = 100
 */
export function calculateDistanceRisk(student: Student): {
  normalized: number;
  rawStr: string;
  detail: string;
} {
  const jarak = student.jarakKm || 2;
  let normalized = 0;

  if (jarak <= 2) {
    normalized = 0;
  } else if (jarak >= 10) {
    normalized = 100;
  } else {
    // 2km -> 0, 10km -> 100
    normalized = Math.round(((jarak - 2) / 8) * 100);
  }

  return {
    normalized,
    rawStr: `${jarak.toFixed(1)} km`,
    detail: jarak > 6 ? `Jarak cukup jauh (${jarak} km), memerlukan akses transportasi` : `Jarak wajar (${jarak} km)`
  };
}

/**
 * Menghitung normalisasi status orang tua / wali (0 - 100).
 * lengkap: 0
 * wali: 40
 * piatu: 50
 * yatim: 60
 * yatim_piatu: 100
 */
export function calculateParentStatusRisk(student: Student): {
  normalized: number;
  rawStr: string;
  detail: string;
} {
  const status = student.statusOrtu || 'lengkap';
  const statusMap: Record<string, { skor: number; label: string }> = {
    lengkap: { skor: 0, label: 'Orang tua lengkap' },
    wali: { skor: 40, label: 'Tinggal bersama wali' },
    piatu: { skor: 50, label: 'Piatu (Ibu meninggal)' },
    yatim: { skor: 60, label: 'Yatim (Ayah meninggal)' },
    yatim_piatu: { skor: 100, label: 'Yatim Piatu' }
  };

  const info = statusMap[status] || { skor: 0, label: 'Lengkap' };

  return {
    normalized: info.skor,
    rawStr: info.label,
    detail: `Status keluarga: ${info.label}`
  };
}

/**
 * Menjalankan perhitungan DSS lengkap untuk satu siswa.
 */
export function runStudentPrediction(
  student: Student,
  attendances: AttendanceRecord[],
  gradeRecord: GradeRecord | undefined,
  behaviors: BehaviorRecord[],
  settings: ModelSettings = DEFAULT_MODEL_SETTINGS,
  dijalankanOleh: string = 'Sistem DSS'
): PredictionRecord {
  const w = settings.weights;

  // 1. Ketidakhadiran (35%)
  const absence = calculateAbsenceRisk(attendances);
  const absenceContrib = (w.absence / 100) * absence.normalized;

  // 2. Nilai rendah (20%)
  const lowGrade = calculateLowGradeRisk(gradeRecord);
  const lowGradeContrib = (w.lowGrades / 100) * lowGrade.normalized;

  // 3. Tren nilai turun (15%)
  const gradeTrend = calculateGradeTrendRisk(gradeRecord);
  const gradeTrendContrib = (w.gradeTrend / 100) * gradeTrend.normalized;

  // 4. Perilaku (10%)
  const behavior = calculateBehaviorRisk(behaviors);
  const behaviorContrib = (w.behavior / 100) * behavior.normalized;

  // 5. Ekonomi (10%)
  const economy = calculateEconomyRisk(student);
  const economyContrib = (w.economy / 100) * economy.normalized;

  // 6. Jarak (5%)
  const distance = calculateDistanceRisk(student);
  const distanceContrib = (w.distance / 100) * distance.normalized;

  // 7. Status Ortu (5%)
  const parentStatus = calculateParentStatusRisk(student);
  const parentStatusContrib = (w.parentStatus / 100) * parentStatus.normalized;

  // Total Skor Akhir (0 - 100)
  const rawTotal =
    absenceContrib +
    lowGradeContrib +
    gradeTrendContrib +
    behaviorContrib +
    economyContrib +
    distanceContrib +
    parentStatusContrib;

  const skor = Math.min(100, Math.max(0, Math.round(rawTotal * 10) / 10));

  // Tentukan Level Risiko berdasarkan Thresholds
  let level: RiskLevel = 'rendah';
  if (skor >= settings.thresholds.high) {
    level = 'tinggi';
  } else if (skor >= settings.thresholds.medium) {
    level = 'sedang';
  } else {
    level = 'rendah';
  }

  // Kompilasi faktor
  const faktorList: FactorContribution[] = [
    {
      nama: 'Ketidakhadiran',
      bobotPersen: w.absence,
      nilaiMentah: absence.rawStr,
      skorNormal: absence.normalized,
      kontribusi: Math.round(absenceContrib * 10) / 10,
      keterangan: absence.detail
    },
    {
      nama: 'Rata-rata Nilai Rendah',
      bobotPersen: w.lowGrades,
      nilaiMentah: lowGrade.rawStr,
      skorNormal: lowGrade.normalized,
      kontribusi: Math.round(lowGradeContrib * 10) / 10,
      keterangan: lowGrade.detail
    },
    {
      nama: 'Tren Penurunan Nilai',
      bobotPersen: w.gradeTrend,
      nilaiMentah: gradeTrend.rawStr,
      skorNormal: gradeTrend.normalized,
      kontribusi: Math.round(gradeTrendContrib * 10) / 10,
      keterangan: gradeTrend.detail
    },
    {
      nama: 'Catatan Perilaku & Sikap',
      bobotPersen: w.behavior,
      nilaiMentah: behavior.rawStr,
      skorNormal: behavior.normalized,
      kontribusi: Math.round(behaviorContrib * 10) / 10,
      keterangan: behavior.detail
    },
    {
      nama: 'Kondisi Ekonomi & Tunggakan',
      bobotPersen: w.economy,
      nilaiMentah: economy.rawStr,
      skorNormal: economy.normalized,
      kontribusi: Math.round(economyContrib * 10) / 10,
      keterangan: economy.detail
    },
    {
      nama: 'Jarak Tempuh ke Sekolah',
      bobotPersen: w.distance,
      nilaiMentah: distance.rawStr,
      skorNormal: distance.normalized,
      kontribusi: Math.round(distanceContrib * 10) / 10,
      keterangan: distance.detail
    },
    {
      nama: 'Status Orang Tua / Wali',
      bobotPersen: w.parentStatus,
      nilaiMentah: parentStatus.rawStr,
      skorNormal: parentStatus.normalized,
      kontribusi: Math.round(parentStatusContrib * 10) / 10,
      keterangan: parentStatus.detail
    }
  ];

  // Urutkan faktor berdasarkan kontribusi tertinggi
  const sortedFaktor = [...faktorList].sort((a, b) => b.kontribusi - a.kontribusi);
  const faktorUtama = sortedFaktor[0]?.kontribusi > 0 ? sortedFaktor[0].nama : 'Stabil/Normal';

  // Bangun rekomendasi terarah berbasis aturan
  const rekomendasi: string[] = [];

  if (absence.normalized >= 50) {
    rekomendasi.push('Kunjungan rumah (Home Visit) dan pemanggilan orang tua/wali untuk evaluasi kehadiran secara langsung.');
  }
  if (lowGrade.normalized >= 50 || gradeTrend.normalized >= 50) {
    rekomendasi.push('Bimbingan konseling akademik berkala serta rekomendasi mengikutkan siswa pada program bimbingan belajar tambahan sekolah.');
  }
  if (behavior.normalized >= 40) {
    rekomendasi.push('Mentoring intensif oleh wali kelas dan konseling individu terfokus bersama Guru BK untuk pembinaan karakter.');
  }
  if (economy.normalized >= 60 || student.adaTunggakan) {
    rekomendasi.push('Koordinasi pengajuan bantuan sosial pendidikan (Program Indonesia Pintar/PIP/KIP) dan advokasi keringanan biaya komite sekolah.');
  }
  if (distance.normalized >= 60) {
    rekomendasi.push('Koordinasi fasilitas transportasi bersama rekan sekelas searah atau pendampingan rute perjalanan aman.');
  }
  if (parentStatus.normalized >= 50) {
    rekomendasi.push('Pendampingan psikososial khusus dan pendekatan personal kepada keluarga wali untuk memastikan dukungan moril di rumah.');
  }

  // Jika risiko rendah atau faktor minor
  if (rekomendasi.length === 0) {
    rekomendasi.push('Pemantauan rutin perkembangan akademik dan kehadiran oleh Wali Kelas.');
    rekomendasi.push('Pertahankan motivasi belajar siswa melalui apresiasi berkala.');
  }

  return {
    id: `pred_${student.id}_${Date.now()}`,
    studentId: student.id,
    studentName: student.nama,
    studentClass: student.kelas,
    studentNisn: student.nisn,
    tanggal: new Date().toISOString(),
    skor,
    level,
    faktor: faktorList,
    rekomendasi,
    dijalankanOleh,
    faktorUtama
  };
}
